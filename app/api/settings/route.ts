import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import { createServerClient } from '@/lib/supabase'
import { getStoreId } from '@/lib/get-store-id'
import { MOCK_STORE } from '@/lib/utils'

export async function GET() {
  try {
    const storeId = await getStoreId()
    const store = await getStore(storeId)
    return NextResponse.json({ store, source: 'db' })
  } catch {
    return NextResponse.json({
      store: {
        id: MOCK_STORE.id,
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
    const storeId = await getStoreId()
    const body = await req.json()
    const sb = createServerClient()
    const { data, error } = await sb
      .from('stores')
      .update({
        name: body.name,
        area: body.area,
        category: body.category,
        keywords: body.keywords,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ store: data, success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
