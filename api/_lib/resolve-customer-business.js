// Shared helper: JWT → user → customer_users → customers → business_id
// Extracts the auth chain common to all customer-facing API endpoints.

export async function resolveCustomerBusiness(req, supabaseUrl, serviceKey) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing authorization header'), { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabaseHeaders = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  // Step 1: Verify JWT → get user
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!userRes.ok) {
    throw Object.assign(new Error('Invalid token'), { status: 401 });
  }
  const userData = await userRes.json();

  // Step 2: customer_users → customer_id + role
  const callerRes = await fetch(
    `${supabaseUrl}/rest/v1/customer_users?auth_user_id=eq.${userData.id}&select=id,customer_id,role`,
    { headers: supabaseHeaders }
  );
  const callerData = await callerRes.json();
  if (!Array.isArray(callerData) || callerData.length === 0) {
    throw Object.assign(new Error('No customer account found'), { status: 403 });
  }
  const caller = callerData[0];

  // Step 3: customers → business_id
  const custRes = await fetch(
    `${supabaseUrl}/rest/v1/customers?id=eq.${caller.customer_id}&select=business_id`,
    { headers: supabaseHeaders }
  );
  const custData = await custRes.json();
  if (!Array.isArray(custData) || custData.length === 0) {
    throw Object.assign(new Error('Customer record not found'), { status: 404 });
  }

  return {
    userId: userData.id,
    customerId: caller.customer_id,
    role: caller.role,
    businessId: custData[0].business_id,
  };
}

