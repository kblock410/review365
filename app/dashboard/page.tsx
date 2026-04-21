"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Card, CardHeader, CardTitle, CardBody,
  StatCard, Badge, Button, PageHeader, ProgressBar,
} from "@/components/ui";
import {
  MOCK_STATS, IMPRESSIONS_DATA, REVIEW_GROWTH_DATA,
  CHANNEL_DATA, formatDelta,
} from "@/lib/utils";
import { AlertCircle, Camera, Loader2, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { DashboardStats } from "@/types";
import { useStore } from "@/lib/store-context";

export default function DashboardPage() {
  const { currentStoreId, currentStore } = useStore();
  const [s, setS] = useState<DashboardStats>(MOCK_STATS);
  const [impressionsData, setImpressionsData] = useState(IMPRESSIONS_DATA);
  const [reviewGrowthData, setReviewGrowthData] = useState(REVIEW_GROWTH_DATA);
  const [dataSource, setDataSource] = useState<"db" | "mock">("mock");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentStoreId) return;
    (window as any).__dashEffect = ((window as any).__dashEffect ?? 0) + 1;
    (window as any).__dashStoreId = currentStoreId;
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/dashboard?storeId=${encodeURIComponent(currentStoreId)}`, {
      cache: "no-store",
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        (window as any).__dashResolved = true;
        setS(data.stats);
        if (data.impressionsData?.length > 0) setImpressionsData(data.impressionsData);
        if (data.reviewGrowthData) {
          setReviewGrowthData(data.reviewGrowthData);
        } else {
          setReviewGrowthData(REVIEW_GROWTH_DATA);
        }
        setDataSource(data.source ?? "mock");
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        (window as any).__dashError = e.message;
      })
      .finally(() => {
        (window as any).__dashFinally = ((window as any).__dashFinally ?? 0) + 1;
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [currentStoreId]);

  if (loading) {
    return (
      <div className="animate-slide-up flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
        <p style={{ color: "var(--muted)" }}>データを取得中...</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="ダッシュボード"
        subtitle={`${currentStore?.name ?? "店舗"} — 過去30日間の概要`}
        badge={dataSource === "db" ? "Supabase" : "デモデータ"}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Googleマップ 表示回数"
          value={s.impressions.toLocaleString()}
          delta={`↑ ${formatDelta(s.impressionsDelta)} 先月比`}
          accent="blue"
        />
        <StatCard
          label="口コミ件数（累計）"
          value={s.totalReviews}
          delta={`↑ +${s.reviewsDelta} 今月`}
          accent="green"
        />
        <StatCard
          label="平均 ★ 評価"
          value={s.averageRating.toFixed(1)}
          delta={`↑ +${s.ratingDelta}`}
          accent="amber"
        />
        <StatCard
          label={`MAP 順位（${currentStore?.area ?? "エリア"} ${currentStore?.category === "restaurant" ? "飲食店" : currentStore?.category === "clinic" ? "クリニック" : currentStore?.category === "beauty" ? "美容室" : "店舗"}）`}
          value={`#${s.mapRank}`}
          delta={`↑ 圏外 → ${s.mapRank}位`}
          accent="red"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Impressions chart */}
        <Card glow>
          <CardHeader>
            <CardTitle>表示回数 推移</CardTitle>
            <Badge variant="blue">6ヶ月</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-mono text-3xl font-semibold">
                {s.impressions.toLocaleString()}
              </span>
              <span className="text-sm text-green-400">↑ +{s.impressionsDelta.toLocaleString()}</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={impressionsData}>
                <defs>
                  <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#1a2235", border: "1px solid #1e2d47", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#3b82f6" }}
                  formatter={(v: any) => [(v as number).toLocaleString(), "表示回数"]}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#impGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Channel pie */}
        <Card>
          <CardHeader>
            <CardTitle>集客チャネル分析</CardTitle>
            <Badge variant="blue">今月</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={CHANNEL_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={62} paddingAngle={2}>
                    {CHANNEL_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {CHANNEL_DATA.map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span style={{ color: "#94a3b8" }}>{d.name}</span>
                      <span className="font-medium">{d.value}%</span>
                    </div>
                    <ProgressBar value={d.value} color={d.color} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 text-[12px]" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
              総回答数 <strong className="text-white">457件</strong>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Review growth + Actions */}
      <div className="grid grid-cols-2 gap-5">
        {/* Review growth */}
        <Card>
          <CardHeader>
            <CardTitle>口コミ数 推移</CardTitle>
            <Badge variant="green">増加中</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-mono text-3xl font-semibold">{s.totalReviews}件</span>
            </div>
            <div className="text-[12px] mb-2" style={{ color: "var(--muted)" }}>
              目標 300件まで あと{300 - s.totalReviews}件
            </div>
            <ProgressBar value={(s.totalReviews / 300) * 100} color="blue" className="mb-4" />
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={reviewGrowthData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "#1a2235", border: "1px solid #1e2d47", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [v, "件"]}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* AI Actions */}
        <Card>
          <CardHeader>
            <CardTitle>AIアクション提案</CardTitle>
            <Badge variant="blue">3件</Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            <div
              className="p-4 rounded-xl flex gap-3"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              <AlertCircle size={18} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-[13px] font-medium mb-1">低評価への返信が必要</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>未返信の★3以下が3件あります</div>
                <Link href="/reviews">
                  <Button variant="ghost" size="sm" className="mt-2">確認する →</Button>
                </Link>
              </div>
            </div>
            <div
              className="p-4 rounded-xl flex gap-3"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              <Camera size={18} style={{ color: "var(--accent2)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-[13px] font-medium mb-1">写真の更新</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>最終更新から14日経過しています</div>
              </div>
            </div>
            <div
              className="p-4 rounded-xl flex gap-3"
              style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)" }}
            >
              <Target size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-[13px] font-medium mb-1">AIO対策キーワード改善</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>「銀座 縮毛矯正」の表示確率が低下中</div>
                <Link href="/aio">
                  <Button size="sm" className="mt-2">今すぐ診断 →</Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

