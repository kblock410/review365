import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import { createServerClient } from '@/lib/supabase'
import { getStoreId } from '@/lib/get-store-id'
import { MOCK_STORE } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const queryStoreId = req.nextUrl.searchParams.get('storeId')
  const storeId = queryStoreId ?? (await getStoreId())
  try {
    const store = await getStore(storeId)
    return NextResponse.json({ store, source: 'db' })
  } catch {
    return NextResponse.json({
      store: {
        id: storeId,
        name: MOCK_STORE.name,
        category: MOCK_STORE.category,
        area: MOCK_STORE.area,
        keywords: MOCK_STORE.keywords,
        average_rating: MOCK_STORE.averageRating,
        total_reviews: MOCK_STORE.totalReviews,
        map_rank: MOCK_STORE.mapRank,
      },
      source: 'mock',
    })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const queryStoreId = req.nextUrl.searchParams.get('storeId')
    const storeId = queryStoreId ?? (await getStoreId())
    const body = await req.json()
    const sb = createServerClient()
    // 基本列の更新
    const basePayload: Record<string, unknown> = {
      name: body.name,
      area: body.area,
      category: body.category,
      keywords: body.keywords,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await sb
      .from('stores')
      .update(basePayload)
      .eq('id', storeId)
      .select()
      .single()
    if (error) throw error

    // menu_options は別更新（未マイグレーション環境でも基本列更新を成功させるため）
    if (Array.isArray(body.menu_options)) {
      try {
        await sb
          .from('stores')
          .update({ menu_options: body.menu_options })
          .eq('id', storeId)
      } catch {
        // 列が無い環境は無視
      }
    }

    // gbp_place_id も別更新（NULL 許容）
    if (body.gbp_place_id !== undefined) {
      try {
        await sb
          .from('stores')
          .update({ gbp_place_id: body.gbp_place_id })
          .eq('id', storeId)
      } catch {
        // 列が無い環境は無視
      }
    }
    return NextResponse.json({ store: data, success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
