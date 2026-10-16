// Supabase Edge Function "publish": lets a logged-in admin start a website rebuild on GitHub.
// Secret needed: GH_DISPATCH_TOKEN (fine-grained GitHub token, Actions: read and write, this repo only).
import { createClient } from 'npm:@supabase/supabase-js@2';

const REPO = 'aniketbrainstorms/shivam-furniture';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Use POST' }, 405);

  // Only a logged-in admin may publish (the anon key alone is not enough).
  const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return reply({ error: 'Please log in again.' }, 401);

  const token = Deno.env.get('GH_DISPATCH_TOKEN');
  if (!token) return reply({ error: 'Publishing is not set up yet (missing GitHub token).' }, 500);

  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/pages.yml/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'shivam-furniture-publish',
    },
    body: JSON.stringify({ ref: 'main' }),
  });
  if (!r.ok) return reply({ error: `GitHub refused the request (${r.status}). Check the token.` }, 502);
  return reply({ ok: true });
});
