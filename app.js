// === Local Business Finder Application ===

(function () {
  'use strict';

  // ── State ──
  let apiKey = localStorage.getItem('google_places_api_key') || '';
  let map = null;
  let placesService = null;
  let geocoder = null;
  let allResults = [];
  let filteredResults = [];
  let isSearching = false;
  let mapsLoaded = false;

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const apiKeyInput = $('#api-key-input');
  const apiStatus = $('#api-status');
  const apiHelpToggle = $('#api-help-toggle');
  const apiHelp = $('#api-help');
  const btnSaveKey = $('#btn-save-key');
  const locationInput = $('#location-input');
  const businessType = $('#business-type');
  const radiusSelect = $('#radius-select');
  const maxResults = $('#max-results');
  const countrySelect = $('#country-select');
  const btnSearch = $('#btn-search');
  const progressSection = $('#progress-section');
  const progressBar = $('#progress-bar');
  const progressText = $('#progress-text');
  const progressStats = $('#progress-stats');
  const resultsSection = $('#results-section');
  const resultsSummary = $('#results-summary');
  const resultsBody = $('#results-body');
  const noResults = $('#no-results');
  const filterInput = $('#filter-input');
  const sortSelect = $('#sort-select');
  const btnExportCsv = $('#btn-export-csv');
  const btnClear = $('#btn-clear');

  // ── Initialize ──
  function init() {
    if (apiKey) {
      apiKeyInput.value = '••••••••••••••••••••';
      loadGoogleMaps(apiKey);
    }

    btnSaveKey.addEventListener('click', saveApiKey);
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveApiKey();
    });
    apiHelpToggle.addEventListener('click', () => {
      apiHelp.style.display = apiHelp.style.display === 'none' ? 'block' : 'none';
    });
    btnSearch.addEventListener('click', startSearch);
    filterInput.addEventListener('input', applyFilterAndSort);
    sortSelect.addEventListener('change', applyFilterAndSort);
    btnExportCsv.addEventListener('click', exportCsv);
    btnClear.addEventListener('click', clearResults);
    countrySelect.addEventListener('change', onCountryChange);

    onCountryChange();
    updateSearchButton();
  }

  // ── API Key Management ──
  function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (!key || key === '••••••••••••••••••••') {
      showApiStatus('Please enter a valid API key.', 'error');
      return;
    }
    apiKey = key;
    localStorage.setItem('google_places_api_key', apiKey);
    apiKeyInput.value = '••••••••••••••••••••';
    showApiStatus('Key saved. Loading Google Maps...', 'success');
    loadGoogleMaps(apiKey);
  }

  function showApiStatus(msg, type) {
    apiStatus.textContent = msg;
    apiStatus.className = 'api-status ' + type;
  }

  // ── Google Maps Loading ──
  function loadGoogleMaps(key) {
    if (mapsLoaded) {
      initServices();
      return;
    }

    // Remove any existing script
    const existing = document.querySelector('script[src*="maps.googleapis"]');
    if (existing) existing.remove();

    window._gmapsCallback = function () {
      mapsLoaded = true;
      initServices();
      showApiStatus('Google Maps loaded successfully.', 'success');
      updateSearchButton();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=_gmapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      showApiStatus('Failed to load Google Maps. Check your API key and ensure Places API is enabled.', 'error');
    };
    document.head.appendChild(script);
  }

  function initServices() {
    // Create a hidden map div (required by PlacesService)
    let mapDiv = document.getElementById('hidden-map');
    if (!mapDiv) {
      mapDiv = document.createElement('div');
      mapDiv.id = 'hidden-map';
      mapDiv.style.display = 'none';
      document.body.appendChild(mapDiv);
    }
    map = new google.maps.Map(mapDiv, { center: { lat: 0, lng: 0 }, zoom: 2 });
    placesService = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();
  }

  // ── Search Button State ──
  function updateSearchButton() {
    const hasLocation = locationInput.value.trim().length > 0;
    const hasType = businessType.value !== '';
    const hasApi = mapsLoaded;
    btnSearch.disabled = !(hasLocation && hasType && hasApi);
  }

  locationInput.addEventListener('input', updateSearchButton);
  businessType.addEventListener('change', updateSearchButton);

  // ── Main Search Flow ──
  async function startSearch() {
    if (isSearching) return;
    isSearching = true;

    const location = locationInput.value.trim();
    const type = businessType.value;
    const radius = parseInt(radiusSelect.value);
    const maxCount = parseInt(maxResults.value);

    // Show progress, hide results
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    allResults = [];
    filteredResults = [];
    updateProgress(0, 'Geocoding location...');

    btnSearch.querySelector('.btn-text').style.display = 'none';
    btnSearch.querySelector('.btn-loading').style.display = 'inline-flex';
    btnSearch.disabled = true;

    try {
      // Step 1: Geocode the location
      const coords = await geocodeLocation(location);
      if (!coords) {
        updateProgress(0, 'Could not find that location. Please try a different address, city, or zip code.');
        resetSearchButton();
        return;
      }

      updateProgress(10, `Location found: ${coords.formattedAddress}. Searching for businesses...`);

      // Step 2: Search for businesses nearby
      const places = await searchPlaces(coords.latLng, type, radius, maxCount);
      if (places.length === 0) {
        updateProgress(100, 'No businesses found in this area. Try expanding the search radius.');
        resetSearchButton();
        return;
      }

      updateProgress(30, `Found ${places.length} businesses. Checking for websites...`);

      // Step 3: Get details for each place (to check for website)
      const detailedPlaces = await getPlaceDetails(places, 30, 95);

      // Step 4: Filter to only those without websites
      const noWebsite = detailedPlaces.filter((p) => !p.website);
      allResults = noWebsite;

      updateProgress(100, 'Search complete!');
      progressStats.textContent = `${places.length} total businesses found | ${noWebsite.length} without a website`;

      // Show results
      showResults();
    } catch (err) {
      console.error('Search error:', err);
      updateProgress(0, `Error: ${err.message || 'An unexpected error occurred.'}`);
    }

    resetSearchButton();
  }

  function resetSearchButton() {
    isSearching = false;
    btnSearch.querySelector('.btn-text').style.display = 'inline';
    btnSearch.querySelector('.btn-loading').style.display = 'none';
    updateSearchButton();
  }

  // ── Country Selection ──
  function onCountryChange() {
    const country = countrySelect.value;
    if (country === 'mx') {
      locationInput.placeholder = 'Ciudad, código postal o dirección (e.g., Ciudad de México, Guadalajara, Cancún)';
      updateRadiusLabels(true);
    } else {
      locationInput.placeholder = 'City, zip code, or address (e.g., Austin TX, 90210, 123 Main St)';
      updateRadiusLabels(false);
    }
  }

  function updateRadiusLabels(useKm) {
    const radiusOptions = radiusSelect.querySelectorAll('option');
    const labels = useKm
      ? ['1.5 km', '5 km', '8 km', '15 km', '30 km', '50 km']
      : ['1 mile', '3 miles', '5 miles', '10 miles', '20 miles', '30 miles'];
    radiusOptions.forEach((opt, i) => {
      opt.textContent = labels[i];
    });
  }

  // ── Geocoding ──
  function geocodeLocation(address) {
    const country = countrySelect.value;
    return new Promise((resolve) => {
      geocoder.geocode(
        { address, componentRestrictions: { country } },
        (results, status) => {
          if (status === 'OK' && results.length > 0) {
            resolve({
              latLng: results[0].geometry.location,
              formattedAddress: results[0].formatted_address,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // ── Places Search ──
  function searchPlaces(latLng, type, radius, maxCount) {
    return new Promise((resolve) => {
      const allPlaces = [];

      const request = {
        location: latLng,
        radius: radius,
        type: type,
      };

      function handleResults(results, status, pagination) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          allPlaces.push(...results);

          // Google returns up to 20 results per page, up to 3 pages (60 total)
          if (pagination && pagination.hasNextPage && allPlaces.length < maxCount) {
            updateProgress(20, `Found ${allPlaces.length} businesses so far, loading more...`);
            // Google requires a short delay before requesting next page
            setTimeout(() => {
              pagination.nextPage();
            }, 2000);
          } else {
            resolve(allPlaces.slice(0, maxCount));
          }
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          console.warn('Places search status:', status);
          resolve(allPlaces);
        }
      }

      placesService.nearbySearch(request, handleResults);
    });
  }

  // ── Place Details ──
  function getPlaceDetails(places, progressStart, progressEnd) {
    return new Promise((resolve) => {
      const detailed = [];
      let completed = 0;
      const total = places.length;

      // Process in batches to respect rate limits
      const batchSize = 5;
      let batchIndex = 0;

      function processBatch() {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, total);
        const batch = places.slice(start, end);

        if (batch.length === 0) {
          resolve(detailed);
          return;
        }

        let batchCompleted = 0;

        batch.forEach((place) => {
          const request = {
            placeId: place.place_id,
            fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'user_ratings_total', 'business_status', 'url', 'types', 'reviews', 'photos', 'opening_hours'],
          };

          placesService.getDetails(request, (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              detailed.push({
                name: result.name || '',
                address: result.formatted_address || '',
                phone: result.formatted_phone_number || '',
                website: result.website || '',
                rating: result.rating || 0,
                reviewCount: result.user_ratings_total || 0,
                status: result.business_status || 'UNKNOWN',
                mapsUrl: result.url || '',
                types: result.types || [],
                placeId: place.place_id,
                reviewData: result.reviews || [],
                photos: result.photos || [],
                hours: result.opening_hours ? result.opening_hours.weekday_text || [] : [],
              });
            } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              // If rate limited, still add with basic info
              detailed.push({
                name: place.name || '',
                address: place.vicinity || '',
                phone: '',
                website: '', // Unknown — treat as no website
                rating: place.rating || 0,
                reviewCount: place.user_ratings_total || 0,
                status: place.business_status || 'UNKNOWN',
                mapsUrl: '',
                types: place.types || [],
                placeId: place.place_id,
                reviewData: [],
                photos: place.photos || [],
                hours: [],
              });
            }

            completed++;
            batchCompleted++;
            const pct = progressStart + ((completed / total) * (progressEnd - progressStart));
            updateProgress(pct, `Checking business ${completed} of ${total}...`);

            if (batchCompleted === batch.length) {
              batchIndex++;
              if (batchIndex * batchSize < total) {
                // Small delay between batches to avoid rate limiting
                setTimeout(processBatch, 300);
              } else {
                resolve(detailed);
              }
            }
          });
        });
      }

      processBatch();
    });
  }

  // ── Progress ──
  function updateProgress(pct, text) {
    progressBar.style.width = Math.round(pct) + '%';
    progressText.textContent = text;
  }

  // ── Display Results ──
  function showResults() {
    resultsSection.style.display = 'block';

    if (allResults.length === 0) {
      noResults.style.display = 'block';
      document.querySelector('.results-table-wrapper').style.display = 'none';
      document.querySelector('.filter-bar').style.display = 'none';
      resultsSummary.textContent = 'No businesses without websites found.';
      return;
    }

    noResults.style.display = 'none';
    document.querySelector('.results-table-wrapper').style.display = 'block';
    document.querySelector('.filter-bar').style.display = 'flex';

    applyFilterAndSort();
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  function applyFilterAndSort() {
    const filter = filterInput.value.toLowerCase().trim();
    const sort = sortSelect.value;

    // Filter
    filteredResults = allResults.filter((r) => {
      if (!filter) return true;
      return r.name.toLowerCase().includes(filter) || r.address.toLowerCase().includes(filter);
    });

    // Sort
    filteredResults.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'reviews') return (b.reviewCount || 0) - (a.reviewCount || 0);
      return 0;
    });

    resultsSummary.textContent = `Showing ${filteredResults.length} of ${allResults.length} businesses without websites`;
    renderTable();
  }

  function renderTable() {
    resultsBody.innerHTML = '';

    filteredResults.forEach((place, idx) => {
      const tr = document.createElement('tr');

      // Business status display
      const statusText = place.status === 'OPERATIONAL' ? 'Open' :
        place.status === 'CLOSED_TEMPORARILY' ? 'Temp Closed' :
        place.status === 'CLOSED_PERMANENTLY' ? 'Closed' : 'Unknown';

      const statusClass = place.status === 'OPERATIONAL' ? 'success' :
        place.status === 'CLOSED_PERMANENTLY' ? 'danger' : 'warning';

      // Star rating
      const fullStars = Math.floor(place.rating);
      const hasHalf = place.rating - fullStars >= 0.5;
      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        if (i < fullStars) starsHtml += '\u2605';
        else if (i === fullStars && hasHalf) starsHtml += '\u2606';
        else starsHtml += '\u2606';
      }

      const mapsLink = place.mapsUrl
        ? `<a href="${escapeHtml(place.mapsUrl)}" target="_blank" rel="noopener" class="maps-link" title="Open in Google Maps">\u{1F4CD}</a>`
        : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}" target="_blank" rel="noopener" class="maps-link" title="Search on Google Maps">\u{1F4CD}</a>`;

      const hasContent = (place.reviewData && place.reviewData.length > 0) || (place.photos && place.photos.length > 0);
      const viewBtnHtml = hasContent
        ? `<button class="btn btn-view" data-idx="${idx}">View</button>`
        : `<span style="color:var(--text-dim);font-size:12px">No data</span>`;

      tr.innerHTML = `
        <td class="td-center">${idx + 1}</td>
        <td><strong>${escapeHtml(place.name)}</strong></td>
        <td>${escapeHtml(place.address)}</td>
        <td>${escapeHtml(place.phone) || '<span style="color:var(--text-dim)">N/A</span>'}</td>
        <td class="td-center">
          <span class="stars">${starsHtml}</span>
          <span class="rating-num">${place.rating > 0 ? place.rating.toFixed(1) : 'N/A'}</span>
        </td>
        <td class="td-center">${place.reviewCount > 0 ? place.reviewCount.toLocaleString() : '0'}</td>
        <td><span class="badge badge-no-site">No Website</span></td>
        <td class="td-center">${viewBtnHtml}</td>
        <td class="td-center">${mapsLink}</td>
      `;

      // Attach click handler for View button
      const viewBtn = tr.querySelector('.btn-view');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => openDetailModal(place));
      }

      resultsBody.appendChild(tr);
    });
  }

  // ── Export CSV ──
  function exportCsv() {
    if (filteredResults.length === 0) return;

    const headers = ['#', 'Business Name', 'Address', 'Phone', 'Rating', 'Reviews', 'Status', 'Google Maps URL'];
    const rows = filteredResults.map((p, i) => [
      i + 1,
      csvEscape(p.name),
      csvEscape(p.address),
      csvEscape(p.phone),
      p.rating || '',
      p.reviewCount || '',
      p.status || '',
      p.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`,
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    const typeName = businessType.options[businessType.selectedIndex].text;
    a.download = `businesses-no-website-${typeName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Clear Results ──
  function clearResults() {
    allResults = [];
    filteredResults = [];
    resultsSection.style.display = 'none';
    progressSection.style.display = 'none';
    filterInput.value = '';
    resultsBody.innerHTML = '';
  }

  // ── Utility ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function csvEscape(str) {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // ── Sentiment Analysis ──
  const positiveWords = [
    'amazing', 'awesome', 'best', 'beautiful', 'clean', 'delicious', 'excellent',
    'exceptional', 'fantastic', 'favorite', 'friendly', 'generous', 'genuine',
    'good', 'gorgeous', 'great', 'happy', 'helpful', 'impressed', 'incredible',
    'kind', 'love', 'loved', 'lovely', 'nice', 'outstanding', 'perfect',
    'phenomenal', 'pleasant', 'polite', 'professional', 'quality', 'recommend',
    'remarkable', 'satisfied', 'stellar', 'superb', 'terrific', 'top-notch',
    'welcoming', 'wonderful', 'worth'
  ];
  const negativeWords = [
    'awful', 'bad', 'cold', 'complaint', 'dirty', 'disappoint', 'disgusting',
    'dreadful', 'horrible', 'mediocre', 'never', 'overpriced', 'poor', 'rude',
    'slow', 'terrible', 'unfriendly', 'unprofessional', 'waste', 'worst'
  ];

  function analyzeSentiment(review) {
    if (!review || !review.text) return { score: 0, label: 'neutral' };

    const text = review.text.toLowerCase();
    const words = text.split(/\s+/);

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      const clean = word.replace(/[^a-z-]/g, '');
      if (positiveWords.includes(clean)) positiveCount++;
      if (negativeWords.includes(clean)) negativeCount++;
    });

    // Combine keyword sentiment with star rating
    const keywordScore = (positiveCount - negativeCount) / Math.max(words.length, 1);
    const ratingScore = ((review.rating || 3) - 3) / 2; // Normalize: 1=-1, 3=0, 5=1

    // Weighted: 40% keywords, 60% rating
    const score = (keywordScore * 0.4) + (ratingScore * 0.6);

    // Bonus for review length (longer reviews are more useful for websites)
    const lengthBonus = Math.min(text.length / 500, 0.2);

    const finalScore = score + lengthBonus;

    let label = 'neutral';
    if (finalScore > 0.15) label = 'positive';
    if (finalScore > 0.4) label = 'very positive';
    if (finalScore < -0.1) label = 'negative';

    return { score: finalScore, label, positiveCount, negativeCount };
  }

  function getTopReviews(reviewData, count) {
    if (!reviewData || reviewData.length === 0) return [];

    const scored = reviewData.map((review) => ({
      ...review,
      sentiment: analyzeSentiment(review),
    }));

    // Sort by sentiment score (best first), then filter to positive only
    scored.sort((a, b) => b.sentiment.score - a.sentiment.score);

    return scored
      .filter((r) => r.sentiment.label === 'positive' || r.sentiment.label === 'very positive')
      .slice(0, count);
  }

  // ── Photo URLs ──
  function getPhotoUrl(photo, maxWidth) {
    if (!photo || !photo.getUrl) return null;
    return photo.getUrl({ maxWidth: maxWidth || 600 });
  }

  // ── Detail Modal ──
  function openDetailModal(place) {
    // Remove existing modal if any
    const existing = document.getElementById('detail-modal');
    if (existing) existing.remove();

    const topReviews = getTopReviews(place.reviewData, 5);
    const photos = (place.photos || []).slice(0, 8);

    const modal = document.createElement('div');
    modal.id = 'detail-modal';
    modal.className = 'modal-overlay';

    // Build photo gallery HTML
    let photosHtml = '';
    if (photos.length > 0) {
      const photoItems = photos.map((photo) => {
        const url = getPhotoUrl(photo, 600);
        if (!url) return '';
        return `<div class="photo-item"><img src="${url}" alt="Business photo" loading="lazy"></div>`;
      }).filter(Boolean).join('');

      if (photoItems) {
        photosHtml = `
          <div class="modal-section">
            <h3>Photos</h3>
            <div class="photo-gallery">${photoItems}</div>
          </div>
        `;
      }
    }

    // Build reviews HTML
    let reviewsHtml = '';
    if (topReviews.length > 0) {
      const reviewItems = topReviews.map((review) => {
        const stars = '\u2605'.repeat(Math.floor(review.rating)) + '\u2606'.repeat(5 - Math.floor(review.rating));
        const sentimentBadge = review.sentiment.label === 'very positive'
          ? '<span class="sentiment-badge sentiment-great">Top Pick</span>'
          : '<span class="sentiment-badge sentiment-good">Good</span>';
        const timeAgo = review.relative_time_description || '';
        return `
          <div class="review-card">
            <div class="review-header">
              <div class="review-author">
                ${review.profile_photo_url ? `<img src="${review.profile_photo_url}" alt="" class="review-avatar">` : '<div class="review-avatar-placeholder"></div>'}
                <div>
                  <strong>${escapeHtml(review.author_name || 'Anonymous')}</strong>
                  <span class="review-time">${escapeHtml(timeAgo)}</span>
                </div>
              </div>
              <div class="review-meta">
                <span class="stars">${stars}</span>
                ${sentimentBadge}
              </div>
            </div>
            <p class="review-text">${escapeHtml(review.text)}</p>
          </div>
        `;
      }).join('');

      reviewsHtml = `
        <div class="modal-section">
          <h3>Top Reviews for Website</h3>
          <p class="section-subtitle">Ranked by sentiment analysis — best testimonials first</p>
          <div class="reviews-list">${reviewItems}</div>
        </div>
      `;
    } else {
      reviewsHtml = `
        <div class="modal-section">
          <h3>Reviews</h3>
          <p class="section-subtitle" style="color:var(--text-dim)">No reviews available for this business.</p>
        </div>
      `;
    }

    // Build hours HTML
    let hoursHtml = '';
    if (place.hours && place.hours.length > 0) {
      const hourItems = place.hours.map((h) => `<li>${escapeHtml(h)}</li>`).join('');
      hoursHtml = `
        <div class="modal-section">
          <h3>Business Hours</h3>
          <ul class="hours-list">${hourItems}</ul>
        </div>
      `;
    }

    // Star rating display
    const fullStars = Math.floor(place.rating);
    const hasHalf = place.rating - fullStars >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) starsHtml += '\u2605';
      else if (i === fullStars && hasHalf) starsHtml += '\u2606';
      else starsHtml += '\u2606';
    }

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2>${escapeHtml(place.name)}</h2>
            <p class="modal-address">${escapeHtml(place.address)}</p>
            <div class="modal-meta">
              <span class="stars">${starsHtml}</span>
              <span>${place.rating > 0 ? place.rating.toFixed(1) : 'N/A'}</span>
              <span class="meta-sep">|</span>
              <span>${place.reviewCount > 0 ? place.reviewCount.toLocaleString() + ' reviews' : 'No reviews'}</span>
              ${place.phone ? `<span class="meta-sep">|</span><span>${escapeHtml(place.phone)}</span>` : ''}
            </div>
          </div>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          ${photosHtml}
          ${reviewsHtml}
          ${hoursHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-copy-reviews">Copy Top Reviews</button>
          <button class="btn btn-primary" id="modal-close-btn-footer">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const closeModal = () => modal.remove();
    modal.querySelector('#modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#modal-close-btn-footer').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    // Copy reviews button
    modal.querySelector('#modal-copy-reviews').addEventListener('click', () => {
      if (topReviews.length === 0) return;
      const text = topReviews.map((r) =>
        `"${r.text}"\n— ${r.author_name || 'Anonymous'}, ${'\u2605'.repeat(r.rating)} (${r.rating}/5)`
      ).join('\n\n');
      navigator.clipboard.writeText(text).then(() => {
        const btn = modal.querySelector('#modal-copy-reviews');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy Top Reviews'; }, 2000);
      });
    });
  }

  // ── Start ──
  init();
})();
