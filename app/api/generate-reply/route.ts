import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_MAP: Record<string, string> = {
  ja: "日本語", en: "英語", zh: "中国語（繁体字）", ko: "韓国語",
};

export async function POST(req: NextRequest) {
  try {
    const { reviewText, language, storeName, rating } = await req.json();
    const langLabel = LANG_MAP[language] ?? "日本語";
    const isLow = rating <= 3;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `「${storeName ?? "店舗"}」のオーナーとして、以下の口コミに${langLabel}で返信文を作成してください。

【口コミ】（★${rating}/5）
${reviewText}

【要件】
- ${langLabel}で返信
- ${isLow ? "低評価への誠実な対応：謝罪・改善への意欲・再来店の歓迎" : "感謝と温かみ：お礼・共感・再来店の歓迎"}
- 80〜120文字程度（日本語）
- 返信文のみ出力`
      }],
    });

    const reply = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Generate reply error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
