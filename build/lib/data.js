import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

export async function loadData({ fixture = false } = {}) {
  if (fixture) {
    return JSON.parse(await readFile(new URL('../fixtures/sample.json', import.meta.url), 'utf8'));
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required (or pass --fixture)');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const [products, images, categories, settings, reviews, gallery] = await Promise.all([
    db.from('products').select('*').order('sort_order').order('created_at', { ascending: false }),
    db.from('product_images').select('*').order('sort_order'),
    db.from('categories').select('*').order('sort_order'),
    db.from('site_settings').select('*').eq('id', 1).single(),
    db.from('reviews').select('*').eq('visible', true).order('sort_order'),
    db.from('custom_gallery').select('*').eq('visible', true).order('sort_order'),
  ]);
  for (const r of [products, images, categories, settings, reviews, gallery]) {
    if (r.error) throw new Error(`Supabase: ${r.error.message}`);
  }
  return {
    supabaseUrl: url,
    products: products.data,
    images: images.data,
    categories: categories.data,
    settings: settings.data,
    reviews: reviews.data,
    gallery: gallery.data,
  };
}

export function shape(data) {
  const categories = [...data.categories].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const imgs = new Map();
  for (const im of data.images) {
    if (!imgs.has(im.product_id)) imgs.set(im.product_id, []);
    imgs.get(im.product_id).push(im);
  }
  const all = data.products.map((p) => ({
    ...p,
    rooms: p.rooms ?? [],
    finishes: p.finishes ?? [],
    category: catById.get(p.category_id) ?? null,
    images: (imgs.get(p.id) ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }));
  const published = all.filter((p) => {
    if (p.status !== 'published') return false;
    const ok = p.category && p.material?.trim() && p.availability;
    if (!ok) console.warn(`Skipping "${p.name}": published but missing required fields`);
    return Boolean(ok);
  });
  const unlisted = all.filter((p) => p.status === 'unpublished' && p.category);
  return { ...data, categories, published, unlisted };
}
