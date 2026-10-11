import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists } from './helpers.js';

test('admin page is noindex and ships its modules', async () => {
  assert.match(await read('admin/index.html'), /<meta name="robots" content="noindex,nofollow">/);
  for (const f of ['app.js', 'db.js', 'ui.js', 'image.js', 'admin.css', 'config.js']) assert.ok(await exists(`admin/${f}`), f);
});
test('headers keep the admin out of search and the cache', async () => {
  assert.match(await read('_headers'), /\/admin\/\*\n\s+X-Robots-Tag: noindex, nofollow/);
});
test('the admin is not linked from any public page', async () => {
  for (const f of ['index.html', 'collection/index.html', 'visit/index.html', 'custom/index.html']) {
    assert.doesNotMatch(await read(f), /href="\/admin/);
  }
});
