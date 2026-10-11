import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists } from './helpers.js';

const BED = 'beds/oak-queen-bed/index.html';

test('product page has SEO basics and a preview image', async () => {
  const h = await read(BED);
  assert.match(h, /<title>Oak Queen Bed \| Beds \| Shivam Furniture, Guwahati<\/title>/);
  assert.match(h, /<link rel="canonical" href="https:\/\/example.test\/beds\/oak-queen-bed\/">/);
  assert.match(h, /property="og:image" content="https:\/\/fixture\.supabase\.co\/storage\/v1\/object\/public\/images\/products\/p1\/one-1600"/);
});
test('product page shows the chosen details', async () => {
  const h = await read(BED);
  assert.match(h, /L 210 × W 160 × H 90 cm/);
  assert.match(h, /Oak/);
  assert.match(h, /data-finish="Natural oak"/);
  assert.match(h, /data-finish="Walnut"/);
  assert.match(h, /Good to know/);
  assert.match(h, /In showroom/);
  assert.match(h, /Customisable/);
});
test('product page has enquiry, call and customise actions', async () => {
  const h = await read(BED);
  assert.match(h, /Ask about this piece/);
  assert.match(h, /Customise this piece/);
  assert.match(h, /href="tel:\+917002023649"/);
  assert.match(h, /data-wa="product"/);
  assert.match(h, /data-wa="customise"/);
  assert.match(h, /data-share/);
});
test('optional sections are hidden when empty', async () => {
  const h = await read('sofas/tea-and-coffee-table/index.html');
  assert.doesNotMatch(h, /Dimensions/);
  assert.doesNotMatch(h, /Good to know/);
  assert.doesNotMatch(h, /Finishes/);
  assert.doesNotMatch(h, />Customisable</);
  assert.match(h, /Ready in 10 days/);
});
test('a piece without photos shows a placeholder and no og:image', async () => {
  const h = await read('study/plain-study-desk/index.html');
  assert.match(h, /Photo coming soon/);
  assert.doesNotMatch(h, /og:image/);
});
test('styled shots are labelled', async () => {
  assert.match(await read(BED), /Styled shot/);
});
test('product markup has no price', async () => {
  const h = await read(BED);
  assert.match(h, /"@type":"Product"/);
  assert.doesNotMatch(h, /"price"/);
});
test('related pieces appear only when there are some', async () => {
  assert.doesNotMatch(await read(BED), /More from/);
});
test('drafts get no page', async () => {
  assert.equal(await exists('sofas/draft-sofa/index.html'), false);
});
