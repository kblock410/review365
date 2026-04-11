-- 店舗テーブル
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'beauty',
  area text not null,
  keywords text[] default '{}',
  average_rating numeric(3,2) default 0,
  total_reviews int default 0,
  map_rank int,
  gbp_place_id text,
  line_channel_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- アンケートテーブル
create table if not exists surveys (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  keywords text[] default '{}',
  min_chars int default 150,
  max_chars int default 300,
  coupon_enabled boolean default false,
  coupon_text text,
  qr_code_url text,
  survey_url text,
  created_at timestamptz default now()
);

-- アンケート回答テーブル
create table if not exists survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references surveys(id) on delete cascade,
  store_id uuid references stores(id) on delete cascade,
  visit_reason text,
  menus text[] default '{}',
  rating int check (rating between 1 and 5),
  staff_rating text,
  atmosphere text,
  free_text text,
  language text default 'ja',
  generated_review text,
  posted_to_google boolean default false,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- 口コミテーブル
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  reviewer_name text not null,
  rating int check (rating between 1 and 5),
  text text not null,
  language text default 'ja',
  review_date date,
  replied boolean default false,
  reply_text text,
  replied_at timestamptz,
  source text default 'google',
  is_local_guide boolean default false,
  google_review_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MAP順位履歴テーブル
create table if not exists map_rankings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  keyword text not null,
  rank int,
  measured_at timestamptz default now()
);

-- インサイトテーブル（Googleマップインサイト）
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  date date not null,
  impressions int default 0,
  mobile_impressions int default 0,
  pc_impressions int default 0,
  click_rate numeric(5,4) default 0,
  phone_clicks int default 0,
  route_searches int default 0,
  website_clicks int default 0,
  menu_clicks int default 0,
  created_at timestamptz default now(),
  unique(store_id, date)
);

-- Row Level Security
alter table stores enable row level security;
alter table surveys enable row level security;
alter table survey_responses enable row level security;
alter table reviews enable row level security;
alter table map_rankings enable row level security;
alter table insights enable row level security;

-- 公開読み取りポリシー（アンケート回答用）
create policy "Public can insert survey responses"
  on survey_responses for insert with check (true);

create policy "Public can read surveys"
  on surveys for select using (true);

-- 認証済みユーザーの全操作
create policy "Auth users full access stores"
  on stores for all using (auth.role() = 'authenticated');

create policy "Auth users full access reviews"
  on reviews for all using (auth.role() = 'authenticated');

create policy "Auth users full access rankings"
  on map_rankings for all using (auth.role() = 'authenticated');

create policy "Auth users full access insights"
  on insights for all using (auth.role() = 'authenticated');

-- サンプルデータ
insert into stores (id, name, category, area, keywords, average_rating, total_reviews, map_rank)
values (
  '00000000-0000-0000-0000-000000000001',
  '銀座 美容室 Shion',
  'beauty',
  '銀座',
  array['銀座 美容室', '銀座 縮毛矯正', '銀座 ヘアサロン', '銀座 ヘアカット'],
  4.7,
  247,
  7
) on conflict (id) do nothing;
