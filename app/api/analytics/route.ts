import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type AnswerVal = string | string[] | number | null | undefined;

function parseFree(free: string | null | undefined): Record<string, AnswerVal> | null {
  if (!free) return null;
  try {
    const obj = JSON.parse(free);
    if (obj && typeof obj === "object" && obj.answers) {
      return obj.answers as Record<string, AnswerVal>;
    }
    return null;
  } catch {
    return null;
  }
}

function monthLabel(d: Date) {
  return `${d.getMonth() + 1}月`;
}

export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }
  try {
    const sb = createServerClient();
    // 店舗情報（業種判定）
    const { data: storeRow } = await sb
      .from("stores")
      .select("id, name, category")
      .eq("id", storeId)
      .single();
    const category = storeRow?.category ?? "restaurant";

    // アンケート回答
    const { data: responses, error: respErr } = await sb
      .from("survey_responses")
      .select(
        "id, store_id, rating, menus, visit_reason, staff_rating, atmosphere, free_text, posted_to_google, created_at"
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: true });
    if (respErr) throw respErr;
    const rows = responses ?? [];

    // ── KPI ──────────────────────────────
    const total = rows.length;
    const ratingsOnly = rows.map((r) => r.rating).filter((x): x is number => typeof x === "number" && x > 0);
    const avgRating =
      ratingsOnly.length > 0
        ? ratingsOnly.reduce((a, b) => a + b, 0) / ratingsOnly.length
        : 0;
    const postedCount = rows.filter((r) => r.posted_to_google === true).length;
    const conversionRate = total > 0 ? (postedCount / total) * 100 : 0;

    // 「また来店したいか」をアンケートJSON から抽出してリピート意向を算出
    let revisitYes = 0;
    let revisitTotal = 0;
    for (const r of rows) {
      const ans = parseFree(r.free_text);
      if (!ans) continue;
      const revisitKeys = ["また来店したいか", "また利用したい", "また来たいですか"];
      const k = revisitKeys.find((kk) => kk in ans);
      if (!k) continue;
      revisitTotal += 1;
      const v = ans[k];
      const val = Array.isArray(v) ? v.join(",") : String(v ?? "");
      if (val.includes("ぜひ") || val.includes("また") || val.includes("はい") || val.includes("Yes")) {
        revisitYes += 1;
      }
    }
    const repeatRate = revisitTotal > 0 ? (revisitYes / revisitTotal) * 100 : 0;

    // ── 月次推移（過去6ヶ月） ───────────
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ label: monthLabel(start), start, end });
    }
    const monthly = months.map((m) => {
      const inMonth = rows.filter((r) => {
        const d = new Date(r.created_at);
        return d >= m.start && d < m.end;
      });
      return {
        month: m.label,
        responses: inMonth.length,
        reviews: inMonth.filter((r) => r.posted_to_google === true).length,
      };
    });

    // ── 評価分布 ────────────────────────
    const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratingsOnly) {
      if (r >= 1 && r <= 5) ratingCounts[r as 1 | 2 | 3 | 4 | 5] += 1;
    }
    const ratingDist = [5, 4, 3, 2, 1].map((n) => ({
      rating: `★${n}`,
      count: ratingCounts[n as 1 | 2 | 3 | 4 | 5],
      pct:
        ratingsOnly.length > 0
          ? (ratingCounts[n as 1 | 2 | 3 | 4 | 5] / ratingsOnly.length) * 100
          : 0,
    }));

    // ── メニュー内訳 ────────────────────
    const menuCounts: Record<string, number> = {};
    let menuTotal = 0;
    for (const r of rows) {
      const arr = Array.isArray(r.menus) ? r.menus : [];
      for (const m of arr) {
        menuCounts[m] = (menuCounts[m] ?? 0) + 1;
        menuTotal += 1;
      }
    }
    const menuBreakdown = Object.entries(menuCounts)
      .map(([name, value]) => ({
        name,
        value,
        pct: menuTotal > 0 ? (value / menuTotal) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // ── 来店チャネル ────────────────────
    const channelCounts: Record<string, number> = {};
    let channelTotal = 0;
    for (const r of rows) {
      const ans = parseFree(r.free_text);
      if (!ans) continue;
      const candidates = ["来店のきっかけ", "ご来店のきっかけ", "どこで知ったか"];
      const k = candidates.find((kk) => kk in ans);
      if (!k) continue;
      const v = ans[k];
      const vals = Array.isArray(v) ? v : [v];
      for (const x of vals) {
        const key = String(x ?? "").trim();
        if (!key) continue;
        channelCounts[key] = (channelCounts[key] ?? 0) + 1;
        channelTotal += 1;
      }
    }
    const channelDist = Object.entries(channelCounts)
      .map(([name, count]) => ({
        name,
        value: channelTotal > 0 ? (count / channelTotal) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // ── レーダー（業種別に集計対象を切替） ──
    // 飲食: 料理/味, サービス, 雰囲気, コスパ, 清潔感, 立地 は「総合評価」と「atmosphere等の文字列」しか無いので
    // 当面は総合評価のみ反映して他はNaNを避けるため全体平均で埋める。
    const base = avgRating > 0 ? Number(avgRating.toFixed(2)) : 0;
    const radar =
      category === "beauty"
        ? [
            { subject: "スタッフ対応", A: base },
            { subject: "技術力", A: base },
            { subject: "雰囲気", A: base },
            { subject: "コスパ", A: base },
            { subject: "清潔感", A: base },
            { subject: "立地", A: base },
          ]
        : [
            { subject: "料理・味", A: base },
            { subject: "接客", A: base },
            { subject: "雰囲気", A: base },
            { subject: "コスパ", A: base },
            { subject: "清潔感", A: base },
            { subject: "立地", A: base },
          ];

    return NextResponse.json({
      kpi: {
        total,
        avgRating: Number(avgRating.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(1)),
        repeatRate: Number(repeatRate.toFixed(1)),
      },
      monthly,
      ratingDist,
      menuBreakdown,
      channelDist,
      radar,
      category,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
