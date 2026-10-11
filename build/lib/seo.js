import { esc } from './html.js';
import { imgUrl } from './images.js';

export function localBusinessLd(ctx) {
  const s = ctx.settings;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FurnitureStore',
    name: 'Shivam Furniture',
    url: ctx.site + '/',
    telephone: `+${s.phone}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.address,
      addressLocality: s.locality ?? undefined,
      addressRegion: s.region ?? undefined,
      postalCode: s.postal_code ?? undefined,
      addressCountry: 'IN',
    },
  };
  if (s.opening_hours?.length) ld.openingHours = s.opening_hours;
  if (s.gbp_url) ld.sameAs = [s.gbp_url];
  return ld;
}

export function productLd(ctx, p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    url: `${ctx.site}/${p.category.slug}/${p.slug}/`,
    brand: { '@type': 'Brand', name: 'Shivam Furniture' },
    material: p.material,
    category: p.category.name,
    image: p.images.map((i) => imgUrl(ctx.supabaseUrl, i.path, 1600)),
    description: `${p.name} by Shivam Furniture, Guwahati. Contact the showroom for price and customisation.`,
  };
}

export function breadcrumbLd(site, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site + path })),
  };
}

export function sitemapXml(site, paths) {
  const urls = paths.map((p) => `  <url><loc>${esc(site + p)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
