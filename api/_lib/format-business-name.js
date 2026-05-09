export function formatBusinessName(value) {
  const input = String(value || '').replace(/\s+/g, ' ').trim();
  if (!input) return '';

  return input
    .split(' ')
    .map((word) => formatWord(word))
    .join(' ');
}

function formatWord(word) {
  return String(word || '')
    .split(/([-\/&])/)
    .map((part) => {
      if (!part || /^[-\/&]$/.test(part)) return part;
      if (/^\d+$/.test(part)) return part;
      if (/^[A-Z0-9]{2,5}$/.test(part)) return part;
      if (/^(?=[ivxlcdm]+$)[ivxlcdm]{1,6}$/i.test(part)) return part.toUpperCase();

      const lower = part.toLocaleLowerCase('es');
      return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
    })
    .join('');
}

export function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
