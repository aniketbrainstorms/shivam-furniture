import { html, raw } from '../../lib/html.js';
import { imgUrl } from '../../lib/images.js';
import { breadcrumbLd, productLd } from '../../lib/seo.js';
import { layout } from '../layout.js';
import { card, picture, placeholder, bottomBar, waSvg, availLabel, availClass, safeHex, directionsUrl } from '../components.js';
import { waLink, msgProduct, msgCustomiseProduct } from '../../../shared/messages.js';

function galleryHtml(ctx, p) {
  if (!p.images.length) return html`<div class="gallery"><div class="slide">${placeholder()}</div></div>`;
  return html`<div class="gallery" data-gallery>
  <div class="gallery-main" data-track>${p.images.map((im, i) => html`<div class="slide"><button class="zoom" type="button" data-zoom="${imgUrl(ctx.supabaseUrl, im.path, 1600)}" aria-label="Zoom photo ${i + 1}">${picture(ctx, im, { sizes: '(min-width:900px) 55vw, 100vw', eager: i === 0 })}</button>${im.is_styled ? html`<span class="styled">Styled shot</span>` : ''}</div>`)}</div>
  ${p.images.length > 1 ? html`<div class="thumbs">${p.images.map((im, i) => html`<button class="thumb" type="button" data-thumb aria-label="Show photo ${i + 1}" aria-current="${String(i === 0)}"><img src="${imgUrl(ctx.supabaseUrl, im.path, 800)}" alt="" loading="lazy"></button>`)}</div>` : ''}
  <dialog class="lightbox" data-lightbox><button class="close" type="button" data-close aria-label="Close">×</button><img alt=""></dialog>
</div>`;
}

export function pages(ctx) {
  const s = ctx.settings;
  return ctx.published.map((p) => {
    const path = `/${p.category.slug}/${p.slug}/`;
    const related = ctx.published.filter((x) => x.category_id === p.category_id && x.id !== p.id).slice(0, 4);
    const swatches = p.finishes.filter((f) => f?.name);
    const body = html`<div class="wrap" data-product data-phone="${s.phone}" data-name="${p.name}">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/collection/">Collection</a> / <a href="/${p.category.slug}/">${p.category.name}</a></nav>
  <article class="product">
    ${galleryHtml(ctx, p)}
    <div class="product-info">
      <div class="badges"><span class="badge ${availClass(p)}">${availLabel(p)}</span>${p.customisable ? html`<span class="tag"><i class="dot"></i>Customisable</span>` : ''}</div>
      <h1>${p.name}</h1>
      <div class="actions">
        <a class="btn btn-wa grow" data-wa="product" href="${waLink(s.phone, msgProduct(p.name))}" rel="noopener">${waSvg()} Ask about this piece</a>
        <a class="btn btn-ghost" href="${`tel:+${s.phone}`}">Call us</a>
      </div>
      <dl class="specs">
        ${p.dimensions ? html`<div><dt>Dimensions</dt><dd class="pre">${p.dimensions}</dd></div>` : ''}
        <div><dt>Material</dt><dd>${p.material}</dd></div>
        ${swatches.length ? html`<div><dt>Finishes</dt><dd><ul class="swatches">${swatches.map((f) => { const hex = safeHex(f.hex); return html`<li><button type="button" class="swatch-btn" data-finish="${f.name}" aria-pressed="false"><span class="swatch" ${raw(hex ? `style="background:${hex}"` : '')}></span>${f.name}</button></li>`; })}</ul><span class="muted" data-finish-label aria-live="polite"></span></dd></div>` : ''}
      </dl>
      <div class="callout"><h2 class="serif">Want a different size or finish?</h2><p class="muted" style="margin:0 0 12px">We can make this piece around your space.</p><a class="btn btn-ghost" data-wa="customise" href="${waLink(s.phone, msgCustomiseProduct(p.name))}" rel="noopener">Customise this piece</a></div>
      ${p.good_to_know ? html`<div class="callout"><h2 class="serif">Good to know</h2><p class="pre" style="margin:0">${p.good_to_know}</p></div>` : ''}
      <div class="callout"><h2 class="serif">See it in person</h2><address translate="no" style="font-style:normal;margin-bottom:12px">${s.address}</address><div class="btn-row"><a class="btn btn-ghost" href="${directionsUrl(s)}" rel="noopener">Directions</a><a class="btn btn-ghost" href="/visit/">Visit us</a><button class="btn btn-ghost" type="button" data-share>Share</button></div></div>
    </div>
  </article>
  ${related.length ? html`<section class="section"><h2>More from ${p.category.name}</h2><div class="grid">${related.map((r) => card(ctx, r))}</div></section>` : ''}
</div>`;
    return {
      path,
      html: layout(ctx, {
        title: `${p.name} | ${p.category.name} | Shivam Furniture, Guwahati`,
        description: `${p.name} in ${p.material}. ${availLabel(p)}. Ask on WhatsApp or visit our Guwahati showroom for price and customisation.`,
        path,
        current: 'collection',
        ogImage: p.images[0] ? imgUrl(ctx.supabaseUrl, p.images[0].path, 1600) : undefined,
        jsonLd: [productLd(ctx, p), breadcrumbLd(ctx.site, [['Home', '/'], ['Collection', '/collection/'], [p.category.name, `/${p.category.slug}/`], [p.name, path]])],
        scripts: ['/js/gallery.js', '/js/product.js'],
        bar: bottomBar(ctx, { product: p }),
        body,
      }),
    };
  });
}
