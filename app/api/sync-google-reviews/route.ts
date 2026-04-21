import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Google Places API (New) で店舗の最新口コミを取得し、reviews テーブルに upsert する。
 *
 * 必要な環境変数:
 *   GOOGLE_PLACES_API_KEY … Google Cloud の Places API 用 API キー
 *
 * Places API (New) は最大5件の最新レビューを返す。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const storeId = body.storeId as string | undefined;
    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_PLACES_API_KEY が未設定です" },
        { status: 500 }
      );
    }

    const sb = createServerClient();
    const { data: store, error: storeErr } = await sb
      .from("stores")
      .select("id, gbp_place_id")
      .eq("id", storeId)
      .single();
    if (storeErr || !store) {
      return NextResponse.json({ error: "store not found" }, { status: 404 });
    }
    const placeId = (store as any).gbp_place_id as string | null;
    if (!placeId) {
      return NextResponse.json(
        { error: "この店舗には Place ID が設定されていません" },
        { status: 400 }
      );
    }

    // Places API (New) 呼び出し
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "reviews,rating,userRatingCount,displayName",
      },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Places API error: ${res.status} ${txt}` },
        { status: 502 }
      );
    }
    const place = (await res.json()) as {
      displayName?: { text?: string };
      rating?: number;
      userRatingCount?: number;
      reviews?: Array<{
        name: string; // "places/{placeId}/reviews/{reviewId}"
        relativePublishTimeDescription?: string;
        rating?: number;
        text?: { text?: string; languageCode?: string };
        originalText?: { text?: string; languageCode?: string };
        authorAttribution?: { displayName?: string; photoUri?: string; uri?: string };
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
      // google_review_id で存在確認
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

    // store の集計値を更新（GooglesideのrratingをそのままDBに反映、ローカル全件でも再計算）
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

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      totalFetched: incoming.length,
      googleRating: place.rating ?? null,
      googleUserRatingCount: place.userRatingCount ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
