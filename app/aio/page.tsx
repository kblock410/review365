"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardBody,
  Badge, Button, PageHeader, ProgressBar, AIPulse, AIOutput,
} from "@/components/ui";
import { MOCK_AIO, MOCK_CITATIONS, MOCK_STORE, getScoreColor } from "@/lib/utils";
import type { AIOResult, CitationStatus } from "@/types";
import { Sparkles, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store-context";

const AI_ENGINES = [
  { key: "chatgpt", label: "ChatGPT", color: "#10b981" },
  { key: "gemini", label: "Gemini", color: "#8b5cf6" },
  { key: "googleAI", label: "Google AIモード", color: "#3b82f6" },
];

function ScorePill({ value }: { value: number }) {
  const color = value >= 70 ? "#10b981" : value >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <span
      className="font-mono text-xl font-semibold"
      style={{ color }}
    >
      {value}%
    </span>
  );
}

function CitationIcon({ status }: { status: CitationStatus["status"] }) {
  if (status === "registered") return <CheckCircle2 size={15} color="#10b981" />;
  if (status === "unregistered") return <XCircle size={15} color="#ef4444" />;
  return <AlertCircle size={15} color="#f59e0b" />;
}

export default function AIOPage() {
  const { currentStore } = useStore();
  const storeName = currentStore?.name ?? MOCK_STORE.name;
  const storeArea = currentStore?.area ?? MOCK_STORE.area;
  const storeKeywords = (currentStore?.keywords?.length ? currentStore.keywords : MOCK_STORE.keywords) as string[];
  const storeTotalReviews = currentStore?.total_reviews ?? MOCK_STORE.totalReviews;
  const storeRating = currentStore?.average_rating ?? MOCK_STORE.averageRating;

  const [advice, setAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [weakKw, setWeakKw] = useState(MOCK_AIO[2].keyword); // default: 最弱キーワード

  const handleGetAdvice = async () => {
    setAdviceLoading(true);
    setAdvice("");
    try {
      const res = await fetch("/api/aio-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          area: storeArea,
          keywords: storeKeywords,
          weakKeyword: weakKw,
          totalReviews: storeTotalReviews,
          rating: storeRating,
        }),
      });
      const data = await res.json();
      setAdvice(data.advice || "アドバイスを取得できませんでした。");
    } catch {
      setAdvice(
        `## 優先度：高\n\n**① 「${weakKw}」キーワードを含む口コミを増やす**\n- 月10件以上の高品質な口コミに「${weakKw}」を自然に含める\n- AIはGoogleマップの口コミを信用情報として最優先で参照する\n\n## 優先度：高\n\n**② Googleビジネスプロフィールのサービス欄を更新**\n- 「${storeArea}」「縮毛矯正」を明記\n- 写真を週2回定期更新し、アクティブな店舗と認識させる\n\n## 優先度：中\n\n**③ 最新情報投稿にキーワードを含める**\n- GBPの最新情報投稿に「${weakKw}」を定期的に含める\n- AIが読み取れる構造化された情報を継続的に発信`
      );
    } finally {
      setAdviceLoading(false);
    }
  };

  // Citation score
  const registeredCount = MOCK_CITATIONS.filter((c) => c.status === "registered").length;
  const citationScore = Math.round((registeredCount / MOCK_CITATIONS.length) * 100);

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="AIO診断"
        subtitle="ChatGPT・Gemini・Google AIモードでの表示確率を診断します"
      />

      <div className="grid grid-cols-2 gap-5">
        {/* ── Left Column ── */}
        <div className="space-y-5">
          {/* AIO Score table */}
          <Card>
            <CardHeader>
              <CardTitle>キーワード × AI表示確率</CardTitle>
              <Badge variant="blue">リアルタイム診断</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {/* Header row */}
              <div
                className="grid px-5 py-2 text-[11px]"
                style={{
                  color: "var(--muted)",
                  borderBottom: "1px solid var(--border)",
                  gridTemplateColumns: "1fr 80px 80px 100px",
                }}
              >
                <span>キーワード</span>
                <span className="text-center">ChatGPT</span>
                <span className="text-center">Gemini</span>
                <span className="text-center">Google AI</span>
              </div>

              {MOCK_AIO.map((aio, idx) => (
                <div
                  key={aio.keyword}
                  className="grid px-5 py-3.5 items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                  style={{
                    gridTemplateColumns: "1fr 80px 80px 100px",
                    borderBottom: idx < MOCK_AIO.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                  onClick={() => setWeakKw(aio.keyword)}
                >
                  <span className="text-[13px] font-medium">{aio.keyword}</span>
                  <div className="text-center"><ScorePill value={aio.chatgpt} /></div>
                  <div className="text-center"><ScorePill value={aio.gemini} /></div>
                  <div className="text-center"><ScorePill value={aio.googleAI} /></div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* MAP Health Score */}
          <Card>
            <CardHeader>
              <CardTitle>MAP健康診断スコア</CardTitle>
              <Badge variant="amber">要改善</Badge>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="font-mono text-5xl font-bold"
                  style={{ color: "var(--amber)" }}
                >
                  C
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold">68 / 100</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>
                    総合スコア
                  </div>
                  <ProgressBar value={68} color="amber" className="mt-2 w-48" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "基本情報", grade: "A", score: 95, v: "green" },
                  { label: "写真", grade: "B", score: 70, v: "blue" },
                  { label: "口コミ", grade: "B", score: 75, v: "blue" },
                  { label: "最新情報", grade: "D", score: 30, v: "red" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-[13px] w-20" style={{ color: "var(--muted2)" }}>
                      {item.label}
                    </span>
                    <ProgressBar value={item.score} color={item.v} className="flex-1" />
                    <Badge variant={item.v as any} className="w-8 text-center">
                      {item.grade}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">
          {/* AIO Advice */}
          <Card glow>
            <CardHeader>
              <CardTitle>✨ AIO対策 AIアドバイス</CardTitle>
              <Button size="sm" onClick={handleGetAdvice} disabled={adviceLoading}>
                {adviceLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    診断中...
                  </>
                ) : (
                  <><Sparkles size={13} /> 診断する</>
                )}
              </Button>
            </CardHeader>
            <CardBody>
              <div className="mb-3">
                <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                  診断するキーワード
                </label>
                <select
                  className="input-base"
                  value={weakKw}
                  onChange={(e) => setWeakKw(e.target.value)}
                >
                  {storeKeywords.map((kw) => (
                    <option key={kw} value={kw}>{kw}</option>
                  ))}
                </select>
              </div>
              <AIPulse label="Claude AI — AIO最適化エンジン" />
              <AIOutput loading={adviceLoading} minHeight={200}>
                {advice || (
                  <span style={{ color: "var(--muted)" }}>
                    {`キーワードを選択して「診断する」ボタンを押すと、\nAIがあなたの店舗のAIO対策について\n具体的なアドバイスを生成します。\n\n• ChatGPT / Gemini / Google AIモードの仕組みを分析\n• 表示確率を上げる具体的な施策を提案\n• 優先度付きで実行プランを提示`}
                  </span>
                )}
              </AIOutput>
            </CardBody>
          </Card>

          {/* Citation status */}
          <Card>
            <CardHeader>
              <CardTitle>サイテーション状況</CardTitle>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold" style={{ color: getScoreColor(citationScore) }}>
                  {citationScore}
                </span>
                <span className="text-[12px]" style={{ color: "var(--muted)" }}>/ 100</span>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="px-5 pb-4 pt-3">
                <ProgressBar
                  value={citationScore}
                  color={citationScore >= 80 ? "green" : citationScore >= 50 ? "amber" : "red"}
                  className="mb-4"
                />
              </div>
              <div className="divide-y" style={{ borderTop: "1px solid var(--border)" }}>
                {MOCK_CITATIONS.map((c) => (
                  <div
                    key={c.platform}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="text-[13px]">{c.platform}</span>
                    <div className="flex items-center gap-2">
                      <CitationIcon status={c.status} />
                      <span
                        className="text-[12px]"
                        style={{
                          color:
                            c.status === "registered"
                              ? "var(--green)"
                              : c.status === "unregistered"
                              ? "var(--red)"
                              : "var(--amber)",
                        }}
                      >
                        {c.status === "registered"
                          ? "登録済"
                          : c.status === "unregistered"
                          ? "未登録"
                          : "要確認"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <Button className="w-full justify-center" size="sm">
                  未登録メディアに一括登録する
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

