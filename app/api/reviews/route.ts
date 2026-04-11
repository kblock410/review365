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
