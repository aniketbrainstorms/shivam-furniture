import { db } from './db.js';

async function encode(canvas) {
  const webp = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.82));
  if (webp && webp.type === 'image/webp') return webp;
  return new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
}

export async function processImage(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const render = (maxW) => {
    const scale = Math.min(1, maxW / bmp.width);
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return encode(c);
  };
  const [large, small] = await Promise.all([render(1600), render(800)]);
  bmp.close();
  return { large, small };
}

/** Uploads both sizes under `${prefix}/${uuid}` and returns that base path. */
export async function uploadPair(prefix, file) {
  const { large, small } = await processImage(file);
  const path = `${prefix}/${crypto.randomUUID()}`;
  const up = (size, blob) => db.storage.from('images').upload(`${path}-${size}`, blob, { contentType: blob.type, cacheControl: '31536000' });
  const [a, b] = await Promise.all([up(1600, large), up(800, small)]);
  if (a.error || b.error) {
    await removePair(path).catch(() => {});
    throw new Error((a.error || b.error).message);
  }
  return path;
}

export async function removePair(path) {
  const { error } = await db.storage.from('images').remove([`${path}-1600`, `${path}-800`]);
  if (error) throw new Error(error.message);
}
