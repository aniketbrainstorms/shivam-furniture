import { db, SUPABASE_URL, SUPABASE_ANON_KEY } from './db.js';
import { h, toast } from './ui.js';

const app = document.getElementById('app');

const TABS = [['products', 'Products'], ['categories', 'Categories'], ['reviews', 'Reviews'], ['gallery', 'Custom gallery'], ['settings', 'Site settings'], ['backup', 'Backup']];

const routes = [
  [/^#\/products$/, 'products', (r) => import('./products.js').then((m) => m.viewProducts(r))],
  [/^#\/product\/(new|[0-9a-f-]{36})$/, 'products', (r, m) => import('./products.js').then((x) => x.viewProductForm(r, m[1] === 'new' ? null : m[1]))],
  [/^#\/categories$/, 'categories', (r) => import('./crud.js').then((m) => m.categoriesView(r))],
  [/^#\/reviews$/, 'reviews', (r) => import('./crud.js').then((m) => m.reviewsView(r))],
  [/^#\/gallery$/, 'gallery', (r) => import('./crud.js').then((m) => m.galleryView(r))],
  [/^#\/settings$/, 'settings', (r) => import('./crud.js').then((m) => m.settingsView(r))],
  [/^#\/backup$/, 'backup', (r) => import('./crud.js').then((m) => m.backupView(r))],
];

function loginView() {
  const email = h('input', { type: 'email', required: true, autocomplete: 'username' });
  const password = h('input', { type: 'password', required: true, autocomplete: 'current-password' });
  const form = h('form', { class: 'login stack', onsubmit: async (e) => {
    e.preventDefault();
    const { error } = await db.auth.signInWithPassword({ email: email.value, password: password.value });
    if (error) toast(error.message, 'err');
  } },
  h('h1', {}, 'Shivam Furniture Admin'),
  h('label', {}, 'Email', email), h('label', {}, 'Password', password),
  h('button', { type: 'submit' }, 'Sign in'));
  app.replaceChildren(form);
}

const buildStamp = () =>
  fetch(`/build.json?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json()).then((j) => j.builtAt).catch(() => null);

function shell() {
  const status = h('span', { class: 'status', 'aria-live': 'polite' });
  const setStatus = (text, kind = '') => { status.textContent = text; status.className = `status ${kind}`; };
  const publish = h('button', { type: 'button' }, 'Publish site');
  publish.addEventListener('click', async () => {
    const { data: { session } } = await db.auth.getSession();
    const before = await buildStamp();
    publish.disabled = true;
    setStatus('Starting build…');
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/publish`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON_KEY } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Publish failed (${r.status})`);
    } catch (e) {
      setStatus(e.message, 'err');
      publish.disabled = false;
      return;
    }
    setStatus('Building… usually 1 to 2 minutes');
    const started = Date.now();
    const timer = setInterval(async () => {
      const now = await buildStamp();
      if (now && now !== before) {
        clearInterval(timer);
        setStatus('Live. Your changes are on the website.', 'ok');
        publish.disabled = false;
      } else if (Date.now() - started > 5 * 60_000) {
        clearInterval(timer);
        setStatus('The build is taking too long. The previous site is still live. Check the build log in Cloudflare Pages.', 'err');
        publish.disabled = false;
      }
    }, 5000);
  });
  const tabs = h('nav', { class: 'tabs', 'aria-label': 'Admin sections' }, TABS.map(([k, label]) => h('a', { href: `#/${k}`, 'data-tab': k }, label)));
  const main = h('main', { id: 'view' });
  app.replaceChildren(
    h('header', { class: 'top' }, h('h1', {}, 'Shivam Furniture Admin'), status, publish, h('button', { class: 'ghost', type: 'button', onclick: () => db.auth.signOut() }, 'Sign out'), tabs),
    main,
  );
  return { main, tabs };
}

let current;
async function route() {
  if (!current) return;
  const hash = location.hash || '#/products';
  const hit = routes.map(([re, tab, run]) => [re.exec(hash), tab, run]).find(([m]) => m);
  if (!hit) { location.hash = '#/products'; return; }
  const [m, tab, run] = hit;
  current.tabs.querySelectorAll('a').forEach((a) => (a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  try { await run(current.main, m); } catch (e) { current.main.replaceChildren(h('p', { class: 'err' }, e.message)); }
}

async function render(session) {
  if (!session) { current = null; loginView(); return; }
  current = shell();
  await route();
}

window.addEventListener('hashchange', route);
db.auth.onAuthStateChange((_event, session) => { render(session); });
