import { html, raw } from '../lib/html.js';
import { imgUrl, isLocal } from '../lib/images.js';
import { waLink, telLink, msgProduct, msgGeneral } from '../../shared/messages.js';

export const ROOMS = { bedroom: 'Bedroom', living: 'Living room', dining: 'Dining', study: 'Study / office', kids: 'Kids’ room' };
const AVAIL = { in_showroom: 'In showroom', made_to_order: 'Made to order' };
export const availLabel = (p) => (p.availability === 'ready_in_days' ? `Ready in ${p.ready_days} days` : AVAIL[p.availability] ?? '');
export const availClass = (p) => (p.availability === 'in_showroom' ? 'badge-showroom' : 'badge-order');
export const safeHex = (h) => (/^#[0-9a-f]{3,8}$/i.test(h ?? '') ? h : null);
export const directionsUrl = (s) =>
  s.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`;

export const logo = (size = 40) => html`<svg viewBox="0 0 100 110" width="${size}" height="${Math.round(size * 1.1)}" aria-hidden="true" focusable="false"><path d="M50 3 96 29 50 56 4 29Z" fill="#725039"/><path d="M4 29 50 56 50 107 4 79Z" fill="#4B3020"/><path d="M96 29 50 56 50 107 96 79Z" fill="#5C3E29"/><text x="26" y="68" fill="#F5F0E7" font-family="Georgia,serif" font-size="34" font-weight="bold" transform="rotate(28 26 68)">S</text><text x="60" y="76" fill="#F5F0E7" font-family="Georgia,serif" font-size="35" font-weight="bold" transform="rotate(-28 60 76)">F</text></svg>`;

export const waSvg = () => html`<svg class="wa-svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Zm4.6 13.4c-.2.5-1.1 1-1.5 1-.4.1-.9.1-2.800-.7-2.300-1-3.800-3.300-3.900-3.500-.1-.2-.9-1.200-.9-2.300s.6-1.600.8-1.900c.2-.2.4-.3.600-.3h.4c.2 0 .3 0 .5.4l.7 1.600c.1.100.1.300 0 .4l-.3.500c-.1.200-.3.300-.1.500.2.300.7 1.100 1.500 1.700 1 .9 1.800 1.100 2 1.200.3.100.4.100.6-.1l.7-.9c.1-.2.3-.2.500-.1l1.500.7c.2.100.3.200.4.300 0 .2 0 .7-.2 1.200Z"/></svg>`;

export const placeholder = () => html`<div class="placeholder" role="img" aria-label="Photo coming soon"><span>Photo coming soon</span></div>`;

export function picture(ctx, image, { sizes = '100vw', eager = false } = {}) {
  const loading = raw(eager ? 'fetchpriority="high"' : 'loading="lazy"');
  if (isLocal(image.path)) return html`<img src="${imgUrl('', image.path, 800)}" alt="${image.alt ?? ''}" decoding="async" ${loading}>`;
  const base = (n) => imgUrl(ctx.supabaseUrl, image.path, n);
  return html`<img src="${base(800)}" srcset="${base(800)} 800w, ${base(1600)} 1600w" sizes="${sizes}" alt="${image.alt ?? ''}" decoding="async" ${loading}>`;
}

export function card(ctx, p) {
  const img = p.images[0];
  const meta = [p.material, p.size_label].filter(Boolean).join(' · ');
  const search = [p.name, p.material, p.size_label, p.category.name].filter(Boolean).join(' ').toLowerCase();
  return html`<article class="card" data-category="${p.category.slug}" data-rooms="${p.rooms.join(' ')}" data-search="${search}">
  <a class="card-link" href="/${p.category.slug}/${p.slug}/">
    <div class="media">${img ? picture(ctx, img, { sizes: '(min-width:1000px) 25vw, (min-width:700px) 33vw, 50vw' }) : placeholder()}<span class="badge ${availClass(p)}">${availLabel(p)}</span></div>
    <h3 class="card-title">${p.name}</h3>
    ${meta ? html`<p class="card-meta">${meta}</p>` : ''}
  </a>
  <div class="card-foot">
    ${p.customisable ? html`<span class="tag"><i class="dot"></i>Customisable</span>` : html`<span></span>`}
    <a class="wa-icon" href="${waLink(ctx.settings.phone, msgProduct(p.name))}" aria-label="Ask about ${p.name} on WhatsApp" rel="noopener">${waSvg()}</a>
  </div>
</article>`;
}

export function bottomBar(ctx, { product } = {}) {
  const s = ctx.settings;
  const primary = product
    ? html`<a class="btn btn-wa grow" data-wa="product" href="${waLink(s.phone, msgProduct(product.name))}" rel="noopener">${waSvg()} Ask about this piece</a>`
    : html`<a class="btn btn-wa grow" href="${waLink(s.phone, msgGeneral())}" rel="noopener">${waSvg()} WhatsApp</a>`;
  return html`<nav class="bar" aria-label="Contact">${primary}<a class="btn btn-ghost" href="${`tel:+${s.phone}`}">Call</a>${product ? '' : html`<a class="btn btn-ghost" href="${directionsUrl(s)}" rel="noopener">Directions</a>`}</nav>`;
}
