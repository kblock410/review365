import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// manually load .env.local
const env = readFileSync('./.env.local', 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g,'');
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await sb
  .from('stores')
  .select('id, name, category, area')
  .order('created_at');
console.log('ERROR:', error);
console.log('STORES:', JSON.stringify(data, null, 2));

// Also test the specific FALLBACK_STORE_ID
const { data: fb, error: fbErr } = await sb
  .from('stores')
  .select('id, name, area, category, keywords, average_rating, total_reviews, map_rank')
  .eq('id', '00000000-0000-0000-0000-000000000001')
  .single();
console.log('\nFALLBACK query:');
console.log('error:', fbErr);
console.log('data:', fb);
