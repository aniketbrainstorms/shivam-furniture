import { mkdir, rm, writeFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadData, shape } from './lib/data.js';
import { sitemapXml } from './lib/seo.js';
import { str } from './lib/html.js';
import * as home from './templates/pages/home.js';
import * as collection from './templates/pages/collection.js';
import * as product from './templates/pages/product.js';
import * as custom from './templates/pages/custom.js';
import * as visit from './templates/pages/visit.js';
import * as tombstones from './templates/pages/tombstones.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Page modules are added here by later tasks. Each exports pages(ctx) -> [{ path, html, index? }]
const modules = [home, collection, product, custom, visit, tombstones];

export async function build({ fixture = false, demo = false, outDir = path.join(root, 'dist'), siteUrl } = {}) {
  const data = shape(await loadData({ fixture, demo }));
  const site = (siteUrl ?? process.env.SITE_URL ?? 'http://localhost:4173').replace(/\/$/, '');
  const base = new URL(site).pathname.replace(/\/$/, ''); // '' on a custom domain, '/repo-name' on github.io/repo-name
  const ctx = { ...data, site, preview: demo };
  const rebase = (h) => (base ? h.replace(/\b(href|src|data-zoom|action)="\/(?!\/)/g, `$1="${base}/`) : h);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const pages = modules.flatMap((m) => m.pages(ctx));
  for (const pg of pages) {
    const file = pg.path.endsWith('/') ? path.join(outDir, pg.path, 'index.html') : path.join(outDir, pg.path);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, rebase(str(pg.html)));
  }

  await cp(path.join(root, 'public'), outDir, { recursive: true });
  await cp(path.join(root, 'shared'), path.join(outDir, 'shared'), { recursive: true });
  if (!demo) {
    await cp(path.join(root, 'admin'), path.join(outDir, 'admin'), { recursive: true });
    const supa = process.env.SUPABASE_URL ?? ctx.supabaseUrl;
    const anon = process.env.SUPABASE_ANON_KEY ?? 'FIXTURE_ANON_KEY';
    await writeFile(
      path.join(outDir, 'admin', 'config.js'),
      `// generated at build time from SUPABASE_URL and SUPABASE_ANON_KEY (public values)\nexport const SUPABASE_URL = ${JSON.stringify(supa)};\nexport const SUPABASE_ANON_KEY = ${JSON.stringify(anon)};\n`,
    );
  }

  await writeFile(
    path.join(outDir, 'robots.txt'),
    demo ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nDisallow: /admin/\nSitemap: ${site}/sitemap.xml\n`,
  );
  const indexable = pages.filter((p) => p.index !== false).map((p) => p.path);
  await writeFile(path.join(outDir, 'sitemap.xml'), sitemapXml(site, indexable));
  await writeFile(path.join(outDir, 'build.json'), JSON.stringify({ builtAt: new Date().toISOString(), pages: pages.length }));
  return { pages: pages.length, outDir };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build({ fixture: process.argv.includes('--fixture'), demo: process.argv.includes('--demo') })
    .then((r) => console.log(`Built ${r.pages} pages into ${r.outDir}`))
    .catch((e) => { console.error(e); process.exit(1); });
}
