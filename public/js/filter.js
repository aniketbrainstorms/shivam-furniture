const cards = [...document.querySelectorAll('.card')];
const q = document.querySelector('[data-filter-q]');
const room = document.querySelector('[data-filter-room]');
const chips = [...document.querySelectorAll('button[data-chip]')];
const empty = document.querySelector('[data-empty]');

const params = new URLSearchParams(location.search);
const state = { q: params.get('q') ?? '', room: params.get('r') ?? '', cat: params.get('c') ?? 'all' };

function apply() {
  const words = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const c of cards) {
    const ok =
      (state.cat === 'all' || c.dataset.category === state.cat) &&
      (!state.room || c.dataset.rooms.split(' ').includes(state.room)) &&
      words.every((w) => c.dataset.search.includes(w));
    c.hidden = !ok;
    if (ok) shown++;
  }
  if (empty) empty.hidden = shown !== 0;
  chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.chip === state.cat)));
  const next = new URLSearchParams();
  if (state.q) next.set('q', state.q);
  if (state.room) next.set('r', state.room);
  if (state.cat !== 'all' && chips.length) next.set('c', state.cat);
  const qs = next.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

if (q) { q.value = state.q; q.addEventListener('input', () => { state.q = q.value; apply(); }); }
if (room) { room.value = state.room; room.addEventListener('change', () => { state.room = room.value; apply(); }); }
chips.forEach((b) => b.addEventListener('click', () => { state.cat = b.dataset.chip; apply(); }));
apply();
