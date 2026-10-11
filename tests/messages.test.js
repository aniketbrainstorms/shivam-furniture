import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waLink, telLink, msgProduct, msgCustomiseProduct, msgCustomForm, msgGeneral, msgCustomSkip } from '../shared/messages.js';

test('waLink round-trips awkward characters', () => {
  const text = "Tea & Coffee Table 50% #1 — 'Nest'\nline two";
  const url = new URL(waLink('917002023649', text));
  assert.equal(url.origin + url.pathname, 'https://wa.me/917002023649');
  assert.equal(url.searchParams.get('text'), text);
});
test('telLink adds plus', () => {
  assert.equal(telLink('917002023649'), 'tel:+917002023649');
});
test('msgProduct names the piece and asks for price, size, finish, availability', () => {
  const m = msgProduct('Oak Bed');
  assert.match(m, /Oak Bed/);
  for (const w of ['price', 'dimensions', 'finishes', 'availability']) assert.match(m, new RegExp(w));
});
test('msgProduct mentions a chosen finish', () => {
  assert.match(msgProduct('Oak Bed', 'Walnut'), /Walnut finish/);
  assert.doesNotMatch(msgProduct('Oak Bed'), /finish\./);
});
test('msgCustomiseProduct names the piece', () => {
  assert.match(msgCustomiseProduct('Oak Bed'), /Oak Bed/);
});
test('msgCustomForm includes only filled fields and the photo note', () => {
  const m = msgCustomForm({ type: 'Wardrobe', size: '', finish: 'Walnut', room: 'Bedroom', notes: '' });
  assert.match(m, /Type of furniture: Wardrobe/);
  assert.match(m, /Preferred finish: Walnut/);
  assert.match(m, /Room: Bedroom/);
  assert.doesNotMatch(m, /Approximate size/);
  assert.match(m, /reference photos in this chat/);
});
test('general and skip messages are plain strings', () => {
  assert.equal(typeof msgGeneral(), 'string');
  assert.match(msgCustomSkip(), /custom/i);
});
