import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 全店舗巡回するので最大5分

/**
 * Vercel Cron Jobs から呼ばれる定期同期エンドポイント。
 * vercel.json の crons 設定で 1日1回実行される。
 *
 * 動作:
 *  1. gbp_place_id が登録されている全店舗を取得
 *  2. 各店舗について Places API (New) で最新口コミを取得
 *  3. google_review_id をキーに reviews テーブルへ upsert
 *  4. 集計値（average_rating / total_reviews）を更新
 *
 * 認証:
 *  Vercel Cron は Authorization: Bearer <CRON_SECRET> ヘッダを自動付与する。
 *  CRON_SECRET 環境変数が未設定なら認証スキップ（開発時のみ）。
 */
export async function GET(req: NextRequest) {
  // Vercel Cron 経由のリクエスト認証
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY が未設定です" },
      { status: 500 }
    );
  }

  const sb = createServerClient();

  // gbp_place_id が登録されている店舗を全件取得
  let stores: Array<{ id: string; gbp_place_id: string | null }> = [];
  try {
    const { data, error } = await sb
      .from("stores")
      .select("id, gbp_place_id");
    if (error) throw error;
    stores = ((data ?? []) as any[]).filter((s) => !!s.gbp_place_id);
  } catch (e: any) {
    return NextResponse.json(
      { error: `stores fetch failed: ${e?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const summary: Array<{
    storeId: string;
    inserted?: number;
    updated?: number;
    error?: string;
  }> = [];

  for (const store of stores) {
    const storeId = store.id;
    const placeId = store.gbp_place_id as string;
    try {
      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
        placeId
      )}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "reviews,rating,userRatingCount,displayName",
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        summary.push({ storeId, error: `Places API ${res.status}: ${txt.slice(0, 200)}` });
        continue;
      }
      const place = (await res.json()) as {
        rating?: number;
        userRatingCount?: number;
        reviews?: Array<{
          name: string;
          rating?: number;
          text?: { text?: string; languageCode?: string };
          originalText?: { text?: string; languageCode?: string };
          authorAttribution?: { displayName?: string };
          publishTime?: string;
        }>;
      };

      const incoming = place.reviews ?? [];
      let inserted = 0;
      let updated = 0;

      for (const rv of incoming) {
        const googleReviewId = rv.name;
        const payload = {
          store_id: storeId,
          reviewer_name: rv.authorAttribution?.displayName ?? "Googleユーザー",
          rating: typeof rv.rating === "number" ? Math.round(rv.rating) : 0,
          text: rv.text?.text ?? rv.originalText?.text ?? "",
          language: rv.text?.languageCode ?? rv.originalText?.languageCode ?? "ja",
          review_date: rv.publishTime
            ? new Date(rv.publishTime).toISOString().slice(0, 10)
            : null,
          source: "google",
          google_review_id: googleReviewId,
        };
        const { data: existing } = await sb
          .from("reviews")
          .select("id")
          .eq("google_review_id", googleReviewId)
          .maybeSingle();
        if (existing?.id) {
          await sb.from("reviews").update(payload).eq("id", existing.id);
          updated += 1;
        } else {
          await sb.from("reviews").insert(payload);
          inserted += 1;
        }
      }

      // 集計値更新
      try {
        const { data: all } = await sb
          .from("reviews")
          .select("rating")
          .eq("store_id", storeId);
        const ratings = (all ?? [])
          .map((r: any) => r.rating)
          .filter((r: unknown): r is number => typeof r === "number" && r > 0);
        const avg =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : typeof place.rating === "number"
            ? place.rating
            : 0;
        await sb
          .from("stores")
          .update({
            average_rating: Number(avg.toFixed(2)),
            total_reviews:
              typeof place.userRatingCount === "number"
                ? place.userRatingCount
                : ratings.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", storeId);
      } catch {
        // 集計更新失敗は致命的ではないので無視
      }

      summary.push({ storeId, inserted, updated });
    } catch (e: any) {
      summary.push({ storeId, error: e?.message ?? "unknown" });
    }
  }

  const totalInserted = summary.reduce((a, s) => a + (s.inserted ?? 0), 0);
  const totalUpdated = summary.reduce((a, s) => a + (s.updated ?? 0), 0);
  const errors = summary.filter((s) => s.error);

  return NextResponse.json({
    success: true,
    storesProcessed: stores.length,
    totalInserted,
    totalUpdated,
    errors: errors.length,
    summary,
  });
}
