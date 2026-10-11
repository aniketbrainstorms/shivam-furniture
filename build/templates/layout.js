import { html, raw } from '../lib/html.js';
import { logo, waSvg, directionsUrl } from './components.js';
import { waLink, msgGeneral } from '../../shared/messages.js';

const NAV = [['collection', '/collection/', 'Collection'], ['custom', '/custom/', 'Custom'], ['visit', '/visit/', 'Visit']];

export function layout(ctx, { title, description, path, ogImage, noindex = false, jsonLd = [], scripts = [], bar = '', body, current = '' }) {
  const s = ctx.settings;
  const canonical = ctx.site + path;
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#F5F0E7">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
${noindex || ctx.preview ? raw('<meta name="robots" content="noindex">') : ''}
<meta property="og:site_name" content="Shivam Furniture">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
${ogImage && !ogImage.startsWith('/') ? html`<meta property="og:image" content="${ogImage}"><meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
${jsonLd.map((o) => raw(`<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`))}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${ctx.preview ? html`<div class="preview-bar">Preview: sample products and photo placeholders are shown until the real catalogue is added.</div>` : ''}
<header class="site-header"><div class="wrap head">
  <a class="brand" href="/" aria-label="Shivam Furniture home">${logo(36)}<span class="brand-text"><span class="brand-name" translate="no">SHIVAM</span><span class="brand-sub" translate="no">FURNITURE</span></span></a>
  <nav class="nav" aria-label="Main">${NAV.map(([key, href, label]) => html`<a href="${href}" ${raw(current === key ? 'aria-current="page"' : '')}>${label}</a>`)}</nav>
  <div class="head-actions"><a class="btn btn-wa" href="${waLink(s.phone, msgGeneral())}" rel="noopener">${waSvg()} WhatsApp</a><a class="btn btn-ghost" href="${`tel:+${s.phone}`}">Call</a></div>
</div></header>
<main id="main">${body}</main>
<footer class="site-footer"><div class="wrap foot">
  <div><p class="foot-title serif" translate="no">Shivam Furniture</p><address translate="no">${s.address}</address><p><a href="${`tel:+${s.phone}`}" translate="no">${s.phone_display}</a></p></div>
  <div class="foot-links"><a href="/collection/">Collection</a><a href="/custom/">Custom furniture</a><a href="/visit/">Visit us</a><a href="${directionsUrl(s)}" rel="noopener">Directions</a></div>
  <p class="copy">© ${new Date().getFullYear()} <span translate="no">Shivam Furniture</span>. Made with care in Guwahati, Assam.</p>
</div></footer>
${bar}
${scripts.map((src) => raw(`<script type="module" src="${src}"></script>`))}
</body>
</html>`;
}
