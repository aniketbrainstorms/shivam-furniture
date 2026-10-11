import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists } from './helpers.js';
import { pages } from '../build/templates/pages/collection.js';

test('collection lists published pieces only', async () => {
  const h = await read('collection/index.html');
  for (const n of ['Oak Queen Bed', 'Tea &amp; Coffee Table', 'Plain Study Desk']) assert.match(h, new RegExp(n));
  assert.doesNotMatch(h, /Draft Sofa/);
  assert.doesNotMatch(h, /Retired Table/);
});
test('collection has search, room filter, chips and an empty state', async () => {
  const h = await read('collection/index.html');
  assert.match(h, /data-filter-q/);
  assert.match(h, /data-filter-room/);
  assert.match(h, /data-chip="beds"/);
  assert.match(h, /data-empty/);
  assert.match(h, /src="\/js\/filter.js"/);
});
test('cards show availability, customisable tag and WhatsApp link', async () => {
  const h = await read('collection/index.html');
  assert.match(h, /In showroom/);
  assert.match(h, /Ready in 10 days/);
  assert.match(h, /Made to order/);
  assert.match(h, /Customisable/);
  assert.match(h, /https:\/\/wa\.me\/917002023649\?text=/);
});
test('a card without photos shows the placeholder', async () => {
  assert.match(await read('collection/index.html'), /Photo coming soon/);
});
test('category page lists only its own pieces', async () => {
  const h = await read('beds/index.html');
  assert.match(h, /Oak Queen Bed/);
  assert.doesNotMatch(h, /Plain Study Desk/);
  assert.doesNotMatch(h, /Retired Table/);
  assert.match(h, /<title>Beds in Guwahati/);
});
test('an empty category says so and offers the custom path', async () => {
  const h = await read('dining/index.html');
  assert.match(h, /New pieces coming soon/);
  assert.match(h, /href="\/custom\/"/);
});
test('reserved slugs are rejected at build time', () => {
  const bad = { categories: [{ id: 'x', name: 'Admin', slug: 'admin', sort_order: 1 }], published: [], settings: {}, site: 'https://x.test' };
  assert.throws(() => pages(bad), /reserved/i);
});
test('unpublished pieces have no listing page', async () => {
  assert.equal(await exists('sofas/draft-sofa/index.html'), false);
});
