// Server-side business data compiler for AI prompts
// Mirrors the logic from employee/admin.js compileBusinessDataForPrompt()
// Fetches data from Supabase and formats it for research-report and generate-website APIs

const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  }
  return supabase;
}


/**
 * Fetch business details (reviews, photos, social profiles) from Supabase.
 *
 * @param {number} businessId
 * @returns {Object} { business, reviews, photos, socialProfiles }
 */
async function fetchBusinessDetails(businessId) {
  const sb = getClient();

  // Fetch business with social profiles
  const { data: business, error: bizErr } = await sb
    .from('businesses')
    .select('*, business_social_profiles(*)')
    .eq('id', businessId)
    .single();

  if (bizErr || !business) {
    throw new Error(`Business ${businessId} not found: ${bizErr?.message}`);
  }

  // Fetch top reviews sorted by sentiment score
  const { data: reviews } = await sb
    .from('business_reviews')
    .select('*')
    .eq('business_id', businessId)
    .order('sentiment_score', { ascending: false, nullsFirst: false })
    .limit(20);

  // Fetch photos (up to 30)
  const { data: photos } = await sb
    .from('business_photos')
    .select('*')
    .eq('business_id', businessId)
    .limit(30);

  return {
    business,
    reviews: reviews || [],
    photos: photos || [],
    socialProfiles: business.business_social_profiles || [],
  };
}


/**
 * Compile business data into a formatted text string for AI prompts.
 * Matches the format expected by /api/ai/research-report and /api/ai/generate-website.
 *
 * @param {Object} business — Full business record from Supabase
 * @param {Array} reviews — From business_reviews table
 * @param {Array} photos — From business_photos table
 * @param {Array} socialProfiles — From business_social_profiles table
 * @returns {string} Formatted business data text
 */
function compileBusinessDataForPrompt(business, reviews, photos, socialProfiles) {
  const sections = [];

  // Identity
  sections.push('=== BUSINESS IDENTITY ===');
  sections.push(`Name: ${business.name || 'Unknown'}`);
  if (business.address_full) sections.push(`Address: ${business.address_full}`);
  if (business.phone) sections.push(`Phone: ${business.phone}`);
  if (business.category) sections.push(`Category: ${business.category}`);
  if (business.subcategory) sections.push(`Subcategory: ${business.subcategory}`);
  if (business.types && business.types.length > 0) {
    sections.push(`Google Types: ${business.types.join(', ')}`);
  }
  if (business.business_status) sections.push(`Status: ${business.business_status}`);

  // Business details
  const detailFields = [
    ['Description', business.description],
    ['Price Level', business.price_level ? '$'.repeat(business.price_level) : null],
    ['Service Options', business.service_options?.join(', ')],
    ['Amenities', business.amenities?.join(', ')],
    ['Highlights', business.highlights?.join(', ')],
    ['Payment Methods', business.payment_methods?.join(', ')],
    ['Languages Spoken', business.languages_spoken?.join(', ')],
    ['Accessibility', business.accessibility_info],
    ['Parking', business.parking_info],
    ['Year Established', business.year_established],
    ['Owner', business.owner_name],
  ];
  const activeDetails = detailFields.filter(([, v]) => v);
  if (activeDetails.length > 0) {
    sections.push('');
    sections.push('=== BUSINESS DETAILS ===');
    activeDetails.forEach(([label, val]) => sections.push(`${label}: ${val}`));
  }

  // Ratings overview
  if (business.rating || business.review_count) {
    sections.push('');
    sections.push('=== RATINGS & REVIEWS OVERVIEW ===');
    if (business.rating) sections.push(`Google Rating: ${business.rating} / 5`);
    if (business.review_count) sections.push(`Total Reviews: ${business.review_count}`);
  }

  // Google reviews
  const googleReviews = reviews.filter(r => r.source === 'google').slice(0, 15);
  if (googleReviews.length > 0) {
    sections.push('');
    sections.push('=== GOOGLE REVIEWS ===');
    googleReviews.forEach((r, i) => {
      const author = r.author_name || 'Anonymous';
      const stars = r.rating ? `${r.rating}★` : '';
      const text = r.review_text || r.text || '';
      sections.push(`Review ${i + 1} (${stars} by ${author}): "${text}"`);
    });
  }

  // Facebook reviews
  const fbReviews = reviews.filter(r => r.source === 'facebook').slice(0, 5);
  if (fbReviews.length > 0) {
    sections.push('');
    sections.push('=== FACEBOOK REVIEWS ===');
    fbReviews.forEach((r, i) => {
      const author = r.author_name || 'Anonymous';
      const stars = r.rating ? `${r.rating}★` : '';
      const text = r.review_text || r.text || '';
      sections.push(`FB Review ${i + 1} (${stars} by ${author}): "${text}"`);
    });
  }

  // Business hours
  if (business.hours && business.hours.length > 0) {
    sections.push('');
    sections.push('=== BUSINESS HOURS ===');
    business.hours.forEach(h => sections.push(h));
  }

  // Social media profiles
  if (socialProfiles && socialProfiles.length > 0) {
    sections.push('');
    sections.push('=== SOCIAL MEDIA PROFILES ===');
    socialProfiles.forEach(sp => {
      let line = `${sp.platform}: ${sp.profile_url || 'N/A'}`;
      if (sp.handle) line += ` (@${sp.handle})`;
      if (sp.follower_count) line += ` | ${sp.follower_count} followers`;
      if (sp.post_count) line += ` | ${sp.post_count} posts`;
      sections.push(line);
    });
  }

  // Photo inventory
  if (photos && photos.length > 0) {
    sections.push('');
    sections.push('=== PHOTO INVENTORY ===');
    sections.push(`Total Photos Available: ${photos.length}`);
    photos.forEach((p, i) => {
      const id = `${p.source || 'unknown'}_photo_${i}`;
      let line = `ID: ${id} | Source: ${p.source || 'unknown'} | Type: ${p.photo_type || 'unclassified'}`;
      if (p.caption) line += ` | Caption: "${p.caption.substring(0, 150)}"`;
      sections.push(line);
    });
  }

  return sections.join('\n');
}


/**
 * Build photo inventory array for the website generation API.
 *
 * @param {Array} photos — From business_photos table
 * @returns {Array<{id: string, type: string, url: string}>}
 */
function buildPhotoInventory(photos) {
  return (photos || []).map((p, i) => ({
    id: `${p.source || 'unknown'}_photo_${i}`,
    type: p.photo_type || 'unclassified',
    url: p.storage_path
      ? (process.env.SUPABASE_URL + '/storage/v1/object/public/photos/' + p.storage_path)
      : p.url,
  }));
}


/**
 * Calculate a data completeness score (0-100) for a business.
 * Used as a quality gate before website generation.
 */
function calculateCompleteness(business, reviews, photos, socialProfiles) {
  let score = 0;
  if (business.name && business.address_full) score += 10;
  if (business.phone) score += 10;
  if (business.hours?.length > 0) score += 10;
  if (business.category || business.types?.length > 0) score += 5;
  if (reviews.length >= 3) score += 15;
  if (reviews.length >= 5) score += 10;
  if (photos.length >= 3) score += 15;
  if (photos.length >= 5) score += 10;
  if (socialProfiles.length > 0) score += 5;
  if (business.description || business.highlights?.length > 0) score += 10;
  return Math.min(score, 100);
}


module.exports = {
  fetchBusinessDetails,
  compileBusinessDataForPrompt,
  buildPhotoInventory,
  calculateCompleteness,
};
