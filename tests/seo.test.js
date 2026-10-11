import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData, shape } from '../build/lib/data.js';
import { localBusinessLd, productLd, breadcrumbLd, sitemapXml } from '../build/lib/seo.js';

const ctx = { ...shape(await loadData({ fixture: true })), site: 'https://example.test' };

test('local business has address and phone, and omits empty hours', () => {
  const ld = localBusinessLd(ctx);
  assert.equal(ld['@type'], 'FurnitureStore');
  assert.equal(ld.address.postalCode, '781019');
  assert.equal(ld.telephone, '+917002023649');
  assert.equal('openingHours' in ld, false);
});
test('local business includes opening hours when set', () => {
  const ld = localBusinessLd({ ...ctx, settings: { ...ctx.settings, opening_hours: ['Mo-Sa 10:00-20:00'] } });
  assert.deepEqual(ld.openingHours, ['Mo-Sa 10:00-20:00']);
});
test('product markup has no price or offers', () => {
  const p = ctx.published.find((x) => x.slug === 'oak-queen-bed');
  const ld = productLd(ctx, p);
  assert.equal(ld['@type'], 'Product');
  assert.equal(ld.material, 'Oak');
  assert.equal(ld.image.length, 2);
  assert.equal('offers' in ld, false);
  assert.doesNotMatch(JSON.stringify(ld), /"price|priceCurrency|"offers"/i);
});
test('breadcrumb list is ordered from 1', () => {
  const ld = breadcrumbLd('https://example.test', [['Home', '/'], ['Beds', '/beds/']]);
  assert.equal(ld.itemListElement[1].position, 2);
  assert.equal(ld.itemListElement[1].item, 'https://example.test/beds/');
});
test('sitemap lists given paths as absolute URLs and escapes &', () => {
  const xml = sitemapXml('https://example.test', ['/', '/a&b/']);
  assert.match(xml, /<loc>https:\/\/example.test\/<\/loc>/);
  assert.match(xml, /a&amp;b/);
});
