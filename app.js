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
            fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'user_ratings_total', 'business_status', 'url', 'types'],
          };

          placesService.getDetails(request, (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              detailed.push({
                name: result.name || '',
                address: result.formatted_address || '',
                phone: result.formatted_phone_number || '',
                website: result.website || '',
                rating: result.rating || 0,
                reviews: result.user_ratings_total || 0,
                status: result.business_status || 'UNKNOWN',
                mapsUrl: result.url || '',
                types: result.types || [],
                placeId: place.place_id,
              });
            } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              // If rate limited, still add with basic info
              detailed.push({
                name: place.name || '',
                address: place.vicinity || '',
                phone: '',
                website: '', // Unknown — treat as no website
                rating: place.rating || 0,
                reviews: place.user_ratings_total || 0,
                status: place.business_status || 'UNKNOWN',
                mapsUrl: '',
                types: place.types || [],
                placeId: place.place_id,
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
      if (sort === 'reviews') return (b.reviews || 0) - (a.reviews || 0);
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

      tr.innerHTML = `
        <td class="td-center">${idx + 1}</td>
        <td><strong>${escapeHtml(place.name)}</strong></td>
        <td>${escapeHtml(place.address)}</td>
        <td>${escapeHtml(place.phone) || '<span style="color:var(--text-dim)">N/A</span>'}</td>
        <td class="td-center">
          <span class="stars">${starsHtml}</span>
          <span class="rating-num">${place.rating > 0 ? place.rating.toFixed(1) : 'N/A'}</span>
        </td>
        <td class="td-center">${place.reviews > 0 ? place.reviews.toLocaleString() : '0'}</td>
        <td><span class="badge badge-no-site">No Website</span></td>
        <td class="td-center">${mapsLink}</td>
      `;

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
      p.reviews || '',
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

  // ── Start ──
  init();
})();
