"use client";

import { Card, CardHeader, CardTitle, CardBody, Badge, PageHeader, ProgressBar } from "@/components/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { CHANNEL_DATA, MOCK_STORE } from "@/lib/utils";

const MENU_DATA = [
  { name: "カット", value: 276, pct: 35.5 },
  { name: "トリートメント", value: 186, pct: 23.9 },
  { name: "カラー", value: 123, pct: 15.8 },
  { name: "ヘアスパ", value: 70, pct: 9.0 },
  { name: "縮毛矯正", value: 65, pct: 8.4 },
  { name: "パーマ", value: 37, pct: 4.8 },
];

const RATING_DATA = [
  { rating: "★5", count: 182, pct: 73.7 },
  { rating: "★4", count: 42, pct: 17.0 },
  { rating: "★3", count: 14, pct: 5.7 },
  { rating: "★2", count: 6, pct: 2.4 },
  { rating: "★1", count: 3, pct: 1.2 },
];

const RADAR_DATA = [
  { subject: "スタッフ対応", A: 4.8 },
  { subject: "技術力", A: 4.6 },
  { subject: "雰囲気", A: 4.7 },
  { subject: "コスパ", A: 4.2 },
  { subject: "清潔感", A: 4.9 },
  { subject: "立地", A: 4.5 },
];

const MONTHLY_DATA = [
  { month: "11月", responses: 38, reviews: 22 },
  { month: "12月", responses: 45, reviews: 28 },
  { month: "1月", responses: 52, reviews: 31 },
  { month: "2月", responses: 61, reviews: 38 },
  { month: "3月", responses: 78, reviews: 47 },
  { month: "4月", responses: 94, reviews: 57 },
];

export default function AnalyticsPage() {
  return (
    <div className="animate-slide-up">
      <PageHeader
        title="アンケート分析"
        subtitle="回答データをもとに店舗改善・集客戦略を立案"
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "総回答数", value: "457件", delta: "↑ +94 今月", color: "var(--accent)" },
          { label: "平均満足度", value: "4.7 ★", delta: "↑ +0.1", color: "var(--amber)" },
          { label: "口コミ転換率", value: "48.8%", delta: "↑ +3.2%", color: "var(--green)" },
          { label: "リピート意向", value: "91.2%", delta: "↑ +1.5%", color: "var(--accent2)" },
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
            <div className="text-[12px] mt-1" style={{ color: "var(--green)" }}>{s.delta}</div>
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
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a2235", border: "1px solid #1e2d47", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="responses" name="回答数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reviews" name="口コミ投稿" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Radar chart */}
        <Card>
          <CardHeader>
            <CardTitle>店舗評価レーダー</CardTitle>
            <Badge variant="green">5点満点</Badge>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#1e2d47" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Radar name="評価" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Menu breakdown */}
        <Card>
          <CardHeader><CardTitle>利用メニュー内訳</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {MENU_DATA.map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span>{m.name}</span>
                  <span className="font-medium">{m.pct}%</span>
                </div>
                <ProgressBar value={m.pct} color="blue" />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Rating breakdown */}
        <Card>
          <CardHeader><CardTitle>評価分布</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {RATING_DATA.map((r) => (
              <div key={r.rating}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span style={{ color: "var(--amber)" }}>{r.rating}</span>
                  <span className="font-medium">{r.count}件 ({r.pct}%)</span>
                </div>
                <ProgressBar
                  value={r.pct}
                  color={r.rating === "★5" || r.rating === "★4" ? "green" : r.rating === "★3" ? "amber" : "red"}
                />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Channel */}
        <Card>
          <CardHeader><CardTitle>来店チャネル</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {CHANNEL_DATA.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span>{c.name}</span>
                  <span className="font-medium">{c.value}%</span>
                </div>
                <ProgressBar value={c.value} color={c.color} />
              </div>
            ))}
            <div className="pt-2 text-[12px]" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
              総回答数 <strong className="text-white">457件</strong>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
