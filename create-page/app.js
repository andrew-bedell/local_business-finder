(function () {
  'use strict';

  var BUSINESS_TYPES = [
    { value: '', label: 'Selecciona una categoría' },
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'cafe', label: 'Cafetería' },
    { value: 'bakery', label: 'Panadería' },
    { value: 'bar', label: 'Bar / Cantina' },
    { value: 'salon', label: 'Salón de belleza' },
    { value: 'nail-salon', label: 'Salón de uñas' },
    { value: 'spa', label: 'Spa' },
    { value: 'barber', label: 'Barbería' },
    { value: 'doctor', label: 'Consultorio / Clínica' },
    { value: 'dentist', label: 'Dentista' },
    { value: 'veterinarian', label: 'Veterinaria' },
    { value: 'physiotherapist', label: 'Fisioterapia' },
    { value: 'gym', label: 'Gimnasio / Fitness' },
    { value: 'lawyer', label: 'Despacho legal' },
    { value: 'accountant', label: 'Contador / Finanzas' },
    { value: 'insurance', label: 'Seguros' },
    { value: 'real-estate', label: 'Bienes raíces' },
    { value: 'plumber', label: 'Plomería' },
    { value: 'electrician', label: 'Electricista' },
    { value: 'contractor', label: 'Contratista / Remodelación' },
    { value: 'auto-repair', label: 'Taller mecánico' },
    { value: 'hotel', label: 'Hotel / Hospedaje' },
    { value: 'travel', label: 'Viajes / Turismo' },
    { value: 'retail', label: 'Tienda / Comercio' },
    { value: 'generic', label: 'Otro negocio local' }
  ];

  var state = {
    selectedGoogleMatch: null,
    uploadedPhotos: []
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function setStatus(el, message, tone) {
    if (!el) return;
    el.textContent = message || '';
    if (tone) el.setAttribute('data-tone', tone);
    else el.removeAttribute('data-tone');
  }

  function populateBusinessTypes() {
    var select = $('#cp-business-type');
    if (!select) return;
    select.innerHTML = BUSINESS_TYPES.map(function (item) {
      return '<option value="' + item.value + '">' + item.label + '</option>';
    }).join('');
  }

  function initScrollButton() {
    var trigger = document.querySelector('[data-scroll-builder]');
    var builder = $('#builder');
    if (!trigger || !builder) return;
    trigger.addEventListener('click', function () {
      builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(function () {
        var first = $('#cp-business-name');
        if (first) first.focus();
      }, 300);
    });
  }

  function buildResultCard(candidate, index) {
    var card = createEl('article', 'cp-result-card');
    var title = createEl('h4', '', candidate.name || ('Resultado ' + (index + 1)));
    var meta = createEl('div', 'cp-result-meta');
    if (candidate.address) meta.appendChild(createEl('div', '', candidate.address));
    if (candidate.addressCity) meta.appendChild(createEl('div', '', 'Ciudad: ' + candidate.addressCity));
    if (candidate.rating) {
      var reviewText = candidate.reviewCount ? ' (' + candidate.reviewCount + ' reseñas)' : '';
      meta.appendChild(createEl('div', '', 'Google: ' + candidate.rating + reviewText));
    }
    var actions = createEl('div', 'cp-inline-actions');
    var useBtn = createEl('button', 'cp-btn cp-btn-primary', 'Usar este negocio');
    useBtn.type = 'button';
    useBtn.addEventListener('click', function () {
      selectGoogleMatch(candidate);
    });
    var manualBtn = createEl('button', 'cp-btn cp-btn-secondary', 'Capturar manualmente');
    manualBtn.type = 'button';
    manualBtn.addEventListener('click', function () {
      selectGoogleMatch(null);
    });
    actions.appendChild(useBtn);
    actions.appendChild(manualBtn);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(actions);
    return card;
  }

  function renderSearchResults(result) {
    var container = $('#cp-search-results');
    if (!container) return;

    container.hidden = false;
    container.innerHTML = '';

    if (!result) return;

    if (result.outcome === 'matched' && result.match) {
      container.appendChild(createEl('p', '', 'Encontramos una coincidencia en Google. Puedes usarla tal cual o cambiar a captura manual.'));
      container.appendChild(buildResultCard(result.match, 0));
      return;
    }

    if (result.outcome === 'ambiguous' && Array.isArray(result.candidates) && result.candidates.length) {
      container.appendChild(createEl('p', '', 'Encontramos varios negocios similares. Elige el correcto o cambia a captura manual.'));
      result.candidates.forEach(function (candidate, index) {
        container.appendChild(buildResultCard(candidate, index));
      });
      return;
    }

    container.appendChild(createEl('p', '', 'No encontramos una ficha clara en Google. Completa el formulario manual y seguimos desde ahí.'));
  }

  function fillHoursFromGoogle(hours) {
    if (!hours) return;
    var inputs = document.querySelectorAll('#cp-hours-grid input[data-day]');
    inputs.forEach(function (input) {
      var day = input.getAttribute('data-day');
      var match = Array.isArray(hours) ? hours.find(function (row) {
        return String(row || '').toLowerCase().indexOf(day) === 0;
      }) : null;
      if (match) {
        var parts = String(match).split(':');
        input.value = parts.length > 1 ? parts.slice(1).join(':').trim() : String(match);
      }
    });
  }

  function showDetailsForm() {
    var form = $('#cp-details-form');
    if (!form) return;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectGoogleMatch(candidate) {
    state.selectedGoogleMatch = candidate || null;

    if (candidate) {
      $('#cp-company').value = candidate.name || $('#cp-business-name').value.trim();
      $('#cp-address-full').value = candidate.address || '';
      $('#cp-city-confirm').value = candidate.addressCity || $('#cp-business-city').value.trim();
      $('#cp-business-phone').value = candidate.phone || '';
      fillHoursFromGoogle(candidate.hours);
    } else {
      $('#cp-company').value = $('#cp-business-name').value.trim();
      $('#cp-city-confirm').value = $('#cp-business-city').value.trim();
    }

    showDetailsForm();
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();

    var statusEl = $('#cp-search-status');
    var businessName = ($('#cp-business-name').value || '').trim();
    var city = ($('#cp-business-city').value || '').trim();
    var shouldSearchGoogle = $('#cp-google-toggle').checked;

    if (!businessName || !city) {
      setStatus(statusEl, 'Escribe el nombre del negocio y la ciudad o dirección.', 'error');
      return;
    }

    if (!shouldSearchGoogle) {
      setStatus(statusEl, 'Búsqueda en Google omitida. Completa los datos manualmente.', 'success');
      renderSearchResults(null);
      selectGoogleMatch(null);
      return;
    }

    setStatus(statusEl, 'Buscando negocio en Google...', null);

    try {
      var response = await fetch('/api/public-builder/google-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: businessName, city: city })
      });
      var payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo buscar el negocio.');
      }
      renderSearchResults(payload);
      if (payload.outcome === 'matched' && payload.match) {
        setStatus(statusEl, 'Encontramos una coincidencia. Revisa y confirma.', 'success');
      } else if (payload.outcome === 'ambiguous') {
        setStatus(statusEl, 'Hay varias coincidencias posibles.', null);
      } else {
        setStatus(statusEl, 'No encontramos una ficha clara. Usa el formulario manual.', null);
        selectGoogleMatch(null);
      }
    } catch (err) {
      setStatus(statusEl, err.message || 'No se pudo buscar el negocio.', 'error');
    }
  }

  function attachRepeaterHandlers() {
    $('#cp-add-review').addEventListener('click', addReview);
    $('#cp-add-service').addEventListener('click', addService);
    $('#cp-copy-hours').addEventListener('click', function () {
      var monday = document.querySelector('#cp-hours-grid input[data-day="lunes"]');
      var value = monday ? monday.value : '';
      document.querySelectorAll('#cp-hours-grid input[data-day]').forEach(function (input) {
        input.value = value;
      });
    });
  }

  function addReview() {
    var template = $('#cp-review-template');
    var list = $('#cp-reviews-list');
    if (!template || !list) return;
    var node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-remove-review]').addEventListener('click', function () {
      node.remove();
    });
    list.appendChild(node);
  }

  function addService() {
    var template = $('#cp-service-template');
    var list = $('#cp-services-list');
    if (!template || !list) return;
    var node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-remove-service]').addEventListener('click', function () {
      node.remove();
    });
    list.appendChild(node);
  }

  function readReviews() {
    return Array.prototype.slice.call(document.querySelectorAll('#cp-reviews-list .cp-repeat-card')).map(function (card) {
      return {
        author_name: (card.querySelector('[data-review="author"]').value || '').trim(),
        rating: parseInt(card.querySelector('[data-review="rating"]').value || '5', 10),
        text: (card.querySelector('[data-review="text"]').value || '').trim()
      };
    }).filter(function (item) {
      return item.author_name && item.text;
    });
  }

  function readServices() {
    return Array.prototype.slice.call(document.querySelectorAll('#cp-services-list .cp-repeat-card')).map(function (card) {
      var priceValue = (card.querySelector('[data-service="price"]').value || '').trim();
      return {
        name: (card.querySelector('[data-service="name"]').value || '').trim(),
        description: (card.querySelector('[data-service="description"]').value || '').trim(),
        price: priceValue ? parseFloat(priceValue) : null,
        currency: card.querySelector('[data-service="currency"]').value || 'MXN'
      };
    }).filter(function (item) {
      return item.name;
    });
  }

  function readHours() {
    var result = {};
    document.querySelectorAll('#cp-hours-grid input[data-day]').forEach(function (input) {
      var value = (input.value || '').trim();
      if (value) result[input.getAttribute('data-day')] = value;
    });
    return result;
  }

  function renderPhotoList() {
    var list = $('#cp-photo-list');
    if (!list) return;
    list.innerHTML = '';
    state.uploadedPhotos.forEach(function (photo, index) {
      var card = createEl('article', 'cp-photo-card');
      var img = document.createElement('img');
      img.src = photo.public_url;
      img.alt = photo.photo_type || 'Foto del negocio';
      var body = createEl('div', 'cp-photo-card-body');
      body.appendChild(createEl('strong', '', (photo.photo_type || 'general').replace('-', ' ')));
      var removeBtn = createEl('button', 'cp-remove-btn', 'Eliminar');
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', function () {
        state.uploadedPhotos.splice(index, 1);
        renderPhotoList();
      });
      body.appendChild(removeBtn);
      card.appendChild(img);
      card.appendChild(body);
      list.appendChild(card);
    });
  }

  async function handlePhotoUpload(event) {
    var files = event.target.files;
    var statusEl = $('#cp-photo-status');
    var photoType = $('#cp-photo-type').value || 'product';

    if (!files || !files.length) return;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (!file.type || file.type.indexOf('image/') !== 0) continue;
      if (file.size > 4 * 1024 * 1024) {
        setStatus(statusEl, 'Cada foto debe pesar máximo 4MB.', 'error');
        continue;
      }

      setStatus(statusEl, 'Subiendo fotos...', null);

      try {
        var buffer = await file.arrayBuffer();
        var response = await fetch('/api/public-builder/upload-photo?photo_type=' + encodeURIComponent(photoType), {
          method: 'POST',
          headers: {
            'Content-Type': file.type
          },
          body: buffer
        });
        var payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo subir la foto.');
        state.uploadedPhotos.push(payload);
        renderPhotoList();
        setStatus(statusEl, 'Foto subida.', 'success');
      } catch (err) {
        setStatus(statusEl, err.message || 'No se pudo subir la foto.', 'error');
      }
    }

    event.target.value = '';
  }

  async function handleDetailsSubmit(event) {
    event.preventDefault();

    var statusEl = $('#cp-submit-status');
    var payload = {
      selectedGoogleMatch: state.selectedGoogleMatch,
      contactName: ($('#cp-contact-name').value || '').trim(),
      contactEmail: ($('#cp-contact-email').value || '').trim(),
      contactWhatsapp: ($('#cp-contact-whatsapp').value || '').trim(),
      businessPhone: ($('#cp-business-phone').value || '').trim(),
      company: ($('#cp-company').value || '').trim(),
      businessType: ($('#cp-business-type').value || '').trim(),
      addressFull: ($('#cp-address-full').value || '').trim(),
      city: ($('#cp-city-confirm').value || '').trim(),
      aboutBusiness: ($('#cp-about-business').value || '').trim(),
      founderName: ($('#cp-founder-name').value || '').trim(),
      founderStory: ($('#cp-founder-story').value || '').trim(),
      extraNotes: ($('#cp-extra-notes').value || '').trim(),
      hours: readHours(),
      reviews: readReviews(),
      services: readServices(),
      photos: state.uploadedPhotos.slice()
    };

    if (!payload.contactName || !payload.contactEmail || !payload.company || !payload.businessType) {
      setStatus(statusEl, 'Nombre, correo, empresa y tipo de negocio son obligatorios.', 'error');
      return;
    }

    setStatus(statusEl, 'Guardando tu borrador...', null);

    try {
      var response = await fetch('/api/public-builder/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'No se pudo guardar el borrador.');
      }

      $('#cp-details-form').hidden = true;
      $('#cp-search-results').hidden = true;
      var successBox = $('#cp-success');
      var successText = $('#cp-success-message');
      if (successText) {
        successText.textContent = result.message || 'Creamos tu negocio y enviamos el acceso al portal a tu correo.';
      }
      if (successBox) successBox.hidden = false;
      setStatus(statusEl, '', null);
    } catch (err) {
      setStatus(statusEl, err.message || 'No se pudo guardar el borrador.', 'error');
    }
  }

  function resetBuilder() {
    state.selectedGoogleMatch = null;
    state.uploadedPhotos = [];
    $('#cp-search-form').reset();
    $('#cp-details-form').reset();
    $('#cp-search-results').hidden = true;
    $('#cp-details-form').hidden = true;
    $('#cp-success').hidden = true;
    $('#cp-photo-list').innerHTML = '';
    $('#cp-reviews-list').innerHTML = '';
    $('#cp-services-list').innerHTML = '';
    setStatus($('#cp-search-status'), '', null);
    setStatus($('#cp-submit-status'), '', null);
    setStatus($('#cp-photo-status'), '', null);
  }

  function init() {
    populateBusinessTypes();
    initScrollButton();
    attachRepeaterHandlers();
    addReview();
    addService();
    $('#cp-search-form').addEventListener('submit', handleSearchSubmit);
    $('#cp-skip-search-btn').addEventListener('click', function () {
      renderSearchResults(null);
      selectGoogleMatch(null);
      setStatus($('#cp-search-status'), 'Captura manual activada.', 'success');
    });
    $('#cp-details-form').addEventListener('submit', handleDetailsSubmit);
    $('#cp-photo-input').addEventListener('change', handlePhotoUpload);
    $('#cp-restart-btn').addEventListener('click', resetBuilder);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
