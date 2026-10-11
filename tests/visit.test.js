import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';
import { loadData, shape } from '../build/lib/data.js';
import { str } from '../build/lib/html.js';
import { pages } from '../build/templates/pages/visit.js';

const base = { ...shape(await loadData({ fixture: true })), site: 'https://example.test' };

test('visit page has address, directions and call', async () => {
  const h = await read('visit/index.html');
  assert.match(h, /Kahilipara/);
  assert.match(h, /Get directions/);
  assert.match(h, /href="tel:\+917002023649"/);
});
test('sections with content appear, sections without are hidden', async () => {
  const h = await read('visit/index.html');
  assert.match(h, /id="warranty"/);
  assert.match(h, /\[fixture\] Warranty text\./);
  assert.match(h, /Google review/);
  for (const id of ['delivery', 'about', 'workshop', 'hours']) assert.doesNotMatch(h, new RegExp(`id="${id}"`));
});
test('all optional sections render when the owner fills them in', () => {
  const ctx = {
    ...base,
    settings: {
      ...base.settings,
      delivery_text: 'Delivery text',
      years_text: 'Years text',
      hours: 'Mon–Sat 10am–8pm',
      gbp_url: 'https://g.page/example',
      workshop_photos: [{ path: 'workshop/a', alt: 'Workshop' }],
    },
  };
  const h = str(pages(ctx)[0].html);
  for (const id of ['delivery', 'about', 'workshop', 'hours']) assert.match(h, new RegExp(`id="${id}"`));
  assert.match(h, /https:\/\/g\.page\/example/);
});
