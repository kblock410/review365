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
  // store_id は data 側を優先（未指定ならデフォルト）
  const payload = { store_id: DEFAULT_STORE_ID, ...data }
  const { data: saved, error } = await sb
    .from('survey_responses')
    .insert(payload)
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
