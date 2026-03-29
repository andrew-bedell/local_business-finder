// HMAC-based token for secure domain selection links in emails
// Tokens encode a businessId + expiry, signed with a key derived from the Supabase secret

import { createHmac, createHash, timingSafeEqual } from 'crypto';

function getSigningKey() {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('No signing key available');
  return createHash('sha256').update('domain-select:' + secret).digest();
}

export function generateDomainToken(businessId, expiryDays = 7) {
  const expiry = Math.floor(Date.now() / 1000) + (expiryDays * 86400);
  const payload = `${businessId}.${expiry}`;
  const key = getSigningKey();
  const sig = createHmac('sha256', key).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function validateDomainToken(token) {
  try {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payloadB64 = token.substring(0, dotIndex);
    const sig = token.substring(dotIndex + 1);
    const payload = Buffer.from(payloadB64, 'base64url').toString();
    const key = getSigningKey();
    const expectedSig = createHmac('sha256', key).update(payload).digest('base64url');

    // Timing-safe comparison
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const lastDot = payload.lastIndexOf('.');
    const businessId = payload.substring(0, lastDot);
    const expiry = parseInt(payload.substring(lastDot + 1));
    if (Date.now() / 1000 > expiry) return null;

    return { businessId };
  } catch {
    return null;
  }
}
