import { db, publicUrl } from './db.js';
import { h, toast, field } from './ui.js';
import { uniqueSlug } from '/shared/slug.js';
import { uploadPair, removePair } from './image.js';

const ROOMS = [['bedroom', 'Bedroom'], ['living', 'Living room'], ['dining', 'Dining'], ['study', 'Study / office'], ['kids', 'Kids’ room']];
const STATUS = { draft: 'Draft', published: 'Published', unpublished: 'Unpublished' };
const REMINDER = 'Saved. Press "Publish site" to put it on the website.';

/* ---------- list ---------- */
export async function viewProducts(root) {
  root.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));
  const [p, c] = await Promise.all([
    db.from('products').select('id,name,status,availability,ready_days,category_id,updated_at').order('updated_at', { ascending: false }),
    db.from('categories').select('id,name'),
  ]);
  if (p.error || c.error) return root.replaceChildren(h('p', { class: 'err' }, (p.error || c.error).message));
  const cat = new Map(c.data.map((x) => [x.id, x.name]));
  let q = '';
  let st = 'all';
  const list = h('div', { class: 'stack' });

  const item = (x) => {
    const opts = [['in_showroom', 'In showroom'], ['made_to_order', 'Made to order']];
    if (x.availability === 'ready_in_days') opts.push(['ready_in_days', `Ready in ${x.ready_days} days`]);
    const sel = h('select', { 'aria-label': `Availability for ${x.name}`, value: x.availability ?? '', onchange: async () => {
      const { error } = await db.from('products').update({ availability: sel.value }).eq('id', x.id);
      toast(error ? error.message : REMINDER, error ? 'err' : 'ok');
    } }, x.availability ? null : h('option', { value: '' }, 'Set availability'), opts.map(([v, l]) => h('option', { value: v }, l)));
    return h('div', { class: 'item' },
      h('div', {}, h('a', { href: `#/product/${x.id}` }, x.name), h('div', { class: 'muted' }, cat.get(x.category_id) ?? 'No category', ' · ', h('span', { class: `chip ${x.status}` }, STATUS[x.status]))),
      sel);
  };
  const draw = () => {
    const rows = p.data.filter((x) => (st === 'all' || x.status === st) && x.name.toLowerCase().includes(q));
    list.replaceChildren(...(rows.length ? rows.map(item) : [h('p', { class: 'muted' }, 'No pieces to show.')]));
  };

  root.replaceChildren(
    h('div', { class: 'row', style: 'margin-bottom:14px' },
      h('input', { type: 'search', placeholder: 'Search pieces', 'aria-label': 'Search pieces', style: 'flex:1;min-width:160px', oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } }),
      h('select', { 'aria-label': 'Filter by status', style: 'width:auto', onchange: (e) => { st = e.target.value; draw(); } }, h('option', { value: 'all' }, 'All'), Object.entries(STATUS).map(([k, v]) => h('option', { value: k }, v))),
      h('button', { type: 'button', onclick: () => { location.hash = '#/product/new'; } }, 'New piece')),
    list);
  draw();
}

/* ---------- form ---------- */
export async function viewProductForm(root, id) {
  root.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));
  const [cats, slugs] = await Promise.all([db.from('categories').select('id,name').order('sort_order'), db.from('products').select('slug')]);
  if (cats.error) return root.replaceChildren(h('p', { class: 'err' }, cats.error.message));
  let existing = null;
  let images = [];
  if (id) {
    const [pr, im] = await Promise.all([db.from('products').select('*').eq('id', id).single(), db.from('product_images').select('*').eq('product_id', id).order('sort_order')]);
    if (pr.error) return root.replaceChildren(h('p', { class: 'err' }, pr.error.message));
    existing = pr.data;
    images = im.data ?? [];
  }
  const p = existing ?? { name: '', category_id: '', rooms: [], material: '', size_label: '', availability: '', ready_days: '', customisable: false, dimensions: '', finishes: [], good_to_know: '', status: 'draft', featured: false, published_once: false };
  const locked = p.published_once;

  const f = {
    name: h('input', { type: 'text', value: p.name, required: true }),
    category: h('select', { value: p.category_id ?? '', disabled: locked }, h('option', { value: '' }, 'Choose…'), cats.data.map((c) => h('option', { value: c.id }, c.name))),
    material: h('input', { type: 'text', value: p.material, placeholder: 'e.g. Sheesham, Teak, Engineered wood' }),
    size: h('input', { type: 'text', value: p.size_label ?? '', placeholder: 'e.g. Queen, 3-seater, 4 ft' }),
    days: h('input', { type: 'number', min: 1, value: p.ready_days ?? '' }),
    dims: h('textarea', { value: p.dimensions ?? '', placeholder: 'e.g. L 210 × W 160 × H 90 cm' }),
    gtk: h('textarea', { value: p.good_to_know ?? '', placeholder: 'Storage, assembly, care' }),
    custom: h('input', { type: 'checkbox', checked: p.customisable }),
    featured: h('input', { type: 'checkbox', checked: p.featured }),
  };
  f.avail = h('select', { value: p.availability ?? '', onchange: () => syncDays() },
    h('option', { value: '' }, 'Choose…'), h('option', { value: 'in_showroom' }, 'In showroom'), h('option', { value: 'made_to_order' }, 'Made to order'), h('option', { value: 'ready_in_days' }, 'Ready in X days'));
  const daysLabel = field('Ready in how many days?', f.days);
  const syncDays = () => { daysLabel.hidden = f.avail.value !== 'ready_in_days'; };
  syncDays();

  const roomsBox = h('div', {}, ROOMS.map(([k, l]) => h('label', { class: 'check' }, h('input', { type: 'checkbox', value: k, checked: p.rooms.includes(k) }), l)));

  const finRows = h('div', {});
  const addFin = (fin = { name: '', hex: '#C7AD8D' }) => {
    const row = h('div', { class: 'fin-row' },
      h('input', { type: 'text', placeholder: 'Finish name', value: fin.name, 'data-fn': '' }),
      h('input', { type: 'color', value: fin.hex || '#C7AD8D', 'data-fh': '', 'aria-label': 'Colour' }),
      h('button', { type: 'button', class: 'ghost btn-sm', onclick: () => row.remove() }, 'Remove'));
    finRows.append(row);
  };
  p.finishes.forEach(addFin);
  const readFinishes = () => [...finRows.children].map((r) => ({ name: r.querySelector('[data-fn]').value.trim(), hex: r.querySelector('[data-fh]').value })).filter((x) => x.name);

  async function save(nextStatus) {
    const availability = f.avail.value || null;
    const payload = {
      name: f.name.value.trim(),
      category_id: f.category.value || null,
      rooms: [...roomsBox.querySelectorAll('input:checked')].map((i) => i.value),
      material: f.material.value.trim(),
      size_label: f.size.value.trim() || null,
      availability,
      ready_days: availability === 'ready_in_days' ? Number(f.days.value) || null : null,
      customisable: f.custom.checked,
      dimensions: f.dims.value.trim() || null,
      finishes: readFinishes(),
      good_to_know: f.gtk.value.trim() || null,
      featured: f.featured.checked,
      status: nextStatus,
    };
    if (!payload.name) throw new Error('Name is required');
    if (nextStatus === 'published') {
      const missing = [];
      if (!payload.category_id) missing.push('category');
      if (!payload.material) missing.push('material');
      if (!payload.availability) missing.push('availability');
      if (payload.availability === 'ready_in_days' && !payload.ready_days) missing.push('number of days');
      if (missing.length) throw new Error(`To publish, please fill in: ${missing.join(', ')}`);
    }
    if (existing) {
      const { error } = await db.from('products').update(payload).eq('id', existing.id);
      if (error) throw new Error(error.message);
      return existing.id;
    }
    const slug = uniqueSlug(payload.name, new Set(slugs.data.map((s) => s.slug)));
    const { data, error } = await db.from('products').insert({ ...payload, slug }).select('id').single();
    if (error) throw new Error(error.message);
    return data.id;
  }
  const run = (nextStatus, message) => async () => {
    try {
      const newId = await save(nextStatus);
      toast(message ?? REMINDER);
      if (!existing) location.hash = `#/product/${newId}`;
      else viewProductForm(root, newId);
    } catch (e) { toast(e.message, 'err'); }
  };

  const buttons = !existing
    ? [h('button', { type: 'button', onclick: run('draft', 'Saved as draft. You can add photos now.') }, 'Save draft')]
    : p.status === 'published'
      ? [h('button', { type: 'button', onclick: run('published') }, 'Save changes'),
         h('button', { type: 'button', class: 'danger', onclick: async () => {
           if (!confirm('Unpublish this piece? Its page will say "no longer listed" after the next Publish site.')) return;
           const { error } = await db.from('products').update({ status: 'unpublished' }).eq('id', existing.id);
           if (error) toast(error.message, 'err'); else { toast(REMINDER); viewProductForm(root, existing.id); }
         } }, 'Unpublish')]
      : [h('button', { type: 'button', class: 'ghost', onclick: run(p.status) }, 'Save'),
         h('button', { type: 'button', onclick: run('published', 'Published. Press "Publish site" to update the website.') }, 'Publish piece')];

  const form = h('form', { class: 'card-form', onsubmit: (e) => e.preventDefault() },
    h('h2', {}, existing ? p.name : 'New piece'),
    existing ? h('p', {}, h('span', { class: `chip ${p.status}` }, STATUS[p.status])) : null,
    field('Name *', f.name),
    field('Category *', f.category, locked ? 'Locked once published, so shared links keep working.' : 'Required to publish.'),
    h('fieldset', { style: 'border:0;padding:0;margin:0 0 12px' }, h('legend', { style: 'font-weight:600;font-size:.9rem' }, 'Room(s)'), roomsBox),
    field('Material *', f.material, 'Only state what is true for this piece, for example do not write "solid wood" unless it is.'),
    field('Size label', f.size, 'Shown on the card, for example "Queen".'),
    field('Availability *', f.avail), daysLabel,
    h('label', { class: 'check' }, f.custom, 'Customisable (we can change size or finish)'),
    field('Dimensions', f.dims),
    h('div', {}, h('strong', {}, 'Finishes'), finRows, h('button', { type: 'button', class: 'ghost btn-sm', onclick: () => addFin() }, 'Add a finish'), h('div', { style: 'height:12px' })),
    field('Good to know', f.gtk),
    h('label', { class: 'check' }, f.featured, 'Show on the home page'),
    h('div', { class: 'row' }, buttons));

  root.replaceChildren(h('p', {}, h('a', { href: '#/products' }, '← All pieces')), form, existing ? imagesSection(existing.id, images) : h('p', { class: 'muted' }, 'Save the draft first, then you can add photos.'));
}

/* ---------- photos ---------- */
function imagesSection(productId, initial) {
  const list = [...initial];
  const box = h('div', { class: 'imgs' });
  const patch = async (imgId, change) => {
    const { error } = await db.from('product_images').update(change).eq('id', imgId);
    if (error) toast(error.message, 'err');
  };
  const move = async (i, d) => {
    const a = list[i];
    const b = list[i + d];
    const [r1, r2] = await Promise.all([
      db.from('product_images').update({ sort_order: b.sort_order }).eq('id', a.id),
      db.from('product_images').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    if (r1.error || r2.error) return toast((r1.error || r2.error).message, 'err');
    [a.sort_order, b.sort_order] = [b.sort_order, a.sort_order];
    list.sort((x, y) => x.sort_order - y.sort_order);
    draw();
  };
  const remove = async (im) => {
    if (!confirm('Delete this photo?')) return;
    const { error } = await db.from('product_images').delete().eq('id', im.id);
    if (error) return toast(error.message, 'err');
    await removePair(im.path).catch(() => {});
    list.splice(list.indexOf(im), 1);
    draw();
  };
  function draw() {
    box.replaceChildren(...list.map((im, i) => h('div', { class: 'img' },
      h('img', { src: publicUrl(im.path, 800), alt: '' }),
      i === 0 ? h('p', { class: 'hint' }, 'First photo: used on cards and link previews') : null,
      h('input', { type: 'text', value: im.alt, placeholder: 'Describe the photo', 'aria-label': 'Photo description', onchange: (e) => patch(im.id, { alt: e.target.value }) }),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: im.is_styled, onchange: (e) => patch(im.id, { is_styled: e.target.checked }) }), 'Styled shot (not this exact piece)'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'ghost btn-sm', disabled: i === 0, onclick: () => move(i, -1) }, '← Earlier'),
        h('button', { type: 'button', class: 'ghost btn-sm', disabled: i === list.length - 1, onclick: () => move(i, 1) }, 'Later →'),
        h('button', { type: 'button', class: 'danger btn-sm', onclick: () => remove(im) }, 'Delete')))));
  }
  async function add(files) {
    for (const file of files) {
      try {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image`);
        toast(`Uploading ${file.name}…`);
        const path = await uploadPair(`products/${productId}`, file);
        const sort_order = (list.at(-1)?.sort_order ?? -1) + 1;
        const { data, error } = await db.from('product_images').insert({ product_id: productId, path, sort_order }).select().single();
        if (error) { await removePair(path).catch(() => {}); throw new Error(error.message); }
        list.push(data);
        draw();
      } catch (e) { toast(e.message, 'err'); }
    }
  }
  const input = h('input', { type: 'file', accept: 'image/*', multiple: true, 'aria-label': 'Choose photos', onchange: (e) => { add([...e.target.files]); e.target.value = ''; } });
  const drop = h('div', { class: 'drop',
    ondragover: (e) => { e.preventDefault(); drop.classList.add('over'); },
    ondragleave: () => drop.classList.remove('over'),
    ondrop: (e) => { e.preventDefault(); drop.classList.remove('over'); add([...e.dataTransfer.files]); } },
  h('p', {}, 'Drag photos here, or choose them. Photos are resized automatically.'), input);
  draw();
  return h('section', { class: 'card-form', style: 'margin-top:16px' }, h('h2', {}, 'Photos'), h('p', { class: 'hint' }, 'Suggested order: front, styled room shot, side, close-up of the wood, detail.'), drop, box);
}
