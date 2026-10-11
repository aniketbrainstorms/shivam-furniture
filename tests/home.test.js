import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

test('home has canonical URL, hero copy and no-translate markers', async () => {
  const h = await read('index.html');
  assert.match(h, /<link rel="canonical" href="https:\/\/example.test\/">/);
  assert.match(h, /Made with Care\. Made for You\./);
  assert.match(h, /translate="no"/);
});
test('home links to every category and to the custom page', async () => {
  const h = await read('index.html');
  for (const slug of ['beds', 'sofas', 'study', 'dining']) assert.match(h, new RegExp(`href="/${slug}/"`));
  assert.match(h, /href="\/custom\/"/);
  assert.match(h, /Start a custom design/);
});
test('home shows featured pieces only', async () => {
  const h = await read('index.html');
  assert.match(h, /Oak Queen Bed/);
  assert.doesNotMatch(h, /Plain Study Desk/);
});
test('home has the contact bar and local business markup', async () => {
  const h = await read('index.html');
  assert.match(h, /class="bar"/);
  assert.match(h, /"@type":"FurnitureStore"/);
});
