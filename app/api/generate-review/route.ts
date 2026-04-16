import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_MAP: Record<string, string> = {
  ja: "日本語", en: "英語", zh: "中国語（繁体字）", ko: "韓国語",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitReason, menus, rating, staffRating, atmosphere, freeText, language, storeName, keywords } = body;
    const storeKeywords: string[] = keywords?.length > 0 ? keywords : [storeName ?? "店舗"];
    const keyword = storeKeywords[Math.floor(Math.random() * storeKeywords.length)];
    const langLabel = LANG_MAP[language] ?? "日本語";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `あなたは「${storeName ?? "店舗"}」を訪問した顧客です。以下のアンケート回答をもとに、Googleマップに投稿する自然でリアルな口コミ文を${langLabel}で作成してください。

【アンケート回答】
- 来店のきっかけ: ${visitReason || "未回答"}
- 利用メニュー: ${menus?.length > 0 ? menus.join("、") : "未回答"}
- 総合満足度: ${rating > 0 ? `★${rating}/5` : "未回答"}
- スタッフの対応: ${staffRating || "未回答"}
- 店内の雰囲気: ${atmosphere || "未回答"}
- 自由記述: ${freeText || "特になし"}

【制約】
- 必ず「${keyword}」を自然な文脈で含める
- 150〜250文字程度
- 自然な個人の感想として書く
- 具体的な体験・感情を含める
- 末尾に再来店意向を含める
- 口コミ文のみを出力`
      }],
    });

    const review = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ review, keyword });
  } catch (error: any) {
    console.error("Generate review error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
