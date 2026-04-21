import { NextRequest, NextResponse } from 'next/server'
import { getReviews } from '@/lib/db'
import { getStoreId } from '@/lib/get-store-id'
import { MOCK_REVIEWS } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const queryStoreId = req.nextUrl.searchParams.get('storeId')
  const storeId = queryStoreId ?? (await getStoreId())
  try {
    const reviews = await getReviews(storeId)
    return NextResponse.json({ reviews, source: 'db' })
  } catch {
    return NextResponse.json({ reviews: MOCK_REVIEWS, source: 'mock' })
  }
}
