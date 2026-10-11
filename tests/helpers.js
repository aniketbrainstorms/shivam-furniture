import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from '../build/build.js';

let dirPromise;
export const builtSite = () => (dirPromise ??= (async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'sf-'));
  await build({ fixture: true, outDir: dir, siteUrl: 'https://example.test' });
  return dir;
})());
export const read = async (rel) => readFile(path.join(await builtSite(), rel), 'utf8');
export const exists = async (rel) => readFile(path.join(await builtSite(), rel)).then(() => true, () => false);
