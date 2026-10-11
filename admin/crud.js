import { db, publicUrl } from './db.js';
import { h, toast, field } from './ui.js';
import { slugify, RESERVED_SLUGS } from '/shared/slug.js';
import { uploadPair, removePair } from './image.js';

/* ---------- generic list editor ---------- */
function control(fd, row) {
  const v = row[fd.key];
  if (fd.type === 'textarea') { const el = h('textarea', { value: v ?? '' }); return [el, () => el.value.trim()]; }
  if (fd.type === 'number') { const el = h('input', { type: 'number', value: v ?? 0 }); return [el, () => Number(el.value) || 0]; }
  if (fd.type === 'checkbox') { const el = h('input', { type: 'checkbox', checked: v ?? fd.default ?? false }); return [el, () => el.checked]; }
  if (fd.type === 'select') { const el = h('select', { value: v ?? fd.options[0][0] }, fd.options.map(([val, label]) => h('option', { value: val }, label))); return [el, () => el.value]; }
  if (fd.type === 'image') {
    const file = h('input', { type: 'file', accept: 'image/*' });
    const wrap = h('div', {}, v ? h('img', { class: 'thumb', src: publicUrl(v, 800), alt: '' }) : null, file);
    return [wrap, () => (file.files[0] ? { file: file.files[0] } : { keep: v ?? null })];
  }
  const el = h('input', { type: 'text', value: v ?? '', disabled: Boolean(fd.lockAfterCreate && row.id) });
  return [el, () => el.value.trim()];
}

export async function crudView(root, cfg) {
  const { data, error } = await db.from(cfg.table).select('*').order('sort_order');
  if (error) return root.replaceChildren(h('p', { class: 'err' }, error.message));
  const list = h('div', { class: 'stack' });

  function editor(row) {
    const getters = {};
    const parts = cfg.fields.map((fd) => {
      const [el, get] = control(fd, row);
      getters[fd.key] = get;
      return fd.type === 'checkbox' ? h('label', { class: 'check' }, el, fd.label) : field(fd.label, el, fd.hint);
    });
    const form = h('form', { class: 'card-form', onsubmit: (e) => e.preventDefault() }, parts,
      h('div', { class: 'row' },
        h('button', { type: 'button', onclick: async () => {
          try {
            const out = {};
            for (const fd of cfg.fields) {
              const val = await getters[fd.key]();
              if (fd.type === 'image') {
                if (val.file) { out[fd.key] = await uploadPair(cfg.imagePrefix, val.file); if (row[fd.key]) await removePair(row[fd.key]).catch(() => {}); }
                else out[fd.key] = val.keep;
              } else out[fd.key] = val;
            }
            cfg.beforeSave?.(out, row);
            for (const fd of cfg.fields.filter((x) => x.required)) if (!out[fd.key]) throw new Error(`${fd.label} is required`);
            const q = row.id ? db.from(cfg.table).update(out).eq('id', row.id) : db.from(cfg.table).insert(out);
            const { data: saved, error: err } = await q.select().single();
            if (err) throw new Error(err.message);
            toast('Saved. Press "Publish site" to put it on the website.');
            form.replaceWith(editor(saved));
          } catch (e) { toast(e.message, 'err'); }
        } }, 'Save'),
        row.id ? h('button', { type: 'button', class: 'danger', onclick: async () => {
          if (!confirm(`Delete this ${cfg.single}?`)) return;
          const { error: err } = await db.from(cfg.table).delete().eq('id', row.id);
          if (err) return toast(err.message, 'err');
          for (const fd of cfg.fields.filter((x) => x.type === 'image')) if (row[fd.key]) await removePair(row[fd.key]).catch(() => {});
          form.remove();
        } }, 'Delete') : null));
    return form;
  }

  list.append(...data.map(editor));
  root.replaceChildren(h('div', { class: 'row', style: 'margin-bottom:14px' }, h('h2', { style: 'flex:1;margin:0' }, cfg.title), h('button', { type: 'button', onclick: () => list.prepend(editor({})) }, `Add ${cfg.single}`)), list);
}

export const categoriesView = (root) => crudView(root, {
  table: 'categories', title: 'Categories', single: 'category', imagePrefix: 'categories',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'slug', label: 'Web address part', type: 'text', lockAfterCreate: true, hint: 'Leave blank to create it from the name. It cannot be changed later, because it is part of every product link.' },
    { key: 'cover_path', label: 'Cover photo (optional)', type: 'image' },
    { key: 'sort_order', label: 'Order (1 comes first)', type: 'number' },
  ],
  beforeSave(out, row) {
    if (row.id) { delete out.slug; return; }
    out.slug = slugify(out.slug || out.name);
    if (!out.slug) throw new Error('Please give the category a name');
    if (RESERVED_SLUGS.has(out.slug)) throw new Error(`"${out.slug}" is used by the site itself. Choose a different name.`);
  },
});

export const reviewsView = (root) => crudView(root, {
  table: 'reviews', title: 'Reviews', single: 'review',
  fields: [
    { key: 'name', label: 'Customer name', type: 'text', required: true },
    { key: 'body', label: 'Review text (only add reviews you have permission to show)', type: 'textarea', required: true },
    { key: 'source', label: 'Where it came from', type: 'select', options: [['google', 'Google review'], ['whatsapp', 'WhatsApp message']] },
    { key: 'visible', label: 'Show on the website', type: 'checkbox', default: true },
    { key: 'sort_order', label: 'Order', type: 'number' },
  ],
});

export const galleryView = (root) => crudView(root, {
  table: 'custom_gallery', title: 'Custom furniture gallery', single: 'photo', imagePrefix: 'custom',
  fields: [
    { key: 'path', label: 'Photo of a piece made for a customer', type: 'image', required: true },
    { key: 'caption', label: 'Short caption', type: 'text' },
    { key: 'visible', label: 'Show on the website', type: 'checkbox', default: true },
    { key: 'sort_order', label: 'Order', type: 'number' },
  ],
});

/* ---------- site settings ---------- */
const SETTINGS = [
  ['phone', 'Phone / WhatsApp number (digits with country code)', 'text', true],
  ['phone_display', 'Phone number as shown on the site', 'text', true],
  ['address', 'Showroom address', 'textarea', true],
  ['locality', 'City', 'text'], ['region', 'State', 'text'], ['postal_code', 'PIN code', 'text'],
  ['maps_url', 'Google Maps directions link', 'text'],
  ['gbp_url', 'Google Business Profile link', 'text'],
  ['hours', 'Opening hours (as shown to visitors)', 'textarea'],
  ['opening_hours', 'Opening hours for Google, comma separated (for example Mo-Sa 10:00-20:00)', 'csv'],
  ['delivery_text', 'Delivery areas and typical times (the section stays hidden while empty)', 'textarea'],
  ['warranty_text', 'Warranty and after-sales (hidden while empty)', 'textarea'],
  ['years_text', 'Years in business or homes furnished (hidden while empty)', 'textarea'],
];

export async function settingsView(root) {
  const { data: row, error } = await db.from('site_settings').select('*').eq('id', 1).single();
  if (error) return root.replaceChildren(h('p', { class: 'err' }, error.message));
  const inputs = {};
  const parts = SETTINGS.map(([key, label, type]) => {
    const value = type === 'csv' ? (row[key] ?? []).join(', ') : row[key] ?? '';
    inputs[key] = type === 'textarea' ? h('textarea', { value }) : h('input', { type: 'text', value });
    return field(label, inputs[key]);
  });
  const save = h('button', { type: 'button', onclick: async () => {
    const out = {};
    for (const [key, label, type, req] of SETTINGS) {
      const v = inputs[key].value.trim();
      if (req && !v) return toast(`${label} is required`, 'err');
      out[key] = type === 'csv' ? v.split(',').map((x) => x.trim()).filter(Boolean) : v || null;
    }
    const { error: err } = await db.from('site_settings').update(out).eq('id', 1);
    toast(err ? err.message : 'Saved. Press "Publish site" to put it on the website.', err ? 'err' : 'ok');
  } }, 'Save settings');

  const photos = [...(row.workshop_photos ?? [])];
  const grid = h('div', { class: 'imgs' });
  const persist = async () => {
    const { error: err } = await db.from('site_settings').update({ workshop_photos: photos }).eq('id', 1);
    if (err) toast(err.message, 'err'); else toast('Saved. Press "Publish site" to put it on the website.');
  };
  const draw = () => grid.replaceChildren(...photos.map((ph, i) => h('div', { class: 'img' },
    h('img', { src: publicUrl(ph.path, 800), alt: '' }),
    h('input', { type: 'text', value: ph.alt ?? '', placeholder: 'Describe the photo', 'aria-label': 'Photo description', onchange: (e) => { ph.alt = e.target.value; persist(); } }),
    h('button', { type: 'button', class: 'danger btn-sm', onclick: async () => { photos.splice(i, 1); await persist(); await removePair(ph.path).catch(() => {}); draw(); } }, 'Delete'))));
  const upload = h('input', { type: 'file', accept: 'image/*', multiple: true, 'aria-label': 'Add workshop photos', onchange: async (e) => {
    for (const file of e.target.files) {
      try { photos.push({ path: await uploadPair('workshop', file), alt: '' }); await persist(); draw(); } catch (err) { toast(err.message, 'err'); }
    }
    e.target.value = '';
  } });
  draw();

  root.replaceChildren(
    h('section', { class: 'card-form' }, h('h2', {}, 'Site settings'), parts, save),
    h('section', { class: 'card-form', style: 'margin-top:16px' }, h('h2', {}, 'Workshop photos'), h('p', { class: 'hint' }, 'Real photos of your workshop and makers. The section stays hidden until you add some.'), upload, grid));
}

/* ---------- backup ---------- */
export async function backupView(root) {
  root.replaceChildren(h('section', { class: 'card-form' },
    h('h2', {}, 'Backup'),
    h('p', {}, 'Download all your catalogue data as one file. Photos stay in storage; this file lists where they are.'),
    h('button', { type: 'button', onclick: async () => {
      const tables = ['categories', 'products', 'product_images', 'site_settings', 'reviews', 'custom_gallery'];
      const out = { exportedAt: new Date().toISOString() };
      for (const t of tables) {
        const { data, error } = await db.from(t).select('*');
        if (error) return toast(`${t}: ${error.message}`, 'err');
        out[t] = data;
      }
      const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })), download: `shivam-furniture-backup-${out.exportedAt.slice(0, 10)}.json` });
      document.body.append(a);
      a.click();
      a.remove();
    } }, 'Download backup (JSON)')));
}
