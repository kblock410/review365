import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const sb = createServerClient()
    const { data, error } = await sb
      .from('stores')
      .select('id, name, area, category, keywords, average_rating, total_reviews, map_rank')
      .order('created_at', { ascending: true })
    if (error) throw error
    return NextResponse.json({ stores: data ?? [] })
  } catch {
    return NextResponse.json({ stores: [] })
  }
}
