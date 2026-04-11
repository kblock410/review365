import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { storeName, area, keywords, weakKeyword, totalReviews, rating } = await req.json();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `あなたはAIO（AI Search Optimization）の専門家です。以下の店舗情報をもとに、AIが推薦する店舗になるための具体的な改善アドバイスを3点、日本語で提供してください。

【店舗情報】
- 店舗名: ${storeName}
- エリア: ${area}
- 対策キーワード: ${keywords?.join("、")}
- 口コミ数: ${totalReviews}件
- 平均評価: ★${rating}
- 表示確率が低いキーワード: ${weakKeyword}

【要件】
- 各アドバイスは具体的な行動レベルで記述
- 「${weakKeyword}」の表示確率改善に重点
- マークダウンで整形（## と - を使用）
- 実行優先度（高・中・低）を各項目に付ける`
      }],
    });

    const advice = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ advice });
  } catch (error: any) {
    console.error("AIO advice error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
