import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData, shape } from '../build/lib/data.js';
import { imgUrl } from '../build/lib/images.js';

const ctx = shape(await loadData({ fixture: true }));

test('published excludes drafts and unpublished', () => {
  const slugs = ctx.published.map((p) => p.slug);
  assert.ok(slugs.includes('oak-queen-bed'));
  assert.ok(!slugs.includes('draft-sofa'));
  assert.ok(!slugs.includes('retired-table'));
});
test('unlisted contains only unpublished pieces', () => {
  assert.deepEqual(ctx.unlisted.map((p) => p.slug), ['retired-table']);
});
test('products carry their category and sorted images', () => {
  const p = ctx.published.find((x) => x.slug === 'oak-queen-bed');
  assert.equal(p.category.slug, 'beds');
  assert.deepEqual(p.images.map((i) => i.sort_order), [0, 1]);
});
test('a piece with no photos still shapes', () => {
  assert.equal(ctx.published.find((x) => x.slug === 'plain-study-desk').images.length, 0);
});
test('imgUrl builds a public storage URL with a size suffix', () => {
  assert.equal(imgUrl('https://x.supabase.co', 'products/a/b', 800), 'https://x.supabase.co/storage/v1/object/public/images/products/a/b-800');
});
