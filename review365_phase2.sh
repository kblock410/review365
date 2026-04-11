#!/bin/bash
set -e
echo "🚀 Phase 2: Supabase + LINE Bot + QRコード セットアップ"

# ── 1. Supabase schema SQL ──────────────────────────────────
mkdir -p supabase

cat > supabase/schema.sql << 'EOF'
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
EOF

echo "✅ Supabase schema SQL 作成完了"

# ── 2. Supabase client lib ──────────────────────────────────
mkdir -p lib

cat > lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// サーバーサイド用（Service Role Key使用）
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
EOF

echo "✅ Supabase client 作成完了"

# ── 3. DB operations lib ────────────────────────────────────
cat > lib/db.ts << 'EOF'
import { createServerClient } from './supabase'

// ─── Reviews ─────────────────────────────────────────────
export async function getReviews(storeId: string) {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('reviews')
    .select('*')
    .eq('store_id', storeId)
    .order('review_date', { ascending: false })
  if (error) throw error
  return data
}

export async function updateReviewReply(reviewId: string, replyText: string) {
  const sb = createServerClient()
  const { error } = await sb
    .from('reviews')
    .update({ replied: true, reply_text: replyText, replied_at: new Date().toISOString() })
    .eq('id', reviewId)
  if (error) throw error
}

export async function insertReview(review: {
  store_id: string
  reviewer_name: string
  rating: number
  text: string
  language: string
  review_date: string
  source?: string
  is_local_guide?: boolean
  google_review_id?: string
}) {
  const sb = createServerClient()
  const { data, error } = await sb.from('reviews').insert(review).select().single()
  if (error) throw error
  return data
}

// ─── Survey Responses ─────────────────────────────────────
export async function saveSurveyResponse(response: {
  survey_id?: string
  store_id: string
  visit_reason?: string
  menus?: string[]
  rating?: number
  staff_rating?: string
  atmosphere?: string
  free_text?: string
  language?: string
  generated_review?: string
}) {
  const sb = createServerClient()
  const { data, error } = await sb.from('survey_responses').insert(response).select().single()
  if (error) throw error
  return data
}

export async function getSurveyResponses(storeId: string, limit = 100) {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('survey_responses')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ─── Store ───────────────────────────────────────────────
export async function getStore(storeId: string) {
  const sb = createServerClient()
  const { data, error } = await sb.from('stores').select('*').eq('id', storeId).single()
  if (error) throw error
  return data
}

export async function updateStoreStats(storeId: string, stats: {
  average_rating?: number
  total_reviews?: number
  map_rank?: number
}) {
  const sb = createServerClient()
  const { error } = await sb
    .from('stores')
    .update({ ...stats, updated_at: new Date().toISOString() })
    .eq('id', storeId)
  if (error) throw error
}

// ─── Insights ────────────────────────────────────────────
export async function getInsights(storeId: string, days = 30) {
  const sb = createServerClient()
  const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
  const { data, error } = await sb
    .from('insights')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', from)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

// ─── Map Rankings ────────────────────────────────────────
export async function getMapRankings(storeId: string, keyword: string, days = 30) {
  const sb = createServerClient()
  const from = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await sb
    .from('map_rankings')
    .select('*')
    .eq('store_id', storeId)
    .eq('keyword', keyword)
    .gte('measured_at', from)
    .order('measured_at', { ascending: true })
  if (error) throw error
  return data
}
EOF

echo "✅ DB operations 作成完了"

# ── 4. API: save-response ───────────────────────────────────
mkdir -p app/api/save-response

cat > app/api/save-response/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { saveSurveyResponse } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { storeId, surveyId, visitReason, menus, rating,
            staffRating, atmosphere, freeText, language, generatedReview } = body

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
    }

    const data = await saveSurveyResponse({
      store_id: storeId,
      survey_id: surveyId,
      visit_reason: visitReason,
      menus,
      rating,
      staff_rating: staffRating,
      atmosphere,
      free_text: freeText,
      language,
      generated_review: generatedReview,
    })

    return NextResponse.json({ success: true, id: data.id })
  } catch (error: any) {
    console.error('Save response error:', error?.message)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
EOF

echo "✅ API: save-response 作成完了"

# ── 5. API: reviews (GET/POST/PATCH) ───────────────────────
mkdir -p app/api/reviews

cat > app/api/reviews/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { getReviews, insertReview } from '@/lib/db'

const DEFAULT_STORE_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(req: NextRequest) {
  try {
    const storeId = req.nextUrl.searchParams.get('storeId') || DEFAULT_STORE_ID
    const reviews = await getReviews(storeId)
    return NextResponse.json({ reviews })
  } catch (error: any) {
    // Supabase未設定の場合はモックデータを返す
    console.warn('DB not configured, returning mock data:', error?.message)
    return NextResponse.json({ reviews: [], mock: true })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const review = await insertReview({
      store_id: body.storeId || DEFAULT_STORE_ID,
      reviewer_name: body.reviewerName,
      rating: body.rating,
      text: body.text,
      language: body.language || 'ja',
      review_date: body.date || new Date().toISOString().split('T')[0],
      source: body.source || 'google',
      is_local_guide: body.isLocal || false,
      google_review_id: body.googleReviewId,
    })
    return NextResponse.json({ review })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
EOF

# ── 6. API: reply (PATCH) ───────────────────────────────────
mkdir -p app/api/reviews/reply

cat > app/api/reviews/reply/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { updateReviewReply } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LANG_MAP: Record<string, string> = {
  ja: '日本語', en: '英語', zh: '中国語（繁体字）', ko: '韓国語',
}

export async function POST(req: NextRequest) {
  try {
    const { reviewId, reviewText, language, storeName, rating, saveToDb } = await req.json()
    const langLabel = LANG_MAP[language] ?? '日本語'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `「${storeName ?? '店舗'}」のオーナーとして、以下の口コミに${langLabel}で返信文を作成してください。

【口コミ】（★${rating}/5）
${reviewText}

【要件】
- ${langLabel}で返信
- ${rating <= 3 ? '低評価への誠実な対応：謝罪・改善への意欲・再来店の歓迎' : '感謝と温かみ：お礼・共感・再来店の歓迎'}
- 80〜120文字程度（日本語）
- 返信文のみ出力`,
      }],
    })

    const reply = message.content[0].type === 'text' ? message.content[0].text : ''

    // DBに保存（saveToDbがtrueの場合）
    if (saveToDb && reviewId) {
      await updateReviewReply(reviewId, reply)
    }

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Reply error:', error?.message)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
EOF

echo "✅ API: reviews 作成完了"

# ── 7. QRコード生成ページ ───────────────────────────────────
mkdir -p app/qr

cat > app/qr/layout.tsx << 'EOF'
import { Sidebar } from "@/components/layout/Sidebar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main className="relative z-10" style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}>
        {children}
      </main>
    </div>
  );
}
EOF

cat > app/qr/page.tsx << 'EOF'
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, PageHeader } from "@/components/ui";
import { MOCK_STORE } from "@/lib/utils";
import { QrCode, Copy, Download, Check, Globe, Smartphone } from "lucide-react";

const BASE_URL = "https://review365.app/survey"; // 本番URL

const SURVEY_TYPES = [
  { id: "google", label: "Google マップ用", icon: "🗺️", color: "#4285f4", desc: "Google口コミに誘導" },
  { id: "tripadvisor", label: "TripAdvisor用", icon: "🦉", color: "#00aa6c", desc: "インバウンド向け" },
  { id: "general", label: "汎用アンケート", icon: "📋", color: "#6366f1", desc: "データ収集のみ" },
];

function QRCodeDisplay({ url, size = 180 }: { url: string; size?: number }) {
  // QRコードをSVGで簡易表示（実際はqrcode.reactライブラリを使用）
  const cells = 21;
  const cellSize = size / cells;
  
  // ダミーQRパターン（実際の実装ではqrcodeライブラリを使用）
  return (
    <div
      className="flex items-center justify-center rounded-xl p-4"
      style={{ background: "#fff", width: size + 32, height: size + 32 }}
    >
      <div
        style={{
          width: size,
          height: size,
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cells} ${cells}'%3E%3Crect width='${cells}' height='${cells}' fill='white'/%3E%3Crect x='0' y='0' width='7' height='7' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='1' width='5' height='5' fill='black'/%3E%3Crect x='2' y='2' width='3' height='3' fill='white'/%3E%3Crect x='3' y='3' width='1' height='1' fill='black'/%3E%3Crect x='14' y='0' width='7' height='7' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='15' y='1' width='5' height='5' fill='black'/%3E%3Crect x='16' y='2' width='3' height='3' fill='white'/%3E%3Crect x='17' y='3' width='1' height='1' fill='black'/%3E%3Crect x='0' y='14' width='7' height='7' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='15' width='5' height='5' fill='black'/%3E%3Crect x='2' y='16' width='3' height='3' fill='white'/%3E%3Crect x='3' y='17' width='1' height='1' fill='black'/%3E%3C/svg%3E")`,
          backgroundSize: "cover",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

export default function QRPage() {
  const [selectedType, setSelectedType] = useState("google");
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"ja" | "en" | "zh" | "all">("all");

  const surveyUrl = `${BASE_URL}/${MOCK_STORE.id}?type=${selectedType}&lang=${lang}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="QRコード・URL発行"
        subtitle="アンケートURLとQRコードを発行して店頭・LINEで共有"
      />

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Settings */}
        <div className="space-y-5">
          {/* Survey type */}
          <Card>
            <CardHeader><CardTitle>アンケートタイプを選択</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {SURVEY_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left"
                  style={{
                    background: selectedType === t.id ? `${t.color}15` : "var(--surface2)",
                    border: `1px solid ${selectedType === t.id ? t.color + "60" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <div className="text-[14px] font-medium">{t.label}</div>
                    <div className="text-[12px]" style={{ color: "var(--muted)" }}>{t.desc}</div>
                  </div>
                  {selectedType === t.id && (
                    <Check size={16} style={{ color: t.color, marginLeft: "auto" }} />
                  )}
                </button>
              ))}
            </CardBody>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader><CardTitle>言語設定</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "all", label: "🌏 自動（端末に合わせる）" },
                  { value: "ja", label: "🇯🇵 日本語固定" },
                  { value: "en", label: "🇺🇸 英語固定" },
                  { value: "zh", label: "🇨🇳 中国語固定" },
                ].map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLang(l.value as any)}
                    className="p-3 rounded-lg text-[13px] transition-all"
                    style={{
                      background: lang === l.value ? "rgba(59,130,246,0.15)" : "var(--surface2)",
                      border: `1px solid ${lang === l.value ? "rgba(59,130,246,0.5)" : "var(--border)"}`,
                      color: lang === l.value ? "var(--accent)" : "var(--muted2)",
                      cursor: "pointer",
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="text-[12px] mt-3" style={{ color: "var(--muted)" }}>
                「自動」はお客様のスマートフォンの言語設定に合わせて自動変換されます
              </p>
            </CardBody>
          </Card>

          {/* URL */}
          <Card>
            <CardHeader>
              <CardTitle>発行されたURL</CardTitle>
              <Badge variant="green">有効</Badge>
            </CardHeader>
            <CardBody>
              <div
                className="p-3 rounded-lg text-[12px] break-all mb-3 font-mono"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent2)" }}
              >
                {surveyUrl}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCopy} className="flex-1 justify-center">
                  {copied ? <><Check size={13} /> コピー済</> : <><Copy size={13} /> URLをコピー</>}
                </Button>
                <Button size="sm" variant="ghost">
                  <Smartphone size={13} /> LINEで送る
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: QR Display */}
        <div className="space-y-5">
          <Card glow>
            <CardHeader>
              <CardTitle>QRコード</CardTitle>
              <Button size="sm" variant="ghost">
                <Download size={13} /> ダウンロード
              </Button>
            </CardHeader>
            <CardBody className="flex flex-col items-center py-8">
              <QRCodeDisplay url={surveyUrl} size={200} />
              <div className="mt-6 text-center">
                <div className="text-[14px] font-medium mb-1">{MOCK_STORE.name}</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                  {SURVEY_TYPES.find(t => t.id === selectedType)?.label}
                </div>
              </div>
              <div
                className="mt-6 p-4 rounded-xl text-center w-full"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
              >
                <div className="text-[12px] mb-2" style={{ color: "var(--muted)" }}>印刷用POPに使用</div>
                <div className="text-[13px]">このQRコードをスキャンして<br/>口コミを投稿してください 🙏</div>
              </div>
            </CardBody>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader><CardTitle>QR読み取り統計</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "今月のスキャン", value: "124回" },
                  { label: "回答率", value: "68%" },
                  { label: "口コミ転換率", value: "42%" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-3 rounded-lg text-center"
                    style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
                  >
                    <div className="font-mono text-xl font-semibold mb-1">{s.value}</div>
                    <div className="text-[11px]" style={{ color: "var(--muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
EOF

echo "✅ QRコードページ 作成完了"

# ── 8. 分析ページ（アンケート回答分析） ────────────────────
mkdir -p app/analytics

cat > app/analytics/layout.tsx << 'EOF'
import { Sidebar } from "@/components/layout/Sidebar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main className="relative z-10" style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}>
        {children}
      </main>
    </div>
  );
}
EOF

cat > app/analytics/page.tsx << 'EOF'
"use client";

import { Card, CardHeader, CardTitle, CardBody, Badge, PageHeader, ProgressBar } from "@/components/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { CHANNEL_DATA, MOCK_STORE } from "@/lib/utils";

const MENU_DATA = [
  { name: "カット", value: 276, pct: 35.5 },
  { name: "トリートメント", value: 186, pct: 23.9 },
  { name: "カラー", value: 123, pct: 15.8 },
  { name: "ヘアスパ", value: 70, pct: 9.0 },
  { name: "縮毛矯正", value: 65, pct: 8.4 },
  { name: "パーマ", value: 37, pct: 4.8 },
];

const RATING_DATA = [
  { rating: "★5", count: 182, pct: 73.7 },
  { rating: "★4", count: 42, pct: 17.0 },
  { rating: "★3", count: 14, pct: 5.7 },
  { rating: "★2", count: 6, pct: 2.4 },
  { rating: "★1", count: 3, pct: 1.2 },
];

const RADAR_DATA = [
  { subject: "スタッフ対応", A: 4.8 },
  { subject: "技術力", A: 4.6 },
  { subject: "雰囲気", A: 4.7 },
  { subject: "コスパ", A: 4.2 },
  { subject: "清潔感", A: 4.9 },
  { subject: "立地", A: 4.5 },
];

const MONTHLY_DATA = [
  { month: "11月", responses: 38, reviews: 22 },
  { month: "12月", responses: 45, reviews: 28 },
  { month: "1月", responses: 52, reviews: 31 },
  { month: "2月", responses: 61, reviews: 38 },
  { month: "3月", responses: 78, reviews: 47 },
  { month: "4月", responses: 94, reviews: 57 },
];

export default function AnalyticsPage() {
  return (
    <div className="animate-slide-up">
      <PageHeader
        title="アンケート分析"
        subtitle="回答データをもとに店舗改善・集客戦略を立案"
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "総回答数", value: "457件", delta: "↑ +94 今月", color: "var(--accent)" },
          { label: "平均満足度", value: "4.7 ★", delta: "↑ +0.1", color: "var(--amber)" },
          { label: "口コミ転換率", value: "48.8%", delta: "↑ +3.2%", color: "var(--green)" },
          { label: "リピート意向", value: "91.2%", delta: "↑ +1.5%", color: "var(--accent2)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
              {s.label}
            </div>
            <div className="font-mono text-2xl font-semibold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[12px] mt-1" style={{ color: "var(--green)" }}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Monthly trend */}
        <Card>
          <CardHeader>
            <CardTitle>回答数・口コミ転換 推移</CardTitle>
            <Badge variant="blue">月次</Badge>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a2235", border: "1px solid #1e2d47", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="responses" name="回答数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reviews" name="口コミ投稿" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Radar chart */}
        <Card>
          <CardHeader>
            <CardTitle>店舗評価レーダー</CardTitle>
            <Badge variant="green">5点満点</Badge>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#1e2d47" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Radar name="評価" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Menu breakdown */}
        <Card>
          <CardHeader><CardTitle>利用メニュー内訳</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {MENU_DATA.map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span>{m.name}</span>
                  <span className="font-medium">{m.pct}%</span>
                </div>
                <ProgressBar value={m.pct} color="blue" />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Rating breakdown */}
        <Card>
          <CardHeader><CardTitle>評価分布</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {RATING_DATA.map((r) => (
              <div key={r.rating}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span style={{ color: "var(--amber)" }}>{r.rating}</span>
                  <span className="font-medium">{r.count}件 ({r.pct}%)</span>
                </div>
                <ProgressBar
                  value={r.pct}
                  color={r.rating === "★5" || r.rating === "★4" ? "green" : r.rating === "★3" ? "amber" : "red"}
                />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Channel */}
        <Card>
          <CardHeader><CardTitle>来店チャネル</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {CHANNEL_DATA.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span>{c.name}</span>
                  <span className="font-medium">{c.value}%</span>
                </div>
                <ProgressBar value={c.value} color={c.color} />
              </div>
            ))}
            <div className="pt-2 text-[12px]" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
              総回答数 <strong className="text-white">457件</strong>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
EOF

echo "✅ 分析ページ 作成完了"

# ── 9. Sidebar にナビ項目追加 ───────────────────────────────
cat > components/layout/Sidebar.tsx << 'EOF'
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PenLine, MessageSquare,
  Cpu, Settings, Store, QrCode, BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/survey",     label: "口コミ生成",     icon: PenLine },
  { href: "/reviews",    label: "口コミ管理",     icon: MessageSquare },
  { href: "/aio",        label: "AIO診断",        icon: Cpu },
  { href: "/qr",         label: "QRコード発行",   icon: QrCode },
  { href: "/analytics",  label: "アンケート分析", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="fixed top-0 left-0 bottom-0 w-[220px] flex flex-col"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)", zIndex: 40 }}
    >
      <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="gradient-text font-mono text-[22px] font-bold tracking-tight">口コミ365</div>
        <div className="text-[11px] mt-1 tracking-wide" style={{ color: "var(--muted)" }}>
          AI MEO / AIO Platform
        </div>
      </div>
      <div
        className="mx-4 my-3 px-3 py-2 rounded-lg flex items-center gap-2"
        style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
      >
        <Store size={14} style={{ color: "var(--accent)" }} />
        <div>
          <div className="text-[12px] font-medium">銀座 美容室 Shion</div>
          <div className="text-[10px]" style={{ color: "var(--muted)" }}>MAP 順位 #7 ↑</div>
        </div>
      </div>
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={`nav-link${active ? " active" : ""}`}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-5" style={{ borderTop: "1px solid var(--border)" }}>
        <Link href="/settings" className="nav-link" style={{ padding: "8px 0" }}>
          <Settings size={14} />
          <span className="text-[12px]">設定</span>
        </Link>
        <div className="text-[10px] mt-3" style={{ color: "var(--muted)" }}>
          Powered by Claude AI<br />v1.0.0 — デモ版
        </div>
      </div>
    </aside>
  );
}
EOF

echo "✅ サイドバー更新完了"

# ── 10. env example 更新 ────────────────────────────────────
cat > .env.local.example << 'EOF'
# Anthropic API（必須）
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Supabase（データ保存に必要）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LINE Messaging API（将来実装）
# LINE_CHANNEL_ACCESS_TOKEN=
# LINE_CHANNEL_SECRET=

# Google Business Profile API（将来実装）
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
EOF

echo ""
echo "✅ Phase 2 全ファイル作成完了！"
echo ""
echo "追加された機能："
echo "  📊 /analytics  — アンケート分析ダッシュボード"
echo "  📱 /qr         — QRコード・URL発行"
echo "  🗄️  supabase/   — DB スキーマ（Supabase設定後に実行）"
echo "  🔌 lib/db.ts   — DB操作ライブラリ"
echo "  🔌 lib/supabase.ts — Supabaseクライアント"
echo "  🌐 api/reviews — 口コミCRUD API"
echo "  🌐 api/save-response — アンケート回答保存API"
echo ""
echo "次のステップ："
echo "  1. npm install @supabase/supabase-js"
echo "  2. Supabase でプロジェクト作成"
echo "  3. .env.local に Supabase の URL と KEY を追加"
echo "  4. supabase/schema.sql を実行"
