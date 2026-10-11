import { html } from '../../lib/html.js';
import { breadcrumbLd, localBusinessLd } from '../../lib/seo.js';
import { layout } from '../layout.js';
import { picture, bottomBar, waSvg, directionsUrl } from '../components.js';
import { waLink, msgGeneral } from '../../../shared/messages.js';

const SOURCE = { google: 'Google review', whatsapp: 'Shared on WhatsApp' };

export function pages(ctx) {
  const s = ctx.settings;
  const section = (id, title, inner) => html`<section class="section-tight" id="${id}"><h2 class="serif">${title}</h2>${inner}</section>`;

  const body = html`<div class="wrap">
  <section class="section-tight" style="padding-top:28px">
    <p class="eyebrow">Visit our showroom</p>
    <h1 class="serif" style="font-size:clamp(2.2rem,7vw,3.6rem)">Come see the craft for yourself.</h1>
    <p class="lead">Explore furniture in person, discuss a custom design, or talk to our team about finding the right piece for your home.</p>
    <div class="callout"><strong translate="no">Shivam Furniture</strong><address translate="no" style="font-style:normal;margin:6px 0 14px">${s.address}</address>
      <div class="btn-row"><a class="btn" href="${directionsUrl(s)}" rel="noopener">Get directions</a><a class="btn btn-wa" href="${waLink(s.phone, msgGeneral())}" rel="noopener">${waSvg()} WhatsApp</a><a class="btn btn-ghost" href="${`tel:+${s.phone}`}">Call <span translate="no">${s.phone_display}</span></a></div>
      ${s.gbp_url ? html`<p style="margin:14px 0 0"><a href="${s.gbp_url}" rel="noopener" style="text-decoration:underline">Find us on Google</a></p>` : ''}
    </div>
  </section>
  ${s.hours ? section('hours', 'Opening hours', html`<p class="pre">${s.hours}</p>`) : ''}
  ${s.workshop_photos?.length ? section('workshop', 'Our workshop', html`<div class="grid">${s.workshop_photos.map((ph) => html`<div class="media">${picture(ctx, ph, { sizes: '(min-width:700px) 33vw, 50vw' })}</div>`)}</div>`) : ''}
  ${s.years_text ? section('about', 'About us', html`<p class="pre">${s.years_text}</p>`) : ''}
  ${s.delivery_text ? section('delivery', 'Delivery and installation', html`<p class="pre">${s.delivery_text}</p>`) : ''}
  ${s.warranty_text ? section('warranty', 'Warranty and after-sales', html`<p class="pre">${s.warranty_text}</p>`) : ''}
  ${ctx.reviews.length ? section('reviews', 'What customers say', ctx.reviews.map((r) => html`<blockquote class="quote"><p style="margin:0">${r.body}</p><cite>${r.name} · ${SOURCE[r.source] ?? ''}</cite></blockquote>`)) : ''}
</div><div class="section-tight"></div>`;

  return [{
    path: '/visit/',
    html: layout(ctx, {
      title: 'Visit Our Showroom in Kahilipara, Guwahati | Shivam Furniture',
      description: 'Visit the Shivam Furniture showroom in Kahilipara, Guwahati. Get directions, call or message us on WhatsApp.',
      path: '/visit/',
      current: 'visit',
      bar: bottomBar(ctx),
      jsonLd: [localBusinessLd(ctx), breadcrumbLd(ctx.site, [['Home', '/'], ['Visit', '/visit/']])],
      body,
    }),
  }];
}
