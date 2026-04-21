// 重複する店舗をリストアップするだけのスクリプト（削除はしない）
// 実行: node list_duplicates.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('./.env.local', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [k, ...v] = line.split('=');
    vars[k.trim()] = v.join('=').trim();
  }
});

const sb = createClient(
  vars.NEXT_PUBLIC_SUPABASE_URL,
  vars.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await sb
  .from('stores')
  .select('id, name, area, category, created_at')
  .order('created_at', { ascending: true });

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(`\n=== Stores in DB (total: ${data.length}) ===\n`);
data.forEach((s, i) => {
  console.log(`${i + 1}. id=${s.id}`);
  console.log(`   name: ${s.name}`);
  console.log(`   area: ${s.area} | category: ${s.category}`);
  console.log(`   created_at: ${s.created_at}`);
  console.log('');
});

// 同名重複を検出
const byName = {};
data.forEach(s => {
  byName[s.name] = byName[s.name] ?? [];
  byName[s.name].push(s);
});

const duplicates = Object.entries(byName).filter(([, list]) => list.length > 1);
if (duplicates.length === 0) {
  console.log('重複はありません。');
} else {
  console.log('=== 同名の重複 ===\n');
  duplicates.forEach(([name, list]) => {
    console.log(`「${name}」が ${list.length} 件あります:`);
    list.forEach((s, i) => {
      const marker = i === list.length - 1 ? ' ← 最も新しい（削除候補）' : '';
      console.log(`  ${i + 1}. ${s.id}  (created_at: ${s.created_at})${marker}`);
    });
    console.log('');
  });
}
