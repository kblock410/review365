"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardBody, Badge, PageHeader, ProgressBar } from "@/components/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { useStore } from "@/lib/store-context";

interface AnalyticsData {
  kpi: {
    total: number;
    avgRating: number;
    conversionRate: number;
    repeatRate: number;
  };
  monthly: { month: string; responses: number; reviews: number }[];
  ratingDist: { rating: string; count: number; pct: number }[];
  menuBreakdown: { name: string; value: number; pct: number }[];
  channelDist: { name: string; value: number }[];
  radar: { subject: string; A: number }[];
  category: string;
}

export default function AnalyticsPage() {
  const { currentStoreId } = useStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentStoreId) return;
    setLoading(true);
    setError(null);
    const ctrl = new AbortController();
    fetch(`/api/analytics?storeId=${encodeURIComponent(currentStoreId)}`, {
      cache: "no-store",
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((j: AnalyticsData & { error?: string }) => {
        if (j.error) {
          setError(j.error);
          setData(null);
        } else {
          setData(j);
        }
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(String(e?.message ?? e));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [currentStoreId]);

  if (loading) {
    return (
      <div className="animate-slide-up">
        <PageHeader title="アンケート分析" subtitle="回答データをもとに店舗改善・集客戦略を立案" />
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>読み込み中...</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="animate-slide-up">
        <PageHeader title="アンケート分析" subtitle="回答データをもとに店舗改善・集客戦略を立案" />
        <Card>
          <CardBody>
            <div className="text-[13px]" style={{ color: "var(--amber)" }}>
              データ取得に失敗しました。{error}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const { kpi, monthly, ratingDist, menuBreakdown, channelDist, radar, category } = data;
  const isRestaurant = category === "restaurant";
  const channelTotal = channelDist.reduce((a, c) => a + c.value, 0);

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="アンケート分析"
        subtitle="回答データをもとに店舗改善・集客戦略を立案"
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "総回答数", value: `${kpi.total}件`, color: "var(--accent)" },
          { label: "平均満足度", value: `${kpi.avgRating.toFixed(2)} ★`, color: "var(--amber)" },
          { label: "口コミ転換率", value: `${kpi.conversionRate.toFixed(1)}%`, color: "var(--green)" },
          { label: "リピート意向", value: `${kpi.repeatRate.toFixed(1)}%`, color: "var(--accent2)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
              {s.label}
            </div>
            <div className="font-mono text-2xl font-semibold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Monthly trend */}
        <Card>
          <CardHeader>
            <CardTitle>回答数・口コミ転換 推移</CardTitle>
            <Badge variant="blue">月次</Badge>
          </CardHeader>
          <CardBody>
            {monthly.every((m) => m.responses === 0) ? (
              <div className="text-[12px]" style={{ color: "var(--muted)" }}>まだ回答がありません。</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#1a2235", border: "1px solid #1e2d47", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="responses" name="回答数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reviews" name="口コミ投稿" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Radar chart */}
        <Card>
          <CardHeader>
            <CardTitle>店舗評価レーダー</CardTitle>
            <Badge variant="green">5点満点</Badge>
          </CardHeader>
          <CardBody>
            {kpi.total === 0 ? (
              <div className="text-[12px]" style={{ color: "var(--muted)" }}>まだ回答がありません。</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radar}>
                  <PolarGrid stroke="#1e2d47" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Radar name="評価" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Menu breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{isRestaurant ? "注文メニュー内訳" : "利用メニュー内訳"}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {menuBreakdown.length === 0 ? (
              <div className="text-[12px]" style={{ color: "var(--muted)" }}>データなし</div>
            ) : (
              menuBreakdown.map((m) => (
                <div key={m.name}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span>{m.name}</span>
                    <span className="font-medium">{m.pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={m.pct} color="blue" />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Rating breakdown */}
        <Card>
          <CardHeader><CardTitle>評価分布</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {kpi.total === 0 ? (
              <div className="text-[12px]" style={{ color: "var(--muted)" }}>データなし</div>
            ) : (
              ratingDist.map((r) => (
                <div key={r.rating}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span style={{ color: "var(--amber)" }}>{r.rating}</span>
                    <span className="font-medium">{r.count}件 ({r.pct.toFixed(1)}%)</span>
                  </div>
                  <ProgressBar
                    value={r.pct}
                    color={r.rating === "★5" || r.rating === "★4" ? "green" : r.rating === "★3" ? "amber" : "red"}
                  />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Channel */}
        <Card>
          <CardHeader><CardTitle>来店チャネル</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {channelDist.length === 0 ? (
              <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                来店きっかけのデータがまだ集まっていません
              </div>
            ) : (
              channelDist.map((c, i) => (
                <div key={c.name}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span>{c.name}</span>
                    <span className="font-medium">{c.value.toFixed(1)}%</span>
                  </div>
                  <ProgressBar
                    value={c.value}
                    color={["blue", "green", "amber", "red", "purple", "cyan"][i % 6] as any}
                  />
                </div>
              ))
            )}
            {channelTotal > 0 && (
              <div className="pt-2 text-[12px]" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
                総回答数 <strong className="text-white">{kpi.total}件</strong>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
