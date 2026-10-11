export const imgUrl = (supabaseUrl, path, size) =>
  `${supabaseUrl}/storage/v1/object/public/images/${path}-${size}`;
