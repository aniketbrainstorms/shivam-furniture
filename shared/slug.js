export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

export function uniqueSlug(base, taken) {
  const root = slugify(base) || 'piece';
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

export const RESERVED_SLUGS = new Set(['collection', 'custom', 'visit', 'admin', 'css', 'js', 'shared', 'sitemap.xml', 'robots.txt', 'build.json', '404.html']);
