import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * 公開アンケートページから呼ぶ単一店舗取得エンドポイント。
 * Service Role は使わず、読める列のみ返す（将来的に RLS を絞る前提）。
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sb = createServerClient();
    // 防御的に SELECT: 未マイグレーション列でクエリが落ちないよう、まず必須列のみ取得
    const baseCols = "id, name, area, category, keywords, average_rating, total_reviews, map_rank";
    const { data, error } = await sb
      .from("stores")
      .select(baseCols)
      .eq("id", id)
      .single();
    if (error || !data) {
      return NextResponse.json({ store: null, error: error?.message ?? "not_found" }, { status: 404 });
    }
    // オプショナル列（存在すればマージ）
    let gbp_place_id: string | null = null;
    let menu_options: string[] = [];
    try {
      const { data: extra } = await sb
        .from("stores")
        .select("gbp_place_id")
        .eq("id", id)
        .single();
      if (extra && (extra as any).gbp_place_id) gbp_place_id = (extra as any).gbp_place_id;
    } catch {
      // 列が存在しない場合は無視
    }
    try {
      const { data: extraMenu } = await sb
        .from("stores")
        .select("menu_options")
        .eq("id", id)
        .single();
      if (extraMenu && Array.isArray((extraMenu as any).menu_options)) {
        menu_options = (extraMenu as any).menu_options;
      }
    } catch {
      // 列が存在しない場合は無視
    }
    return NextResponse.json({ store: { ...data, gbp_place_id, menu_options } });
  } catch (e: any) {
    return NextResponse.json(
      { store: null, error: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
