import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export { SUPABASE_URL, SUPABASE_ANON_KEY };
export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const publicUrl = (path, size) => `${SUPABASE_URL}/storage/v1/object/public/images/${path}-${size}`;
