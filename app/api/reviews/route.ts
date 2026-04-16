import { NextResponse } from 'next/server'
import { getReviews } from '@/lib/db'
import { getStoreId } from '@/lib/get-store-id'
import { MOCK_REVIEWS } from '@/lib/utils'

export async function GET() {
  try {
    const storeId = await getStoreId()
    const reviews = await getReviews(storeId)
    return NextResponse.json({ reviews, source: 'db' })
  } catch {
    return NextResponse.json({ reviews: MOCK_REVIEWS, source: 'mock' })
  }
}
