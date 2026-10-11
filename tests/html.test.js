import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, str } from '../build/lib/html.js';

test('escapes interpolated strings', () => {
  assert.equal(str(html`<p>${'<b>"x"</b> & \'y\''}</p>`), '<p>&lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; &#39;y&#39;</p>');
});
test('does not double-escape nested html', () => {
  const inner = html`<i>${'a&b'}</i>`;
  assert.equal(str(html`<p>${inner}</p>`), '<p><i>a&amp;b</i></p>');
});
test('joins arrays and drops null/false/undefined', () => {
  assert.equal(str(html`<ul>${[html`<li>1</li>`, null, false, undefined, html`<li>2</li>`]}</ul>`), '<ul><li>1</li><li>2</li></ul>');
});
test('raw passes through untouched', () => {
  assert.equal(str(html`${raw('<br>')}`), '<br>');
});
