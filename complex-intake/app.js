const { useMemo, useRef, useState } = React;

const SUPPORT_WHATSAPP = "529991095806";
const STORAGE_KEY = "atp_complex_intake";
const SUBMISSION_KEY = "atp_complex_intake_submission";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TARGET_IMAGE_BYTES = Math.floor(MAX_IMAGE_BYTES * 0.92);
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

const currencies = ["COP", "MXN", "USD"];

const locationOptions = [
  ["storefront", "Local comercial", "Storefront"],
  ["office", "Oficina o consultorio", "Office or clinic"],
  ["home", "Desde casa", "From home"],
  ["delivery", "A domicilio", "At the customer's location"],
  ["online", "En linea", "Online"],
  ["street", "Calle, ferias o eventos", "Street, fairs, or events"],
  ["other", "Otro", "Other"],
];

const visitOptions = [
  ["appointment", "Si, con cita previa", "Yes, by appointment"],
  ["business_hours", "Si, en horario de atencion", "Yes, during business hours"],
  ["customer_location", "No, yo voy donde el cliente", "No, I go to the customer"],
  ["online_only", "No, vendo principalmente en linea", "No, I mainly sell online"],
  ["not_sure", "No estoy seguro", "Not sure"],
];

const businessModelOptions = [
  ["products", "Productos", "Products"],
  ["services", "Servicios", "Services"],
  ["both", "Productos y servicios", "Products and services"],
];

const marketReachOptions = [
  ["local", "Solo mi ciudad o zona", "Only my city or area"],
  ["national", "Clientes de otras ciudades del pais", "Customers from other cities in my country"],
  ["travel_international", "Extranjeros que pueden viajar a mi negocio", "Foreign customers who can travel to me"],
  ["online_international", "Clientes internacionales en linea", "International online customers"],
  ["not_sure", "No estoy seguro", "Not sure"],
];

const goalOptions = [
  ["whatsapp", "Recibir mas mensajes por WhatsApp", "Get more WhatsApp messages"],
  ["appointments", "Conseguir mas citas o reservas", "Get more appointments or bookings"],
  ["direct_sales", "Vender productos directamente", "Sell products directly"],
  ["course", "Vender un curso o producto digital", "Sell a course or digital product"],
  ["travel", "Convencer clientes extranjeros de viajar a mi negocio", "Persuade foreign customers to travel"],
  ["complex_services", "Explicar servicios complejos", "Explain complex services"],
  ["multiple_offers", "Promocionar varias ofertas", "Promote multiple offers"],
  ["other", "Otro", "Other"],
];

const actionOptions = [
  ["whatsapp", "Escribir por WhatsApp", "Message on WhatsApp"],
  ["call", "Llamar", "Call"],
  ["book", "Reservar una cita", "Book an appointment"],
  ["buy", "Comprar en linea", "Buy online"],
  ["form", "Llenar un formulario", "Fill out a form"],
  ["pricing", "Ver precios", "View pricing"],
  ["download", "Descargar informacion", "Download information"],
  ["other", "Otro", "Other"],
];

const defaultCategory = (type) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  description: "",
  minPrice: "",
  maxPrice: "",
  currency: "COP",
  problem: "",
  unique: "",
  salesScope: "",
  currentScope: "",
});

function createDefaultForm() {
  return {
    businessName: "",
    businessCategory: "",
    oneLineDescription: "",
    city: "",
    country: "Colombia",
    address: "",
    locationType: "",
    visitPreference: "",
    businessModel: "services",
    businessStructure: "",
    primaryModel: "",
    productCategories: [defaultCategory("product")],
    serviceCategories: [defaultCategory("service")],
    marketReach: "",
    targetCustomers: "",
    siteGoal: "",
    primaryAction: "",
    customerQuestions: "",
    strategicNotes: "",
    promotions: "",
    currentWebsite: "no",
    websiteUrl: "",
    websiteProblems: "",
    hasDomain: "no",
    domainDetails: "",
    socialInstagram: "",
    socialFacebook: "",
    socialTikTok: "",
    socialLinkedIn: "",
    socialOther: "",
    googleMapsStatus: "",
    googleMapsUrl: "",
    materialsStatus: "",
    inspiration: "",
    personalName: "",
    personalEmail: "",
    personalWhatsapp: "",
    publicWhatsapp: "",
    publicEmail: "",
    publicAddress: "",
    businessHours: "",
  };
}

function loadSavedForm() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved && typeof saved === "object" ? { ...createDefaultForm(), ...saved } : createDefaultForm();
  } catch {
    return createDefaultForm();
  }
}

function safeText(value) {
  return String(value || "").trim();
}

function formatChoice(options, value) {
  const match = options.find((option) => option[0] === value);
  return match ? match[1] : value || "";
}

function getByPath(source, path) {
  return String(path || "").split(".").reduce((current, key) => {
    if (current == null) return "";
    return current[key];
  }, source);
}

function setByPath(source, path, value) {
  const parts = String(path || "").split(".");
  const next = Array.isArray(source) ? [...source] : { ...source };
  let cursor = next;

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    if (isLast) {
      cursor[part] = value;
      return;
    }
    const oldValue = cursor[part];
    cursor[part] = Array.isArray(oldValue) ? [...oldValue] : { ...(oldValue || {}) };
    cursor = cursor[part];
  });

  return next;
}

function summarizeForm(form) {
  const lines = [
    `Negocio: ${form.businessName}`,
    `Giro: ${form.businessCategory}`,
    `Descripcion corta: ${form.oneLineDescription}`,
    `Ciudad/pais: ${form.city}, ${form.country}`,
    `Modelo: ${formatChoice(businessModelOptions, form.businessModel)}`,
    `Meta del sitio: ${formatChoice(goalOptions, form.siteGoal)}`,
    `Accion principal: ${formatChoice(actionOptions, form.primaryAction)}`,
    `Clientes objetivo: ${form.targetCustomers}`,
    `Alcance: ${formatChoice(marketReachOptions, form.marketReach)}`,
    `Notas de marketing: ${form.strategicNotes}`,
  ];

  if (form.productCategories && form.productCategories.length) {
    lines.push("Categorias de producto:");
    form.productCategories.forEach((item, index) => {
      if (safeText(item.name) || safeText(item.description)) {
        lines.push(`${index + 1}. ${item.name}: ${item.description}. Precio: ${item.currency || ""} ${item.minPrice || ""}-${item.maxPrice || ""}. Problema: ${item.problem}. Diferencia: ${item.unique}.`);
      }
    });
  }

  if (form.serviceCategories && form.serviceCategories.length) {
    lines.push("Categorias de servicio:");
    form.serviceCategories.forEach((item, index) => {
      if (safeText(item.name) || safeText(item.description)) {
        lines.push(`${index + 1}. ${item.name}: ${item.description}. Precio: ${item.currency || ""} ${item.minPrice || ""}-${item.maxPrice || ""}. Problema: ${item.problem}. Diferencia: ${item.unique}.`);
      }
    });
  }

  return lines.filter((line) => safeText(line).replace(/^[^:]+:\s*$/, "")).join("\n");
}

function buildExtraNotes(form) {
  const productNotes = (form.productCategories || [])
    .filter((item) => safeText(item.name) || safeText(item.description))
    .map((item, index) => [
      `Producto ${index + 1}: ${item.name || "Sin nombre"}`,
      `Descripcion: ${item.description || ""}`,
      `Precio: ${item.currency || ""} ${item.minPrice || ""}${item.maxPrice ? ` - ${item.maxPrice}` : ""}`,
      `Problema que resuelve: ${item.problem || ""}`,
      `Diferenciador: ${item.unique || ""}`,
      `Venta/entrega: ${item.salesScope || ""}`,
      `Venta actual: ${item.currentScope || ""}`,
    ].join("\n"));

  const serviceNotes = (form.serviceCategories || [])
    .filter((item) => safeText(item.name) || safeText(item.description))
    .map((item, index) => [
      `Servicio ${index + 1}: ${item.name || "Sin nombre"}`,
      `Descripcion: ${item.description || ""}`,
      `Precio: ${item.currency || ""} ${item.minPrice || ""}${item.maxPrice ? ` - ${item.maxPrice}` : ""}`,
      `Problema que resuelve: ${item.problem || ""}`,
      `Diferenciador: ${item.unique || ""}`,
      `Mercado objetivo: ${item.salesScope || ""}`,
      `Venta actual: ${item.currentScope || ""}`,
    ].join("\n"));

  return [
    "INTAKE PERSONALIZADO",
    `Descripcion corta: ${form.oneLineDescription}`,
    `Ubicacion: ${form.city}, ${form.country}`,
    `Direccion privada/publica: ${form.address || form.publicAddress || ""}`,
    `Tipo de atencion: ${formatChoice(locationOptions, form.locationType)} / ${formatChoice(visitOptions, form.visitPreference)}`,
    `Modelo de negocio: ${formatChoice(businessModelOptions, form.businessModel)}`,
    form.businessModel === "both" ? `Estructura: ${form.businessStructure || ""}` : "",
    form.businessModel === "both" ? `Negocio principal: ${form.primaryModel || ""}` : "",
    productNotes.join("\n\n"),
    serviceNotes.join("\n\n"),
    `Alcance deseado: ${formatChoice(marketReachOptions, form.marketReach)}`,
    `Clientes ideales: ${form.targetCustomers}`,
    `Meta del sitio: ${formatChoice(goalOptions, form.siteGoal)}`,
    `Accion principal: ${formatChoice(actionOptions, form.primaryAction)}`,
    `Dudas del cliente: ${form.customerQuestions}`,
    `Notas estrategicas: ${form.strategicNotes}`,
    `Promociones/campanas: ${form.promotions}`,
    `Sitio actual: ${form.currentWebsite} ${form.websiteUrl || ""}`,
    `Problemas del sitio actual: ${form.websiteProblems}`,
    `Dominio: ${form.hasDomain} ${form.domainDetails || ""}`,
    `Instagram: ${form.socialInstagram}`,
    `Facebook: ${form.socialFacebook}`,
    `TikTok: ${form.socialTikTok}`,
    `LinkedIn: ${form.socialLinkedIn}`,
    `Otros perfiles: ${form.socialOther}`,
    `Google Maps: ${form.googleMapsStatus} ${form.googleMapsUrl || ""}`,
    `Materiales disponibles: ${form.materialsStatus}`,
    `Inspiracion/competidores: ${form.inspiration}`,
  ].filter(Boolean).join("\n\n");
}

function Topbar({ mode }) {
  return (
    <header className="ci-topbar">
      <div className="ci-topbar-inner">
        <a className="ci-brand" href="/">
          <span className="ci-brand-mark">A</span>
          <span className="ci-brand-copy">
            <strong>AhoraTengoPagina</strong>
            <span>{mode === "catalog" ? "Catalogo antes de crear tu pagina" : "Intake personalizado"}</span>
          </span>
        </a>
        <div className="ci-top-actions">
          <a className="ci-btn ci-btn--ghost ci-btn--small" href="/crear-tu-pagina/chat">Formulario simple</a>
          <a className="ci-btn ci-btn--primary ci-btn--small" href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener">Ayuda por WhatsApp</a>
        </div>
      </div>
    </header>
  );
}

function Field({ label, english, required, children, full }) {
  return (
    <label className={`ci-field${full ? " ci-field--full" : ""}`}>
      <span className="ci-label">{label} {required ? <span>*</span> : null}</span>
      {english ? <span className="ci-english">{english}</span> : null}
      {children}
    </label>
  );
}

function TextInput({ form, setForm, path, label, english, required, type = "text", placeholder = "" }) {
  const value = getByPath(form, path) || "";
  return (
    <Field label={label} english={english} required={required}>
      <input
        className="ci-input"
        type={type}
        value={value}
        placeholder={placeholder}
        data-path={path}
        data-label={label}
        onFocus={(event) => window.dispatchEvent(new CustomEvent("ci-focus-field", { detail: { path, label, value: event.target.value } }))}
        onChange={(event) => setForm((current) => setByPath(current, path, event.target.value))}
      />
    </Field>
  );
}

function TextArea({ form, setForm, path, label, english, required, large, placeholder = "" }) {
  const value = getByPath(form, path) || "";
  return (
    <Field label={label} english={english} required={required} full>
      <textarea
        className={`ci-textarea${large ? " ci-textarea--large" : ""}`}
        value={value}
        placeholder={placeholder}
        data-path={path}
        data-label={label}
        onFocus={(event) => window.dispatchEvent(new CustomEvent("ci-focus-field", { detail: { path, label, value: event.target.value } }))}
        onChange={(event) => setForm((current) => setByPath(current, path, event.target.value))}
      />
    </Field>
  );
}

function SelectInput({ form, setForm, path, label, english, children, required }) {
  return (
    <Field label={label} english={english} required={required}>
      <select className="ci-select" value={getByPath(form, path) || ""} onChange={(event) => setForm((current) => setByPath(current, path, event.target.value))}>
        {children}
      </select>
    </Field>
  );
}

function ChoiceGroup({ form, setForm, path, label, english, options, required }) {
  const value = getByPath(form, path) || "";
  return (
    <div className="ci-field ci-field--full">
      <div className="ci-label">{label} {required ? <span>*</span> : null}</div>
      {english ? <div className="ci-english">{english}</div> : null}
      <div className="ci-segment-grid">
        {options.map((option) => (
          <button
            type="button"
            key={option[0]}
            className={`ci-choice${value === option[0] ? " is-selected" : ""}`}
            onClick={() => setForm((current) => setByPath(current, path, option[0]))}
          >
            <strong>{option[1]}</strong>
            <span>{option[2]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ id, title, english, children }) {
  return (
    <section className="ci-section" id={id}>
      <div className="ci-section-head">
        <h2>{title}</h2>
        {english ? <p>{english}</p> : null}
      </div>
      <div className="ci-section-body">{children}</div>
    </section>
  );
}

function CategoryEditor({ form, setForm, type, title, intro }) {
  const key = type === "product" ? "productCategories" : "serviceCategories";
  const categories = form[key] || [];
  const scopeLabel = type === "product" ? "Donde puedes vender o entregar" : "A quien quieres vender este servicio";
  const scopeEnglish = type === "product" ? "Where can you sell or deliver this?" : "Who do you want to sell this service to?";

  function updateList(nextList) {
    setForm((current) => ({ ...current, [key]: nextList }));
  }

  return (
    <div className="ci-repeater">
      <div className="ci-alert">{intro}</div>
      {categories.map((category, index) => (
        <div className="ci-repeat-card" key={category.id || index}>
          <div className="ci-repeat-head">
            <h3>{title} {index + 1}</h3>
            {categories.length > 1 ? (
              <button
                className="ci-btn ci-btn--danger ci-btn--small"
                type="button"
                onClick={() => updateList(categories.filter((_, currentIndex) => currentIndex !== index))}
              >
                Quitar
              </button>
            ) : null}
          </div>
          <div className="ci-grid">
            <TextInput form={form} setForm={setForm} path={`${key}.${index}.name`} label="Nombre de la categoria" english="Category name" />
            <Field label="Rango de precios aproximado" english="Approximate price range">
              <div className="ci-price-row">
                <select
                  className="ci-select"
                  value={category.currency || "COP"}
                  onChange={(event) => setForm((current) => setByPath(current, `${key}.${index}.currency`, event.target.value))}
                >
                  {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
                <input
                  className="ci-input"
                  value={category.minPrice || ""}
                  placeholder="Min"
                  inputMode="decimal"
                  onChange={(event) => setForm((current) => setByPath(current, `${key}.${index}.minPrice`, event.target.value))}
                />
                <input
                  className="ci-input"
                  value={category.maxPrice || ""}
                  placeholder="Max"
                  inputMode="decimal"
                  onChange={(event) => setForm((current) => setByPath(current, `${key}.${index}.maxPrice`, event.target.value))}
                />
              </div>
            </Field>
            <TextArea form={form} setForm={setForm} path={`${key}.${index}.description`} label="Describe esta categoria" english="Describe this category" />
            <TextArea form={form} setForm={setForm} path={`${key}.${index}.problem`} label={type === "product" ? "Que problema resuelve este producto" : "Que problema resuelve este servicio"} english="What problem does this solve?" />
            <TextArea form={form} setForm={setForm} path={`${key}.${index}.unique`} label={type === "product" ? "Por que tus productos son diferentes" : "Por que tu servicio es diferente"} english="Why is this different or better?" />
            <TextInput form={form} setForm={setForm} path={`${key}.${index}.salesScope`} label={scopeLabel} english={scopeEnglish} />
            <TextInput form={form} setForm={setForm} path={`${key}.${index}.currentScope`} label="Donde estas vendiendo actualmente" english="Where are you currently selling?" />
          </div>
        </div>
      ))}
      <div>
        <button className="ci-btn ci-btn--ghost" type="button" onClick={() => updateList([...categories, defaultCategory(type)])}>
          Agregar otra categoria
        </button>
      </div>
    </div>
  );
}

function Progress({ form }) {
  const important = [
    form.businessName,
    form.businessCategory,
    form.oneLineDescription,
    form.city,
    form.locationType,
    form.businessModel,
    form.marketReach,
    form.targetCustomers,
    form.siteGoal,
    form.primaryAction,
    form.strategicNotes,
    form.personalName,
    form.personalEmail,
    form.personalWhatsapp,
    form.publicWhatsapp,
  ];
  const complete = important.filter((value) => safeText(value)).length;
  const percent = Math.round((complete / important.length) * 100);

  return (
    <div className="ci-progress-wrap">
      <div className="ci-progress-row">
        <span className="ci-progress-label">Avance del formulario</span>
        <span className="ci-progress-meta">{percent}% completo</span>
      </div>
      <div className="ci-progress-track">
        <div className="ci-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function AiHelper({ form, setForm }) {
  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [summary, setSummary] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    function handleFocus(event) {
      setActiveField(event.detail);
    }
    window.addEventListener("ci-focus-field", handleFocus);
    return () => window.removeEventListener("ci-focus-field", handleFocus);
  }, []);

  async function askAi(mode) {
    setError("");
    setDraft("");
    setLoading(true);
    try {
      const response = await fetch("/api/public-builder/intake-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          summary,
          fieldLabel: activeField ? activeField.label : "",
          fieldValue: activeField ? getByPath(form, activeField.path) : "",
          businessContext: summarizeForm(form),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo usar la IA");
      setDraft(result.text || "");
    } catch (err) {
      setError(err.message || "No se pudo usar la IA");
    } finally {
      setLoading(false);
    }
  }

  function applyDraft() {
    if (!activeField || !draft) return;
    setForm((current) => setByPath(current, activeField.path, draft));
  }

  return (
    <>
      <button className="ci-helper-button" type="button" onClick={() => setOpen((value) => !value)}>
        AI ayuda
      </button>
      {open ? (
        <aside className="ci-helper-panel" aria-label="Ayuda con inteligencia artificial">
          <div className="ci-helper-head">
            <div>
              <h2>Ayuda para escribir</h2>
              <p>Escribe una idea simple y la IA puede convertirla en una respuesta clara para el campo que estas editando.</p>
            </div>
            <button className="ci-btn ci-btn--ghost ci-btn--small" type="button" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
          <div className="ci-helper-body">
            <div className="ci-alert">
              Campo activo: <strong>{activeField ? activeField.label : "Haz clic en un campo del formulario"}</strong>
              <div className="ci-english">Active field: {activeField ? activeField.label : "Click a form field first"}</div>
            </div>
            <textarea
              className="ci-textarea"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Ejemplo: Somos una empresa que administra Airbnbs en Medellin, vende muebles para propiedades y quiere lanzar un curso para propietarios."
            />
            <div className="ci-form-actions">
              <button className="ci-btn ci-btn--ghost" type="button" disabled={loading || !activeField} onClick={() => askAi("draft")}>
                Escribir campo
              </button>
              <button className="ci-btn ci-btn--secondary" type="button" disabled={loading || !activeField} onClick={() => askAi("improve")}>
                Mejorar campo
              </button>
            </div>
            {loading ? <div className="ci-alert">La IA esta escribiendo...</div> : null}
            {error ? <div className="ci-alert ci-alert--error">{error}</div> : null}
            {draft ? (
              <>
                <div className="ci-helper-draft">{draft}</div>
                <button className="ci-btn ci-btn--primary" type="button" onClick={applyDraft}>Usar esta respuesta</button>
              </>
            ) : null}
          </div>
        </aside>
      ) : null}
    </>
  );
}

function IntakePage() {
  const [form, setFormState] = useState(loadSavedForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function setForm(updater) {
    setFormState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const showProducts = form.businessModel === "products" || form.businessModel === "both";
  const showServices = form.businessModel === "services" || form.businessModel === "both";

  async function submitForm(event) {
    event.preventDefault();
    setError("");
    const missing = [
      ["businessName", "nombre del negocio"],
      ["businessCategory", "giro del negocio"],
      ["personalName", "nombre de contacto"],
      ["personalEmail", "email personal"],
      ["personalWhatsapp", "WhatsApp personal"],
      ["siteGoal", "meta del sitio"],
    ].filter(([key]) => !safeText(form[key]));

    if (missing.length) {
      setError(`Faltan estos campos: ${missing.map((item) => item[1]).join(", ")}.`);
      return;
    }

    const payload = {
      company: form.businessName,
      contactName: form.personalName,
      contactEmail: form.personalEmail,
      contactWhatsapp: form.personalWhatsapp,
      businessType: form.businessCategory || form.businessModel || "negocio",
      businessPhone: form.publicWhatsapp,
      addressFull: form.publicAddress || form.address,
      city: form.city,
      aboutBusiness: [form.oneLineDescription, form.strategicNotes].filter(Boolean).join("\n\n"),
      hours: form.businessHours ? { horario: form.businessHours } : null,
      extraNotes: buildExtraNotes(form),
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/public-builder/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el formulario");

      localStorage.setItem(SUBMISSION_KEY, JSON.stringify({ businessId: result.businessId, form }));
      window.location.href = `/crear-tu-pagina/catalogo?businessId=${encodeURIComponent(result.businessId)}`;
    } catch (err) {
      setError(err.message || "No se pudo guardar el formulario");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ci-shell">
      <Topbar mode="intake" />
      <header className="ci-header">
        <div>
          <p className="ci-kicker">Formulario estrategico</p>
          <h1 className="ci-title">Crea tu pagina web personalizada</h1>
          <p className="ci-lead">
            Este formulario es para negocios con varias ofertas, clientes en diferentes mercados o metas de marketing mas especificas. Con tus respuestas creamos una primera version y despues la ajustamos contigo.
          </p>
          <p className="ci-english">
            This form is for businesses with multiple offers, more specific marketing goals, or customers in different cities or countries.
          </p>
        </div>
        <div className="ci-hero-panel">
          <strong>Quieres algo mas rapido?</strong>
          <p>Si solo necesitas una pagina simple para recibir mas mensajes por WhatsApp, usa el formulario por chat.</p>
          <p className="ci-english">For the low-friction version, use the chat intake.</p>
          <div style={{ marginTop: 14 }}>
            <a className="ci-btn ci-btn--ghost" href="/crear-tu-pagina/chat">Ir al chat simple</a>
          </div>
        </div>
      </header>

      <Progress form={form} />

      <form className="ci-layout" onSubmit={submitForm}>
        <nav className="ci-sidebar" aria-label="Secciones del formulario">
          {[
            ["basico", "Negocio"],
            ["oferta", "Oferta"],
            ["estrategia", "Estrategia"],
            ["presencia", "Presencia online"],
            ["materiales", "Materiales"],
            ["contacto", "Contacto"],
          ].map((item) => (
            <a className="ci-side-link" href={`#${item[0]}`} key={item[0]}>
              <span className="ci-side-dot" />
              {item[1]}
            </a>
          ))}
        </nav>

        <main className="ci-main">
          <Section id="basico" title="1. Informacion basica" english="Basic business information">
            <div className="ci-grid">
              <TextInput form={form} setForm={setForm} path="businessName" label="Nombre del negocio" english="Business name" required />
              <TextInput form={form} setForm={setForm} path="businessCategory" label="Giro o tipo de negocio" english="Business category" required placeholder="Ej: cirujano plastico, administracion de Airbnbs" />
              <TextArea form={form} setForm={setForm} path="oneLineDescription" label="Describe tu negocio en una frase" english="Describe your business in one sentence" />
              <TextInput form={form} setForm={setForm} path="city" label="Ciudad principal" english="Main city" />
              <TextInput form={form} setForm={setForm} path="country" label="Pais" english="Country" />
              <TextInput form={form} setForm={setForm} path="address" label="Direccion interna o referencia" english="Internal address or reference" />
              <ChoiceGroup form={form} setForm={setForm} path="locationType" label="Donde atiendes o vendes principalmente?" english="Where do you mainly serve or sell?" options={locationOptions} />
              <ChoiceGroup form={form} setForm={setForm} path="visitPreference" label="Quieres que los clientes visiten tu ubicacion fisica?" english="Do you want customers to visit your physical location?" options={visitOptions} />
            </div>
          </Section>

          <Section id="oferta" title="2. Que vendes" english="Products, services, or both">
            <ChoiceGroup form={form} setForm={setForm} path="businessModel" label="Que vende tu negocio?" english="What does your business sell?" options={businessModelOptions} required />

            {form.businessModel === "both" ? (
              <div className="ci-grid">
                <TextArea form={form} setForm={setForm} path="businessStructure" label="Todo pertenece al mismo negocio o deberian ser sitios separados?" english="Is this all one business, or should parts be separate websites?" />
                <TextInput form={form} setForm={setForm} path="primaryModel" label="Tu negocio principal es mas de productos o servicios?" english="Is your main business more product-based or service-based?" />
              </div>
            ) : null}

            {showProducts ? (
              <CategoryEditor
                form={form}
                setForm={setForm}
                type="product"
                title="Categoria de producto"
                intro="Agrupa tus productos en categorias. No necesitas escribir todo tu catalogo ahora. Si vendes productos muy diferentes, agrega varias categorias; si vendes productos relacionados, una categoria puede ser suficiente."
              />
            ) : null}

            {showServices ? (
              <CategoryEditor
                form={form}
                setForm={setForm}
                type="service"
                title="Categoria de servicio"
                intro="Agrupa tus servicios en categorias. No necesitas escribir cada servicio exacto ahora. Si ofreces servicios muy diferentes, agrega varias categorias; si tu oferta es simple, una categoria puede ser suficiente."
              />
            ) : null}
          </Section>

          <Section id="estrategia" title="3. Clientes, mercado y estrategia" english="Customers, market, and website strategy">
            <ChoiceGroup form={form} setForm={setForm} path="marketReach" label="Donde quieres vender con esta pagina?" english="Where do you want this website to sell?" options={marketReachOptions} />
            <TextArea form={form} setForm={setForm} path="targetCustomers" label="Quien es tu cliente ideal?" english="Who is your ideal customer?" large />
            <ChoiceGroup form={form} setForm={setForm} path="siteGoal" label="Cual es el objetivo principal del sitio?" english="What is the main goal of the website?" options={goalOptions} required />
            <ChoiceGroup form={form} setForm={setForm} path="primaryAction" label="Que accion debe tomar un visitante?" english="What action should a visitor take?" options={actionOptions} />
            <TextArea form={form} setForm={setForm} path="customerQuestions" label="Que dudas o miedos tienen tus clientes antes de comprar?" english="What doubts, fears, or questions do customers have before buying?" large />
            <TextArea form={form} setForm={setForm} path="strategicNotes" label="Que debemos saber para vender bien tu negocio?" english="What should we know to market your business well?" large required />
            <TextArea form={form} setForm={setForm} path="promotions" label="Promociones, temporadas o campanas importantes" english="Promotions, seasons, or campaigns to highlight" />
          </Section>

          <Section id="presencia" title="4. Sitio actual, dominio y presencia online" english="Current website, domain, socials, and maps">
            <div className="ci-grid">
              <SelectInput form={form} setForm={setForm} path="currentWebsite" label="Tienes sitio web actualmente?" english="Do you currently have a website?">
                <option value="no">No</option>
                <option value="yes">Si</option>
              </SelectInput>
              <TextInput form={form} setForm={setForm} path="websiteUrl" label="URL del sitio actual" english="Current website URL" placeholder="https://..." />
              <TextArea form={form} setForm={setForm} path="websiteProblems" label="Que no te gusta del sitio actual?" english="What is wrong with the current site?" />
              <SelectInput form={form} setForm={setForm} path="hasDomain" label="Ya compraste un dominio?" english="Have you already bought a domain?">
                <option value="no">No</option>
                <option value="yes">Si</option>
                <option value="not_sure">No estoy seguro</option>
              </SelectInput>
              <TextArea form={form} setForm={setForm} path="domainDetails" label="Dominio y donde lo compraste" english="Domain and where you bought it" placeholder="Ej: medellinairbnb.com en GoDaddy" />
            </div>
            <div className="ci-social-grid">
              <TextInput form={form} setForm={setForm} path="socialInstagram" label="Instagram" english="Instagram" />
              <TextInput form={form} setForm={setForm} path="socialFacebook" label="Facebook" english="Facebook" />
              <TextInput form={form} setForm={setForm} path="socialTikTok" label="TikTok" english="TikTok" />
              <TextInput form={form} setForm={setForm} path="socialLinkedIn" label="LinkedIn" english="LinkedIn" />
            </div>
            <TextArea form={form} setForm={setForm} path="socialOther" label="Otros perfiles o directorios" english="Other profiles or directories" />
            <div className="ci-grid">
              <SelectInput form={form} setForm={setForm} path="googleMapsStatus" label="Tienes ficha de Google Maps?" english="Do you have a Google Maps listing?">
                <option value="">Selecciona una opcion</option>
                <option value="yes_link">Si, puedo pegar el enlace</option>
                <option value="yes_no_link">Si, pero no tengo el enlace ahora</option>
                <option value="no">No</option>
                <option value="not_sure">No estoy seguro</option>
              </SelectInput>
              <TextInput form={form} setForm={setForm} path="googleMapsUrl" label="Enlace de Google Maps" english="Google Maps link" />
            </div>
          </Section>

          <Section id="materiales" title="5. Materiales disponibles" english="Photos, testimonials, logos, references">
            <SelectInput form={form} setForm={setForm} path="materialsStatus" label="Tienes fotos, videos, testimonios, certificaciones o logo?" english="Do you have photos, videos, testimonials, certifications, or a logo?">
              <option value="">Selecciona una opcion</option>
              <option value="ready">Si, ya los tengo listos</option>
              <option value="later">Si, los puedo enviar despues</option>
              <option value="not_yet">No todavia</option>
              <option value="need_help">Necesito ayuda con eso</option>
            </SelectInput>
            <TextArea form={form} setForm={setForm} path="inspiration" label="Sitios, marcas o competidores que te gusten" english="Websites, brands, or competitors you like" large />
          </Section>

          <Section id="contacto" title="6. Contacto" english="Private coordination contact and public business contact">
            <div className="ci-grid">
              <TextInput form={form} setForm={setForm} path="personalName" label="Tu nombre" english="Your name" required />
              <TextInput form={form} setForm={setForm} path="personalEmail" label="Email personal para coordinar" english="Personal email for coordination" type="email" required />
              <TextInput form={form} setForm={setForm} path="personalWhatsapp" label="WhatsApp personal para coordinar" english="Personal WhatsApp for coordination" required />
              <TextInput form={form} setForm={setForm} path="publicWhatsapp" label="WhatsApp publico del negocio" english="Public business WhatsApp" />
              <TextInput form={form} setForm={setForm} path="publicEmail" label="Email publico del negocio" english="Public business email" type="email" />
              <TextInput form={form} setForm={setForm} path="publicAddress" label="Direccion publica si quieres mostrarla" english="Public address, if you want to show it" />
              <TextArea form={form} setForm={setForm} path="businessHours" label="Horarios de atencion" english="Business hours" />
            </div>
            {error ? <div className="ci-alert ci-alert--error">{error}</div> : null}
            <div className="ci-form-actions">
              <button className="ci-btn ci-btn--ghost" type="button" onClick={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(form))}>
                Guardar borrador
              </button>
              <button className="ci-btn ci-btn--primary" type="submit" disabled={submitting}>
                {submitting ? <span className="ci-spinner" /> : null}
                Continuar al catalogo
              </button>
            </div>
          </Section>
        </main>
      </form>

      <AiHelper form={form} setForm={setForm} />
    </div>
  );
}

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((response) => response.blob());
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo preparar la imagen"));
    }, type, quality);
  });
}

async function normalizeImageFile(file) {
  if (file.size <= TARGET_IMAGE_BYTES && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { blob: file, contentType: file.type, optimized: false };
  }

  if (file.type === "image/gif") {
    if (file.size > MAX_IMAGE_BYTES) throw new Error("El GIF es demasiado pesado. Usa un archivo menor de 4MB.");
    return { blob: file, contentType: file.type, optimized: false };
  }

  const image = await loadImageFromBlob(file);
  const sourceWidth = image.naturalWidth || image.width || 1;
  const sourceHeight = image.naturalHeight || image.height || 1;
  const baseScale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const scaleSteps = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
  const qualitySteps = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48];
  let bestBlob = file;

  for (const scaleStep of scaleSteps) {
    const scale = Math.min(1, baseScale * scaleStep);
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la imagen");
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of qualitySteps) {
      const candidate = await canvasToBlob(canvas, "image/jpeg", quality);
      if (candidate.size < bestBlob.size) bestBlob = candidate;
      if (candidate.size <= TARGET_IMAGE_BYTES) {
        return { blob: candidate, contentType: "image/jpeg", optimized: true };
      }
    }
  }

  if (bestBlob.size <= MAX_IMAGE_BYTES) {
    return { blob: bestBlob, contentType: bestBlob.type || "image/jpeg", optimized: true };
  }

  throw new Error("La imagen sigue siendo demasiado pesada despues de optimizarla. Usa una foto menor de 4MB.");
}

function makeCatalogItem(service, currency) {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: service && service.name ? service.name : "",
    description: service && service.description ? service.description : "",
    price: service && service.price != null ? String(service.price) : "",
    currency: (service && service.currency) || currency || "COP",
  };
}

function CatalogPage() {
  const savedSubmission = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(SUBMISSION_KEY) || "null");
    } catch {
      return null;
    }
  }, []);
  const params = new URLSearchParams(window.location.search);
  const businessId = params.get("businessId") || (savedSubmission && savedSubmission.businessId) || "";
  const businessType = (savedSubmission && savedSubmission.form && savedSubmission.form.businessCategory) || "";
  const inputRef = useRef(null);
  const [currency, setCurrency] = useState("COP");
  const [files, setFiles] = useState([]);
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function processFiles(fileList) {
    setError("");
    setSuccess("");
    if (!businessId) {
      setError("No encontramos el formulario anterior. Vuelve a completar el intake personalizado.");
      return;
    }

    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    setBusy(true);
    for (const file of incoming) {
      const isImage = file.type && file.type.indexOf("image/") === 0;
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) {
        setError(`Formato no soportado: ${file.name}. Usa imagen o PDF.`);
        continue;
      }

      if (isPdf && file.size > MAX_PDF_BYTES) {
        setError(`PDF demasiado grande: ${file.name}. Maximo 10MB.`);
        continue;
      }

      try {
        const prepared = isImage ? await normalizeImageFile(file) : { blob: file, contentType: file.type, optimized: false };
        if (isImage && prepared.blob.size > MAX_IMAGE_BYTES) {
          throw new Error("Imagen demasiado grande. Maximo 4MB.");
        }

        const uploadResponse = await fetch(`/api/public-builder/upload-catalog?business_id=${encodeURIComponent(businessId)}`, {
          method: "POST",
          headers: { "Content-Type": prepared.contentType },
          body: prepared.blob,
        });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(uploadResult.error || "No se pudo subir el archivo");

        const previewUrl = isImage ? URL.createObjectURL(prepared.blob) : "";
        const record = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          previewUrl,
          optimized: prepared.optimized,
          ...uploadResult,
        };
        setFiles((current) => [...current, record]);

        const parseResponse = await fetch("/api/catalog/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileUrl: uploadResult.public_url,
            currency,
            businessType,
          }),
        });
        const parseResult = await parseResponse.json().catch(() => ({}));
        if (parseResponse.ok && Array.isArray(parseResult.services) && parseResult.services.length) {
          setItems((current) => [...current, ...parseResult.services.map((service) => makeCatalogItem(service, currency))]);
        } else {
          setItems((current) => current.length ? current : [makeCatalogItem(null, currency)]);
          setError("Subimos el archivo, pero no pudimos extraer todos los datos. Puedes completar la lista manualmente.");
        }
      } catch (err) {
        setError(err.message || "No se pudo procesar el archivo");
      }
    }
    setBusy(false);
  }

  function updateItem(id, key, value) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function saveCatalog() {
    setError("");
    setSuccess("");
    if (!businessId) {
      setError("No encontramos el negocio. Vuelve al formulario personalizado.");
      return;
    }

    const cleanItems = items
      .map((item) => ({
        name: safeText(item.name),
        description: safeText(item.description),
        price: safeText(item.price),
        currency: item.currency || currency,
      }))
      .filter((item) => item.name || item.description || item.price);

    setBusy(true);
    try {
      const response = await fetch("/api/public-builder/save-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          items: cleanItems,
          files,
          replaceServices: true,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el catalogo");
      setSuccess("Listo. Guardamos tu catalogo y ya tenemos la informacion para crear tu pagina.");
    } catch (err) {
      setError(err.message || "No se pudo guardar el catalogo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ci-shell">
      <Topbar mode="catalog" />
      <header className="ci-header">
        <div>
          <p className="ci-kicker">Paso final antes de crear la pagina</p>
          <h1 className="ci-title">Sube tu catalogo real</h1>
          <p className="ci-lead">
            Sube fotos de listas de precios, menus, productos, servicios o PDF. La IA extrae nombre, descripcion y precio para que puedas editar lo que falte.
          </p>
          <p className="ci-english">
            Upload photos or PDFs of your real catalog. AI extracts name, description, and price, then you can edit missing details.
          </p>
        </div>
        <div className="ci-hero-panel">
          <strong>Limites de carga</strong>
          <p>Las fotos se optimizan antes de subir. El limite final es 4MB por imagen. Los PDF pueden pesar hasta 10MB.</p>
          <p className="ci-english">Images are compressed before upload. Final image limit is 4MB. PDF limit is 10MB.</p>
        </div>
      </header>

      <main className="ci-catalog-layout">
        {!businessId ? (
          <div className="ci-alert ci-alert--error">
            No encontramos el formulario anterior. Empieza por el intake personalizado para crear el negocio primero.
            <div style={{ marginTop: 12 }}>
              <a className="ci-btn ci-btn--primary" href="/crear-tu-pagina/personalizada">Ir al intake</a>
            </div>
          </div>
        ) : null}

        <section className="ci-section">
          <div className="ci-section-head">
            <h2>1. Sube archivos</h2>
            <p>Selecciona varias fotos o un PDF. Si una foto es muy grande, la pagina intenta reducirla automaticamente antes de enviarla.</p>
          </div>
          <div className="ci-section-body">
            <div className="ci-grid">
              <SelectInput form={{ currency }} setForm={(updater) => {
                const next = typeof updater === "function" ? updater({ currency }) : updater;
                setCurrency(next.currency || "COP");
              }} path="currency" label="Moneda principal" english="Primary currency">
                {currencies.map((option) => <option key={option} value={option}>{option}</option>)}
              </SelectInput>
            </div>
            <div
              className={`ci-upload-zone${dragging ? " is-dragging" : ""}`}
              onClick={() => inputRef.current && inputRef.current.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                processFiles(event.dataTransfer.files);
              }}
            >
              <strong>Elegir fotos o PDF del catalogo</strong>
              <span>Tambien puedes arrastrar archivos aqui.</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                hidden
                onChange={(event) => {
                  processFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>
            {busy ? <div className="ci-alert">Procesando archivos. Esto puede tomar un momento.</div> : null}
            {error ? <div className="ci-alert ci-alert--error">{error}</div> : null}
            {files.length ? (
              <div className="ci-file-grid">
                {files.map((file) => (
                  <article className="ci-file-card" key={file.id}>
                    <div className="ci-file-thumb">
                      {file.previewUrl ? <img src={file.previewUrl} alt="" /> : <span>PDF</span>}
                    </div>
                    <div className="ci-file-meta">
                      <strong title={file.name}>{file.name}</strong>
                      <span>{file.optimized ? "Optimizado y subido" : "Subido"}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="ci-section">
          <div className="ci-section-head">
            <h2>2. Revisa la lista extraida</h2>
            <p>Edita nombres, descripciones y precios. Agrega manualmente cualquier producto o servicio que la IA no haya encontrado.</p>
          </div>
          <div className="ci-section-body">
            {items.length ? (
              <div className="ci-items">
                {items.map((item) => (
                  <div className="ci-item-row" key={item.id}>
                    <input className="ci-input" value={item.name} placeholder="Nombre" onChange={(event) => updateItem(item.id, "name", event.target.value)} />
                    <textarea className="ci-textarea" value={item.description} placeholder="Descripcion" onChange={(event) => updateItem(item.id, "description", event.target.value)} />
                    <input className="ci-input" value={item.price} inputMode="decimal" placeholder="Precio" onChange={(event) => updateItem(item.id, "price", event.target.value)} />
                    <select className="ci-select" value={item.currency || currency} onChange={(event) => updateItem(item.id, "currency", event.target.value)}>
                      {currencies.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <button className="ci-btn ci-btn--danger ci-btn--small" type="button" onClick={() => removeItem(item.id)}>X</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ci-empty">
                Todavia no hay productos o servicios. Sube fotos de tu catalogo o agrega el primer item manualmente.
              </div>
            )}
            <div className="ci-form-actions">
              <button className="ci-btn ci-btn--ghost" type="button" onClick={() => setItems((current) => [...current, makeCatalogItem(null, currency)])}>
                Agregar item manual
              </button>
              <button className="ci-btn ci-btn--primary" type="button" disabled={busy} onClick={saveCatalog}>
                {busy ? <span className="ci-spinner" /> : null}
                Guardar catalogo y crear mi pagina
              </button>
            </div>
            {success ? (
              <div className="ci-alert ci-alert--success">
                {success}
                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="ci-btn ci-btn--primary" href="/mipagina">Ir a mi portal</a>
                  <a className="ci-btn ci-btn--ghost" href={`https://wa.me/${SUPPORT_WHATSAPP}`}>Hablar con soporte</a>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  const isCatalog = window.location.pathname.indexOf("/catalogo") !== -1;
  return isCatalog ? <CatalogPage /> : <IntakePage />;
}

const root = document.getElementById("complex-intake-root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
