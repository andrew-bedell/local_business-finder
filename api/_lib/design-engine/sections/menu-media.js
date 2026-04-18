function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STOP_WORDS = new Set([
  'a', 'al', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'para', 'por', 'y',
  'our', 'the', 'and', 'menu', 'menú', 'especialidad', 'especialidades', 'artesanal', 'artesanales',
]);

const TOKEN_ALIASES = {
  desayuno: ['desayuno', 'desayunos', 'breakfast', 'brunch'],
  desayunos: ['desayuno', 'desayunos', 'breakfast', 'brunch'],
  brunch: ['desayuno', 'desayunos', 'breakfast', 'brunch'],
  cafe: ['cafe', 'coffee', 'espresso', 'latte', 'capuccino', 'cappuccino'],
  bebidas: ['bebida', 'bebidas', 'drink', 'drinks', 'beverage', 'beverages', 'jugo', 'jugos', 'juice', 'smoothie', 'smoothies', 'te', 'tea'],
  bebida: ['bebida', 'bebidas', 'drink', 'drinks', 'beverage', 'beverages'],
  postre: ['postre', 'postres', 'dessert', 'desserts', 'dulce', 'dulces', 'pastel', 'pasteles', 'bakery'],
  postres: ['postre', 'postres', 'dessert', 'desserts', 'dulce', 'dulces', 'pastel', 'pasteles', 'bakery'],
  comida: ['comida', 'comidas', 'food', 'lunch', 'dinner', 'plato', 'platos', 'entree', 'entrees'],
  comidas: ['comida', 'comidas', 'food', 'lunch', 'dinner', 'plato', 'platos', 'entree', 'entrees'],
  pan: ['pan', 'panes', 'bread', 'bakery', 'baked'],
  panaderia: ['panaderia', 'bakery', 'bread', 'pastry', 'pastries'],
  reposteria: ['reposteria', 'bakery', 'dessert', 'desserts', 'pastry', 'pastries'],
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));
}

function expandToken(token) {
  const singular = token.endsWith('s') ? token.slice(0, -1) : token;
  const plural = token.endsWith('s') ? token : `${token}s`;
  return new Set([
    token,
    singular,
    plural,
    ...(TOKEN_ALIASES[token] || []),
    ...(TOKEN_ALIASES[singular] || []),
    ...(TOKEN_ALIASES[plural] || []),
  ]);
}

function buildExpandedTokenSet(tokens) {
  const expanded = new Set();
  for (const token of tokens) {
    for (const variant of expandToken(token)) {
      expanded.add(variant);
    }
  }
  return expanded;
}

function isMenuRelatedPhoto(photo) {
  const value = normalizeText(photo?.section || photo?.slot || '');
  return /(menu|desayun|brunch|cafe|coffee|bebid|drink|postre|dessert|comida|food|plato|bakery|pan|reposter)/.test(value);
}

function scoreMenuPhoto(photo, categoryName) {
  if (!photo?.url || !isMenuRelatedPhoto(photo)) return -1;

  const normalizedCategory = normalizeText(categoryName);
  const normalizedSection = normalizeText(photo.section || '');
  const normalizedSlot = normalizeText(photo.slot || '');

  if (normalizedCategory && (normalizedSection.includes(normalizedCategory) || normalizedSlot.includes(normalizedCategory))) {
    return 100;
  }

  const categoryTokens = tokenize(categoryName);
  const sectionTokens = tokenize(`${photo.section || ''} ${photo.slot || ''}`);
  const expandedCategoryTokens = buildExpandedTokenSet(categoryTokens);

  let overlap = 0;
  for (const token of sectionTokens) {
    if (expandedCategoryTokens.has(token)) overlap += 1;
  }

  if (!overlap) return isMenuRelatedPhoto(photo) ? 1 : -1;

  return overlap * 10 + (normalizedSection.includes('menu') ? 2 : 0);
}

export function findMenuCategoryPhoto(photos, categoryName, usedUrls = new Set()) {
  const candidates = Array.isArray(photos) ? photos.filter((photo) => photo?.url && !usedUrls.has(photo.url)) : [];
  if (!candidates.length) return null;

  let best = null;
  let bestScore = -1;
  for (const photo of candidates) {
    const score = scoreMenuPhoto(photo, categoryName);
    if (score > bestScore) {
      best = photo;
      bestScore = score;
    }
  }

  if (!best || bestScore < 0) return null;
  usedUrls.add(best.url);
  return best.url;
}

export function getMenuCategorySectionCss() {
  return `
    .menu-category__layout {
      display: grid;
      gap: 1.5rem;
      align-items: start;
    }

    .menu-category__copy {
      min-width: 0;
    }

    .menu-category__media {
      display: block;
      margin: 0;
    }

    .menu-category__media-frame {
      overflow: hidden;
      border-radius: 24px;
      background: rgba(0,0,0,0.04);
      box-shadow: 0 18px 50px rgba(0,0,0,0.08);
    }

    .menu-category__media-frame img {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }

    .menu-category__media figcaption {
      margin-top: 0.6rem;
      font-size: 0.8rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    @media (min-width: 900px) {
      .menu-category__layout--with-media {
        grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
      }

      .menu-category__layout--reverse {
        grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
      }

      .menu-category__layout--reverse .menu-category__copy {
        order: 2;
      }

      .menu-category__layout--reverse .menu-category__media {
        order: 1;
      }
    }
  `;
}

export function renderMenuCategories(categories, photos) {
  const usedUrls = new Set();

  return (categories || []).map((cat, index) => {
    const photoUrl = findMenuCategoryPhoto(photos, cat?.name, usedUrls);
    const layoutClasses = [
      'menu-category__layout',
      photoUrl ? 'menu-category__layout--with-media' : '',
      photoUrl && index % 2 === 1 ? 'menu-category__layout--reverse' : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="menu-category">
        <div class="${layoutClasses}">
          <div class="menu-category__copy">
            <h3>${esc(cat?.name)}</h3>
            ${((cat?.items) || []).map((item) => `
              <div class="menu-item">
                <div>
                  <div class="menu-item__name">${esc(item?.name)}</div>
                  ${item?.description ? `<div class="menu-item__desc">${esc(item.description)}</div>` : ''}
                </div>
                ${item?.price ? `<span class="menu-item__price">${esc(item.price)}</span>` : ''}
              </div>
            `).join('')}
          </div>
          ${photoUrl ? `
            <figure class="menu-category__media">
              <div class="menu-category__media-frame">
                <img src="${esc(photoUrl)}" alt="Imagen de referencia de ${esc(cat?.name)}" loading="lazy">
              </div>
              <figcaption>Imagen de referencia</figcaption>
            </figure>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}
