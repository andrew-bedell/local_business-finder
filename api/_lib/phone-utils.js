// Shared phone number utilities for E.164 normalization
// WhatsApp requires E.164 format: +{country_code}{number} with no spaces/dashes

/**
 * Country code map — ISO 3166-1 alpha-2 to dialing code (without +).
 */
export const COUNTRY_CODES = {
  MX: '52',
  CO: '57',
  US: '1',
  PE: '51',
  AR: '54',
  CL: '56',
  EC: '593',
  GT: '502',
  HN: '504',
  CR: '506',
  PA: '507',
  DO: '1',   // Dominican Republic shares +1 with US
  VE: '58',
  BR: '55',
  UY: '598',
  BO: '591',
  PY: '595',
  NI: '505',
  SV: '503',
};

/**
 * Strip all non-digit characters except a leading +.
 */
function stripPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Normalize a phone number to E.164 format for WhatsApp.
 *
 * Rules:
 * 1. Strip spaces, dashes, parens, dots
 * 2. If already starts with +{digits}, validate and return
 * 3. If starts with country code digits (e.g. 52...), prepend +
 * 4. If local number + countryCode provided, prepend +{countryCode}
 * 5. If local number + addressCountry (ISO), look up code and prepend
 *
 * @param {string} phone - Raw phone number
 * @param {Object} [opts]
 * @param {string} [opts.countryCode] - Dialing code without + (e.g. "52")
 * @param {string} [opts.addressCountry] - ISO country code (e.g. "MX") — fallback if countryCode not provided
 * @returns {string|null} E.164 phone number or null if invalid
 */
export function toE164(phone, opts = {}) {
  if (!phone) return null;

  let stripped = stripPhone(phone);
  if (!stripped) return null;

  // Already has + prefix — assume it's complete
  if (stripped.startsWith('+')) {
    const digits = stripped.slice(1);
    if (digits.length < 7 || digits.length > 15) return null;
    return '+' + digits;
  }

  // Resolve country code from options
  let dialCode = opts.countryCode || null;
  if (!dialCode && opts.addressCountry) {
    dialCode = COUNTRY_CODES[opts.addressCountry.toUpperCase()] || null;
  }

  // If number already starts with the dial code, just prepend +
  if (dialCode && stripped.startsWith(dialCode)) {
    const result = '+' + stripped;
    if (stripped.length >= 7 && stripped.length <= 15) return result;
  }

  // Mexico special case: local numbers sometimes start with 1 (cell prefix) or are 10 digits
  // For MX, a 10-digit number is local (area code + number)
  if (dialCode === '52' && stripped.length === 10) {
    return '+52' + stripped;
  }

  // Colombia: local numbers are 10 digits (area/mobile + number)
  if (dialCode === '57' && stripped.length === 10) {
    return '+57' + stripped;
  }

  // US/CA: 10-digit local numbers
  if (dialCode === '1' && stripped.length === 10) {
    return '+1' + stripped;
  }

  // Generic: if we have a dial code and the number doesn't start with it, prepend
  if (dialCode && !stripped.startsWith(dialCode)) {
    const result = '+' + dialCode + stripped;
    const totalDigits = dialCode.length + stripped.length;
    if (totalDigits >= 7 && totalDigits <= 15) return result;
  }

  // Last resort: if number is long enough, just prepend +
  if (stripped.length >= 10 && stripped.length <= 15) {
    return '+' + stripped;
  }

  return null;
}

/**
 * Reverse lookup: dial code (without +) → ISO country code.
 * For ambiguous codes (e.g. +1 → US/DO), returns the most common match.
 */
export function countryFromDialCode(dialCode) {
  if (!dialCode) return null;
  const code = String(dialCode).replace(/^\+/, '');
  // Build reverse map (first match wins for duplicates like +1)
  const reverseMap = {};
  for (const [iso, dial] of Object.entries(COUNTRY_CODES)) {
    if (!reverseMap[dial]) reverseMap[dial] = iso;
  }
  return reverseMap[code] || null;
}

/**
 * Legacy normalizePhone — strips formatting only (no country code logic).
 * Kept for backward compatibility in matching (where we compare raw values).
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/[\s\-().]/g, '').trim() || null;
}
