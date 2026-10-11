import { html, raw } from '../../lib/html.js';
import { imgUrl } from '../../lib/images.js';
import { breadcrumbLd } from '../../lib/seo.js';
import { layout } from '../layout.js';
import { card, bottomBar, ROOMS } from '../components.js';
import { RESERVED_SLUGS } from '../../../shared/slug.js';

const roomSelect = () => html`<select class="field" data-filter-room aria-label="Filter by room"><option value="">All rooms</option>${Object.entries(ROOMS).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select>`;
const search = () => html`<input class="field" type="search" data-filter-q placeholder="Search, e.g. study table" aria-label="Search furniture" autocomplete="off">`;

const emptyState = () => html`<div class="empty" data-empty hidden><p><strong>Nothing matches that.</strong></p><p>Can’t find it? We make custom furniture. Tell us what you need.</p><a class="btn" href="/custom/">Start a custom design</a></div>`;

function collectionPage(ctx) {
  const chips = html`<div class="chips" role="group" aria-label="Category"><button type="button" class="chip" data-chip="all" aria-pressed="true">All</button>${ctx.categories.map((c) => html`<button type="button" class="chip" data-chip="${c.slug}" aria-pressed="false">${c.name}</button>`)}</div>`;
  const first = ctx.published.find((p) => p.images.length)?.images[0];
  return {
    path: '/collection/',
    html: layout(ctx, {
      title: 'Furniture Collection | Shivam Furniture, Guwahati',
      description: 'Browse beds, sofas, dining, storage and study furniture from Shivam Furniture, Guwahati. Ask on WhatsApp for prices and custom options.',
      path: '/collection/',
      current: 'collection',
      ogImage: first ? imgUrl(ctx.supabaseUrl, first.path, 1600) : undefined,
      scripts: ['/js/filter.js'],
      bar: bottomBar(ctx),
      jsonLd: [breadcrumbLd(ctx.site, [['Home', '/'], ['Collection', '/collection/']])],
      body: html`<div class="wrap">
  <div style="padding-top:20px"><p class="eyebrow">The collection</p><h1 class="serif" style="font-size:clamp(2rem,6vw,3.2rem)">Find a piece you love.</h1><p class="lead">Message us for price, size and finish options, or visit the showroom.</p></div>
  <div class="controls"><div class="controls-row">${search()}${roomSelect()}</div>${chips}</div>
  <div class="grid" style="margin-top:16px">${ctx.published.map((p) => card(ctx, p))}</div>
  ${emptyState()}
</div><div class="section-tight"></div>`,
    }),
  };
}

function categoryPage(ctx, c) {
  const items = ctx.published.filter((p) => p.category_id === c.id);
  const first = items.find((p) => p.images.length)?.images[0];
  const chips = html`<div class="chips" aria-label="Categories"><a class="chip" href="/collection/">All</a>${ctx.categories.map((k) => html`<a class="chip" href="/${k.slug}/" ${raw(k.id === c.id ? 'aria-current="page"' : '')}>${k.name}</a>`)}</div>`;
  const lower = c.name.toLowerCase();
  return {
    path: `/${c.slug}/`,
    html: layout(ctx, {
      title: `${c.name} in Guwahati | Shivam Furniture`,
      description: `Browse ${lower} from Shivam Furniture, Guwahati. Handcrafted wooden furniture, ready-made or made to order. Ask on WhatsApp for prices.`,
      path: `/${c.slug}/`,
      current: 'collection',
      ogImage: first ? imgUrl(ctx.supabaseUrl, first.path, 1600) : undefined,
      scripts: items.length ? ['/js/filter.js'] : [],
      bar: bottomBar(ctx),
      jsonLd: [breadcrumbLd(ctx.site, [['Home', '/'], ['Collection', '/collection/'], [c.name, `/${c.slug}/`]])],
      body: html`<div class="wrap">
  <div style="padding-top:20px"><p class="eyebrow">Collection</p><h1 class="serif" style="font-size:clamp(2rem,6vw,3.2rem)">${c.name}</h1><p class="lead">Message us for price, size and finish options, or visit the showroom.</p></div>
  <div class="controls">${items.length ? html`<div class="controls-row">${search()}${roomSelect()}</div>` : ''}${chips}</div>
  ${items.length
    ? html`<div class="grid" style="margin-top:16px">${items.map((p) => card(ctx, p))}</div>${emptyState()}`
    : html`<div class="empty"><p><strong>New pieces coming soon.</strong></p><p>We also make ${lower} to order. Tell us what you have in mind.</p><a class="btn" href="/custom/">Start a custom design</a></div>`}
</div><div class="section-tight"></div>`,
    }),
  };
}

export function pages(ctx) {
  for (const c of ctx.categories) {
    if (RESERVED_SLUGS.has(c.slug)) throw new Error(`Category slug "${c.slug}" is reserved and would collide with a site path`);
  }
  return [collectionPage(ctx), ...ctx.categories.map((c) => categoryPage(ctx, c))];
}
