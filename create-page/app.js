const { useState, useEffect, useRef } = React;

const C = {
  green: "#21C55E",
  greenDk: "#16A34A",
  greenBg: "rgba(33,197,94,.08)",
  navy: "#0E172A",
  slate: "#1E293B",
  blue: "#2563EB",
  blueLt: "#DBEAFE",
  waBg: "#0B141A",
  waHeader: "#1F2C34",
  waBubIn: "#1F2C34",
  waBubOut: "#005C4B",
  waText: "#E9EDEF",
  waSub: "#8696A0",
  waTick: "#53BDEB",
  waTime: "#8696A0",
  red: "#EF4444",
};

const SUPPORT_WHATSAPP = "529991095806";

const ts = () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function looksLikeNo(value) {
  return /^(no|ninguno|ninguna|n\/a|na)\b/i.test(String(value || "").trim());
}

function firstName(value) {
  return String(value || "").trim().split(/\s+/)[0] || "";
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function svgTextToBlob(svgText) {
  return new Blob([svgText], { type: "image/svg+xml" });
}

async function uploadPhotoAsset(source, photoType) {
  if (!source) return null;

  let blob = null;

  if (typeof source === "string" && source.startsWith("data:")) {
    blob = await dataUrlToBlob(source);
  } else if (typeof source === "string" && source.trim().startsWith("<svg")) {
    blob = svgTextToBlob(source);
  } else {
    return null;
  }

  const response = await fetch(`/api/public-builder/upload-photo?photo_type=${encodeURIComponent(photoType)}`, {
    method: "POST",
    headers: {
      "Content-Type": blob.type || "image/jpeg",
    },
    body: blob,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "No se pudo subir la imagen");
  }
  return result;
}

async function uploadCollectedAssets(data) {
  const tasks = [];
  const extraPhotos = Array.isArray(data.fotos_extra) ? data.fotos_extra : [];

  extraPhotos.forEach((photo) => {
    tasks.push(uploadPhotoAsset(photo, "product"));
  });

  if (data.logo) {
    tasks.push(uploadPhotoAsset(data.logo, "logo"));
  }

  if (!tasks.length) return [];

  const settled = await Promise.allSettled(tasks);
  const successful = settled
    .filter((entry) => entry.status === "fulfilled" && entry.value)
    .map((entry) => entry.value);

  settled
    .filter((entry) => entry.status === "rejected")
    .forEach((entry) => {
      console.warn("Asset upload failed:", entry.reason && entry.reason.message ? entry.reason.message : entry.reason);
    });

  return successful;
}

let GKEY = null;

async function fetchApiKey() {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    GKEY = data.googleApiKey || null;
  } catch (error) {
    console.warn("Could not fetch API key:", error);
  }
}

fetchApiKey();

async function lookup(name, city) {
  if (!GKEY) await fetchApiKey();
  if (!GKEY) return null;

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GKEY,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.shortFormattedAddress",
          "places.internationalPhoneNumber",
          "places.rating",
          "places.userRatingCount",
          "places.regularOpeningHours",
          "places.primaryTypeDisplayName",
          "places.editorialSummary",
          "places.addressComponents",
          "places.photos",
        ].join(","),
      },
      body: JSON.stringify({ textQuery: `${name} ${city}`, languageCode: "es", maxResultCount: 5 }),
    });
    const data = await res.json();
    if (!data.places || !data.places.length) return null;

    return data.places.map((place) => {
      let horario = "";
      if (place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions && place.regularOpeningHours.weekdayDescriptions.length) {
        horario = place.regularOpeningHours.weekdayDescriptions.slice(0, 3).join("\n");
      }

      const cityComp = (place.addressComponents || []).find((component) => (
        component.types && (
          component.types.includes("locality") ||
          component.types.includes("administrative_area_level_2")
        )
      ));

      return {
        nombre: (place.displayName && place.displayName.text) || name,
        tipo: (place.primaryTypeDisplayName && place.primaryTypeDisplayName.text) || "Negocio local",
        ciudad: cityComp ? cityComp.longText : city,
        direccion: place.formattedAddress || "",
        shortAddress: place.shortFormattedAddress || place.formattedAddress || "",
        telefono: place.internationalPhoneNumber || "",
        horario,
        calificacion: place.rating ? String(place.rating) : "",
        resenas: place.userRatingCount || 0,
        sobre: (place.editorialSummary && place.editorialSummary.text) || "",
        place_id: place.id,
        photos: (place.photos || []).slice(0, 10).map((photo) => photo.name),
      };
    });
  } catch (error) {
    console.error("Places API error:", error);
    return null;
  }
}

function LocationPicker({ results, onConfirm, onNone }) {
  const [selected, setSelected] = useState(() => new Set());

  function toggle(index) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const count = selected.size;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13, color: C.waSub, marginBottom: 2, lineHeight: 1.4 }}>
        Encontré {results.length} ubicaciones con ese nombre.
        <br />
        <span style={{ color: C.waText }}>Toca todas las que sean tuyas</span>
      </div>

      {results.map((result, index) => {
        const checked = selected.has(index);
        return (
          <div
            key={result.place_id || index}
            onClick={() => toggle(index)}
            style={{
              background: checked ? "rgba(33,197,94,.10)" : "rgba(255,255,255,.05)",
              border: `1.5px solid ${checked ? C.green : "rgba(255,255,255,.1)"}`,
              borderRadius: 10,
              padding: "10px 12px",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              transition: "all .15s ease",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                flexShrink: 0,
                marginTop: 1,
                background: checked ? C.green : "transparent",
                border: `2px solid ${checked ? C.green : "rgba(255,255,255,.3)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all .15s ease",
              }}
            >
              {checked ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6.5L5 9.5L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.waText }}>{result.nombre}</div>
              <div style={{ fontSize: 12, color: C.waSub, marginTop: 3, lineHeight: 1.4 }}>
                {result.shortAddress || result.direccion}
              </div>
              {result.calificacion ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                  <span style={{ color: "#FCD34D", fontSize: 12 }}>★</span>
                  <span style={{ fontSize: 12, color: C.waText }}>{result.calificacion}</span>
                  <span style={{ fontSize: 11, color: C.waSub }}>({result.resenas} reseñas)</span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => {
          if (!count) return;
          const picked = [...selected].sort((a, b) => a - b).map((index) => results[index]);
          onConfirm(picked);
        }}
        disabled={count === 0}
        style={{
          padding: "12px",
          background: count > 0 ? C.green : "rgba(255,255,255,.06)",
          border: "none",
          borderRadius: 10,
          color: count > 0 ? "#fff" : C.waSub,
          fontSize: 14,
          fontWeight: 600,
          cursor: count > 0 ? "pointer" : "not-allowed",
          fontFamily: "DM Sans,sans-serif",
          marginTop: 4,
          transition: "all .15s ease",
        }}
      >
        {count === 0 ? "Selecciona tus ubicaciones" : count === 1 ? "Confirmar 1 ubicación" : `Confirmar ${count} ubicaciones`}
      </button>

      <button
        onClick={onNone}
        style={{
          background: "transparent",
          border: "1px dashed rgba(255,255,255,.15)",
          borderRadius: 10,
          padding: "9px 12px",
          cursor: "pointer",
          textAlign: "center",
          color: C.waSub,
          fontSize: 13,
          fontFamily: "DM Sans,sans-serif",
        }}
      >
        Ninguna es la mía
      </button>
    </div>
  );
}

function UploadCard({ label, accept, multiple, hint, icon, onDone, skipLabel, maxFiles = 20 }) {
  const [previews, setPreviews] = useState([]);
  const inputRef = useRef(null);

  function readAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(fileList) {
    const array = [...fileList];
    const room = maxFiles - previews.length;
    const accepted = array.slice(0, Math.max(0, room));
    const newPreviews = await Promise.all(accepted.map(readAsDataURL));
    setPreviews((prev) => [...prev, ...newPreviews]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index) {
    setPreviews((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  const atCap = previews.length >= maxFiles;
  const remaining = maxFiles - previews.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {previews.length > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {previews.map((source, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  borderRadius: 8,
                  overflow: "hidden",
                  aspectRatio: "1",
                  background: "rgba(255,255,255,.05)",
                }}
              >
                <img src={source} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {multiple && maxFiles > 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      background: "rgba(0,0,0,.65)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {index + 1}
                  </div>
                ) : null}
                <button
                  onClick={() => removeAt(index)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,.65)",
                    border: "none",
                    color: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "DM Sans,sans-serif",
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            {multiple && !atCap ? (
              <div
                onClick={() => inputRef.current && inputRef.current.click()}
                style={{
                  borderRadius: 8,
                  aspectRatio: "1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  gap: 2,
                  background: "rgba(33,197,94,.06)",
                  border: "1.5px dashed rgba(33,197,94,.4)",
                  transition: "all .15s",
                }}
              >
                <div style={{ fontSize: 24, color: C.green, lineHeight: 1 }}>+</div>
                <div style={{ fontSize: 10, color: C.green, fontWeight: 500 }}>Agregar</div>
              </div>
            ) : null}
          </div>

          {multiple && maxFiles > 1 ? (
            <div style={{ fontSize: 11, color: C.waSub, textAlign: "center" }}>
              {previews.length} de {maxFiles} {atCap ? "- máximo alcanzado" : `- puedes agregar ${remaining} más`}
            </div>
          ) : null}
        </>
      ) : (
        <div
          onClick={() => inputRef.current && inputRef.current.click()}
          style={{
            background: "rgba(255,255,255,.04)",
            border: "2px dashed rgba(255,255,255,.15)",
            borderRadius: 12,
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all .15s",
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
        onChange={(event) => handleFiles(event.target.files)}
        style={{ display: "none" }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        {previews.length > 0 ? (
          <>
            <button
              onClick={() => onDone(previews)}
              style={{
                flex: 1,
                padding: "10px",
                background: C.green,
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
              }}
            >
              Listo - {previews.length} foto{previews.length !== 1 ? "s" : ""}
            </button>
            <button
              onClick={() => setPreviews([])}
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,.06)",
                border: "none",
                borderRadius: 10,
                color: C.waSub,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
              }}
            >
              ×
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => inputRef.current && inputRef.current.click()}
              style={{
                flex: 1,
                padding: "10px",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 10,
                color: C.waText,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
              }}
            >
              Elegir archivo{multiple ? "s" : ""}
            </button>
            {skipLabel ? (
              <button
                onClick={() => onDone([])}
                style={{
                  padding: "10px 12px",
                  background: "rgba(255,255,255,.06)",
                  border: "none",
                  borderRadius: 10,
                  color: C.waSub,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "DM Sans,sans-serif",
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

function LogoChoiceCard({ bizName, bizType, onUpload, onPick, onSkip }) {
  const [mode, setMode] = useState("choose");
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState([]);
  const [picked, setPicked] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    const preview = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.readAsDataURL(file);
    });
    setUploadPreview(preview);
    setMode("uploaded");
  }

  function generate() {
    setGenerating(true);
    const name = bizName || "Tu negocio";
    const initials = name
      .split(/\s+/)
      .map((piece) => piece.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "N";
    const palette = [
      { bg: "#F7F7ED", fg: "#0E172A", accent: "#21C55E" },
      { bg: "#10253D", fg: "#F8FBFF", accent: "#7DD3FC" },
      { bg: "#FFF7E5", fg: "#40210F", accent: "#F6C65B" },
      { bg: "#EFF6FF", fg: "#123047", accent: "#2563EB" },
    ];

    const nextOptions = [
      {
        label: "Monograma circular",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="${palette[0].bg}" stroke="${palette[0].accent}" stroke-width="4"/><text x="100" y="118" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="68" fill="${palette[0].fg}">${initials}</text></svg>`,
      },
      {
        label: "Bloque sólido",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="8" y="8" width="184" height="184" rx="32" fill="${palette[1].bg}"/><text x="100" y="120" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="800" font-size="76" fill="${palette[1].fg}">${initials}</text></svg>`,
      },
      {
        label: "Minimalista",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${palette[2].bg}"/><text x="100" y="105" text-anchor="middle" font-family="Georgia, serif" font-weight="400" font-size="72" fill="${palette[2].fg}">${initials}</text><line x1="60" y1="130" x2="140" y2="130" stroke="${palette[2].accent}" stroke-width="3"/><text x="100" y="158" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="500" font-size="13" fill="${palette[2].fg}" letter-spacing="3">${name.slice(0, 16).toUpperCase()}</text></svg>`,
      },
      {
        label: "Insignia",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="20" fill="${palette[3].bg}"/><circle cx="100" cy="80" r="38" fill="none" stroke="${palette[3].accent}" stroke-width="3"/><text x="100" y="92" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="34" fill="${palette[3].fg}">${initials}</text><text x="100" y="148" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="600" font-size="14" fill="${palette[3].fg}" letter-spacing="2">${name.slice(0, 18).toUpperCase()}</text><text x="100" y="170" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="9" fill="${palette[3].accent}" letter-spacing="3">${(bizType || "").slice(0, 20).toUpperCase()}</text></svg>`,
      },
    ];

    setTimeout(() => {
      setOptions(nextOptions);
      setGenerating(false);
      setMode("generated");
    }, 800);
  }

  if (mode === "choose") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input ref={fileRef} type="file" accept="image/*,.svg" onChange={(event) => handleFile(event.target.files[0])} style={{ display: "none" }} />

        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          style={{
            padding: "12px 14px",
            background: "rgba(33,197,94,.08)",
            border: `1.5px solid ${C.green}`,
            borderRadius: 12,
            color: C.green,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "DM Sans,sans-serif",
            textAlign: "left",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 18 }}>🖼️</span>
          <div>
            <div>Subir mi logo</div>
            <div style={{ fontSize: 11, color: C.waSub, fontWeight: 400, marginTop: 2 }}>Tengo una imagen lista</div>
          </div>
        </button>

        <button
          onClick={generate}
          disabled={generating}
          style={{
            padding: "12px 14px",
            background: "rgba(14,165,233,.08)",
            border: `1.5px solid ${C.blue}`,
            borderRadius: 12,
            color: C.blue,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "DM Sans,sans-serif",
            textAlign: "left",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 18 }}>{generating ? "…" : "✨"}</span>
          <div>
            <div>{generating ? "Creando opciones…" : "Crear 4 opciones para mí"}</div>
            <div style={{ fontSize: 11, color: C.waSub, fontWeight: 400, marginTop: 2 }}>Eliges la que más te guste</div>
          </div>
        </button>

        <button
          onClick={onSkip}
          style={{
            padding: "9px",
            background: "transparent",
            border: "none",
            color: C.waSub,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "DM Sans,sans-serif",
          }}
        >
          No tengo, continuar sin logo
        </button>
      </div>
    );
  }

  if (mode === "uploaded") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 12, padding: 16, display: "flex", justifyContent: "center" }}>
          <img src={uploadPreview} alt="logo" style={{ maxWidth: 140, maxHeight: 140, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onUpload(uploadPreview)}
            style={{
              flex: 1,
              padding: "10px",
              background: C.green,
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "DM Sans,sans-serif",
            }}
          >
            Usar este logo
          </button>
          <button
            onClick={() => {
              setUploadPreview(null);
              setMode("choose");
            }}
            style={{
              padding: "10px 12px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,.15)",
              borderRadius: 10,
              color: C.waSub,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "DM Sans,sans-serif",
            }}
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: C.waSub }}>Toca el que más te guste:</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {options.map((option, index) => {
          const isPicked = picked === index;
          return (
            <div
              key={index}
              onClick={() => setPicked(index)}
              style={{
                borderRadius: 12,
                padding: 8,
                cursor: "pointer",
                border: `2px solid ${isPicked ? C.green : "rgba(255,255,255,.1)"}`,
                background: isPicked ? "rgba(33,197,94,.06)" : "rgba(255,255,255,.03)",
                transition: "all .15s",
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: option.svg }} />
              <div style={{ fontSize: 10, color: isPicked ? C.green : C.waSub, fontWeight: 500, textAlign: "center" }}>{option.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => picked !== null && onPick(options[picked])}
          disabled={picked === null}
          style={{
            flex: 1,
            padding: "10px",
            background: picked === null ? "rgba(255,255,255,.06)" : C.green,
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: picked === null ? "not-allowed" : "pointer",
            fontFamily: "DM Sans,sans-serif",
            opacity: picked === null ? 0.5 : 1,
          }}
        >
          Usar este logo
        </button>
        <button
          onClick={() => {
            setPicked(null);
            setMode("choose");
          }}
          style={{
            padding: "10px 12px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 10,
            color: C.waSub,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "DM Sans,sans-serif",
          }}
        >
          Volver
        </button>
      </div>
    </div>
  );
}

function PhotoApproval({ photoNames, apiKey, onDone }) {
  const [selected, setSelected] = useState(() => new Set(photoNames.map((_, index) => index)));
  const [loaded, setLoaded] = useState({});

  function photoUrl(name) {
    return `https://places.googleapis.com/v1/${name}/media?maxWidthPx=400&key=${apiKey}`;
  }

  function toggle(index) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const approvedCount = selected.size;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, color: C.waSub, marginBottom: 2 }}>
        {photoNames.length} fotos encontradas en Google. Desmarca las que no quieras en tu página.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {photoNames.map((name, index) => {
          const checked = selected.has(index);
          return (
            <div
              key={index}
              onClick={() => toggle(index)}
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                cursor: "pointer",
                border: `2px solid ${checked ? C.green : "rgba(255,255,255,.1)"}`,
                transition: "border-color .15s",
                aspectRatio: "4/3",
              }}
            >
              {!loaded[index] ? (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.green}`, borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />
                </div>
              ) : null}
              <img
                src={photoUrl(name)}
                alt={`Foto ${index + 1}`}
                onLoad={() => setLoaded((current) => ({ ...current, [index]: true }))}
                onError={() => setLoaded((current) => ({ ...current, [index]: "error" }))}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  opacity: loaded[index] ? (checked ? 1 : 0.35) : 0,
                  transition: "opacity .2s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: checked ? C.green : "rgba(0,0,0,.5)",
                  border: `2px solid ${checked ? C.green : "rgba(255,255,255,.3)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all .15s",
                }}
              >
                {checked ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </div>
              {!checked ? (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 24, color: "rgba(255,255,255,.5)" }}>×</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onDone(photoNames.filter((_, index) => selected.has(index)))}
        style={{
          padding: "11px",
          background: C.green,
          border: "none",
          borderRadius: 10,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          marginTop: 4,
          boxShadow: "0 3px 12px rgba(33,197,94,.3)",
        }}
      >
        Confirmar {approvedCount} foto{approvedCount !== 1 ? "s" : ""}
      </button>
    </div>
  );
}

const VFIELDS = [
  { key: "nombre", label: "Nombre del negocio" },
  { key: "tipo", label: "Tipo de negocio" },
  { key: "direccion", label: "Dirección completa" },
  { key: "telefono", label: "Teléfono" },
  { key: "horario", label: "Horario de atención" },
  { key: "sobre", label: "Descripción del negocio" },
];

const EMPTY_FIELD_PROMPTS = {
  nombre: "¿Cómo se llama tu negocio?",
  tipo: "Cuéntame, ¿a qué se dedica tu negocio?\n_Por ejemplo: restaurante, salón de belleza, taller…_",
  direccion: "¿Cuál es la dirección donde te visitan tus clientes?",
  telefono: "¿Cuál es el número al que te pueden llamar?",
  horario: "¿Qué días y horas atiendes?\n_Ej: lunes a sábado, 9am-7pm_",
  sobre: "Cuéntame sobre tu negocio como si me lo contaras a un amigo.\n\n¿Qué es lo que más le gusta a la gente de venir? ¿Qué te hace diferente?\n\n_No te preocupes por escribir bonito: yo lo organizo después._",
};

function VerifyCard({ label, value, onOk, onSave }) {
  const [edit, setEdit] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  return (
    <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ fontSize: 11, color: C.waSub, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{label}</div>
        {edit ? (
          <textarea
            value={currentValue}
            onChange={(event) => setCurrentValue(event.target.value)}
            rows={3}
            style={{
              width: "100%",
              background: "rgba(255,255,255,.07)",
              border: "none",
              borderRadius: 8,
              padding: "8px 10px",
              color: C.waText,
              fontSize: 14,
              fontFamily: "DM Sans,sans-serif",
              resize: "none",
              outline: "none",
            }}
          />
        ) : (
          <div style={{ fontSize: 14, color: C.waText, lineHeight: 1.5 }}>{currentValue}</div>
        )}
      </div>
      <div style={{ display: "flex" }}>
        {edit ? (
          <button
            onClick={() => {
              setEdit(false);
              onSave(currentValue);
            }}
            style={{
              flex: 1,
              padding: "10px",
              background: C.green,
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "DM Sans,sans-serif",
            }}
          >
            Guardar
          </button>
        ) : (
          <>
            <button
              onClick={() => onOk(currentValue)}
              style={{
                flex: 1,
                padding: "10px",
                background: "transparent",
                border: "none",
                borderRight: "1px solid rgba(255,255,255,.06)",
                color: C.green,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
              }}
            >
              Correcto
            </button>
            <button
              onClick={() => setEdit(true)}
              style={{
                flex: 1,
                padding: "10px",
                background: "transparent",
                border: "none",
                color: C.waSub,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
              }}
            >
              Editar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Ticks({ read }) {
  const color = read ? C.waTick : C.waSub;
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" style={{ display: "inline-block", marginLeft: 3 }}>
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
        borderRadius: "50%",
        flexShrink: 0,
        background: `linear-gradient(135deg,${C.blue},${C.green})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
    <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: C.waBubIn, borderRadius: "0 10px 10px 10px", width: 56, alignItems: "center" }}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: C.waSub,
            display: "block",
            animation: `dot 1.2s ease ${index * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Bubble({ msg }) {
  const bot = msg.from === "bot";
  const background = bot ? C.waBubIn : C.waBubOut;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: bot ? "row" : "row-reverse",
        alignItems: "flex-end",
        gap: 6,
        marginBottom: 3,
        paddingLeft: bot ? 0 : 44,
        paddingRight: bot ? 44 : 0,
        animation: "fadeUp .25s ease",
      }}
    >
      {bot ? <Avatar /> : null}
      <div
        style={{
          maxWidth: "78%",
          background,
          borderRadius: bot ? "0 10px 10px 10px" : "10px 0 10px 10px",
          padding: "8px 12px 5px",
          color: C.waText,
          fontSize: 14.5,
          lineHeight: 1.5,
          boxShadow: "0 1px 3px rgba(0,0,0,.35)",
        }}
      >
        {msg.text ? (
          <div
            style={{ whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{
              __html: msg.text
                .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                .replace(/_(.*?)_/g, '<em style="color:#a0b4c8">$1</em>'),
            }}
          />
        ) : null}
        {msg.rich ? <div>{msg.rich}</div> : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, marginTop: 4 }}>
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
      <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", border: `3px solid ${C.green}`, borderTopColor: "transparent", animation: "spin .8s linear infinite", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, color: C.waText, fontWeight: 500 }}>Buscando en Google Maps…</div>
            <div style={{ fontSize: 12, color: C.waSub, marginTop: 1 }}>Verificando tu negocio</div>
          </div>
        </div>
      </div>
    );
  }

  if (!found) {
    return (
      <div style={{ background: "rgba(239,68,68,.08)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(239,68,68,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔍</div>
          <div>
            <div style={{ fontSize: 13, color: C.waText, fontWeight: 500 }}>No encontramos tu negocio</div>
            <div style={{ fontSize: 12, color: C.waSub, marginTop: 1 }}>Te guiaré paso a paso</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.greenBg, borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(33,197,94,.25)", animation: "pop .35s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block", animation: "glow 1.5s infinite" }} />
        <span style={{ fontSize: 11, color: C.green, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>
          {count > 1 ? `${count} ubicaciones encontradas` : "Negocio encontrado"}
        </span>
      </div>
      <div style={{ fontSize: 14, color: C.waText, fontWeight: 600 }}>{biz.nombre}</div>
      <div style={{ fontSize: 12, color: C.waSub, marginTop: 2 }}>{biz.tipo} - {biz.ciudad}</div>
      {biz.calificacion ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          <span style={{ color: "#FCD34D", fontSize: 13 }}>★</span>
          <span style={{ fontSize: 13, color: C.waText }}>{biz.calificacion}</span>
          <span style={{ fontSize: 12, color: C.waSub }}>({biz.resenas} reseñas en Google)</span>
        </div>
      ) : null}
    </div>
  );
}

const CHECKLIST = [
  { key: "nombre", label: "Nombre del negocio" },
  { key: "tipo", label: "Tipo de negocio" },
  { key: "direccion", label: "Dirección" },
  { key: "telefono", label: "Teléfono del negocio" },
  { key: "horario", label: "Horario" },
  { key: "sobre", label: "Descripción" },
  { key: "whatsapp", label: "WhatsApp del negocio" },
  { key: "contacto_nombre", label: "Tu nombre" },
  { key: "contacto_whatsapp", label: "Tu WhatsApp" },
  { key: "email", label: "Tu correo" },
  { key: "slogan", label: "Slogan" },
  { key: "redes", label: "Redes sociales" },
];

function ProgressBar({ data }) {
  const done = CHECKLIST.filter((field) => data[field.key]);
  const pct = Math.round(done.length / CHECKLIST.length * 100);
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: "rgba(0,0,0,.3)", borderBottom: "1px solid rgba(255,255,255,.05)", flexShrink: 0 }}>
      <div onClick={() => setExpanded((current) => !current)} style={{ padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.1)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.green, transition: "width .5s ease", borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 11, color: pct === 100 ? C.green : C.waSub, whiteSpace: "nowrap", fontWeight: pct === 100 ? 600 : 400 }}>
          {pct === 100 ? "Completo" : `${done.length}/${CHECKLIST.length}`}
        </span>
        <span style={{ fontSize: 10, color: C.waSub, display: "inline-block", transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </div>
      {expanded ? (
        <div style={{ padding: "2px 14px 10px", display: "flex", flexWrap: "wrap", gap: "5px 12px" }}>
          {CHECKLIST.map((field) => {
            const checked = !!data[field.key];
            return (
              <div key={field.key} style={{ display: "flex", alignItems: "center", gap: 5, opacity: checked ? 1 : 0.38 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: checked ? C.green : "transparent",
                    border: checked ? "none" : `1.5px solid ${C.waSub}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all .2s",
                  }}
                >
                  {checked ? (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
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

function ChatBuilderApp() {
  const [msgs, setMsgs] = useState([{ id: 1, from: "bot", text: "Hola! 👋 Soy tu asistente de diseño de *AhoraTengoPagina*.", time: ts() }]);
  const [typing, setTyping] = useState(true);
  const [inputVal, setInputVal] = useState("");
  const [inputOff, setInputOff] = useState(false);
  const [collected, setCollected] = useState({});
  const [searchDone, setSearchDone] = useState(false);
  const [searchFound, setSearchFound] = useState(false);
  const [searchBiz, setSearchBiz] = useState(null);
  const [searchCount, setSearchCount] = useState(0);
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const stepRef = useRef("init");
  const collRef = useRef({});
  const verifyIdx = useRef(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const [vh, setVh] = useState(() => (typeof window !== "undefined" && window.visualViewport && window.visualViewport.height) || (typeof window !== "undefined" ? window.innerHeight : 800));
  const [vw, setVw] = useState(() => (typeof window !== "undefined" && window.visualViewport && window.visualViewport.width) || (typeof window !== "undefined" ? window.innerWidth : 420));

  function scrollBottom() {
    if (!bottomRef.current) return;
    const scroller = bottomRef.current.parentElement;
    if (scroller) scroller.scrollTop = scroller.scrollHeight + 9999;
  }

  useEffect(scrollBottom, [msgs, typing, showSearchCard]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const viewport = window.visualViewport;

    function update() {
      setVh(viewport ? viewport.height : window.innerHeight);
      setVw(viewport ? viewport.width : window.innerWidth);
      requestAnimationFrame(scrollBottom);
    }

    update();
    if (viewport) {
      viewport.addEventListener("resize", update);
      viewport.addEventListener("scroll", update);
    }
    window.addEventListener("resize", update);

    return () => {
      if (viewport) {
        viewport.removeEventListener("resize", update);
        viewport.removeEventListener("scroll", update);
      }
      window.removeEventListener("resize", update);
    };
  }, []);

  const isMobile = vw < 600;
  const chatHeight = isMobile ? Math.min(720, Math.max(600, vh * 0.72)) : 760;
  const outerStyle = { width: "100%", height: "100%" };
  const frameStyle = {
    width: "100%",
    height: `${chatHeight}px`,
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 32px 80px rgba(0,0,0,.45)",
    border: "1px solid rgba(255,255,255,.06)",
    background: C.navy,
  };

  function pushMsg(message) {
    setMsgs((prev) => [...prev, { id: Date.now() + Math.random(), ...message }]);
  }

  function botSay(text, extra = {}) {
    return new Promise((resolve) => {
      setTyping(true);
      const delay = Math.min(600 + String(text || "").length * 16, 2000);
      setTimeout(() => {
        setTyping(false);
        pushMsg({ from: "bot", text, time: ts(), ...extra });
        setTimeout(resolve, 80);
      }, delay);
    });
  }

  function userSay(text) {
    const message = { id: Date.now() + Math.random(), from: "user", text, time: ts(), read: false };
    setMsgs((prev) => [...prev, message]);
    setTimeout(() => {
      setMsgs((prev) => prev.map((entry) => (entry.id === message.id ? { ...entry, read: true } : entry)));
    }, 700);
  }

  function collect(values) {
    const next = { ...collRef.current, ...values };
    collRef.current = next;
    setCollected({ ...next });
  }

  async function introFlow() {
    await sleep(1100);
    setTyping(false);
    pushMsg({
      from: "bot",
      text: "Te ayudaré a reunir todo lo necesario para tu *página de muestra*.\n\n¿Cómo te llamas?",
      time: ts(),
    });
    stepRef.current = "name";
  }

  useEffect(() => {
    introFlow();
  }, []);

  async function startContactFlow() {
    const name = collRef.current.propietario || collRef.current.contacto_nombre;
    if (name) {
      collect({ contacto_nombre: name });
      await botSay(`Perfecto, *${firstName(name)}*. Ahora necesito tus datos para que el equipo te envíe la muestra y coordinemos cambios contigo.`);
      await botSay("¿Cuál es tu *número de WhatsApp personal*? Así nuestro equipo podrá contactarte directamente.\n\n_Solo para uso interno, no aparecerá en tu página._");
      stepRef.current = "contact_wa";
    } else {
      await botSay("¿Cuál es tu *nombre completo*?");
      stepRef.current = "contact_name";
    }
  }

  function startWhatsAppFlow(biz) {
    const hasPhone = !!(biz.telefono || collRef.current.telefono);

    if (hasPhone) {
      const phone = biz.telefono || collRef.current.telefono;
      botSay(`Tenemos este número en tu ficha de Google:\n*${phone}*\n\n¿Ese también es el número de *WhatsApp* que quieres mostrar en tu página?\n\n_Este número lo verán tus clientes._`).then(() => {
        pushMsg({
          from: "bot",
          time: ts(),
          rich: (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
              {["Sí, es el mismo", "No, es diferente"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setMsgs((current) => [...current, { id: Date.now(), from: "user", text: option, time: ts(), read: true }]);
                    if (option.startsWith("Sí")) {
                      collect({ whatsapp: phone });
                      startContactFlow();
                    } else {
                      stepRef.current = "post_verify_wa_manual";
                      botSay("¿Cuál es el número de *WhatsApp* de tu negocio?\n\n_Este número aparecerá en tu página web._");
                    }
                  }}
                  style={{
                    padding: "8px 14px",
                    background: "transparent",
                    border: `1.5px solid ${C.green}`,
                    borderRadius: 20,
                    color: C.green,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "DM Sans,sans-serif",
                    transition: "all .15s",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          ),
        });
      });
    } else {
      botSay("¿Cuál es el número de *WhatsApp* de tu negocio?\n\n_Este número aparecerá en tu página web._").then(() => {
        stepRef.current = "post_verify_wa_manual";
      });
    }
  }

  function pushVerifyCard(biz, index) {
    if (index >= VFIELDS.length) {
      setInputOff(false);
      startWhatsAppFlow(biz);
      return;
    }

    const field = VFIELDS[index];
    const value = biz[field.key] || "";
    if (!value || !String(value).trim()) {
      setInputOff(false);
      stepRef.current = "verify_fill";
      verifyIdx.current = index;
      botSay(EMPTY_FIELD_PROMPTS[field.key] || `¿Me puedes compartir ${field.label.toLowerCase()}?`);
      return;
    }

    pushMsg({
      from: "bot",
      time: ts(),
      rich: (
        <VerifyCard
          label={field.label}
          value={value}
          onOk={(confirmedValue) => {
            collect({ [field.key]: confirmedValue });
            verifyIdx.current = index + 1;
            pushVerifyCard(biz, index + 1);
          }}
          onSave={(savedValue) => {
            collect({ [field.key]: savedValue });
            verifyIdx.current = index + 1;
            pushVerifyCard(biz, index + 1);
          }}
        />
      ),
    });
  }

  async function startPhotoUploadFlow() {
    setInputOff(true);
    await botSay("Excelente. Ya tenemos lo esencial para preparar tu muestra. 🎉");
    const googlePhotos = collRef.current.photos || [];

    if (googlePhotos.length > 0 && !collRef.current.fotos_aprobadas) {
      await botSay(`Encontré *${googlePhotos.length} fotos* de tu negocio en Google. Desmarca las que no quieras usar en tu página:`);
      pushMsg({
        from: "bot",
        time: ts(),
        rich: (
          <PhotoApproval
            photoNames={googlePhotos}
            apiKey={GKEY}
            onDone={(approvedPhotos) => {
              collect({ fotos_aprobadas: approvedPhotos });
              setMsgs((current) => [...current, { id: Date.now(), from: "user", text: `${approvedPhotos.length} foto${approvedPhotos.length !== 1 ? "s" : ""} aprobada${approvedPhotos.length !== 1 ? "s" : ""}`, time: ts(), read: true }]);
              showExtraPhotoUpload();
            }}
          />
        ),
      });
      return;
    }

    showExtraPhotoUpload();
  }

  async function showExtraPhotoUpload() {
    await botSay("¿Tienes fotos de tu negocio que quieras agregar?\n_(Local, equipo, ambiente, productos…)_");
    pushMsg({
      from: "bot",
      time: ts(),
      rich: (
        <UploadCard
          label="Subir fotos del negocio"
          accept="image/*"
          multiple={true}
          maxFiles={15}
          hint="Selecciona todas las fotos que quieras"
          icon="📸"
          onDone={(files) => {
            collect({ fotos_extra: files });
            const count = files.length;
            setMsgs((current) => [...current, { id: Date.now(), from: "user", text: count > 0 ? `📸 ${count} foto${count !== 1 ? "s" : ""} subida${count !== 1 ? "s" : ""}` : "Sin fotos por ahora", time: ts(), read: true }]);
            askForLogo();
          }}
          skipLabel="Saltar"
        />
      ),
    });
  }

  async function askForLogo() {
    setInputOff(true);
    await botSay("¿Tienes un *logo* para tu negocio?");
    pushMsg({
      from: "bot",
      time: ts(),
      rich: (
        <LogoChoiceCard
          bizName={collRef.current.nombre || ""}
          bizType={collRef.current.tipo || ""}
          onUpload={(dataUrl) => {
            collect({ logo: dataUrl, logo_source: "upload" });
            setMsgs((current) => [...current, { id: Date.now(), from: "user", text: "Logo subido", time: ts(), read: true }]);
            startFinalQuestions();
          }}
          onPick={(option) => {
            collect({ logo: option.svg, logo_source: "generated", logo_concept: option.label });
            setMsgs((current) => [...current, { id: Date.now(), from: "user", text: `Logo elegido: ${option.label}`, time: ts(), read: true }]);
            startFinalQuestions();
          }}
          onSkip={() => {
            collect({ logo: null, logo_source: "none" });
            setMsgs((current) => [...current, { id: Date.now(), from: "user", text: "Sin logo por ahora", time: ts(), read: true }]);
            startFinalQuestions();
          }}
        />
      ),
    });
  }

  async function startFinalQuestions() {
    setInputOff(false);
    await botSay("Ya casi estamos listos para crear tu página. Solo un par de preguntas más:");
    await botSay('¿Tienes un *slogan* o frase que describa tu negocio?\n_(Ej: "El sabor que te hace volver" - escribe "no" si no tienes)_');
    stepRef.current = "slogan";
  }

  async function submitData() {
    setInputOff(true);
    setSubmitting(true);

    await botSay("Perfecto. Con esto vamos a preparar tu *página de muestra*. 🚀");

    const data = collRef.current;
    const hasUploads = (Array.isArray(data.fotos_extra) && data.fotos_extra.length > 0) || !!data.logo;
    let uploadedPhotos = [];

    if (hasUploads) {
      await botSay("Estoy subiendo tus fotos y tu logo para que el equipo los tenga listos.");
      try {
        uploadedPhotos = await uploadCollectedAssets(data);
      } catch (error) {
        console.warn("Asset upload group failed:", error);
      }
    }

    await botSay("Dame un momento mientras guardo tu información…");

    const extraNotes = [
      data.slogan ? `Slogan: ${data.slogan}` : "",
      data.redes ? `Redes: ${data.redes}` : "",
      data.logo_source === "generated" && data.logo_concept ? `Logo generado elegido: ${data.logo_concept}` : "",
      Array.isArray(data.additional_locations) && data.additional_locations.length
        ? `Ubicaciones adicionales: ${data.additional_locations.map((location) => `${location.nombre} - ${location.shortAddress || location.direccion}`).join(" | ")}`
        : "",
      Array.isArray(data.fotos_aprobadas) ? `Fotos de Google aprobadas: ${data.fotos_aprobadas.length}` : "",
    ].filter(Boolean).join("\n");

    const payload = {
      company: data.nombre || "",
      contactName: data.contacto_nombre || data.propietario || "",
      contactEmail: data.email || "",
      contactWhatsapp: data.contacto_whatsapp || "",
      businessType: data.tipo || "generic",
      businessPhone: data.telefono || "",
      addressFull: data.direccion || "",
      city: data.ciudad || "",
      aboutBusiness: data.sobre || "",
      founderName: data.propietario || "",
      hours: data.horario ? { horario: data.horario } : null,
      extraNotes,
      selectedGoogleMatch: data.place_id ? {
        placeId: data.place_id,
        name: data.nombre,
        address: data.direccion,
        addressCity: data.ciudad,
        phone: data.telefono,
        rating: data.calificacion ? parseFloat(data.calificacion) : null,
        reviewCount: data.resenas || null,
        types: data.tipo ? [data.tipo] : [],
      } : null,
      photos: uploadedPhotos,
    };

    try {
      const response = await fetch("/api/public-builder/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al guardar");

      await botSay("Listo. Ya tenemos todo para preparar tu página de muestra. 🎉");
      await botSay("Nuestro equipo te contactará por WhatsApp para enseñártela y, si decides seguir, terminarla contigo y moverla a tu dominio.");

      pushMsg({
        from: "bot",
        time: ts(),
        rich: (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a
              href={result.portalUrl || "/mipagina"}
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                background: C.green,
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "DM Sans,sans-serif",
                boxShadow: "0 4px 20px rgba(33,197,94,.35)",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Ir a mi portal
            </a>
            <a href="/" style={{ display: "block", textAlign: "center", color: C.waSub, fontSize: 12, textDecoration: "none", fontFamily: "DM Sans,sans-serif" }}>
              Volver al inicio
            </a>
          </div>
        ),
      });
      stepRef.current = "done";
    } catch (error) {
      console.error("Submit error:", error);
      await botSay("Hubo un problema al guardar tu información. Puedes intentar otra vez o escribirnos directo por WhatsApp.");
      pushMsg({
        from: "bot",
        time: ts(),
        rich: (
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hola, tuve un problema al enviar mi información desde crear-tu-pagina.")}`}
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 14px",
              borderRadius: 12,
              background: C.green,
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Escribir por WhatsApp
          </a>
        ),
      });
      setInputOff(false);
    }

    setSubmitting(false);
  }

  async function handleSend(raw) {
    const value = String(raw || inputVal).trim();
    if (!value) return;

    setInputVal("");
    userSay(value);
    const step = stepRef.current;

    if (step === "name") {
      collect({ propietario: value });
      stepRef.current = "biz";
      await botSay(`Mucho gusto, *${firstName(value)}*!`);
      await botSay("¿Cuál es el *nombre de tu negocio*?");
      return;
    }

    if (step === "verify_fill") {
      const index = verifyIdx.current;
      const field = VFIELDS[index];
      collect({ [field.key]: value });
      const biz = { ...collRef.current };
      verifyIdx.current = index + 1;
      stepRef.current = "verify";
      setInputOff(true);
      await sleep(300);
      await botSay("Gracias! 🙌");
      pushVerifyCard(biz, index + 1);
      return;
    }

    if (step === "biz") {
      collect({ nombre: value });
      stepRef.current = "city";
      await botSay("¿En qué *ciudad* está tu negocio?");
      return;
    }

    if (step === "city") {
      collect({ ciudad: value });
      stepRef.current = "searching";
      setInputOff(true);
      await botSay(`Perfecto. Voy a buscar *${collRef.current.nombre}* en Google Maps… 🔍`);
      setSearchDone(false);
      setSearchFound(false);
      setSearchBiz(null);
      setShowSearchCard(true);
      await sleep(200);

      const bizResult = await lookup(collRef.current.nombre, value);
      const allResults = Array.isArray(bizResult) ? bizResult : (bizResult ? [bizResult] : []);
      const biz = allResults.length > 0 ? { ...allResults[0], propietario: collRef.current.propietario } : null;

      setSearchDone(true);
      setSearchFound(allResults.length > 0);
      setSearchBiz(allResults[0] || null);
      setSearchCount(allResults.length);
      await sleep(1800);
      setShowSearchCard(false);
      await sleep(300);

      if (biz) {
        if (allResults.length > 1) {
          await botSay(`Encontré *${allResults.length} ubicaciones* para ese nombre.\n\nToca todas las que sean tuyas. 👇`);
          pushMsg({
            from: "bot",
            time: ts(),
            rich: (
              <LocationPicker
                results={allResults}
                onConfirm={(picked) => {
                  const primary = { ...picked[0], propietario: collRef.current.propietario };
                  collect({ ...primary, additional_locations: picked.slice(1) });
                  const summary = picked.length === 1 ? `${primary.nombre}\n${primary.shortAddress || primary.direccion}` : `${picked.length} ubicaciones seleccionadas`;
                  setMsgs((current) => [...current, { id: Date.now(), from: "user", text: summary, time: ts(), read: true }]);
                  botSay("Perfecto. Vamos a verificar la información 👇").then(() => {
                    stepRef.current = "verify";
                    verifyIdx.current = 0;
                    pushVerifyCard(primary, 0);
                  });
                }}
                onNone={() => {
                  setMsgs((current) => [...current, { id: Date.now(), from: "user", text: "Ninguna es la mía", time: ts(), read: true }]);
                  setInputOff(false);
                  botSay("Sin problema. Te hago unas preguntas rápidas.\n\n¿Cuál es el *correo electrónico de contacto*?").then(() => {
                    stepRef.current = "email";
                  });
                }}
              />
            ),
          });
        } else {
          collect(biz);
          await botSay("Encontré tu negocio en Google! 🎉\n\nVamos a verificar que todo esté correcto.");
          await sleep(400);
          stepRef.current = "verify";
          verifyIdx.current = 0;
          pushVerifyCard(biz, 0);
        }
      } else {
        setInputOff(false);
        await botSay("No encontré tu negocio en Google, pero no te preocupes.\n\nSolo necesito unos datos rápidos.");
        await botSay("¿Cuál es el *correo electrónico de contacto*?");
        stepRef.current = "email";
      }
      return;
    }

    if (step === "email") {
      collect({ email: value });
      stepRef.current = "wa";
      await botSay("¿Tu número de *WhatsApp* del negocio?");
      return;
    }

    if (step === "wa") {
      collect({ whatsapp: value });
      stepRef.current = "tipo";
      await botSay("¿Cuál es el *tipo de negocio*?\n_(Ej: restaurante, peluquería, tienda de ropa…)_");
      return;
    }

    if (step === "tipo") {
      collect({ tipo: value });
      stepRef.current = "dir";
      await botSay("¿Cuál es la *dirección completa*?");
      return;
    }

    if (step === "dir") {
      collect({ direccion: value });
      stepRef.current = "hora";
      await botSay("¿Cuál es el *horario de atención*?\n_(Ej: lunes a viernes, 9:00-18:00)_");
      return;
    }

    if (step === "hora") {
      collect({ horario: value });
      stepRef.current = "sobre";
      await botSay("Cuéntame un poco sobre tu negocio. _¿Qué lo hace especial?_");
      return;
    }

    if (step === "sobre") {
      collect({ sobre: value });
      stepRef.current = "manual_wa";
      await botSay("¿Cuál es el número de *WhatsApp* de tu negocio para que tus clientes te contacten?\n\n_Este número aparecerá en tu página web._");
      return;
    }

    if (step === "manual_wa") {
      collect({ whatsapp: value });
      await startContactFlow();
      return;
    }

    if (step === "post_verify_wa_confirm") {
      if (/^s[ií]/i.test(value)) {
        collect({ whatsapp: collRef.current.telefono });
        await startContactFlow();
      } else {
        stepRef.current = "post_verify_wa_manual";
        await botSay("¿Cuál es el número de *WhatsApp* de tu negocio?\n\n_Este número aparecerá en tu página web._");
      }
      return;
    }

    if (step === "post_verify_wa_manual") {
      collect({ whatsapp: value });
      await startContactFlow();
      return;
    }

    if (step === "contact_name") {
      collect({ contacto_nombre: value });
      stepRef.current = "contact_wa";
      await botSay(`Gracias, *${firstName(value)}*.\n\n¿Cuál es tu *número de WhatsApp personal*? Así nuestro equipo podrá contactarte directamente.\n\n_Solo para uso interno, no aparecerá en tu página._`);
      return;
    }

    if (step === "contact_wa") {
      collect({ contacto_whatsapp: value, contacto_telefono: value });
      if (collRef.current.email) {
        await startPhotoUploadFlow();
      } else {
        stepRef.current = "contact_email";
        await botSay("¿Y tu *correo electrónico*?");
      }
      return;
    }

    if (step === "contact_email") {
      collect({ email: value });
      await startPhotoUploadFlow();
      return;
    }

    if (step === "slogan") {
      collect({ slogan: looksLikeNo(value) ? "" : value });
      stepRef.current = "social";
      await botSay('¿Tienes redes sociales? Comparte los links que quieras mostrar en tu página.\n_(Instagram, Facebook, TikTok, etc. - escribe "no" si no tienes)_');
      return;
    }

    if (step === "social") {
      collect({ redes: looksLikeNo(value) ? "" : value });
      await submitData();
    }
  }

  return (
    <div style={outerStyle}>
      <div style={frameStyle}>
        <div style={{ background: C.waHeader, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,.05)" }}>
          <Avatar size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.waText }}>Diseñador virtual</div>
            <div style={{ fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
              En línea
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.waSub, textAlign: "right", lineHeight: 1.3 }}>
            <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>Ahora</span>
            <span style={{ color: C.waText, fontWeight: 700, fontSize: 12 }}>Tengo</span>
            <br />
            <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>Pagina</span>
          </div>
        </div>

        <ProgressBar data={collected} />

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 2, background: C.waBg }}>
          <div style={{ flex: "1 0 auto", minHeight: 0 }} />
          {msgs.map((message) => <Bubble key={message.id} msg={message} />)}
          {typing ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, animation: "fadeUp .2s ease" }}>
              <Avatar />
              <Dots />
            </div>
          ) : null}
          {showSearchCard ? (
            <div style={{ paddingLeft: 40, animation: "fadeUp .3s ease", marginTop: 4 }}>
              <div style={{ maxWidth: "82%", background: C.waBubIn, borderRadius: "0 10px 10px 10px", padding: "10px 12px", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }}>
                <SearchCard done={searchDone} found={searchFound} biz={searchBiz} count={searchCount} />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: C.waTime }}>{ts()}</span>
                </div>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} style={{ height: 4 }} />
        </div>

        <div style={{ background: C.waHeader, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, borderTop: "1px solid rgba(255,255,255,.04)" }}>
          {inputOff ? (
            <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: C.waSub, padding: "10px 0" }}>
              {submitting ? "Guardando tu información…" : "Procesando…"}
            </div>
          ) : (
            <>
              <div style={{ flex: 1, background: "rgba(255,255,255,.08)", borderRadius: 24, padding: "10px 14px", display: "flex", alignItems: "center" }}>
                <input
                  ref={inputRef}
                  value={inputVal}
                  onChange={(event) => setInputVal(event.target.value)}
                  onFocus={() => {
                    const start = Date.now();
                    function tick() {
                      scrollBottom();
                      if (Date.now() - start < 600) requestAnimationFrame(tick);
                    }
                    tick();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Escribe un mensaje…"
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.waText, fontSize: 16, fontFamily: "DM Sans,sans-serif" }}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputVal.trim() || typing}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  background: inputVal.trim() && !typing ? C.green : "rgba(255,255,255,.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background .2s",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 9L16 2L9 16L7.5 10.5L2 9Z" fill="white" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById("chat-root");
if (root) {
  ReactDOM.createRoot(root).render(<ChatBuilderApp />);
}
