import { NextRequest, NextResponse } from "next/server";
import { saveSurveyResponse } from "@/lib/db";
import { getStoreId } from "@/lib/get-store-id";

export const dynamic = "force-dynamic";

/**
 * 新フォーマット：
 *   { storeId, industry, answers: { "質問ラベル": "回答" | [...] }, generatedReview, rating, language }
 *
 * 旧フォーマット（後方互換）：
 *   { visitReason, menus, rating, staffRating, atmosphere, freeText, language, generatedReview }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // storeId は body 優先 → cookie フォールバック
    const storeId: string =
      body.storeId ?? (await getStoreId());

    // 新フォーマット判定
    const isNew = body.answers && typeof body.answers === "object";

    let payload: Parameters<typeof saveSurveyResponse>[0];

    if (isNew) {
      const ans: Record<string, string | string[]> = body.answers;

      // スキーマ（既存列）に可能な限りマップ、それ以外は free_text にJSONで残す
      // 「来店シーン」「来店時間帯」「来店のきっかけ」など ⇒ visit_reason
      const visitSceneKey =
        ["来店シーン", "来店のきっかけ", "来店された時間帯"]
          .find((k) => k in ans) ?? null;
      const visitReason =
        visitSceneKey && !Array.isArray(ans[visitSceneKey])
          ? (ans[visitSceneKey] as string)
          : undefined;

      // 「注文したメニュー」「ご利用メニュー」 ⇒ menus
      const menuKey =
        ["注文したメニュー", "ご利用メニュー"].find((k) => k in ans) ?? null;
      const menus =
        menuKey && Array.isArray(ans[menuKey])
          ? (ans[menuKey] as string[])
          : undefined;

      // 「特に良かった点」「スタッフの対応」 ⇒ staff_rating（文字列化）
      const staffKey =
        ["特に良かった点", "スタッフの対応"].find((k) => k in ans) ?? null;
      const staffRating = staffKey
        ? Array.isArray(ans[staffKey])
          ? (ans[staffKey] as string[]).join("、")
          : (ans[staffKey] as string)
        : undefined;

      // 「この店を一言で表すと」「店内の雰囲気」 ⇒ atmosphere
      const atmosKey =
        ["この店を一言で表すと", "店内の雰囲気"].find((k) => k in ans) ?? null;
      const atmosphere = atmosKey
        ? Array.isArray(ans[atmosKey])
          ? (ans[atmosKey] as string[]).join("、")
          : (ans[atmosKey] as string)
        : undefined;

      // 自由記述系
      const freeKey =
        ["印象に残ったシーンや料理を一言で（任意）", "感想（任意）"].find(
          (k) => k in ans
        ) ?? null;
      const freeTextRaw = freeKey
        ? Array.isArray(ans[freeKey])
          ? (ans[freeKey] as string[]).join("\n")
          : (ans[freeKey] as string)
        : "";

      // 全回答を JSON で保存（スキーマ migration 無しで持ち運ぶため free_text に同梱）
      const combinedFreeText = JSON.stringify(
        { industry: body.industry ?? null, answers: ans, freeText: freeTextRaw },
        null,
        0
      );

      payload = {
        store_id: storeId,
        visit_reason: visitReason,
        menus,
        rating: typeof body.rating === "number" ? body.rating : undefined,
        staff_rating: staffRating,
        atmosphere,
        free_text: combinedFreeText,
        language: body.language,
        generated_review: body.generatedReview,
      };
    } else {
      payload = {
        store_id: storeId,
        visit_reason: body.visitReason,
        menus: body.menus,
        rating: body.rating,
        staff_rating: body.staffRating,
        atmosphere: body.atmosphere,
        free_text: body.freeText,
        language: body.language,
        generated_review: body.generatedReview,
      };
    }

    const saved = await saveSurveyResponse(payload);
    return NextResponse.json({ success: true, id: saved.id });
  } catch (e: any) {
    console.error("Save response error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
