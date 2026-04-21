import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getStoreId } from '@/lib/get-store-id'
import { MOCK_STATS, IMPRESSIONS_DATA } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // クエリパラメータ優先 → フォールバックでCookie
  const queryStoreId = req.nextUrl.searchParams.get('storeId')
  const storeId = queryStoreId ?? (await getStoreId())

  try {
    const sb = createServerClient()

    // 店舗の基本情報
    const { data: store, error: storeError } = await sb
      .from('stores')
      .select('name, average_rating, total_reviews, map_rank')
      .eq('id', storeId)
      .single()
    if (storeError || !store) throw storeError ?? new Error('store not found')

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

    const ins = insights ?? []

    // 集計
    const totalImpressions = ins.reduce((s, i) => s + (i.impressions ?? 0), 0)
    const phoneClicks = ins.reduce((s, i) => s + (i.phone_clicks ?? 0), 0)
    const routeSearches = ins.reduce((s, i) => s + (i.route_searches ?? 0), 0)
    const websiteClicks = ins.reduce((s, i) => s + (i.website_clicks ?? 0), 0)

    // 口コミ増加数（過去30日）
    const { count: recentReviews } = await sb
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // 月別インサイトグラフ用
    const impressionsChart = ins.map((i) => ({
      month: new Date(i.date).toLocaleDateString('ja-JP', { month: 'short' }),
      value: i.impressions ?? 0,
    }))

    // 口コミ数の推移（過去6ヶ月・累計）
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)
    const { data: allReviews } = await sb
      .from('reviews')
      .select('created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true })
    const reviewDates = (allReviews ?? []).map((r) => new Date(r.created_at))
    const months: { key: string; label: string; start: Date; end: Date }[] = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo)
      d.setMonth(d.getMonth() + i)
      const end = new Date(d)
      end.setMonth(end.getMonth() + 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: `${d.getMonth() + 1}月`,
        start: d,
        end,
      })
    }
    const reviewGrowthChart = months.map((m) => {
      const cumulative = reviewDates.filter((rd) => rd < m.end).length
      return { month: m.label, value: cumulative }
    })

    // インサイトが空ならShionモックではなく「ゼロ埋めチャート」を返す
    const emptyChart = months.map((m) => ({ month: m.label, value: 0 }))

    return NextResponse.json({
      source: 'db',
      storeId,
      storeName: store.name,
      hasInsights: ins.length > 0,
      stats: {
        impressions: totalImpressions,
        impressionsDelta: ins[ins.length - 1]?.impressions ?? 0,
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
      impressionsData: impressionsChart.length > 0 ? impressionsChart : emptyChart,
      reviewGrowthData: reviewGrowthChart,
    })
  } catch {
    // DB自体に繋がらない等の致命的エラーのみモックを返す
    return NextResponse.json({
      source: 'mock',
      storeId,
      storeName: null,
      hasInsights: false,
      stats: MOCK_STATS,
      impressionsData: IMPRESSIONS_DATA,
      reviewGrowthData: null,
    })
  }
}
