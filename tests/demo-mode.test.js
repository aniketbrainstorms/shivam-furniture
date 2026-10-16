import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from '../build/build.js';

const out = await mkdtemp(path.join(tmpdir(), 'demo-'));
await build({ demo: true, outDir: out, siteUrl: 'https://x.github.io/shivam-furniture' });
const files = (await readdir(out, { recursive: true })).filter((f) => f.endsWith('.html'));
const exists = (p) => access(path.join(out, p)).then(() => true, () => false);

test('demo build is noindex, hides admin, has no prices', async () => {
  assert.match(await readFile(path.join(out, 'robots.txt'), 'utf8'), /Disallow: \/\n/);
  assert.equal(await exists('admin/index.html'), false);
  for (const f of files) {
    const h = await readFile(path.join(out, f), 'utf8');
    assert.match(h, /noindex/, f);
    assert.doesNotMatch(h, /₹|"price"/, f);
  }
});
test('every internal link and asset resolves under the base path', async () => {
  for (const f of files) {
    const h = await readFile(path.join(out, f), 'utf8');
    assert.doesNotMatch(h, /(href|src|data-zoom)="\/(?!shivam-furniture\/|\/)/, `unprefixed URL in ${f}`);
    for (const m of h.matchAll(/(?:href|src|data-zoom)="\/shivam-furniture(\/[^"#?]*)"/g)) {
      const t = m[1];
      assert.ok(await exists(t.endsWith('/') ? `${t}index.html` : t), `broken ${t} in ${f}`);
    }
  }
});
test('admin page is included, with config, when Supabase values are provided', async () => {
  const o2 = await mkdtemp(path.join(tmpdir(), 'demo-admin-'));
  process.env.SUPABASE_URL = 'https://abc.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  try { await build({ demo: true, outDir: o2, siteUrl: 'https://x.test' }); } finally { delete process.env.SUPABASE_URL; delete process.env.SUPABASE_ANON_KEY; }
  assert.match(await readFile(path.join(o2, 'admin', 'config.js'), 'utf8'), /abc\.supabase\.co/);
  assert.ok(await access(path.join(o2, 'admin', 'index.html')).then(() => true, () => false));
});
