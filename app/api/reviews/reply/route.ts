import { NextRequest, NextResponse } from 'next/server'
import { saveReply } from '@/lib/db'

// ユーザーが承認した返信テキストをDBに保存するだけ
export async function POST(req: NextRequest) {
  try {
    const { reviewId, replyText } = await req.json()

    if (!reviewId || !replyText) {
      return NextResponse.json({ error: 'reviewId and replyText are required' }, { status: 400 })
    }

    // DBに保存（reviewIdがUUIDの場合のみ）
    if (reviewId.includes('-')) {
      await saveReply(reviewId, replyText)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
