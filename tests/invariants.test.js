import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { builtSite, read, exists } from './helpers.js';

const htmlFiles = async () => {
  const dir = await builtSite();
  const all = await readdir(dir, { recursive: true });
  return all.filter((f) => f.endsWith('.html') && !f.startsWith('admin')).map((f) => [f, path.join(dir, f)]);
};

test('an unpublished piece keeps its URL with a "no longer listed" page', async () => {
  const h = await read('beds/retired-table/index.html');
  assert.match(h, /no longer listed/i);
  assert.match(h, /<meta name="robots" content="noindex">/);
  assert.match(h, /href="\/beds\/"/);
});
test('404 page exists and is noindex', async () => {
  assert.match(await read('404.html'), /noindex/);
});
test('sitemap includes live pages and excludes drafts, unlisted, 404 and admin', async () => {
  const xml = await read('sitemap.xml');
  for (const p of ['/', '/collection/', '/custom/', '/visit/', '/beds/', '/beds/oak-queen-bed/', '/sofas/tea-and-coffee-table/']) {
    assert.ok(xml.includes(`<loc>https://example.test${p}</loc>`), `missing ${p}`);
  }
  for (const p of ['draft-sofa', 'retired-table', '404', 'admin']) assert.ok(!xml.includes(p), `should not list ${p}`);
});
test('no price appears anywhere on the public site', async () => {
  for (const [name, file] of await htmlFiles()) {
    const h = await readFile(file, 'utf8');
    assert.doesNotMatch(h, /₹|\bRs\.?\s?\d|\bINR\b|\$\s?\d|"price"/, `price-like text in ${name}`);
  }
});
test('every page has a title, description and canonical', async () => {
  for (const [name, file] of await htmlFiles()) {
    const h = await readFile(file, 'utf8');
    assert.match(h, /<title>[^<]+<\/title>/, name);
    assert.match(h, /<meta name="description" content="[^"]+">/, name);
    assert.match(h, /<link rel="canonical" href="https:\/\/example.test\//, name);
  }
});
test('every internal page link resolves to a built page', async () => {
  const targets = new Set();
  for (const [, file] of await htmlFiles()) {
    for (const m of (await readFile(file, 'utf8')).matchAll(/href="(\/[^"#?]*)"/g)) targets.add(m[1]);
  }
  for (const t of targets) {
    if (t.startsWith('/admin') || /\.[a-z0-9]+$/i.test(t)) continue;
    assert.ok(await exists(t.endsWith('/') ? `${t}index.html` : t), `broken link ${t}`);
  }
});
test('brand, phone and address are marked do-not-translate on every page', async () => {
  for (const [name, file] of await htmlFiles()) {
    const h = await readFile(file, 'utf8');
    assert.match(h, /class="brand-name" translate="no"/, name);
    assert.match(h, /<address translate="no">/, name);
  }
});
