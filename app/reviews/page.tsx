"use client";

import { useState, useEffect } from "react";
import {
  Card, CardHeader, CardTitle, CardBody,
  Badge, Button, PageHeader, Stars, AIPulse, AIOutput,
} from "@/components/ui";
import { LANG_LABELS } from "@/lib/utils";
import type { Review } from "@/types";
import { MessageSquare, RefreshCw, Check, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store-context";

type Filter = "all" | "unreplied" | "low";

export default function ReviewsPage() {
  const { currentStoreId, currentStore } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"db" | "mock">("mock");

  useEffect(() => {
    setLoading(true);
    setReviews([]);
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        // DBのカラム名（snake_case）をフロント型（camelCase）に変換
        const mapped: Review[] = data.reviews.map((r: any) => ({
          id: r.id,
          reviewerName: r.reviewer_name ?? r.reviewerName,
          rating: r.rating,
          text: r.text,
          language: r.language ?? "ja",
          date: r.review_date
            ? new Date(r.review_date).toLocaleDateString("ja-JP").replace(/-/g, "/")
            : r.date ?? "",
          replied: r.replied ?? false,
          replyText: r.reply_text ?? r.replyText,
          source: r.source ?? "google",
          isLocal: r.is_local_guide ?? r.isLocal ?? false,
        }));
        setReviews(mapped);
        setDataSource(data.source ?? "mock");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentStoreId]);
  const [filter, setFilter] = useState<Filter>("all");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedReplies, setGeneratedReplies] = useState<Record<string, string>>({});
  const [confirmedReplies, setConfirmedReplies] = useState<Set<string>>(new Set());

  const filtered = reviews.filter((r) => {
    if (filter === "unreplied") return !r.replied;
    if (filter === "low") return r.rating <= 3;
    return true;
  });

  const counts = {
    all: reviews.length,
    unreplied: reviews.filter((r) => !r.replied).length,
    low: reviews.filter((r) => r.rating <= 3).length,
  };

  const handleGenerateReply = async (review: Review) => {
    setGeneratingId(review.id);
    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: review.text,
          language: review.language,
          storeName: currentStore?.name ?? "店舗",
          rating: review.rating,
        }),
      });
      const data = await res.json();
      setGeneratedReplies((prev) => ({ ...prev, [review.id]: data.reply }));
    } catch {
      const fallback =
        review.language === "en"
          ? "Thank you so much for your kind review! We're so happy you enjoyed your experience. We look forward to welcoming you back soon!"
          : review.rating <= 3
          ? "この度はご不便をおかけし、誠に申し訳ございません。いただいたご意見を真摯に受け止め、改善に努めてまいります。またのご来店をお待ちしております。"
          : `この度はご来店いただきありがとうございます！またのご来店を心よりお待ちしております。${currentStore?.name ?? "店舗"} スタッフ一同`;
      setGeneratedReplies((prev) => ({ ...prev, [review.id]: fallback }));
    } finally {
      setGeneratingId(null);
    }
  };

  const handleConfirmReply = async (id: string) => {
    const replyText = generatedReplies[id];
    // 承認した返信テキストをDBに保存
    try {
      await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: id, replyText }),
      });
    } catch {}
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, replied: true, replyText }
          : r
      )
    );
    setConfirmedReplies((prev) => new Set([...prev, id]));
  };

  const getLangBadge = (lang: string) => {
    const v = lang === "ja" ? "amber" : lang === "en" ? "blue" : "green";
    return <Badge variant={v as any}>{LANG_LABELS[lang] ?? lang.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="animate-slide-up flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
        <p style={{ color: "var(--muted)" }}>口コミデータを取得中...</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="口コミ管理"
        subtitle="Googleマップの口コミを一元管理・AIで返信"
        badge={dataSource === "db" ? "Supabase" : "デモデータ"}
      />

      {/* Filter tabs */}
      <div
        className="flex mb-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {(["all", "unreplied", "low"] as Filter[]).map((f) => {
          const labels = { all: "すべて", unreplied: "未返信", low: "低評価" };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-5 py-2.5 text-[13px] transition-all"
              style={{
                marginBottom: -1,
                color: filter === f ? "var(--accent)" : "var(--muted)",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${filter === f ? "var(--accent)" : "transparent"}`,
                cursor: "pointer",
              }}
            >
              {labels[f]}{" "}
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{
                  background: filter === f ? "rgba(59,130,246,0.2)" : "var(--surface2)",
                  color: filter === f ? "var(--accent)" : "var(--muted)",
                }}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "総口コミ数", value: reviews.length, color: "var(--accent)" },
          { label: "平均評価", value: "4.7 ★", color: "var(--amber)" },
          { label: "返信率", value: `${Math.round((reviews.filter(r=>r.replied).length/reviews.length)*100)}%`, color: "var(--green)" },
          { label: "ローカルガイド", value: reviews.filter(r=>r.isLocal).length + "件", color: "var(--accent2)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="text-[11px] mb-1" style={{ color: "var(--muted)" }}>{s.label}</div>
            <div className="font-mono text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Review list */}
      <Card>
        <CardBody className="p-0">
          {filtered.length === 0 && (
            <div className="p-8 text-center" style={{ color: "var(--muted)" }}>
              該当する口コミはありません
            </div>
          )}
          {filtered.map((review, idx) => (
            <div
              key={review.id}
              className="p-5"
              style={{
                borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium flex-shrink-0"
                    style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent)" }}
                  >
                    {review.reviewerName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{review.reviewerName}</span>
                      {review.isLocal && <Badge variant="blue">ローカルガイド</Badge>}
                      {getLangBadge(review.language)}
                    </div>
                    <Stars rating={review.rating} size={13} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: "var(--muted)" }}>{review.date}</span>
                  {review.replied ? (
                    <Badge variant="green">返信済</Badge>
                  ) : (
                    <Badge variant="amber">未返信</Badge>
                  )}
                </div>
              </div>

              {/* Review text */}
              <p className="text-[13px] leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
                {review.text}
              </p>

              {/* Existing reply */}
              {review.replied && review.replyText && (
                <div
                  className="rounded-lg p-3 mb-3"
                  style={{
                    background: "rgba(59,130,246,0.05)",
                    borderLeft: "2px solid var(--accent)",
                  }}
                >
                  <div className="text-[11px] mb-1" style={{ color: "var(--accent)" }}>オーナーの返信</div>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--muted2)" }}>
                    {review.replyText}
                  </p>
                </div>
              )}

              {/* AI Reply generation (for unreplied) */}
              {!review.replied && (
                <div>
                  {generatedReplies[review.id] ? (
                    <div>
                      <AIPulse label="Claude AI — 生成された返信" />
                      <AIOutput minHeight={60}>
                        {generatedReplies[review.id]}
                      </AIOutput>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => handleConfirmReply(review.id)}>
                          <Check size={13} /> この返信を投稿する
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateReply(review)}
                          disabled={generatingId === review.id}
                        >
                          <RefreshCw size={13} /> 再生成
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateReply(review)}
                      disabled={generatingId === review.id}
                    >
                      {generatingId === review.id ? (
                        <>
                          <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <><MessageSquare size={13} /> AI返信を生成</>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

