import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists } from './helpers.js';

test('build writes robots, sitemap and build.json', async () => {
  assert.match(await read('robots.txt'), /Disallow: \/admin\//);
  assert.match(await read('robots.txt'), /Sitemap: https:\/\/example.test\/sitemap.xml/);
  assert.match(await read('sitemap.xml'), /<urlset/);
  assert.ok(JSON.parse(await read('build.json')).builtAt);
});
test('build copies static assets and shared modules', async () => {
  assert.ok(await exists('css/site.css'));
  assert.ok(await exists('shared/messages.js'));
  assert.ok(await exists('_headers'));
});
test('admin config is generated from the environment, not committed', async () => {
  assert.match(await read('admin/config.js'), /SUPABASE_URL/);
});
