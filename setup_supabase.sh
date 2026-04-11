#!/bin/bash
set -e
echo "🗄️ Supabase連携セットアップ中..."

# ── lib/supabase.ts ──────────────────────────────────────
cat > lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
EOF

# ── lib/db.ts ────────────────────────────────────────────
cat > lib/db.ts << 'EOF'
import { createServerClient } from './supabase'

const DEFAULT_STORE_ID = '00000000-0000-0000-0000-000000000001'

// ─── 口コミ ──────────────────────────────────────────────
export async function getReviews(storeId = DEFAULT_STORE_ID) {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('reviews')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function saveReply(reviewId: string, replyText: string) {
  const sb = createServerClient()
  const { error } = await sb
    .from('reviews')
    .update({ replied: true, reply_text: replyText, replied_at: new Date().toISOString() })
    .eq('id', reviewId)
  if (error) throw error
}

// ─── アンケート回答 ──────────────────────────────────────
export async function saveSurveyResponse(data: {
  store_id?: string
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
  const { data: saved, error } = await sb
    .from('survey_responses')
    .insert({ store_id: DEFAULT_STORE_ID, ...data })
    .select()
    .single()
  if (error) throw error
  return saved
}

export async function getSurveyResponses(storeId = DEFAULT_STORE_ID) {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('survey_responses')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data ?? []
}

// ─── 店舗 ────────────────────────────────────────────────
export async function getStore(storeId = DEFAULT_STORE_ID) {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single()
  if (error) throw error
  return data
}
EOF

# ── API: 口コミ一覧取得 ──────────────────────────────────
mkdir -p app/api/reviews
cat > app/api/reviews/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getReviews } from '@/lib/db'
import { MOCK_REVIEWS } from '@/lib/utils'

export async function GET() {
  try {
    const reviews = await getReviews()
    return NextResponse.json({ reviews, source: 'db' })
  } catch (e) {
    // Supabase未設定時はモックデータを返す
    return NextResponse.json({ reviews: MOCK_REVIEWS, source: 'mock' })
  }
}
EOF

# ── API: 返信保存 ────────────────────────────────────────
mkdir -p app/api/reviews/reply
cat > app/api/reviews/reply/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { saveReply } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const LANG_MAP: Record<string, string> = {
  ja: '日本語', en: '英語', zh: '中国語', ko: '韓国語',
}

export async function POST(req: NextRequest) {
  try {
    const { reviewId, reviewText, language, storeName, rating } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `「${storeName}」のオーナーとして、以下の口コミに${LANG_MAP[language] ?? '日本語'}で返信文を作成してください。
口コミ（★${rating}/5）: ${reviewText}
要件: ${rating <= 3 ? '低評価への誠実な謝罪・改善意欲' : '感謝と再来店の歓迎'}。80〜120文字。返信文のみ出力。`,
      }],
    })

    const reply = message.content[0].type === 'text' ? message.content[0].text : ''

    // DBに保存（reviewIdがUUIDの場合のみ）
    if (reviewId && reviewId.includes('-')) {
      await saveReply(reviewId, reply)
    }

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
EOF

# ── API: アンケート回答保存 ──────────────────────────────
mkdir -p app/api/save-response
cat > app/api/save-response/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { saveSurveyResponse } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const saved = await saveSurveyResponse({
      visit_reason: body.visitReason,
      menus: body.menus,
      rating: body.rating,
      staff_rating: body.staffRating,
      atmosphere: body.atmosphere,
      free_text: body.freeText,
      language: body.language,
      generated_review: body.generatedReview,
    })
    return NextResponse.json({ success: true, id: saved.id })
  } catch (e: any) {
    console.error('Save response error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
EOF

# ── survey.htmlをSupabase保存に対応 ─────────────────────
# public/survey.html の fetch('/api/generate-review') の後に保存処理を追加
sed -i '' 's|D\.review = data\.review || makeSample(kw); showResult();|D.review = data.review || makeSample(kw);\n    // Supabaseに回答を保存\n    fetch("/api/save-response", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ visitReason: D.visit, menus: D.menus, rating: D.rating, staffRating: D.staff, atmosphere: D.atmos, language: "ja", generatedReview: D.review }) }).catch(function(){}); showResult();|' public/survey.html 2>/dev/null || true

echo ""
echo "✅ Supabase連携 セットアップ完了！"
echo ""
echo "次のステップ："
echo "  npm run dev を再起動してください"
echo ""
echo "動作確認："
echo "  1. iPhoneでアンケートに回答"
echo "  2. Supabaseダッシュボード → Table Editor → survey_responses で保存確認"
