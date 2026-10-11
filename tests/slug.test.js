import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, uniqueSlug } from '../shared/slug.js';

test('slugify lowercases and hyphenates', () => {
  assert.equal(slugify('Sheesham Queen Bed'), 'sheesham-queen-bed');
});
test('slugify handles punctuation and ampersands', () => {
  assert.equal(slugify('  Tea & Coffee Table!! '), 'tea-and-coffee-table');
});
test('slugify strips accents', () => {
  assert.equal(slugify('Café Chair'), 'cafe-chair');
});
test('slugify of nothing usable is empty', () => {
  assert.equal(slugify('!!!'), '');
});
test('uniqueSlug appends a counter on collision', () => {
  assert.equal(uniqueSlug('Bed', new Set(['bed', 'bed-2'])), 'bed-3');
});
test('uniqueSlug falls back to "piece"', () => {
  assert.equal(uniqueSlug('!!!', new Set()), 'piece');
});

import { RESERVED_SLUGS } from '../shared/slug.js';

test('reserved slugs cover the site paths a category could collide with', () => {
  for (const s of ['collection', 'custom', 'visit', 'admin', 'css', 'js', 'shared']) assert.ok(RESERVED_SLUGS.has(s), s);
});
