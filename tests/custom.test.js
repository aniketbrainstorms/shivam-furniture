import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

test('custom page has the guided form wired to the shop number', async () => {
  const h = await read('custom/index.html');
  assert.match(h, /<form[^>]*data-custom-form[^>]*data-phone="917002023649"/);
  for (const name of ['type', 'size', 'finish', 'room', 'notes']) assert.match(h, new RegExp(`name="${name}"`));
  assert.match(h, /src="\/js\/custom-form.js"/);
});
test('custom page offers the skip-to-WhatsApp path and a photo reminder', async () => {
  const h = await read('custom/index.html');
  assert.match(h, /Skip, chat on WhatsApp/);
  assert.match(h, /href="https:\/\/wa\.me\/917002023649\?text=/);
  assert.match(h, /attach/i);
});
test('custom page explains the process and hides the empty gallery', async () => {
  const h = await read('custom/index.html');
  assert.match(h, /How it works/);
  assert.doesNotMatch(h, /id="custom-gallery"/);
});
