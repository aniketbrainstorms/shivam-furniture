import { html } from '../../lib/html.js';
import { layout } from '../layout.js';
import { bottomBar } from '../components.js';

function notice(ctx, { path, title, heading, text, back }) {
  return {
    path,
    index: false,
    html: layout(ctx, {
      title,
      description: 'This page is not available. Browse the Shivam Furniture collection or ask us about custom furniture.',
      path,
      noindex: true,
      bar: bottomBar(ctx),
      body: html`<div class="wrap section"><h1 class="serif" style="font-size:clamp(2rem,6vw,3rem)">${heading}</h1><p class="lead">${text}</p>
        <div class="btn-row">${back ? html`<a class="btn" href="${back.href}">${back.label}</a>` : ''}<a class="btn btn-ghost" href="/collection/">See the collection</a><a class="btn btn-ghost" href="/custom/">Start a custom design</a></div></div>`,
    }),
  };
}

export function pages(ctx) {
  const gone = ctx.unlisted.map((p) =>
    notice(ctx, {
      path: `/${p.category.slug}/${p.slug}/`,
      title: `${p.name} is no longer listed | Shivam Furniture`,
      heading: 'This piece is no longer listed',
      text: `${p.name} is not currently in our catalogue. We may be able to make something similar, so message us.`,
      back: { href: `/${p.category.slug}/`, label: `More ${p.category.name.toLowerCase()}` },
    }),
  );
  return [
    ...gone,
    notice(ctx, { path: '/404.html', title: 'Page not found | Shivam Furniture', heading: 'We couldn’t find that page', text: 'The link may be old. Try the collection, or message us and we will help.' }),
  ];
}
