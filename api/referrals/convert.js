// Vercel serverless function: Convert a referral — apply Stripe rewards
// POST — called when a referred business becomes a paying customer
// Creates 50% coupon for referred customer, applies balance credit to referrer

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Not configured' });
  }

  const { referralId } = req.body || {};
  if (!referralId) {
    return res.status(400).json({ error: 'Missing referralId' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch the referral
    const refRes = await fetch(
      `${supabaseUrl}/rest/v1/referrals?id=eq.${encodeURIComponent(referralId)}&select=*`,
      { headers: supabaseHeaders }
    );
    const referrals = await refRes.json();
    if (!referrals || referrals.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    const referral = referrals[0];

    if (referral.status === 'rewarded') {
      return res.status(200).json({ message: 'Already rewarded', referralId });
    }

    // 2. Get the referrer's customer record (for Stripe credit)
    const referrerCustRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${encodeURIComponent(referral.referrer_customer_id)}&select=id,stripe_customer_id,monthly_price,currency`,
      { headers: supabaseHeaders }
    );
    const referrerCusts = await referrerCustRes.json();
    const referrerCustomer = referrerCusts && referrerCusts[0] ? referrerCusts[0] : null;

    // 3. Apply referrer reward: 1 month free via Stripe customer balance credit
    let referrerRewardStatus = 'pending';
    let referrerStripeCreditId = null;

    if (referrerCustomer && referrerCustomer.stripe_customer_id && referrerCustomer.monthly_price) {
      try {
        // Credit the referrer's Stripe balance (negative amount = credit)
        const creditAmount = Math.round(referrerCustomer.monthly_price * 100); // Convert to cents
        const creditParams = new URLSearchParams();
        creditParams.append('amount', -creditAmount); // Negative = credit
        creditParams.append('currency', referrerCustomer.currency || 'mxn');
        creditParams.append('description', 'Referral reward: 1 month free');

        const creditRes = await fetch(
          `https://api.stripe.com/v1/customers/${referrerCustomer.stripe_customer_id}/balance_transactions`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: creditParams.toString(),
          }
        );

        const creditData = await creditRes.json();
        if (creditRes.ok) {
          referrerRewardStatus = 'applied';
          referrerStripeCreditId = creditData.id;
        } else {
          console.error('Stripe credit error:', creditData);
          referrerRewardStatus = 'failed';
        }
      } catch (err) {
        console.error('Referrer reward error:', err);
        referrerRewardStatus = 'failed';
      }
    }

    // 4. Apply referred reward: create 50% off coupon for 2 months
    let referredRewardStatus = 'pending';
    let referredStripeCouponId = null;

    try {
      const couponParams = new URLSearchParams();
      couponParams.append('percent_off', '50');
      couponParams.append('duration', 'repeating');
      couponParams.append('duration_in_months', '2');
      couponParams.append('name', 'Referral: 50% off first 2 months');
      couponParams.append('metadata[referral_id]', referralId);

      const couponRes = await fetch('https://api.stripe.com/v1/coupons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: couponParams.toString(),
      });

      const couponData = await couponRes.json();
      if (couponRes.ok) {
        referredRewardStatus = 'created';
        referredStripeCouponId = couponData.id;
      } else {
        console.error('Stripe coupon error:', couponData);
        referredRewardStatus = 'failed';
      }
    } catch (err) {
      console.error('Referred reward error:', err);
      referredRewardStatus = 'failed';
    }

    // 5. Update referral record
    const now = new Date().toISOString();
    const updatePayload = {
      status: 'rewarded',
      referrer_reward_status: referrerRewardStatus,
      referrer_stripe_credit_id: referrerStripeCreditId,
      referred_reward_status: referredRewardStatus,
      referred_stripe_coupon_id: referredStripeCouponId,
      rewarded_at: now,
      last_updated_at: now,
    };

    await fetch(
      `${supabaseUrl}/rest/v1/referrals?id=eq.${encodeURIComponent(referralId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify(updatePayload),
      }
    );

    // 6. Update referral_codes successful count and reward count
    const codeUpdateRes = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?id=eq.${encodeURIComponent(referral.referral_code_id)}`,
      { headers: supabaseHeaders }
    );
    const codeData = await codeUpdateRes.json();
    if (codeData && codeData[0]) {
      await fetch(
        `${supabaseUrl}/rest/v1/referral_codes?id=eq.${encodeURIComponent(referral.referral_code_id)}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            successful_referrals: (codeData[0].successful_referrals || 0) + 1,
            total_rewards: (codeData[0].total_rewards || 0) + 1,
          }),
        }
      );
    }

    return res.status(200).json({
      success: true,
      referralId,
      referrerRewardStatus,
      referredRewardStatus,
      referredStripeCouponId,
    });
  } catch (err) {
    console.error('Convert referral error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
