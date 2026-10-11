export const isLocal = (path) => path.startsWith('img/');
export const imgUrl = (supabaseUrl, path, size) =>
  isLocal(path) ? `/${path}` : `${supabaseUrl}/storage/v1/object/public/images/${path}-${size}`;
