-- stores.menu_options: 業種別テンプレでメニュー質問を上書きするための店舗別選択肢
-- 飲食店: 料理/ドリンク選択肢
-- 美容室: カット/カラー等のメニュー選択肢
alter table stores
  add column if not exists menu_options text[] default '{}';
