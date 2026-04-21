import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * 公開アンケートから「Googleマップに投稿する」を押したタイミングで呼ぶ。
 *
 *  1. survey_responses.posted_to_google = true
 *  2. reviews テーブルに行を1件追加（source='survey'）
 *  3. stores.total_reviews と average_rating を再計算
 *
 * これによりダッシュボードのKPIとチャートが自動で増える。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      surveyResponseId,
      storeId,
      rating,
      reviewText,
      language,
      reviewerName,
    } = body;

    if (!storeId || !reviewText || !rating) {
      return NextResponse.json(
        { error: "storeId, reviewText, rating is required" },
        { status: 400 }
      );
    }

    const sb = createServerClient();

    // 1. アンケート回答を posted にマーク
    if (surveyResponseId) {
      await sb
        .from("survey_responses")
        .update({ posted_to_google: true })
        .eq("id", surveyResponseId);
    }

    // 2. reviews に挿入
    const todayDate = new Date().toISOString().split("T")[0];
    const { data: inserted, error: insertError } = await sb
      .from("reviews")
      .insert({
        store_id: storeId,
        reviewer_name: reviewerName ?? "アンケート経由のお客様",
        rating,
        text: reviewText,
        language: language ?? "ja",
        review_date: todayDate,
        source: "survey",
      })
      .select()
      .single();
    if (insertError) throw insertError;

    // 3. stores の集計を再計算（全reviewsで平均を取り直す）
    const { data: allReviews } = await sb
      .from("reviews")
      .select("rating")
      .eq("store_id", storeId);
    const ratings = (allReviews ?? [])
      .map((r) => r.rating)
      .filter((r): r is number => typeof r === "number" && r > 0);
    const totalReviews = ratings.length;
    const avg =
      totalReviews > 0
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / totalReviews) * 100
          ) / 100
        : 0;

    await sb
      .from("stores")
      .update({ total_reviews: totalReviews, average_rating: avg })
      .eq("id", storeId);

    return NextResponse.json({
      success: true,
      reviewId: inserted?.id,
      totalReviews,
      averageRating: avg,
    });
  } catch (e: any) {
    console.error("mark-posted error:", e?.message);
    return NextResponse.json(
      { error: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
