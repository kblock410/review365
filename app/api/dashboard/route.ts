import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getStoreId } from '@/lib/get-store-id'
import { MOCK_STATS, IMPRESSIONS_DATA } from '@/lib/utils'

export async function GET() {
  try {
    const storeId = await getStoreId()
    const sb = createServerClient()

    // 店舗の基本情報
    const { data: store, error: storeError } = await sb
      .from('stores')
      .select('name, average_rating, total_reviews, map_rank')
      .eq('id', storeId)
      .single()
    if (storeError) throw storeError

    // 過去30日のインサイト集計
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: insights, error: insightsError } = await sb
      .from('insights')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })
    if (insightsError) throw insightsError

    // 集計
    const totalImpressions = insights.reduce((s, i) => s + (i.impressions ?? 0), 0)
    const phoneClicks = insights.reduce((s, i) => s + (i.phone_clicks ?? 0), 0)
    const routeSearches = insights.reduce((s, i) => s + (i.route_searches ?? 0), 0)
    const websiteClicks = insights.reduce((s, i) => s + (i.website_clicks ?? 0), 0)

    // 口コミ増加数（過去30日）
    const { count: recentReviews } = await sb
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // 月別インサイトグラフ用
    const impressionsChart = insights.map((i) => ({
      month: new Date(i.date).toLocaleDateString('ja-JP', { month: 'short' }),
      value: i.impressions,
    }))

    return NextResponse.json({
      source: 'db',
      storeName: store.name,
      stats: {
        impressions: totalImpressions,
        impressionsDelta: insights[insights.length - 1]?.impressions ?? 0,
        totalReviews: store.total_reviews ?? 0,
        reviewsDelta: recentReviews ?? 0,
        averageRating: store.average_rating ?? 0,
        ratingDelta: 0,
        mapRank: store.map_rank ?? 0,
        prevMapRank: store.map_rank ? store.map_rank + 5 : 99,
        phoneClicks,
        routeSearches,
        websiteClicks,
      },
      impressionsData: impressionsChart.length > 0 ? impressionsChart : IMPRESSIONS_DATA,
    })
  } catch {
    return NextResponse.json({
      source: 'mock',
      storeName: null,
      stats: MOCK_STATS,
      impressionsData: IMPRESSIONS_DATA,
    })
  }
}
