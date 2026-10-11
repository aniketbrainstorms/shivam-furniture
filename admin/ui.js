export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (k === 'value' || v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  if (attrs && attrs.value != null) el.value = attrs.value; // after children so <select> options exist
  return el;
}

export function toast(message, kind = 'ok') {
  const t = h('div', { class: `toast ${kind === 'err' ? 'err' : ''}`, role: 'status' }, message);
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), kind === 'err' ? 7000 : 4000);
}

export const field = (label, control, hint) => h('label', {}, label, control, hint ? h('span', { class: 'hint' }, hint) : null);
