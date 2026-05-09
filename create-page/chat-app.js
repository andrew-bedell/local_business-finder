const { useState, useEffect, useRef } = React;

const C = {
  green: '#21C55E',
  greenBg: 'rgba(33,197,94,.08)',
  navy: '#0E172A',
  slate: '#1E293B',
  blue: '#2563EB',
  waBg: '#0B141A',
  waHeader: '#1F2C34',
  waBubIn: '#1F2C34',
  waBubOut: '#005C4B',
  waText: '#E9EDEF',
  waSub: '#8696A0',
  waTick: '#53BDEB',
  waTime: '#8696A0',
  red: '#EF4444',
  amber: '#F59E0B'
};

const CATEGORY_KEYWORDS = [
  { value: 'restaurant', keywords: ['restaurant', 'restaurante', 'taqueria', 'tacos', 'comida', 'cocina', 'marisqueria', 'pizzeria'] },
  { value: 'cafe', keywords: ['cafe', 'cafeteria', 'coffee'] },
  { value: 'bakery', keywords: ['panaderia', 'bakery', 'pasteleria'] },
  { value: 'bar', keywords: ['bar', 'cantina', 'cerveceria'] },
  { value: 'salon', keywords: ['salon', 'beauty', 'belleza', 'estetica'] },
  { value: 'nail-salon', keywords: ['unas', 'uñas', 'nails', 'manicure', 'pedicure'] },
  { value: 'spa', keywords: ['spa'] },
  { value: 'barber', keywords: ['barber', 'barberia', 'barbería', 'peluqueria', 'peluquería'] },
  { value: 'doctor', keywords: ['doctor', 'clinica', 'clínica', 'consultorio', 'medico', 'médico'] },
  { value: 'dentist', keywords: ['dentista', 'dental'] },
  { value: 'veterinarian', keywords: ['veterinaria', 'veterinary'] },
  { value: 'physiotherapist', keywords: ['fisio', 'fisioterapia', 'rehabilitacion', 'rehabilitación'] },
  { value: 'gym', keywords: ['gimnasio', 'gym', 'fitness', 'crossfit', 'pilates', 'yoga'] },
  { value: 'lawyer', keywords: ['abogado', 'lawyer', 'legal', 'juridico', 'jurídico'] },
  { value: 'accountant', keywords: ['contador', 'accountant', 'fiscal', 'impuestos'] },
  { value: 'insurance', keywords: ['seguro', 'insurance'] },
  { value: 'real-estate', keywords: ['inmobiliaria', 'real estate', 'bienes raices', 'bienes raíces'] },
  { value: 'plumber', keywords: ['plomeria', 'plomería', 'plumber'] },
  { value: 'electrician', keywords: ['electricista', 'electrician'] },
  { value: 'contractor', keywords: ['contratista', 'remodelacion', 'remodelación', 'construccion', 'construcción'] },
  { value: 'auto-repair', keywords: ['mecanico', 'mecánico', 'taller', 'auto', 'llantas'] },
  { value: 'hotel', keywords: ['hotel', 'hostal', 'hospedaje', 'airbnb'] },
  { value: 'travel', keywords: ['viaje', 'travel', 'turismo', 'tour'] },
  { value: 'retail', keywords: ['tienda', 'boutique', 'store', 'comercio', 'shop'] }
];

const FOOD_CATEGORIES = new Set(['restaurant', 'cafe', 'bakery', 'bar']);
const FOUND_FIELDS = [
  {
    key: 'nombre',
    label: 'nombre del negocio',
    prompt: 'Como quieres que aparezca el nombre de tu negocio?'
  },
  {
    key: 'tipo',
    label: 'tipo de negocio',
    prompt: 'A que se dedica tu negocio?\n_Por ejemplo: restaurante, salon de belleza, taller..._'
  },
  {
    key: 'direccion',
    label: 'direccion',
    prompt: 'Cual es la direccion completa donde te visitan tus clientes?'
  },
  {
    key: 'telefono',
    label: 'telefono del negocio',
    prompt: 'Cual es el numero al que te pueden llamar?'
  },
  {
    key: 'horario',
    label: 'horario',
    prompt: 'Que dias y horas atiendes?\n_Ej: Lunes a sabado, 9am-7pm_'
  },
  {
    key: 'sobre',
    label: 'descripcion',
    prompt: 'Cuentame sobre tu negocio como si me lo contaras a un amigo.\n\nQue te hace especial y por que vuelven tus clientes?'
  }
];

const CHECKLIST = [
  { key: 'nombre', label: 'Nombre del negocio' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'tipo', label: 'Tipo de negocio' },
  { key: 'direccion', label: 'Direccion' },
  { key: 'telefono', label: 'Telefono del negocio' },
  { key: 'whatsapp', label: 'WhatsApp del negocio' },
  { key: 'contacto_email', label: 'Correo de acceso' },
  { key: 'contacto_whatsapp', label: 'WhatsApp personal' },
  { key: 'sobre', label: 'Descripcion' },
  { key: 'uploaded_photos', label: 'Fotos' },
  { key: 'offerings_ready', label: 'Servicios o menu' }
];

const ts = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isAffirmative(value) {
  const normalized = normalizeText(value);
  return normalized === 'si' || normalized === 'sí' || normalized === 'yes' || normalized === 'claro' || normalized.startsWith('si ');
}

function isNegative(value) {
  const normalized = normalizeText(value);
  return normalized === 'no' || normalized === 'nop' || normalized === 'negativo';
}

function normalizeMaybeBlank(value) {
  return isNegative(value) ? '' : String(value || '').trim();
}

function mapBusinessType(rawValue) {
  const normalized = normalizeText(rawValue);
  for (let i = 0; i < CATEGORY_KEYWORDS.length; i += 1) {
    const entry = CATEGORY_KEYWORDS[i];
    if (entry.keywords.some(keyword => normalized.includes(normalizeText(keyword)))) {
      return entry.value;
    }
  }
  return 'generic';
}

function isFoodBusiness(typeValue) {
  const mapped = mapBusinessType(typeValue);
  return FOOD_CATEGORIES.has(mapped);
}

function previewLine(item, isFood) {
  const name = isFood ? item.item_name : item.name;
  const description = isFood ? item.item_description : item.description;
  const price = item.price != null && item.price !== '' ? '$' + String(item.price) : 'sin precio';
  return [name, description, price].filter(Boolean).join(' - ');
}

function parseOfferingsText(rawText, asMenu) {
  const chunks = String(rawText || '')
    .split(/\n|,/)
    .map(part => part.trim())
    .filter(Boolean);

  return chunks.map((chunk, index) => {
    const priceMatch = chunk.match(/(?:\$|mxn|cop|usd)?\s*(\d+(?:[.,]\d{1,2})?)/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;
    let cleaned = chunk;
    if (priceMatch) cleaned = cleaned.replace(priceMatch[0], '').trim();
    cleaned = cleaned.replace(/[-–|]+\s*$/, '').trim();

    let name = cleaned;
    let description = '';
    const split = cleaned.split(/\s[-–|]\s/);
    if (split.length > 1) {
      name = split[0].trim();
      description = split.slice(1).join(' - ').trim();
    }

    if (!name) {
      name = 'Elemento ' + (index + 1);
    }

    if (asMenu) {
      return {
        menu_category: 'Menu',
        item_name: name,
        item_description: description,
        price: price,
        currency: 'MXN'
      };
    }

    return {
      name: name,
      description: description,
      price: price,
      currency: 'MXN'
    };
  }).filter(item => (asMenu ? item.item_name : item.name));
}

async function lookup(name, city) {
  try {
    const res = await fetch('/api/public-builder/google-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessName: name,
        city: city
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'No se pudo buscar el negocio.');
    }
    if (data.outcome === 'matched') {
      return data.match ? [data.match] : null;
    }
    if (data.outcome === 'ambiguous') {
      return Array.isArray(data.candidates) ? data.candidates : null;
    }
    return null;
  } catch (error) {
    console.error('Business lookup error:', error);
    return null;
  }
}

async function uploadPhotoFile(file, photoType) {
  const buffer = await file.arrayBuffer();
  const res = await fetch('/api/public-builder/upload-photo?photo_type=' + encodeURIComponent(photoType), {
    method: 'POST',
    headers: {
      'Content-Type': file.type
    },
    body: buffer
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || 'No se pudo subir la foto.');
  return payload;
}

async function uploadCatalogFile(file) {
  const buffer = await file.arrayBuffer();
  const res = await fetch('/api/public-builder/upload-catalog', {
    method: 'POST',
    headers: {
      'Content-Type': file.type
    },
    body: buffer
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || 'No se pudo subir el archivo.');
  return payload;
}

async function parseCatalog(uploaded, businessType) {
  const res = await fetch('/api/catalog/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileUrl: uploaded.public_url,
      currency: 'MXN',
      businessType: businessType || ''
    })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || 'No se pudo analizar el archivo.');
  return payload.services || [];
}

async function parseMenuPhoto(photoUrl) {
  const res = await fetch('/api/menu/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUrl: photoUrl, currency: 'MXN' })
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || 'No se pudo analizar el menu.');
  return payload.items || [];
}

function LocationPicker({ results, onConfirm, onNone }) {
  const [selected, setSelected] = useState(() => new Set());

  function toggle(index) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const count = selected.size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, color: C.waSub, lineHeight: 1.4 }}>
        Encontre {results.length} ubicaciones con ese nombre.
        <br />
        <span style={{ color: C.waText }}>Toca todas las que sean tuyas.</span>
      </div>
      {results.map((result, index) => {
        const checked = selected.has(index);
        return (
          <div
            key={result.place_id || index}
            onClick={() => toggle(index)}
            style={{
              background: checked ? 'rgba(33,197,94,.10)' : 'rgba(255,255,255,.05)',
              border: '1.5px solid ' + (checked ? C.green : 'rgba(255,255,255,.1)'),
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              transition: 'all .15s ease'
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                flexShrink: 0,
                marginTop: 1,
                background: checked ? C.green : 'transparent',
                border: '2px solid ' + (checked ? C.green : 'rgba(255,255,255,.3)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {checked ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L5 9.5L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.waText }}>{result.nombre}</div>
              <div style={{ fontSize: 12, color: C.waSub, marginTop: 3, lineHeight: 1.4 }}>{result.shortAddress || result.direccion}</div>
              {result.calificacion ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  <span style={{ color: '#FCD34D', fontSize: 12 }}>★</span>
                  <span style={{ fontSize: 12, color: C.waText }}>{result.calificacion}</span>
                  <span style={{ fontSize: 11, color: C.waSub }}>({result.resenas} resenas)</span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      <button
        onClick={() => {
          if (!count) return;
          const picked = [...selected].sort((a, b) => a - b).map(index => results[index]);
          onConfirm(picked);
        }}
        disabled={!count}
        style={{
          padding: '12px',
          background: count ? C.green : 'rgba(255,255,255,.06)',
          border: 'none',
          borderRadius: 10,
          color: count ? '#fff' : C.waSub,
          fontSize: 14,
          fontWeight: 600,
          cursor: count ? 'pointer' : 'not-allowed',
          fontFamily: 'DM Sans, sans-serif',
          marginTop: 4
        }}
      >
        {count === 1 ? 'Confirmar 1 ubicacion' : count ? 'Confirmar ' + count + ' ubicaciones' : 'Selecciona tus ubicaciones'}
      </button>
      <button
        onClick={onNone}
        style={{
          background: 'transparent',
          border: '1px dashed rgba(255,255,255,.15)',
          borderRadius: 10,
          padding: '9px 12px',
          cursor: 'pointer',
          textAlign: 'center',
          color: C.waSub,
          fontSize: 13,
          fontFamily: 'DM Sans, sans-serif'
        }}
      >
        Ninguna es la mia
      </button>
    </div>
  );
}

function FileUploadCard({ label, accept, multiple, hint, icon, onDone, skipLabel, maxFiles = 12 }) {
  const [entries, setEntries] = useState([]);
  const inputRef = useRef(null);

  function readPreview(file) {
    if (!file.type || file.type.indexOf('image/') !== 0) return Promise.resolve(null);
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = event => resolve(event.target.result);
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(fileList) {
    const incoming = [...fileList];
    const room = maxFiles - entries.length;
    const accepted = incoming.slice(0, Math.max(0, room));
    const nextEntries = await Promise.all(accepted.map(async file => ({
      file,
      preview: await readPreview(file)
    })));
    setEntries(prev => prev.concat(nextEntries));
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index) {
    setEntries(prev => prev.filter((_, idx) => idx !== index));
  }

  const atCap = entries.length >= maxFiles;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.length ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {entries.map((entry, index) => (
              <div key={index} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'rgba(255,255,255,.05)' }}>
                {entry.preview ? (
                  <img src={entry.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: C.waSub, padding: 8 }}>
                    <span style={{ fontSize: 24 }}>PDF</span>
                    <span style={{ fontSize: 10, textAlign: 'center', lineHeight: 1.3 }}>{entry.file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAt(index)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,.65)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                >
                  x
                </button>
              </div>
            ))}
            {multiple && !atCap ? (
              <div
                onClick={() => inputRef.current && inputRef.current.click()}
                style={{
                  borderRadius: 8,
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: 2,
                  background: 'rgba(33,197,94,.06)',
                  border: '1.5px dashed rgba(33,197,94,.4)'
                }}
              >
                <div style={{ fontSize: 24, color: C.green, lineHeight: 1 }}>+</div>
                <div style={{ fontSize: 10, color: C.green, fontWeight: 500 }}>Agregar</div>
              </div>
            ) : null}
          </div>
          <div style={{ fontSize: 11, color: C.waSub, textAlign: 'center' }}>{entries.length} archivo{entries.length !== 1 ? 's' : ''}</div>
        </>
      ) : (
        <div
          onClick={() => inputRef.current && inputRef.current.click()}
          style={{
            background: 'rgba(255,255,255,.04)',
            border: '2px dashed rgba(255,255,255,.15)',
            borderRadius: 12,
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontSize: 13, color: C.waText, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 12, color: C.waSub, marginTop: 3 }}>{hint}</div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={event => handleFiles(event.target.files)}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        {entries.length ? (
          <>
            <button
              onClick={() => onDone(entries.map(entry => entry.file))}
              style={{
                flex: 1,
                padding: '10px',
                background: C.green,
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif'
              }}
            >
              Listo - {entries.length} archivo{entries.length !== 1 ? 's' : ''}
            </button>
            <button
              onClick={() => setEntries([])}
              style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,.06)',
                border: 'none',
                borderRadius: 10,
                color: C.waSub,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif'
              }}
            >
              x
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => inputRef.current && inputRef.current.click()}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 10,
                color: C.waText,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif'
              }}
            >
              Elegir archivo{multiple ? 's' : ''}
            </button>
            {skipLabel ? (
              <button
                onClick={() => onDone([])}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,.06)',
                  border: 'none',
                  borderRadius: 10,
                  color: C.waSub,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif'
                }}
              >
                {skipLabel}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function ChoiceButtons({ options }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
      {options.map(option => {
        const tone = option.tone || 'outline';
        const styles = tone === 'solid'
          ? { background: C.green, color: '#fff', border: '1.5px solid ' + C.green }
          : tone === 'ghost'
            ? { background: 'rgba(255,255,255,.06)', color: C.waSub, border: '1px solid rgba(255,255,255,.12)' }
            : { background: 'transparent', color: C.green, border: '1.5px solid ' + C.green };
        return (
          <button
            key={option.label}
            onClick={option.onClick}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              ...styles
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Ticks({ read }) {
  const color = read ? C.waTick : C.waSub;
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" style={{ display: 'inline-block', marginLeft: 3 }}>
      <path d="M1 5.5L4.5 9L11 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5 5.5L8.5 9L15 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Avatar({ size = 34 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'linear-gradient(135deg,' + C.blue + ',' + C.green + ')',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill="white" fillOpacity=".18" />
        <path d="M6 14c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="7" r="2.5" fill="white" />
      </svg>
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: C.waBubIn, borderRadius: '0 10px 10px 10px', width: 56, alignItems: 'center' }}>
      {[0, 1, 2].map(index => (
        <span
          key={index}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: C.waSub,
            display: 'block',
            animation: 'dot 1.2s ease ' + (index * 0.2) + 's infinite'
          }}
        />
      ))}
    </div>
  );
}

function Bubble({ msg }) {
  const bot = msg.from === 'bot';
  const bg = bot ? C.waBubIn : C.waBubOut;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: bot ? 'row' : 'row-reverse',
        alignItems: 'flex-end',
        gap: 6,
        marginBottom: 3,
        paddingLeft: bot ? 0 : 44,
        paddingRight: bot ? 44 : 0,
        animation: 'fadeUp .25s ease'
      }}
    >
      {bot ? <Avatar /> : null}
      <div
        style={{
          maxWidth: '78%',
          background: bg,
          borderRadius: bot ? '0 10px 10px 10px' : '10px 0 10px 10px',
          padding: '8px 12px 5px',
          color: C.waText,
          fontSize: 14.5,
          lineHeight: 1.5,
          boxShadow: '0 1px 3px rgba(0,0,0,.35)'
        }}
      >
        {msg.text ? (
          <div
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{
              __html: msg.text
                .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                .replace(/_(.*?)_/g, '<em style="color:#a0b4c8">$1</em>')
            }}
          />
        ) : null}
        {msg.rich ? <div>{msg.rich}</div> : null}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: C.waTime }}>{msg.time}</span>
          {!bot ? <Ticks read={msg.read} /> : null}
        </div>
      </div>
    </div>
  );
}

function SearchCard({ done, found, biz, count = 1 }) {
  if (!done) {
    return (
      <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid ' + C.green, borderTopColor: 'transparent', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, color: C.waText, fontWeight: 500 }}>Buscando en Google Maps...</div>
            <div style={{ fontSize: 12, color: C.waSub, marginTop: 1 }}>Verificando tu negocio</div>
          </div>
        </div>
      </div>
    );
  }

  if (!found) {
    return (
      <div style={{ background: 'rgba(239,68,68,.08)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(239,68,68,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(239,68,68,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔍</div>
          <div>
            <div style={{ fontSize: 13, color: C.waText, fontWeight: 500 }}>No encontramos una ficha clara</div>
            <div style={{ fontSize: 12, color: C.waSub, marginTop: 1 }}>Seguimos contigo en el chat</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.greenBg, borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(33,197,94,.25)', animation: 'pop .35s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'glow 1.5s infinite' }} />
        <span style={{ fontSize: 11, color: C.green, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase' }}>
          {count > 1 ? count + ' ubicaciones encontradas' : 'Negocio encontrado'}
        </span>
      </div>
      <div style={{ fontSize: 14, color: C.waText, fontWeight: 600 }}>{biz.nombre}</div>
      <div style={{ fontSize: 12, color: C.waSub, marginTop: 2 }}>{biz.tipo} - {biz.ciudad}</div>
      {biz.calificacion ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <span style={{ color: '#FCD34D', fontSize: 13 }}>★</span>
          <span style={{ fontSize: 13, color: C.waText }}>{biz.calificacion}</span>
          <span style={{ fontSize: 12, color: C.waSub }}>({biz.resenas} resenas en Google)</span>
        </div>
      ) : null}
    </div>
  );
}

function ProgressBar({ data }) {
  const done = CHECKLIST.filter(field => {
    const value = data[field.key];
    if (Array.isArray(value)) return value.length > 0;
    return !!value;
  });
  const pct = Math.round(done.length / CHECKLIST.length * 100);
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: 'rgba(0,0,0,.3)', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
      <div onClick={() => setExpanded(prev => !prev)} style={{ padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: C.green, transition: 'width .5s ease', borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 11, color: pct === 100 ? C.green : C.waSub, whiteSpace: 'nowrap', fontWeight: pct === 100 ? 600 : 400 }}>
          {pct === 100 ? 'Completo' : done.length + '/' + CHECKLIST.length}
        </span>
        <span style={{ fontSize: 10, color: C.waSub, display: 'inline-block', transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </div>
      {expanded ? (
        <div style={{ padding: '2px 14px 10px', display: 'flex', flexWrap: 'wrap', gap: '5px 12px' }}>
          {CHECKLIST.map(field => {
            const value = data[field.key];
            const checked = Array.isArray(value) ? value.length > 0 : !!value;
            return (
              <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: checked ? 1 : 0.38 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: checked ? C.green : 'transparent',
                    border: checked ? 'none' : '1.5px solid ' + C.waSub,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {checked ? <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                </div>
                <span style={{ fontSize: 11, color: checked ? C.waText : C.waSub }}>{field.label}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const [msgs, setMsgs] = useState([{ id: 1, from: 'bot', text: 'Hola! 👋 Soy tu asistente de *AhoraTengoPagina*.', time: ts() }]);
  const [typing, setTyping] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [inputOff, setInputOff] = useState(false);
  const [collected, setCollected] = useState({});
  const [searchDone, setSearchDone] = useState(false);
  const [searchFound, setSearchFound] = useState(false);
  const [searchBiz, setSearchBiz] = useState(null);
  const [searchCount, setSearchCount] = useState(0);
  const [showSearchCard, setShowSearchCard] = useState(false);

  const stepRef = useRef('init');
  const collRef = useRef({});
  const foundFieldIdxRef = useRef(0);
  const contactContextRef = useRef('found');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  function scrollBottom() {
    if (bottomRef.current) {
      const parent = bottomRef.current.parentElement;
      if (parent) parent.scrollTop = parent.scrollHeight + 9999;
    }
  }

  useEffect(scrollBottom, [msgs, typing, showSearchCard]);

  const [vh, setVh] = useState(() => (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.height) || (typeof window !== 'undefined' ? window.innerHeight : 800));
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.width) || (typeof window !== 'undefined' ? window.innerWidth : 420));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const vv = window.visualViewport;
    function update() {
      setVh(vv ? vv.height : window.innerHeight);
      setVw(vv ? vv.width : window.innerWidth);
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
      requestAnimationFrame(scrollBottom);
    }
    update();
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, []);

  const isMobile = vw < 600;
  const outerStyle = isMobile
    ? { position: 'fixed', top: 0, left: 0, width: '100%', height: vh + 'px', background: C.navy }
    : { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.navy, padding: '20px' };
  const frameStyle = isMobile
    ? { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.navy }
    : { width: '100%', maxWidth: 420, height: 'min(800px, ' + (vh - 40) + 'px)', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,.65)', border: '1px solid rgba(255,255,255,.06)' };

  function pushMsg(message) {
    setMsgs(prev => prev.concat([{ id: Date.now() + Math.random(), ...message }]));
  }

  function userSay(text) {
    const message = { id: Date.now() + Math.random(), from: 'user', text, time: ts(), read: false };
    setMsgs(prev => prev.concat([message]));
    setTimeout(() => {
      setMsgs(prev => prev.map(item => (item.id === message.id ? { ...item, read: true } : item)));
    }, 700);
  }

  function addChoiceReply(label, handler) {
    return async function onClick() {
      setMsgs(prev => prev.concat([{ id: Date.now() + Math.random(), from: 'user', text: label, time: ts(), read: true }]));
      await handler();
    };
  }

  function collect(values) {
    const next = { ...collRef.current, ...values };
    next.offerings_ready = (Array.isArray(next.services) && next.services.length > 0) || (Array.isArray(next.menu_items) && next.menu_items.length > 0);
    collRef.current = next;
    setCollected({ ...next });
  }

  function botSay(text, extra) {
    return new Promise(resolve => {
      setTyping(true);
      const delay = Math.min(600 + String(text || '').length * 16, 1800);
      setTimeout(() => {
        setTyping(false);
        pushMsg({ from: 'bot', text, time: ts(), ...(extra || {}) });
        setTimeout(resolve, 80);
      }, delay);
    });
  }

  async function introFlow() {
    await sleep(1200);
    setTyping(false);
    pushMsg({ from: 'bot', text: 'Te ayudare a crear la pagina web de tu negocio en minutos.\n\nComo te llamas?', time: ts() });
    stepRef.current = 'owner_name';
  }

  useEffect(() => {
    introFlow();
  }, []);

  async function askGoogleListingStatus() {
    setInputOff(true);
    await botSay('No encontre una ficha clara en Google Maps.');
    await botSay('Ya tienes una ficha de *Google Maps / Google Places* para este negocio?');
    pushMsg({
      from: 'bot',
      time: ts(),
      rich: (
        <ChoiceButtons
          options={[
            {
              label: 'Si, ya la tengo',
              onClick: addChoiceReply('Si, ya la tengo', async () => {
                collect({ listing_status: 'has_google_profile' });
                setInputOff(false);
                stepRef.current = 'listing_details';
                await botSay('Perfecto. Comparte el *link de Google Maps* o el *nombre exacto* como aparece ahi para que lo revisemos despues.');
              })
            },
            {
              label: 'No, todavia no',
              tone: 'solid',
              onClick: addChoiceReply('No, todavia no', async () => {
                collect({ listing_status: 'needs_google_profile' });
                await botSay('No pasa nada. Eso esta bien.\n\nTe ayudaremos a crear tu ficha de Google Maps como parte del servicio despues de hacer tu pagina web.');
                await beginContactCapture('manual');
              })
            }
          ]}
        />
      )
    });
  }

  async function beginGoogleLookup() {
    const businessName = collRef.current.nombre;
    const city = collRef.current.ciudad;

    setInputOff(true);
    stepRef.current = 'searching';
    await botSay('Perfecto. Voy a buscar *' + businessName + '* en Google Maps... 🔍');
    setSearchDone(false);
    setSearchFound(false);
    setSearchBiz(null);
    setSearchCount(0);
    setShowSearchCard(true);
    await sleep(200);

    const results = await lookup(businessName, city);
    const allResults = Array.isArray(results) ? results : (results ? [results] : []);
    const primary = allResults.length ? allResults[0] : null;

    setSearchDone(true);
    setSearchFound(allResults.length > 0);
    setSearchBiz(primary);
    setSearchCount(allResults.length);

    await sleep(1600);
    setShowSearchCard(false);
    await sleep(250);

    if (!allResults.length) {
      await askGoogleListingStatus();
      return;
    }

    if (allResults.length > 1) {
      await botSay('Encontre *' + allResults.length + ' ubicaciones* con ese nombre.\n\nMarca las que sean tuyas. 👇');
      pushMsg({
        from: 'bot',
        time: ts(),
        rich: (
          <LocationPicker
            results={allResults}
            onConfirm={picked => {
              const primaryPicked = { ...picked[0], additional_locations: picked.slice(1) };
              collect({
                ...primaryPicked,
                listing_status: 'matched',
                additional_locations: picked.slice(1)
              });
              setMsgs(list => list.concat([{
                id: Date.now() + Math.random(),
                from: 'user',
                text: picked.length === 1 ? primaryPicked.nombre + '\n' + (primaryPicked.shortAddress || primaryPicked.direccion) : picked.length + ' ubicaciones seleccionadas',
                time: ts(),
                read: true
              }]));
              askFoundField(0);
            }}
            onNone={addChoiceReply('Ninguna es la mia', async () => {
              await askGoogleListingStatus();
            })}
          />
        )
      });
      return;
    }

    collect({
      ...primary,
      listing_status: 'matched'
    });
    await botSay('Encontre tu negocio en Google. Ahora lo revisamos contigo paso a paso.');
    await askFoundField(0);
  }

  async function askFoundField(index) {
    if (index >= FOUND_FIELDS.length) {
      await askBusinessWhatsapp();
      return;
    }

    foundFieldIdxRef.current = index;
    const field = FOUND_FIELDS[index];
    const currentValue = String(collRef.current[field.key] || '').trim();

    if (!currentValue) {
      setInputOff(false);
      stepRef.current = 'editing_found_field';
      await botSay(field.prompt);
      return;
    }

    setInputOff(true);
    stepRef.current = 'waiting_found_field';
    await botSay('Encontre este *' + field.label + '* en Google:\n*' + currentValue + '*\n\nLo dejamos asi?');
    pushMsg({
      from: 'bot',
      time: ts(),
      rich: (
        <ChoiceButtons
          options={[
            {
              label: 'Si, dejalo asi',
              tone: 'solid',
              onClick: addChoiceReply('Si, dejalo asi', async () => {
                collect({ [field.key]: currentValue });
                await askFoundField(index + 1);
              })
            },
            {
              label: 'Cambiarlo',
              onClick: addChoiceReply('Cambiarlo', async () => {
                setInputOff(false);
                stepRef.current = 'editing_found_field';
                await botSay(field.prompt);
              })
            }
          ]}
        />
      )
    });
  }

  async function askBusinessWhatsapp() {
    const phone = String(collRef.current.telefono || '').trim();
    if (phone) {
      setInputOff(true);
      stepRef.current = 'waiting_business_whatsapp';
      await botSay('Tenemos este numero para tu negocio:\n*' + phone + '*\n\nEs tambien el *WhatsApp* que quieres mostrar en tu pagina?');
      pushMsg({
        from: 'bot',
        time: ts(),
        rich: (
          <ChoiceButtons
            options={[
              {
                label: 'Si, es el mismo',
                tone: 'solid',
                onClick: addChoiceReply('Si, es el mismo', async () => {
                  collect({ whatsapp: phone });
                  await continueAfterBusinessWhatsapp();
                })
              },
              {
                label: 'No, es otro',
                onClick: addChoiceReply('No, es otro', async () => {
                  setInputOff(false);
                  stepRef.current = 'manual_business_whatsapp';
                  await botSay('Cual es el numero de *WhatsApp* que quieres mostrar en tu pagina?');
                })
              }
            ]}
          />
        )
      });
      return;
    }

    setInputOff(false);
    stepRef.current = 'manual_business_whatsapp';
    await botSay('Cual es el numero de *WhatsApp* que quieres mostrar en tu pagina?');
  }

  async function beginContactCapture(context) {
    contactContextRef.current = context;
    setInputOff(false);

    if (!String(collRef.current.contacto_email || '').trim()) {
      stepRef.current = 'contact_email';
      await botSay('Cual es tu *correo electronico* para crear tu acceso a Mi Pagina?');
      return;
    }

    if (!String(collRef.current.contacto_whatsapp || '').trim()) {
      stepRef.current = 'contact_phone';
      await botSay('Y cual es tu *numero de WhatsApp personal* para coordinar contigo?\n\n_Este numero es interno y no aparecera en la pagina._');
      return;
    }

    await advanceAfterContactCapture();
  }

  async function advanceAfterContactCapture() {
    if (contactContextRef.current === 'manual' && !String(collRef.current.tipo || '').trim()) {
      stepRef.current = 'manual_type';
      await botSay('A que se dedica tu negocio?\n_(Ej: restaurante, salon de belleza, taller...)_');
      return;
    }

    await startPhotoUploadFlow();
  }

  async function continueAfterBusinessWhatsapp() {
    if (contactContextRef.current === 'manual') {
      await startPhotoUploadFlow();
      return;
    }
    await beginContactCapture('found');
  }

  async function startPhotoUploadFlow() {
    setInputOff(true);
    const foundGooglePhotos = Array.isArray(collRef.current.photos) ? collRef.current.photos.length : 0;
    if (foundGooglePhotos) {
      await botSay('Tambien encontramos fotos en Google para tu negocio. Si quieres, ahora puedes subir *tus propias fotos* para que prioricemos esas en tu pagina.');
    } else {
      await botSay('Excelente. Ahora sube algunas *fotos de tu negocio*.\n\n_Pueden ser del local, equipo, productos, menu o ambiente._');
    }

    pushMsg({
      from: 'bot',
      time: ts(),
      rich: (
        <FileUploadCard
          label="Subir fotos del negocio"
          accept="image/*"
          multiple={true}
          maxFiles={15}
          hint="JPG, PNG o WebP. Maximo 4MB por foto."
          icon="📸"
          skipLabel="Saltar"
          onDone={files => handlePhotoUploads(files)}
        />
      )
    });
  }

  async function handlePhotoUploads(files) {
    if (!files.length) {
      setMsgs(prev => prev.concat([{ id: Date.now() + Math.random(), from: 'user', text: 'Sin fotos por ahora', time: ts(), read: true }]));
      collect({ uploaded_photos: [] });
      await askOfferingsUpload();
      return;
    }

    setMsgs(prev => prev.concat([{ id: Date.now() + Math.random(), from: 'user', text: '📸 ' + files.length + ' foto' + (files.length !== 1 ? 's' : '') + ' seleccionada' + (files.length !== 1 ? 's' : ''), time: ts(), read: true }]));
    setInputOff(true);
    try {
      await botSay('Estoy subiendo y guardando tus fotos...');

      const photoType = isFoodBusiness(collRef.current.tipo) ? 'food' : 'product';
      const uploaded = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        uploaded.push(await uploadPhotoFile(file, photoType));
      }

      collect({ uploaded_photos: uploaded });
      await botSay('Listo. Guardamos ' + uploaded.length + ' foto' + (uploaded.length !== 1 ? 's' : '') + ' para tu pagina.');
      await askOfferingsUpload();
    } catch (error) {
      console.error('Photo upload error:', error);
      await botSay('No pude subir esas fotos. Puedes intentar de nuevo o seguir sin ellas por ahora.');
      setInputOff(false);
    }
  }

  async function askOfferingsUpload() {
    setInputOff(true);
    const food = isFoodBusiness(collRef.current.tipo);
    await botSay(
      food
        ? 'Ahora sube una *foto o PDF de tu menu, carta o lista de precios* para extraer tus productos y precios.'
        : 'Ahora sube una *foto o PDF de tu lista de servicios o productos con precios* para extraerlos automaticamente.'
    );
    pushMsg({
      from: 'bot',
      time: ts(),
      rich: (
        <FileUploadCard
          label={food ? 'Subir menu o carta' : 'Subir lista de servicios'}
          accept="image/*,application/pdf,.pdf"
          multiple={true}
          maxFiles={6}
          hint={food ? 'Puedes subir imagenes o PDF del menu.' : 'Puedes subir imagenes o PDF con tus servicios y precios.'}
          icon={food ? '🍽️' : '🧾'}
          skipLabel="No tengo archivo"
          onDone={files => handleOfferingsUpload(files, food)}
        />
      )
    });
  }

  async function handleOfferingsUpload(files, asMenu) {
    if (!files.length) {
      setMsgs(prev => prev.concat([{ id: Date.now() + Math.random(), from: 'user', text: 'No tengo archivo', time: ts(), read: true }]));
      setInputOff(false);
      stepRef.current = 'manual_offerings';
      await botSay(
        asMenu
          ? 'Sin problema. Escribe en un solo mensaje algunos platillos o bebidas con precio.\n\n_Ejemplo: Tacos al pastor - 95, Agua fresca - 30_'
          : 'Sin problema. Escribe en un solo mensaje algunos servicios o productos con precio.\n\n_Ejemplo: Corte clasico - 250, Barba - 150_'
      );
      return;
    }

    setMsgs(prev => prev.concat([{ id: Date.now() + Math.random(), from: 'user', text: '🧾 ' + files.length + ' archivo' + (files.length !== 1 ? 's' : '') + ' seleccionado' + (files.length !== 1 ? 's' : ''), time: ts(), read: true }]));
    setInputOff(true);
    try {
      await botSay('Estoy leyendo ese archivo para extraer tus precios...');

      let menuItems = [];
      let services = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const uploaded = await uploadCatalogFile(file);

        if (asMenu && file.type && file.type.indexOf('image/') === 0) {
          try {
            const parsedMenu = await parseMenuPhoto(uploaded.public_url);
            if (parsedMenu.length) {
              menuItems = menuItems.concat(parsedMenu.map(item => ({
                menu_category: item.menu_category || 'Menu',
                item_name: item.item_name,
                item_description: item.item_description || '',
                price: item.price != null ? item.price : null,
                currency: item.currency || 'MXN'
              })));
              continue;
            }
          } catch (error) {
            console.warn('Menu photo parse fallback:', error);
          }
        }

        const parsedServices = await parseCatalog(uploaded, collRef.current.tipo || '');
        if (asMenu) {
          menuItems = menuItems.concat(parsedServices.map(service => ({
            menu_category: 'Menu',
            item_name: service.name,
            item_description: service.description || '',
            price: service.price != null ? service.price : null,
            currency: service.currency || 'MXN'
          })));
        } else {
          services = services.concat(parsedServices);
        }
      }

      if (asMenu && menuItems.length) {
        collect({ menu_items: menuItems });
        await botSay('Extraimos ' + menuItems.length + ' elemento' + (menuItems.length !== 1 ? 's' : '') + ' de tu menu.\n\n' + menuItems.slice(0, 3).map(item => '- ' + previewLine(item, true)).join('\n'));
        await startFinalQuestions();
        return;
      }

      if (!asMenu && services.length) {
        collect({ services: services });
        await botSay('Extraimos ' + services.length + ' servicio' + (services.length !== 1 ? 's' : '') + ' o producto' + (services.length !== 1 ? 's' : '') + '.\n\n' + services.slice(0, 3).map(item => '- ' + previewLine(item, false)).join('\n'));
        await startFinalQuestions();
        return;
      }

      setInputOff(false);
      stepRef.current = 'manual_offerings';
      await botSay(asMenu ? 'No pude extraer el menu automaticamente. Escribeme algunos platillos o bebidas con precio en un solo mensaje.' : 'No pude extraer la lista automaticamente. Escribeme algunos servicios o productos con precio en un solo mensaje.');
    } catch (error) {
      console.error('Catalog upload/parse error:', error);
      setInputOff(false);
      stepRef.current = 'manual_offerings';
      await botSay(asMenu ? 'No pude leer ese archivo. Si quieres, escribeme algunos platillos o bebidas con precio en un solo mensaje.' : 'No pude leer ese archivo. Si quieres, escribeme algunos servicios o productos con precio en un solo mensaje.');
    }
  }

  async function startFinalQuestions() {
    setInputOff(false);
    await botSay('Ya casi terminamos. Solo un par de preguntas mas.');
    stepRef.current = 'slogan';
    await botSay('Tienes un *slogan* o frase corta para tu negocio?\n\n_Escribe "no" si no tienes._');
  }

  async function submitData() {
    setInputOff(true);
    await botSay('Perfecto. Voy a guardar toda tu informacion y preparar tu acceso a Mi Pagina. 🚀');

    const data = collRef.current;
    const normalizedBusinessType = mapBusinessType(data.tipo || '');
    const notes = [];
    if (data.slogan && !isNegative(data.slogan)) notes.push('Slogan: ' + data.slogan);
    if (data.redes && !isNegative(data.redes)) notes.push('Redes: ' + data.redes);
    if (data.tipo && normalizedBusinessType === 'generic') notes.push('Tipo original: ' + data.tipo);

    const payload = {
      company: data.nombre || '',
      contactName: data.contacto_nombre || data.propietario || '',
      contactEmail: data.contacto_email || '',
      contactWhatsapp: data.contacto_whatsapp || '',
      businessType: normalizedBusinessType,
      businessPhone: data.telefono || '',
      businessWhatsapp: data.whatsapp || '',
      addressFull: data.direccion || '',
      city: data.ciudad || '',
      aboutBusiness: data.sobre || '',
      founderName: data.propietario || '',
      hours: data.horario ? { general: data.horario } : null,
      extraNotes: notes.join('\n'),
      selectedGoogleMatch: data.place_id ? {
        placeId: data.place_id,
        name: data.nombre,
        address: data.direccion,
        addressCity: data.ciudad,
        phone: data.telefono,
        rating: data.calificacion ? parseFloat(data.calificacion) : null,
        reviewCount: data.resenas || null,
        types: [normalizedBusinessType]
      } : null,
      googleListingStatus: data.listing_status || '',
      googleListingNote: data.listing_note || '',
      additionalLocations: data.additional_locations || [],
      photos: data.uploaded_photos || [],
      services: data.services || [],
      menuItems: data.menu_items || []
    };

    try {
      const res = await fetch('/api/public-builder/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Error al guardar');

      await botSay(result.message || 'Listo. Guardamos tu informacion.');
      if (result.accountStatus === 'invite_sent') {
        await botSay('Revisa *' + payload.contactEmail + '* para verificar tu correo, crear tu contraseña y entrar a *Mi Pagina*.');
      } else if (result.accountStatus === 'existing_user') {
        await botSay('Si tu acceso ya existia, ya puedes entrar a *Mi Pagina* con ese mismo correo y contraseña.');
      } else {
        await botSay('Tu registro quedo guardado, pero hubo un problema al enviar el acceso automaticamente. Nuestro equipo te ayudara a activarlo.');
      }

      pushMsg({
        from: 'bot',
        time: ts(),
        rich: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href="/mipagina" style={{ display: 'block', width: '100%', padding: '14px', background: C.green, borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, textAlign: 'center', textDecoration: 'none', boxShadow: '0 4px 20px rgba(33,197,94,.35)' }}>Ir a mi portal</a>
            <a href="/" style={{ display: 'block', textAlign: 'center', color: C.waSub, fontSize: 12, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>Volver al inicio</a>
          </div>
        )
      });

      stepRef.current = 'done';
    } catch (error) {
      console.error('Submit error:', error);
      await botSay('Hubo un problema al guardar tu informacion. Por favor intenta de nuevo o contactanos por WhatsApp.');
      setInputOff(false);
    }
  }

  async function handleSend(rawValue) {
    const value = String(rawValue || inputVal).trim();
    if (!value) return;
    setInputVal('');
    userSay(value);

    switch (stepRef.current) {
      case 'owner_name':
        collect({ propietario: value, contacto_nombre: value });
        stepRef.current = 'business_name';
        await botSay('Mucho gusto, *' + value.split(' ')[0] + '*.');
        await botSay('Como se llama tu *negocio*?');
        break;

      case 'business_name':
        collect({ nombre: value });
        stepRef.current = 'business_city';
        await botSay('En que *ciudad* esta tu negocio?');
        break;

      case 'business_city':
        collect({ ciudad: value });
        await beginGoogleLookup();
        break;

      case 'editing_found_field': {
        const field = FOUND_FIELDS[foundFieldIdxRef.current];
        collect({ [field.key]: normalizeMaybeBlank(value) });
        await askFoundField(foundFieldIdxRef.current + 1);
        break;
      }

      case 'listing_details':
        collect({ listing_note: value });
        await botSay('Gracias. Aunque hoy no la encontramos automaticamente, avanzamos con tu pagina y revisaremos esa ficha despues.');
        await beginContactCapture('manual');
        break;

      case 'contact_email':
        collect({ contacto_email: value });
        stepRef.current = 'contact_phone';
        await botSay('Y cual es tu *numero de WhatsApp personal* para coordinar contigo?\n\n_Este numero es interno y no aparecera en la pagina._');
        break;

      case 'contact_phone':
        collect({ contacto_whatsapp: value });
        await advanceAfterContactCapture();
        break;

      case 'manual_type':
        collect({ tipo: value });
        stepRef.current = 'manual_address';
        await botSay('Cual es la *direccion completa* donde te visitan tus clientes?');
        break;

      case 'manual_address':
        collect({ direccion: normalizeMaybeBlank(value) });
        stepRef.current = 'manual_business_phone';
        await botSay('Cual es el *telefono del negocio*?\n\n_Escribe "no" si todavia no tienes uno publico._');
        break;

      case 'manual_business_phone':
        collect({ telefono: normalizeMaybeBlank(value) });
        stepRef.current = 'manual_hours';
        await botSay('Cual es tu *horario de atencion*?\n\n_Ejemplo: Lunes a sabado, 9am-7pm_');
        break;

      case 'manual_hours':
        collect({ horario: normalizeMaybeBlank(value) });
        stepRef.current = 'manual_about';
        await botSay('Cuentame un poco sobre tu negocio.\n\nQue te hace especial y por que te recomiendan tus clientes?');
        break;

      case 'manual_about':
        collect({ sobre: normalizeMaybeBlank(value) });
        stepRef.current = 'manual_business_whatsapp';
        await botSay('Cual es el *WhatsApp* que quieres mostrar en tu pagina?\n\n_Escribe "no" si quieres definirlo despues._');
        break;

      case 'manual_business_whatsapp':
        collect({ whatsapp: normalizeMaybeBlank(value) });
        await continueAfterBusinessWhatsapp();
        break;

      case 'manual_offerings': {
        const asMenu = isFoodBusiness(collRef.current.tipo);
        const items = parseOfferingsText(value, asMenu);
        if (!items.length) {
          await botSay(asMenu ? 'No pude leer ningun platillo ahi. Prueba con algo como: Tacos al pastor - 95, Agua fresca - 30' : 'No pude leer ningun servicio ahi. Prueba con algo como: Corte clasico - 250, Barba - 150');
          return;
        }
        if (asMenu) collect({ menu_items: items });
        else collect({ services: items });
        await botSay('Perfecto. Guardamos ' + items.length + ' elemento' + (items.length !== 1 ? 's' : '') + '.\n\n' + items.slice(0, 3).map(item => '- ' + previewLine(item, asMenu)).join('\n'));
        await startFinalQuestions();
        break;
      }

      case 'slogan':
        collect({ slogan: isNegative(value) ? '' : value });
        stepRef.current = 'social';
        await botSay('Comparte los *links de redes sociales* que quieras mostrar en tu pagina.\n\n_Instagram, Facebook, TikTok, etc. Escribe "no" si no tienes._');
        break;

      case 'social':
        collect({ redes: isNegative(value) ? '' : value });
        await submitData();
        break;

      default:
        break;
    }
  }

  return (
    <div style={outerStyle}>
      <div style={frameStyle}>
        <div style={{ background: C.waHeader, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <Avatar size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.waText }}>Pagina</div>
            <div style={{ fontSize: 12, color: C.green, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
              En linea
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.waSub, textAlign: 'right', lineHeight: 1.3 }}>
            <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>Ahora</span>
            <span style={{ color: C.waText, fontWeight: 700, fontSize: 12 }}>Tengo</span>
            <br />
            <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>Pagina</span>
          </div>
        </div>

        <ProgressBar data={collected} />

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2, background: C.waBg }}>
          <div style={{ flex: '1 0 auto', minHeight: 0 }} />
          {msgs.map(message => <Bubble key={message.id} msg={message} />)}
          {typing ? <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, animation: 'fadeUp .2s ease' }}><Avatar /><Dots /></div> : null}
          {showSearchCard ? (
            <div style={{ paddingLeft: 40, animation: 'fadeUp .3s ease', marginTop: 4 }}>
              <div style={{ maxWidth: '82%', background: C.waBubIn, borderRadius: '0 10px 10px 10px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}>
                <SearchCard done={searchDone} found={searchFound} biz={searchBiz || {}} count={searchCount} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: C.waTime }}>{ts()}</span>
                </div>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} style={{ height: 4 }} />
        </div>

        <div style={{ background: C.waHeader, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, borderTop: '1px solid rgba(255,255,255,.04)' }}>
          {inputOff ? (
            <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: C.waSub, padding: '10px 0' }}>Procesando...</div>
          ) : (
            <>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.08)', borderRadius: 24, padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  value={inputVal}
                  onChange={event => setInputVal(event.target.value)}
                  onFocus={() => {
                    const start = Date.now();
                    function tick() {
                      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
                      scrollBottom();
                      if (Date.now() - start < 800) requestAnimationFrame(tick);
                    }
                    tick();
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.waText, fontSize: 16, fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputVal.trim() || typing}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  background: inputVal.trim() && !typing ? C.green : 'rgba(255,255,255,.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background .2s'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9L16 2L9 16L7.5 10.5L2 9Z" fill="white" /></svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
