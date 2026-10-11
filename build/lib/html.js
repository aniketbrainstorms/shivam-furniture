const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw {
  constructor(s) { this.s = s; }
}
export const raw = (s) => new Raw(String(s));
export const str = (r) => (r instanceof Raw ? r.s : String(r));

const flat = (v) => {
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(flat).join('');
  if (v == null || v === false) return '';
  return esc(v);
};

export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s + (i < vals.length ? flat(vals[i]) : '');
  });
  return raw(out);
}
