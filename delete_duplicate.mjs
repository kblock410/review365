// 指定したIDのstoreを1件削除する
// 実行: node delete_duplicate.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 削除対象のID（list_duplicates.mjs で確認したID）
const TARGET_ID = '65f5867d-e2f9-494c-abdc-ca7c54b8a538';

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

// 1) 対象storeの存在確認
const { data: target, error: fetchErr } = await sb
  .from('stores')
  .select('id, name, area, created_at')
  .eq('id', TARGET_ID)
  .single();

if (fetchErr) {
  console.error('Fetch error:', fetchErr);
  process.exit(1);
}

if (!target) {
  console.log(`ID ${TARGET_ID} のstoreは見つかりませんでした。`);
  process.exit(0);
}

console.log('\n=== 削除対象 ===');
console.log(`  id:         ${target.id}`);
console.log(`  name:       ${target.name}`);
console.log(`  area:       ${target.area}`);
console.log(`  created_at: ${target.created_at}`);
console.log('');

// 2) 関連する子テーブルを先にクリーンアップ
//    外部キー制約がある場合のために、よくある子テーブルをあらかじめ削除
const childTables = ['reviews', 'insights', 'survey_responses', 'responses', 'qr_codes'];
for (const table of childTables) {
  const { error: cErr, count } = await sb
    .from(table)
    .delete({ count: 'exact' })
    .eq('store_id', TARGET_ID);
  if (cErr) {
    // テーブルが存在しないエラーは無視（42P01 等）
    if (cErr.code === '42P01' || /not exist/i.test(cErr.message || '')) {
      console.log(`  [skip] ${table} : テーブルなし`);
    } else {
      console.log(`  [skip] ${table} : ${cErr.message}`);
    }
  } else {
    console.log(`  [clean] ${table} : ${count ?? 0} 件削除`);
  }
}

// 3) 本体を削除
console.log('\nstoreを削除します...');
const { error: delErr } = await sb
  .from('stores')
  .delete()
  .eq('id', TARGET_ID);

if (delErr) {
  console.error('\n削除エラー:', delErr);
  console.error('外部キー制約のエラーの場合、参照元テーブルをまずクリーンアップする必要があります。');
  console.error('エラーメッセージを教えていただければ、該当テーブルのクリーンアップ処理を追加します。');
  process.exit(1);
}

console.log('\n✓ 削除しました。');
