import { html } from '../../lib/html.js';
import { imgUrl } from '../../lib/images.js';
import { localBusinessLd } from '../../lib/seo.js';
import { layout } from '../layout.js';
import { card, picture, placeholder, logo, bottomBar, waSvg, directionsUrl } from '../components.js';
import { waLink, msgGeneral } from '../../../shared/messages.js';

export function pages(ctx) {
  const s = ctx.settings;
  const featured = ctx.published.filter((p) => p.featured).slice(0, 8);
  const heroImg = (featured[0] ?? ctx.published.find((p) => p.images.length))?.images[0];

  const body = html`
<div class="wrap">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Handcrafted wooden furniture</p>
      <h1>Made with Care. Made for You.</h1>
      <p>Thoughtfully crafted furniture for modern homes. Choose from our ready-made collection or create a piece made around your space and style.</p>
      <div class="btn-row">
        <a class="btn" href="/collection/">Browse the collection</a>
        <a class="btn btn-ghost" href="/custom/">Start a custom design</a>
      </div>
    </div>
    <div class="hero-media">${heroImg ? picture(ctx, heroImg, { sizes: '(min-width:700px) 50vw, 100vw', eager: true }) : html`<div class="placeholder">${logo(72)}</div>`}</div>
  </section>
  <div class="trust" aria-label="Why Shivam Furniture">
    <div><strong>Made in our workshop</strong><br><span class="muted">Hands-on craftsmanship</span></div>
    <div><strong>Quality wood</strong><br><span class="muted">Materials chosen with care</span></div>
    <div><strong>Made to order</strong><br><span class="muted">Designed around your needs</span></div>
  </div>
</div>

<section class="section"><div class="wrap">
  <p class="eyebrow">Find your kind of furniture</p>
  <h2>Made for every corner of home.</h2>
  <p class="lead">From quiet mornings at your study desk to family dinners around the table, find pieces made for everyday living.</p>
  <div class="cat-tiles">
    ${ctx.categories.map((c) => html`<a class="cat-tile" href="/${c.slug}/">${c.cover_path ? picture(ctx, { path: c.cover_path, alt: '' }, { sizes: '(min-width:700px) 33vw, 50vw' }) : placeholder()}<span>${c.name}</span></a>`)}
  </div>
</div></section>

${featured.length ? html`<section class="section band-light"><div class="wrap">
  <p class="eyebrow">Featured pieces</p>
  <h2>From the showroom.</h2>
  <p class="lead">Tap any piece to see details, then message us for price and availability.</p>
  <div class="grid">${featured.map((p) => card(ctx, p))}</div>
  <p style="margin-top:22px"><a class="btn btn-ghost" href="/collection/">See the full collection</a></p>
</div></section>` : ''}

<section class="band"><div class="wrap">
  <p class="eyebrow" style="color:var(--oak)">Custom furniture</p>
  <h2>Your vision. Our craft.</h2>
  <p class="lead">Have a specific design, size or finish in mind? We make custom furniture tailored to your space, preferences and everyday needs.</p>
  <div class="btn-row"><a class="btn btn-light" href="/custom/">Start a custom design</a><a class="btn btn-wa" href="${waLink(s.phone, msgGeneral())}" rel="noopener">${waSvg()} Chat on WhatsApp</a></div>
</div></section>

<section class="section"><div class="wrap">
  <p class="eyebrow">Visit our showroom</p>
  <h2>Come see the craft for yourself.</h2>
  <p class="lead">Explore furniture in person, discuss a custom design, or talk to our team about finding the right piece for your home.</p>
  <address translate="no" style="font-style:normal;margin-bottom:14px">${s.address}</address>
  <div class="btn-row"><a class="btn" href="${directionsUrl(s)}" rel="noopener">Get directions</a><a class="btn btn-ghost" href="${`tel:+${s.phone}`}">Call <span translate="no">${s.phone_display}</span></a></div>
</div></section>`;

  return [{
    path: '/',
    html: layout(ctx, {
      title: 'Shivam Furniture | Handcrafted Wooden Furniture, Guwahati',
      description: 'Handcrafted wooden furniture for modern homes. Browse ready-made pieces or create a custom design at our Kahilipara showroom in Guwahati.',
      path: '/',
      ogImage: heroImg ? imgUrl(ctx.supabaseUrl, heroImg.path, 1600) : undefined,
      jsonLd: [localBusinessLd(ctx)],
      bar: bottomBar(ctx),
      body,
    }),
  }];
}
