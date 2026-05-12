const { useMemo, useRef, useState } = React;

const SUPPORT_WHATSAPP = "529991095806";
const STORAGE_KEY = "atp_complex_intake";
const SUBMISSION_KEY = "atp_complex_intake_submission";
const STEP_KEY = "atp_complex_intake_step";
const PREMIUM_INTENT_KEY = "atp_premium_plan_intent";
const PREMIUM_DEFERRED_KEY = "atp_premium_plan_deferred";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TARGET_IMAGE_BYTES = Math.floor(MAX_IMAGE_BYTES * 0.92);
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

const currencies = ["COP", "MXN", "USD"];

const locationOptions = [
  ["storefront", "Local comercial"],
  ["office", "Oficina o consultorio"],
  ["home", "Desde casa"],
  ["delivery", "A domicilio"],
  ["online", "En linea"],
  ["street", "Calle, ferias o eventos"],
  ["other", "Otro"],
];

const visitOptions = [
  ["appointment", "Si, con cita previa"],
  ["business_hours", "Si, en horario de atencion"],
  ["customer_location", "No, yo voy donde el cliente"],
  ["online_only", "No, vendo principalmente en linea"],
  ["not_sure", "No estoy seguro"],
];

const businessModelOptions = [
  ["products", "Productos"],
  ["services", "Servicios"],
  ["both", "Productos y servicios"],
];

const marketReachOptions = [
  ["local", "Solo mi ciudad o zona"],
  ["national", "Clientes de otras ciudades del pais"],
  ["travel_international", "Extranjeros que pueden viajar a mi negocio"],
  ["online_international", "Clientes internacionales en linea"],
  ["not_sure", "No estoy seguro"],
];

const goalOptions = [
  ["whatsapp", "Recibir mas mensajes por WhatsApp"],
  ["appointments", "Conseguir mas citas o reservas"],
  ["direct_sales", "Vender productos directamente"],
  ["course", "Vender un curso o producto digital"],
  ["travel", "Convencer clientes extranjeros de viajar a mi negocio"],
  ["complex_services", "Explicar servicios complejos"],
  ["multiple_offers", "Promocionar varias ofertas"],
  ["other", "Otro"],
];

const actionOptions = [
  ["whatsapp", "Escribir por WhatsApp"],
  ["call", "Llamar"],
  ["book", "Reservar una cita"],
  ["buy", "Comprar en linea"],
  ["form", "Llenar un formulario"],
  ["pricing", "Ver precios"],
  ["download", "Descargar informacion"],
  ["other", "Otro"],
];

const intakeSteps = [
  { id: "basico", label: "Negocio", title: "1. Informacion basica", english: "Basic business information" },
  { id: "contacto", label: "Tus datos", title: "2. Tus datos", english: "Private coordination contact and public business contact" },
  { id: "oferta", label: "Oferta", title: "3. Que vendes", english: "Products, services, or both" },
  { id: "estrategia", label: "Estrategia", title: "4. Clientes, mercado y estrategia", english: "Customers, market, and website strategy" },
  { id: "presencia", label: "Presencia online", title: "5. Sitio actual, dominio y presencia online", english: "Current website, domain, socials, and maps" },
  { id: "materiales", label: "Materiales", title: "6. Materiales disponibles", english: "Photos, testimonials, logos, references" },
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
    logoStatus: "",
    wantsGeneratedLogo: "",
    logoUrl: "",
    logoStoragePath: "",
    logoSource: "",
    logoLabel: "",
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

function loadSavedSubmission() {
  try {
    const saved = JSON.parse(localStorage.getItem(SUBMISSION_KEY) || "null");
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    return null;
  }
}

function loadSavedStep() {
  const saved = parseInt(localStorage.getItem(STEP_KEY) || "0", 10);
  if (!Number.isFinite(saved)) return 0;
  return Math.max(0, Math.min(intakeSteps.length - 1, saved));
}

function safeText(value) {
  return String(value || "").trim();
}

function normalizePlanText(value) {
  return safeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isNegocioPlusProduct(product) {
  const text = normalizePlanText([product && product.name, product && product.description].filter(Boolean).join(" "));
  return text.indexOf("negocio") !== -1 && text.indexOf("+") !== -1;
}

function countryToCode(value) {
  const text = normalizePlanText(value);
  if (text.indexOf("colombia") !== -1 || text === "co") return "CO";
  if (text.indexOf("mexico") !== -1 || text === "mx") return "MX";
  if (text.indexOf("ecuador") !== -1 || text === "ec") return "EC";
  return "";
}

function readPremiumIntent() {
  const params = new URLSearchParams(window.location.search);
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(PREMIUM_INTENT_KEY) || "null");
  } catch {
    stored = null;
  }

  if (params.get("plan") === "negocio-plus" || params.get("premiumProductId")) {
    const next = {
      ...(stored && typeof stored === "object" ? stored : {}),
      productId: params.get("premiumProductId") || (stored && stored.productId) || "",
      selectedAt: (stored && stored.selectedAt) || new Date().toISOString(),
    };
    localStorage.setItem(PREMIUM_INTENT_KEY, JSON.stringify(next));
    return next;
  }

  return stored && typeof stored === "object" ? stored : null;
}

function productFromPremiumIntent(intent) {
  if (!intent || !intent.productId) return null;
  return {
    id: intent.productId,
    name: intent.productName || "Pagina Negocio+",
    price: intent.productPrice || "",
    currency: intent.productCurrency || "",
    billing_interval: intent.billingInterval || "monthly",
  };
}

function formatProductPrice(product) {
  if (!product || product.price === "" || product.price == null) return "";
  const price = parseFloat(product.price);
  if (!Number.isFinite(price)) return "";
  const intervalLabels = { monthly: "/mes", yearly: "/ano", one_time: "" };
  return `$${price.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${product.currency || ""} ${intervalLabels[product.billing_interval] || ""}`.trim();
}

function buildPremiumCheckoutUrl(product, businessId, form) {
  const params = new URLSearchParams();
  if (businessId) params.set("business", businessId);
  params.set("source", "catalog-premium-upsell");
  const businessName = safeText(form && form.businessName);
  if (businessName) params.set("business_name", businessName);
  return `/checkout/${encodeURIComponent(product.id)}?${params.toString()}`;
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
  const hasCurrentWebsite = form.currentWebsite === "yes";
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
    `Sitio actual: ${form.currentWebsite}${hasCurrentWebsite && form.websiteUrl ? ` ${form.websiteUrl}` : ""}`,
    hasCurrentWebsite ? `Problemas del sitio actual: ${form.websiteProblems}` : "",
    `Dominio: ${form.hasDomain} ${form.domainDetails || ""}`,
    `Instagram: ${form.socialInstagram}`,
    `Facebook: ${form.socialFacebook}`,
    `TikTok: ${form.socialTikTok}`,
    `LinkedIn: ${form.socialLinkedIn}`,
    `Otros perfiles: ${form.socialOther}`,
    `Google Maps: ${form.googleMapsStatus} ${form.googleMapsUrl || ""}`,
    `Materiales disponibles: ${form.materialsStatus}`,
    form.logoUrl ? `Logo: ${form.logoSource === "generated" ? "generado por IA" : "subido por cliente"}${form.logoLabel ? ` - ${form.logoLabel}` : ""}` : "",
    `Inspiracion/competidores: ${form.inspiration}`,
  ].filter(Boolean).join("\n\n");
}

function buildLogoPhoto(form) {
  if (form.logoStatus === "no" && form.wantsGeneratedLogo === "no") {
    return { clear: true };
  }

  if (!form.logoUrl) return null;

  return {
    photo_type: "logo",
    public_url: form.logoUrl,
    url: form.logoUrl,
    storage_path: form.logoStoragePath || null,
    source: form.logoSource || "upload",
    label: form.logoLabel || "",
  };
}

function buildLeadPayload(form) {
  const logoPhoto = buildLogoPhoto(form);
  return {
    company: form.businessName,
    contactName: form.personalName,
    contactEmail: form.personalEmail,
    contactWhatsapp: form.personalWhatsapp,
    publicEmail: form.publicEmail,
    leadSource: "advanced_intake",
    businessType: form.businessCategory || form.businessModel || "negocio",
    businessPhone: form.publicWhatsapp,
    addressFull: form.publicAddress || form.address,
    city: form.city,
    aboutBusiness: [form.oneLineDescription, form.strategicNotes].filter(Boolean).join("\n\n"),
    hours: form.businessHours ? { horario: form.businessHours } : null,
    extraNotes: buildExtraNotes(form),
    logoPhoto,
    photos: logoPhoto && !logoPhoto.clear ? [logoPhoto] : [],
  };
}

function validateStep(stepIndex, form) {
  const step = intakeSteps[stepIndex];
  if (!step) return "";

  const requiredByStep = {
    basico: [
      ["businessName", "nombre del negocio"],
      ["businessCategory", "giro del negocio"],
    ],
    contacto: [
      ["personalName", "tu nombre"],
      ["personalEmail", "email personal"],
      ["personalWhatsapp", "WhatsApp personal"],
    ],
    estrategia: [
      ["siteGoal", "meta principal del sitio"],
    ],
  };

  const missing = (requiredByStep[step.id] || []).filter(([key]) => !safeText(form[key]));
  if (!missing.length) return "";
  return `Faltan estos campos: ${missing.map((item) => item[1]).join(", ")}.`;
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
      </div>
    </header>
  );
}

function Field({ label, english, required, children, full }) {
  return (
    <label className={`ci-field${full ? " ci-field--full" : ""}`}>
      <span className="ci-label">{label} {required ? <span>*</span> : null}</span>
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

function SelectInput({ form, setForm, path, label, english, children, required, onChange }) {
  function handleChange(event) {
    const nextValue = event.target.value;
    setForm((current) => onChange ? onChange(current, nextValue) : setByPath(current, path, nextValue));
  }

  return (
    <Field label={label} english={english} required={required}>
      <select className="ci-select" value={getByPath(form, path) || ""} onChange={handleChange}>
        {children}
      </select>
    </Field>
  );
}

function CurrentWebsiteFields({ form, setForm }) {
  const hasCurrentWebsite = form.currentWebsite === "yes";

  function updateCurrentWebsite(current, value) {
    const next = setByPath(current, "currentWebsite", value);
    if (value !== "yes") {
      next.websiteUrl = "";
      next.websiteProblems = "";
    }
    return next;
  }

  return (
    <>
      <SelectInput form={form} setForm={setForm} path="currentWebsite" label="Tienes sitio web actualmente?" english="Do you currently have a website?" onChange={updateCurrentWebsite}>
        <option value="no">No</option>
        <option value="yes">Si</option>
      </SelectInput>
      {hasCurrentWebsite ? (
        <>
          <TextInput form={form} setForm={setForm} path="websiteUrl" label="URL del sitio actual" english="Current website URL" placeholder="https://..." />
          <TextArea form={form} setForm={setForm} path="websiteProblems" label="Que no te gusta del sitio actual?" english="What is wrong with the current site?" />
        </>
      ) : null}
    </>
  );
}

function ChoiceGroup({ form, setForm, path, label, english, options, required }) {
  const value = getByPath(form, path) || "";
  return (
    <div className="ci-field ci-field--full">
      <div className="ci-label">{label} {required ? <span>*</span> : null}</div>
      <div className="ci-segment-grid">
        {options.map((option) => (
          <button
            type="button"
            key={option[0]}
            className={`ci-choice${value === option[0] ? " is-selected" : ""}`}
            onClick={() => setForm((current) => setByPath(current, path, option[0]))}
          >
            <strong>{option[1]}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function LogoIntake({ form, setForm }) {
  const fileRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateLogo(values) {
    setForm((current) => ({ ...current, ...values }));
  }

  function chooseLogoStatus(value) {
    setError("");
    if (value === "yes") {
      updateLogo({ logoStatus: "yes", wantsGeneratedLogo: "", logoUrl: "", logoStoragePath: "", logoSource: "", logoLabel: "" });
    } else {
      updateLogo({ logoStatus: "no", wantsGeneratedLogo: "", logoUrl: "", logoStoragePath: "", logoSource: "", logoLabel: "" });
    }
  }

  async function uploadLogo(file) {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const fileType = file.type || (/\.svg$/i.test(file.name || "") ? "image/svg+xml" : "");
      if (!fileType || fileType.indexOf("image/") !== 0) {
        throw new Error("Usa una imagen para el logo.");
      }

      const isSvg = fileType === "image/svg+xml";
      const prepared = isSvg
        ? { blob: file, contentType: fileType }
        : await normalizeImageFile(file);

      const response = await fetch("/api/public-builder/upload-photo?photo_type=logo", {
        method: "POST",
        headers: { "Content-Type": prepared.contentType },
        body: prepared.blob,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo subir el logo.");

      updateLogo({
        logoStatus: "yes",
        wantsGeneratedLogo: "",
        logoUrl: result.public_url,
        logoStoragePath: result.storage_path || "",
        logoSource: "upload",
        logoLabel: file.name || "Logo subido",
      });
      setOptions([]);
    } catch (err) {
      setError(err.message || "No se pudo subir el logo.");
    } finally {
      setLoading(false);
    }
  }

  async function generateLogos() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/public-builder/generate-logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          businessCategory: form.businessCategory || form.businessModel,
          businessDescription: form.oneLineDescription || form.strategicNotes,
          context: summarizeForm(form),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudieron crear los logos.");
      if (!Array.isArray(result.logos) || !result.logos.length) throw new Error("No recibimos opciones de logo.");
      setOptions(result.logos);
      updateLogo({ logoStatus: "no", wantsGeneratedLogo: "yes", logoUrl: "", logoStoragePath: "", logoSource: "", logoLabel: "" });
    } catch (err) {
      setError(err.message || "No se pudieron crear los logos.");
    } finally {
      setLoading(false);
    }
  }

  function pickGeneratedLogo(option) {
    updateLogo({
      logoStatus: "no",
      wantsGeneratedLogo: "yes",
      logoUrl: option.public_url || option.url || "",
      logoStoragePath: option.storage_path || "",
      logoSource: "generated",
      logoLabel: option.label || "Logo generado",
    });
  }

  return (
    <div className="ci-field ci-field--full">
      <div className="ci-label">Tienes logo para tu negocio?</div>
      <div className="ci-segment-grid">
        <button type="button" className={`ci-choice${form.logoStatus === "yes" ? " is-selected" : ""}`} onClick={() => chooseLogoStatus("yes")}>
          <strong>Si, lo puedo subir</strong>
          <span>Agrega una imagen lista de tu marca.</span>
        </button>
        <button type="button" className={`ci-choice${form.logoStatus === "no" ? " is-selected" : ""}`} onClick={() => chooseLogoStatus("no")}>
          <strong>No tengo logo</strong>
          <span>Podemos crear opciones iniciales con IA.</span>
        </button>
      </div>

      {form.logoStatus === "yes" ? (
        <div className="ci-logo-tool">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.svg"
            hidden
            onChange={(event) => {
              uploadLogo(event.target.files && event.target.files[0]);
              event.target.value = "";
            }}
          />
          <button className="ci-btn ci-btn--ghost" type="button" disabled={loading} onClick={() => fileRef.current && fileRef.current.click()}>
            {loading ? <span className="ci-spinner ci-spinner--dark" /> : null}
            Subir logo
          </button>
          {form.logoUrl && form.logoSource === "upload" ? (
            <div className="ci-logo-preview">
              <img src={form.logoUrl} alt="Logo seleccionado" />
              <div>
                <strong>{form.logoLabel || "Logo subido"}</strong>
                <span>Usaremos este logo en la pagina.</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {form.logoStatus === "no" ? (
        <div className="ci-logo-tool">
          <div className="ci-label">Quieres que creemos uno para ti?</div>
          <div className="ci-segment-grid">
            <button
              type="button"
              className={`ci-choice${form.wantsGeneratedLogo === "yes" ? " is-selected" : ""}`}
              onClick={() => {
                updateLogo({ wantsGeneratedLogo: "yes" });
                if (!options.length && !form.logoUrl) generateLogos();
              }}
            >
              <strong>Si, crear 4 opciones</strong>
              <span>Las generamos con IA y eliges tu favorita.</span>
            </button>
            <button
              type="button"
              className={`ci-choice${form.wantsGeneratedLogo === "no" ? " is-selected" : ""}`}
              onClick={() => {
                setOptions([]);
                updateLogo({ wantsGeneratedLogo: "no", logoUrl: "", logoStoragePath: "", logoSource: "", logoLabel: "" });
              }}
            >
              <strong>No, continuar sin logo</strong>
              <span>Podemos usar un logo de texto con el nombre.</span>
            </button>
          </div>

          {form.wantsGeneratedLogo === "yes" ? (
            <>
              <div className="ci-form-actions">
                <button className="ci-btn ci-btn--ghost" type="button" disabled={loading} onClick={generateLogos}>
                  {loading ? <span className="ci-spinner ci-spinner--dark" /> : null}
                  {options.length ? "Crear otras 4 opciones" : "Crear 4 logos"}
                </button>
              </div>
              {options.length ? (
                <div className="ci-logo-options">
                  {options.map((option, index) => {
                    const optionUrl = option.public_url || option.url || "";
                    const selected = form.logoUrl && form.logoUrl === optionUrl;
                    return (
                      <button
                        type="button"
                        className={`ci-logo-option${selected ? " is-selected" : ""}`}
                        key={option.id || optionUrl || index}
                        onClick={() => pickGeneratedLogo(option)}
                      >
                        {optionUrl ? <img src={optionUrl} alt={option.label || `Logo ${index + 1}`} /> : null}
                        <span>{option.label || `Opcion ${index + 1}`}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {error ? <div className="ci-alert ci-alert--error">{error}</div> : null}
    </div>
  );
}

function Section({ id, title, english, children }) {
  return (
    <section className="ci-section" id={id}>
      <div className="ci-section-head">
        <h2>{title}</h2>
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

function Progress({ form, currentStep }) {
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
  const step = intakeSteps[currentStep] || intakeSteps[0];

  return (
    <div className="ci-progress-wrap">
      <div className="ci-progress-row">
        <span className="ci-progress-label">Paso {currentStep + 1} de {intakeSteps.length}: {step.label}</span>
        <span className="ci-progress-meta">{percent}% de datos clave completo</span>
      </div>
      <div className="ci-progress-track">
        <div className="ci-progress-fill" style={{ width: `${Math.round(((currentStep + 1) / intakeSteps.length) * 100)}%` }} />
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
          formData: form,
          formPurpose: "Formulario personalizado para crear una pagina web a la medida, optimizada para marketing, anuncios de Facebook e Instagram, promociones de temporada y soporte humano posterior.",
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
        IA Ayuda
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

    const payload = buildLeadPayload(form);

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
            Para negocios con metas de marketing claras. Te hacemos preguntas a fondo para que nuestra IA construya una pagina hecha a la medida, y despues una persona del equipo trabaja contigo para ajustar todo, lanzar promociones de temporada, optimizar para tus campanas de Facebook e Instagram, y crear contenido para anuncios. Soporte humano mientras seas cliente. Para algo mas rapido, ve al formulario por chat.
          </p>
        </div>
        <div className="ci-hero-panel">
          <strong>Quieres algo mas rapido?</strong>
          <p>Si solo necesitas una pagina simple para recibir mas mensajes por WhatsApp, usa el formulario por chat.</p>
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
              <CurrentWebsiteFields form={form} setForm={setForm} />
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
            <LogoIntake form={form} setForm={setForm} />
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

function IntakePageWizard() {
  const savedSubmissionAtBoot = useMemo(loadSavedSubmission, []);
  const [form, setFormState] = useState(loadSavedForm);
  const [currentStep, setCurrentStep] = useState(loadSavedStep);
  const [businessId, setBusinessId] = useState(() => savedSubmissionAtBoot && savedSubmissionAtBoot.businessId ? savedSubmissionAtBoot.businessId : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState(() => businessId ? "saved" : "local");
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef("");

  const showProducts = form.businessModel === "products" || form.businessModel === "both";
  const showServices = form.businessModel === "services" || form.businessModel === "both";
  const currentStepMeta = intakeSteps[currentStep] || intakeSteps[0];
  const isLastStep = currentStep === intakeSteps.length - 1;

  function setForm(updater) {
    setFormState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (businessId) {
        localStorage.setItem(SUBMISSION_KEY, JSON.stringify({ businessId, form: next }));
      }
      return next;
    });
  }

  function updateStep(nextStep) {
    const bounded = Math.max(0, Math.min(intakeSteps.length - 1, nextStep));
    setCurrentStep(bounded);
    localStorage.setItem(STEP_KEY, String(bounded));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProgress(formToSave = form, showSaving = false, idOverride = businessId) {
    if (!idOverride) return null;
    const payload = { businessId: idOverride, ...buildLeadPayload(formToSave) };
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSavedRef.current && !showSaving) return idOverride;

    if (showSaving) setSaveState("saving");
    try {
      const response = await fetch("/api/public-builder/save-intake-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el avance");
      lastSavedRef.current = snapshot;
      localStorage.setItem(SUBMISSION_KEY, JSON.stringify({ businessId: idOverride, form: formToSave }));
      setSaveState("saved");
      return idOverride;
    } catch (err) {
      setSaveState("error");
      if (showSaving) setError(err.message || "No se pudo guardar el avance");
      return null;
    }
  }

  async function ensureLeadSaved() {
    if (businessId) {
      await saveProgress(form, true, businessId);
      return businessId;
    }

    const firstStepError = validateStep(0, form);
    const contactStepError = validateStep(1, form);
    if (firstStepError || contactStepError) {
      setError(firstStepError || contactStepError);
      return "";
    }

    setSaveState("saving");
    try {
      const response = await fetch("/api/public-builder/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildLeadPayload(form)),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 409) throw new Error(result.error || "No se pudo guardar el formulario");

      const savedBusinessId = result.businessId || (result.business && result.business.id);
      if (!savedBusinessId) throw new Error("No pudimos confirmar el negocio guardado.");
      setBusinessId(savedBusinessId);
      localStorage.setItem(SUBMISSION_KEY, JSON.stringify({ businessId: savedBusinessId, form }));
      setSaveState("saved");
      return savedBusinessId;
    } catch (err) {
      setSaveState("error");
      setError(err.message || "No se pudo guardar el formulario");
      return "";
    }
  }

  React.useEffect(() => {
    if (!businessId) return undefined;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState("pending");
    saveTimerRef.current = setTimeout(() => {
      saveProgress(form, false, businessId);
    }, 1200);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [form, businessId]);

  async function goNext() {
    setError("");
    const stepError = validateStep(currentStep, form);
    if (stepError) {
      setError(stepError);
      return;
    }

    setSubmitting(true);
    try {
      if (currentStep === 1) {
        const savedId = await ensureLeadSaved();
        if (!savedId) return;
      } else if (businessId) {
        await saveProgress(form, true, businessId);
      }
      updateStep(currentStep + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function finishIntake(event) {
    event.preventDefault();
    setError("");

    if (!safeText(form.siteGoal)) {
      setError("Antes de crear el catalogo, necesitamos la meta principal del sitio.");
      updateStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const savedId = businessId || await ensureLeadSaved();
      if (!savedId) return;
      await saveProgress(form, true, savedId);
      window.location.href = `/crear-tu-pagina/catalogo?businessId=${encodeURIComponent(savedId)}`;
    } finally {
      setSubmitting(false);
    }
  }

  function renderStep() {
    if (currentStepMeta.id === "basico") {
      return (
        <Section id="basico" title={currentStepMeta.title} english={currentStepMeta.english}>
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
      );
    }

    if (currentStepMeta.id === "contacto") {
      return (
        <Section id="contacto" title={currentStepMeta.title} english={currentStepMeta.english}>
          <div className="ci-alert">
            Al terminar este paso guardamos tu avance en la base de datos. Si cierras el formulario mas adelante, podremos recuperar lo que ya compartiste.
          </div>
          <div className="ci-grid">
            <TextInput form={form} setForm={setForm} path="personalName" label="Tu nombre" english="Your name" required />
            <TextInput form={form} setForm={setForm} path="personalEmail" label="Email personal para coordinar" english="Personal email for coordination" type="email" required />
            <TextInput form={form} setForm={setForm} path="personalWhatsapp" label="WhatsApp personal para coordinar" english="Personal WhatsApp for coordination" required />
            <TextInput form={form} setForm={setForm} path="publicWhatsapp" label="WhatsApp publico del negocio" english="Public business WhatsApp" />
            <TextInput form={form} setForm={setForm} path="publicEmail" label="Email publico del negocio" english="Public business email" type="email" />
            <TextInput form={form} setForm={setForm} path="publicAddress" label="Direccion publica si quieres mostrarla" english="Public address, if you want to show it" />
            <TextArea form={form} setForm={setForm} path="businessHours" label="Horarios de atencion" english="Business hours" />
          </div>
        </Section>
      );
    }

    if (currentStepMeta.id === "oferta") {
      return (
        <Section id="oferta" title={currentStepMeta.title} english={currentStepMeta.english}>
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
      );
    }

    if (currentStepMeta.id === "estrategia") {
      return (
        <Section id="estrategia" title={currentStepMeta.title} english={currentStepMeta.english}>
          <ChoiceGroup form={form} setForm={setForm} path="marketReach" label="Donde quieres vender con esta pagina?" english="Where do you want this website to sell?" options={marketReachOptions} />
          <TextArea form={form} setForm={setForm} path="targetCustomers" label="Quien es tu cliente ideal?" english="Who is your ideal customer?" large />
          <ChoiceGroup form={form} setForm={setForm} path="siteGoal" label="Cual es el objetivo principal del sitio?" english="What is the main goal of the website?" options={goalOptions} required />
          <ChoiceGroup form={form} setForm={setForm} path="primaryAction" label="Que accion debe tomar un visitante?" english="What action should a visitor take?" options={actionOptions} />
          <TextArea form={form} setForm={setForm} path="customerQuestions" label="Que dudas o miedos tienen tus clientes antes de comprar?" english="What doubts, fears, or questions do customers have before buying?" large />
          <TextArea form={form} setForm={setForm} path="strategicNotes" label="Que debemos saber para vender bien tu negocio?" english="What should we know to market your business well?" large />
          <TextArea form={form} setForm={setForm} path="promotions" label="Promociones, temporadas o campanas importantes" english="Promotions, seasons, or campaigns to highlight" />
        </Section>
      );
    }

    if (currentStepMeta.id === "presencia") {
      return (
        <Section id="presencia" title={currentStepMeta.title} english={currentStepMeta.english}>
          <div className="ci-grid">
            <CurrentWebsiteFields form={form} setForm={setForm} />
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
      );
    }

    return (
      <Section id="materiales" title={currentStepMeta.title} english={currentStepMeta.english}>
        <SelectInput form={form} setForm={setForm} path="materialsStatus" label="Tienes fotos, videos, testimonios, certificaciones o logo?" english="Do you have photos, videos, testimonials, certifications, or a logo?">
          <option value="">Selecciona una opcion</option>
          <option value="ready">Si, ya los tengo listos</option>
          <option value="later">Si, los puedo enviar despues</option>
          <option value="not_yet">No todavia</option>
          <option value="need_help">Necesito ayuda con eso</option>
        </SelectInput>
        <LogoIntake form={form} setForm={setForm} />
        <TextArea form={form} setForm={setForm} path="inspiration" label="Sitios, marcas o competidores que te gusten" english="Websites, brands, or competitors you like" large />
      </Section>
    );
  }

  const saveCopy = {
    local: "Guardado en este navegador",
    pending: "Pendiente de guardar",
    saving: "Guardando...",
    saved: "Guardado en base de datos",
    error: "No se pudo guardar automaticamente",
  }[saveState] || "Guardado en este navegador";

  return (
    <div className="ci-shell">
      <Topbar mode="intake" />
      <header className="ci-header">
        <div>
          <p className="ci-kicker">Formulario estrategico</p>
          <h1 className="ci-title">Crea tu pagina web personalizada</h1>
          <p className="ci-lead">
            Para negocios con metas de marketing claras. Te hacemos preguntas a fondo para que nuestra IA construya una pagina hecha a la medida, y despues una persona del equipo trabaja contigo para ajustar todo, lanzar promociones de temporada, optimizar para tus campanas de Facebook e Instagram, y crear contenido para anuncios. Soporte humano mientras seas cliente. Para algo mas rapido, ve al formulario por chat.
          </p>
        </div>
        <div className="ci-hero-panel">
          <strong>Quieres algo mas rapido?</strong>
          <p>Si solo necesitas una pagina simple para recibir mas mensajes por WhatsApp, usa el formulario por chat.</p>
          <div style={{ marginTop: 14 }}>
            <a className="ci-btn ci-btn--ghost" href="/crear-tu-pagina/chat">Ir al chat simple</a>
          </div>
        </div>
      </header>

      <Progress form={form} currentStep={currentStep} />

      <form className="ci-wizard" onSubmit={finishIntake}>
        <nav className="ci-stepper" aria-label="Pasos del formulario">
          {intakeSteps.map((step, index) => (
            <button
              className={`ci-step-pill${index === currentStep ? " is-current" : ""}${index < currentStep ? " is-done" : ""}`}
              key={step.id}
              type="button"
              disabled={index > currentStep && !businessId}
              onClick={() => {
                if (index <= currentStep || businessId) updateStep(index);
              }}
            >
              <span>{index + 1}</span>
              {step.label}
            </button>
          ))}
        </nav>
        <main className="ci-main">
          {renderStep()}
          {error ? <div className="ci-alert ci-alert--error">{error}</div> : null}
          <div className="ci-wizard-footer">
            <div className={`ci-save-state ci-save-state--${saveState}`}>
              <span />
              {saveCopy}
              {businessId ? <small>ID {businessId}</small> : null}
            </div>
            <div className="ci-form-actions">
              <button className="ci-btn ci-btn--ghost" type="button" disabled={currentStep === 0 || submitting} onClick={() => updateStep(currentStep - 1)}>
                Anterior
              </button>
              <button className="ci-btn ci-btn--ghost" type="button" onClick={() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
                if (businessId) saveProgress(form, true, businessId);
              }}>
                Guardar borrador
              </button>
              {isLastStep ? (
                <button className="ci-btn ci-btn--primary" type="submit" disabled={submitting}>
                  {submitting ? <span className="ci-spinner" /> : null}
                  Continuar al catalogo
                </button>
              ) : (
                <button className="ci-btn ci-btn--primary" type="button" disabled={submitting} onClick={goNext}>
                  {submitting ? <span className="ci-spinner" /> : null}
                  {currentStep === 1 ? "Guardar y continuar" : "Continuar"}
                </button>
              )}
            </div>
          </div>
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

function CatalogCompletionScreen({ mode, error, websiteUrl, onChoosePremium, onChooseAutomatic, onGenerate, onBackToCatalog }) {
  if (mode === "service_choice") {
    return (
      <main className="ci-catalog-layout">
        <section className="ci-section">
          <div className="ci-section-head">
            <h2>Catalogo guardado</h2>
            <p>Ya tenemos la informacion principal de tu negocio y tu catalogo. Ahora puedes elegir si quieres el servicio premium con edicion humana o una primera demo automatica.</p>
          </div>
          <div className="ci-section-body">
            <div className="ci-segment-grid">
              <button className="ci-choice" type="button" onClick={onChoosePremium}>
                <strong>Si, quiero el servicio premium</strong>
                <span>Trabajamos contigo desde el principio para pulir estrategia, texto, diseno y anuncios.</span>
              </button>
              <button className="ci-choice is-selected" type="button" onClick={onChooseAutomatic}>
                <strong>No quiero pagar premium ahora</strong>
                <span>Generamos una primera pagina con IA usando lo que ya compartiste.</span>
              </button>
            </div>
            <div className="ci-form-actions">
              <button className="ci-btn ci-btn--ghost" type="button" onClick={onBackToCatalog}>Volver al catalogo</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (mode === "premium") {
    return (
      <main className="ci-catalog-layout">
        <section className="ci-section">
          <div className="ci-section-head">
            <h2>Listo, vamos con ayuda premium</h2>
            <p>Guardamos tu catalogo. Puedes entrar a tu portal o escribirnos por WhatsApp para coordinar la edicion humana de tu pagina.</p>
          </div>
          <div className="ci-section-body">
            <div className="ci-form-actions">
              <a className="ci-btn ci-btn--primary" href="/mipagina">Ir a mi portal</a>
              <a className="ci-btn ci-btn--ghost" href={`https://wa.me/${SUPPORT_WHATSAPP}`}>Hablar con soporte</a>
              <button className="ci-btn ci-btn--ghost" type="button" onClick={onChooseAutomatic}>Crear demo automatico primero</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (mode === "generating") {
    return (
      <main className="ci-catalog-layout">
        <section className="ci-section">
          <div className="ci-section-head">
            <h2>Estamos creando tu demo</h2>
            <p>La IA esta organizando tus respuestas, catalogo, textos e imagenes en una primera pagina. Esto puede tomar un momento.</p>
          </div>
          <div className="ci-section-body">
            <div className="ci-alert"><span className="ci-spinner ci-spinner--dark" /> Generando tu pagina demo...</div>
          </div>
        </section>
      </main>
    );
  }

  if (mode === "generated") {
    return (
      <main className="ci-catalog-layout">
        <section className="ci-section">
          <div className="ci-section-head">
            <h2>Tu demo esta lista</h2>
            <p>Ya puedes revisar la primera version automatica. Despues trabajaremos contigo para editarla hasta que quede exactamente como quieres.</p>
          </div>
          <div className="ci-section-body">
            <div className="ci-form-actions">
              {websiteUrl ? <a className="ci-btn ci-btn--primary" href={websiteUrl} target="_blank" rel="noopener">Ver mi demo</a> : null}
              <a className="ci-btn ci-btn--ghost" href="/mipagina">Ir a mi portal</a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="ci-catalog-layout">
      <section className="ci-section">
        <div className="ci-section-head">
          <h2>Ya tenemos todo para crear tu demo</h2>
          <p>Tenemos toda la informacion. Creemos tu pagina demo.</p>
        </div>
        <div className="ci-section-body">
          <div className="ci-alert">
            Vamos a crearla automaticamente con tus respuestas y tu catalogo. Despues trabajaremos contigo para editarla hasta que quede exactamente como te gusta.
            <br /><br />
            Recuerda: esta primera version se hace automaticamente, asi que puede no ser la version final que quieres. Un humano puede ajustarla para que quede exactamente como quieres y optimizada para publicidad.
          </div>
          {error ? <div className="ci-alert ci-alert--error">{error}</div> : null}
          <div className="ci-form-actions">
            <button className="ci-btn ci-btn--primary" type="button" onClick={onGenerate}>Crear mi demo automaticamente</button>
            <button className="ci-btn ci-btn--ghost" type="button" onClick={onBackToCatalog}>Volver al catalogo</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function CatalogPage() {
  const savedSubmission = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(SUBMISSION_KEY) || "null");
    } catch {
      return null;
    }
  }, []);
  const premiumIntent = useMemo(readPremiumIntent, []);
  const params = new URLSearchParams(window.location.search);
  const businessId = params.get("businessId") || (savedSubmission && savedSubmission.businessId) || "";
  const businessType = (savedSubmission && savedSubmission.form && savedSubmission.form.businessCategory) || "";
  const inputRef = useRef(null);
  const [currency, setCurrency] = useState("COP");
  const [catalogSource, setCatalogSource] = useState("upload");
  const [files, setFiles] = useState([]);
  const [items, setItems] = useState([]);
  const [premiumProduct, setPremiumProduct] = useState(() => productFromPremiumIntent(premiumIntent));
  const [premiumChoice, setPremiumChoice] = useState(null);
  const [hasExtractedItems, setHasExtractedItems] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [catalogStage, setCatalogStage] = useState("catalog");
  const [demoUrl, setDemoUrl] = useState("");
  const isManualCatalog = catalogSource === "manual";
  const listTitle = isManualCatalog
    ? "2. Agrega tu lista manualmente"
    : hasExtractedItems
      ? "2. Revisa la lista extraida"
      : "2. Revisa o completa tu lista";
  const listDescription = isManualCatalog
    ? "Escribe cada producto o servicio con nombre, descripcion y precio. Puedes agregar tantos items como necesites."
    : hasExtractedItems
      ? "Edita nombres, descripciones y precios. Agrega manualmente cualquier producto o servicio que la IA no haya encontrado."
      : "Cuando subas archivos, aqui aparecera lo que la IA pueda extraer. Tambien puedes agregar productos o servicios manualmente.";
  const emptyListMessage = isManualCatalog
    ? "Agrega el primer producto o servicio manualmente para crear tu catalogo."
    : "Todavia no hay productos o servicios. Sube fotos de tu catalogo o agrega el primer item manualmente.";

  function chooseCatalogSource(value) {
    setCatalogSource(value);
    setError("");
    setSuccess("");
    if (value === "manual" && !items.length) {
      setItems([makeCatalogItem(null, currency)]);
    }
  }

  function moveToCatalogStage(stage) {
    setCatalogStage(stage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  React.useEffect(() => {
    let cancelled = false;
    const formCountry = savedSubmission && savedSubmission.form && savedSubmission.form.country;
    const countryCode = countryToCode(formCountry);
    const url = "/api/products/list" + (countryCode ? `?country=${encodeURIComponent(countryCode)}` : "");

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const products = Array.isArray(data.products) ? data.products.filter((product) => parseFloat(product.price) > 0) : [];
        const byIntent = premiumIntent && premiumIntent.productId
          ? products.find((product) => String(product.id) === String(premiumIntent.productId))
          : null;
        setPremiumProduct(byIntent || products.find(isNegocioPlusProduct) || productFromPremiumIntent(premiumIntent));
      })
      .catch(() => {
        if (!cancelled) setPremiumProduct(productFromPremiumIntent(premiumIntent));
      });

    return () => {
      cancelled = true;
    };
  }, [premiumIntent && premiumIntent.productId, savedSubmission && savedSubmission.form && savedSubmission.form.country]);

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
          setHasExtractedItems(true);
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
          files: isManualCatalog ? [] : files,
          replaceServices: true,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el catalogo");
      setSuccess("");
      if (premiumProduct && premiumProduct.id) {
        setPremiumChoice({ product: premiumProduct, savedItems: result.savedItems || cleanItems.length });
      } else {
        moveToCatalogStage("service_choice");
      }
    } catch (err) {
      setError(err.message || "No se pudo guardar el catalogo");
    } finally {
      setBusy(false);
    }
  }

  function payForPremiumNow() {
    if (!premiumChoice || !premiumChoice.product || !premiumChoice.product.id) return;
    window.location.href = buildPremiumCheckoutUrl(premiumChoice.product, businessId, savedSubmission && savedSubmission.form);
  }

  function createPageBeforePremium() {
    const deferred = {
      businessId,
      productId: premiumChoice && premiumChoice.product && premiumChoice.product.id,
      productName: premiumChoice && premiumChoice.product && premiumChoice.product.name,
      deferredAt: new Date().toISOString(),
    };
    localStorage.setItem(PREMIUM_DEFERRED_KEY, JSON.stringify(deferred));
    localStorage.removeItem(PREMIUM_INTENT_KEY);
    setPremiumChoice(null);
    moveToCatalogStage("demo_ready");
  }

  async function generateDemoPage() {
    setError("");
    setDemoUrl("");
    if (!businessId) {
      setError("No encontramos el negocio. Vuelve al formulario personalizado.");
      return;
    }

    moveToCatalogStage("generating");
    try {
      const response = await fetch("/api/public-builder/generate-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo generar la demo");

      const nextUrl = result.publishedUrl || result.previewUrl || (result.websiteId ? `/ver/${result.websiteId}` : "");
      setDemoUrl(nextUrl);
      moveToCatalogStage("generated");
    } catch (err) {
      setError(err.message || "No se pudo generar la demo. Puedes intentarlo otra vez o hablar con soporte.");
      moveToCatalogStage("demo_ready");
    }
  }

  return (
    <div className="ci-shell">
      <Topbar mode="catalog" />
      <header className="ci-header">
        <div>
          <p className="ci-kicker">Paso final antes de crear la pagina</p>
          <h1 className="ci-title">Carga tu catalogo real</h1>
          <p className="ci-lead">
            Si tienes fotos de menu, listas de precios, productos, servicios o PDF, puedes subirlas para que la IA extraiga los datos. Si no, escribe tu catalogo manualmente.
          </p>
        </div>
        <div className="ci-hero-panel">
          <strong>Dos formas de cargarlo</strong>
          <p>Con archivo, las fotos se optimizan antes de subir. El limite final es 4MB por imagen y 10MB por PDF.</p>
        </div>
      </header>

      {catalogStage !== "catalog" ? (
        <CatalogCompletionScreen
          mode={catalogStage}
          error={error}
          websiteUrl={demoUrl}
          onChoosePremium={() => moveToCatalogStage("premium")}
          onChooseAutomatic={() => moveToCatalogStage("demo_ready")}
          onGenerate={generateDemoPage}
          onBackToCatalog={() => {
            setError("");
            setSuccess("");
            moveToCatalogStage("catalog");
          }}
        />
      ) : (
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
            <h2>1. Elige como cargar tu catalogo</h2>
            <p>Si tienes fotos o PDF, la IA intentara extraer la lista. Si no, puedes pasar directo a escribir los productos o servicios manualmente.</p>
          </div>
          <div className="ci-section-body">
            <div className="ci-field ci-field--full">
              <div className="ci-label">Tienes una foto, menu o PDF del catalogo para subir?</div>
              <div className="ci-segment-grid">
                <button
                  className={`ci-choice${catalogSource === "upload" ? " is-selected" : ""}`}
                  type="button"
                  onClick={() => chooseCatalogSource("upload")}
                >
                  <strong>Si, quiero subir archivo</strong>
                </button>
                <button
                  className={`ci-choice${catalogSource === "manual" ? " is-selected" : ""}`}
                  type="button"
                  onClick={() => chooseCatalogSource("manual")}
                >
                  <strong>No, lo escribire manualmente</strong>
                </button>
              </div>
            </div>
            <div className="ci-grid">
              <SelectInput form={{ currency }} setForm={(updater) => {
                const next = typeof updater === "function" ? updater({ currency }) : updater;
                setCurrency(next.currency || "COP");
              }} path="currency" label="Moneda principal" english="Primary currency">
                {currencies.map((option) => <option key={option} value={option}>{option}</option>)}
              </SelectInput>
            </div>
            {!isManualCatalog ? (
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
            ) : null}
            {busy ? <div className="ci-alert">Procesando archivos. Esto puede tomar un momento.</div> : null}
            {error ? <div className="ci-alert ci-alert--error">{error}</div> : null}
            {!isManualCatalog && files.length ? (
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
            <h2>{listTitle}</h2>
            <p>{listDescription}</p>
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
                {emptyListMessage}
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
      )}

      {premiumChoice ? (
        <div className="ci-modal-backdrop" role="presentation" onClick={createPageBeforePremium}>
          <div className="ci-upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="premium-choice-title" onClick={(event) => event.stopPropagation()}>
            <button className="ci-modal-close" type="button" aria-label="Cerrar" onClick={createPageBeforePremium}>X</button>
            <p className="ci-upgrade-kicker">Pagina Negocio+</p>
            <h2 id="premium-choice-title">Quieres activar las funciones premium ahora?</h2>
            <p>
              Ya guardamos tu catalogo. Si quieres que agreguemos citas, pagos en linea, reservas automaticas y herramientas de crecimiento, activa el plan premium antes de que lo implementemos en tu pagina.
            </p>
            <div className="ci-upgrade-price">
              <span>{premiumChoice.product.name || "Pagina Negocio+"}</span>
              <strong>{formatProductPrice(premiumChoice.product) || "Plan premium"}</strong>
            </div>
            <div className="ci-upgrade-actions">
              <button className="ci-btn ci-btn--primary" type="button" onClick={payForPremiumNow}>
                Pagar premium ahora
              </button>
              <button className="ci-btn ci-btn--ghost" type="button" onClick={createPageBeforePremium}>
                Crear mi pagina primero
              </button>
            </div>
            <p className="ci-upgrade-footnote">
              Si creas la pagina primero, no te cobraremos Pagina Negocio+ hasta que decidas actualizar.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const isCatalog = window.location.pathname.indexOf("/catalogo") !== -1;
  return isCatalog ? <CatalogPage /> : <IntakePageWizard />;
}

const root = document.getElementById("complex-intake-root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
