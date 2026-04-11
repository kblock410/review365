import { NextRequest, NextResponse } from 'next/server'
import { saveReply } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const LANG_MAP: Record<string, string> = {
  ja: '日本語', en: '英語', zh: '中国語', ko: '韓国語',
}

export async function POST(req: NextRequest) {
  try {
    const { reviewId, reviewText, language, storeName, rating } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `「${storeName}」のオーナーとして、以下の口コミに${LANG_MAP[language] ?? '日本語'}で返信文を作成してください。
口コミ（★${rating}/5）: ${reviewText}
要件: ${rating <= 3 ? '低評価への誠実な謝罪・改善意欲' : '感謝と再来店の歓迎'}。80〜120文字。返信文のみ出力。`,
      }],
    })

    const reply = message.content[0].type === 'text' ? message.content[0].text : ''

    // DBに保存（reviewIdがUUIDの場合のみ）
    if (reviewId && reviewId.includes('-')) {
      await saveReply(reviewId, reply)
    }

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
