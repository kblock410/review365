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
