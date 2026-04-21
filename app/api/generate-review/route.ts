import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_MAP: Record<string, string> = {
  ja: "日本語", en: "英語", zh: "中国語（繁体字）", ko: "韓国語",
};

export const dynamic = "force-dynamic";

/**
 * 新フォーマット（業種テンプレ駆動）で受ける。
 *   { storeName, keywords, industry, promptHints, rating, language, answers }
 *
 * 後方互換として旧フォーマット
 *   { visitReason, menus, rating, staffRating, atmosphere, freeText, language, storeName, keywords }
 * も受け付ける。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      storeName,
      keywords,
      industry,
      promptHints,
      rating,
      language,
      answers,
      // ── legacy fields ──
      visitReason,
      menus,
      staffRating,
      atmosphere,
      freeText,
    } = body;

    const storeKeywords: string[] = keywords?.length > 0 ? keywords : [storeName ?? "店舗"];
    const keyword = storeKeywords[Math.floor(Math.random() * storeKeywords.length)];
    const langLabel = LANG_MAP[language] ?? "日本語";

    // 回答ブロックを組み立てる
    let answerBlock = "";
    if (answers && typeof answers === "object") {
      const lines: string[] = [];
      for (const [q, v] of Object.entries(answers)) {
        const formatted = Array.isArray(v) ? v.join("、") : String(v);
        lines.push(`- ${q}: ${formatted || "未回答"}`);
      }
      if (rating && rating > 0) lines.unshift(`- 総合満足度: ★${rating}/5`);
      answerBlock = lines.join("\n");
    } else {
      // legacy
      answerBlock = [
        `- 来店のきっかけ: ${visitReason || "未回答"}`,
        `- 利用メニュー: ${menus?.length > 0 ? menus.join("、") : "未回答"}`,
        `- 総合満足度: ${rating > 0 ? `★${rating}/5` : "未回答"}`,
        `- スタッフの対応: ${staffRating || "未回答"}`,
        `- 店内の雰囲気: ${atmosphere || "未回答"}`,
        `- 自由記述: ${freeText || "特になし"}`,
      ].join("\n");
    }

    // 業種テンプレ由来のヒント
    const hintBlock = Array.isArray(promptHints) && promptHints.length > 0
      ? promptHints.map((h: string) => `- ${h}`).join("\n")
      : "- 具体的な体験・感情を含める";

    const industryLabel = industry || "店舗";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `あなたは「${storeName ?? "店舗"}」（${industryLabel}）を訪問した顧客です。以下のアンケート回答をもとに、Googleマップに投稿する自然でリアルな口コミ文を${langLabel}で作成してください。

【アンケート回答】
${answerBlock}

【必須の書き方ルール】
${hintBlock}

【制約】
- 必ず「${keyword}」を自然な文脈で含める
- 150〜250文字程度
- 一般の顧客が書いた一人称の感想として書く
- 末尾に再来店意向または推薦意向を含める
- 口コミ文のみを出力（前置きや解説は不要）`
      }],
    });

    const review = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ review, keyword });
  } catch (error: any) {
    console.error("Generate review error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
