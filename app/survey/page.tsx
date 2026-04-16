"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardBody,
  Button, Badge, PageHeader, AIPulse, AIOutput,
} from "@/components/ui";
import {
  MENU_OPTIONS, VISIT_REASONS, LANG_LABELS,
} from "@/lib/utils";
import type { Language, SurveyAnswer } from "@/types";
import { Copy, RefreshCw, Send, Star, Check } from "lucide-react";
import { useStore } from "@/lib/store-context";

export default function SurveyPage() {
  const { currentStore } = useStore();
  const storeName = currentStore?.name ?? "店舗";
  const storeKeywords = currentStore?.keywords ?? [];
  const [lang, setLang] = useState<Language>("ja");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [visitReason, setVisitReason] = useState("");
  const [menus, setMenus] = useState<string[]>([]);
  const [staffRating, setStaffRating] = useState("");
  const [atmosphere, setAtmosphere] = useState("");
  const [freeText, setFreeText] = useState("");

  const [review, setReview] = useState("");
  const [usedKeyword, setUsedKeyword] = useState("");
  const [reply, setReply] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const toggleMenu = (m: string) =>
    setMenus((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );

  const handleGenerate = async () => {
    setReviewLoading(true);
    setReview("");
    setReply("");
    const body: SurveyAnswer = {
      visitReason, menus, rating, staffRating, atmosphere, freeText, language: lang,
    };
    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, storeName, keywords: storeKeywords }),
      });
      const data = await res.json();
      const generatedReview = data.review || "エラーが発生しました。";
      setReview(generatedReview);
      setUsedKeyword(data.keyword || "");
      // Auto-generate reply
      generateReply(generatedReview, lang);
      // DB保存（バックグラウンドで実行、エラーは無視しない）
      saveToDB({ visitReason, menus, rating, staffRating, atmosphere, freeText, language: lang }, generatedReview);
    } catch {
      const fallbackKw = storeKeywords[0] ?? storeName;
      setReview(
        `【サンプル出力】\n\nInstagramで見かけて初めて訪問しました。${fallbackKw}の中でも特に丁寧なカウンセリングで、仕上がりが想像以上に自然！スタッフの方がとても親切で、上品な空間でリラックスできました。また絶対来ます！`
      );
      setUsedKeyword(fallbackKw);
      generateReply("サンプル口コミです。", lang);
    } finally {
      setReviewLoading(false);
    }
  };

  const generateReply = async (reviewText: string, language: Language) => {
    setReplyLoading(true);
    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText,
          language,
          storeName,
          rating,
        }),
      });
      const data = await res.json();
      setReply(data.reply || "");
    } catch {
      setReply(`この度はご来店いただきありがとうございます！またのご来店を心よりお待ちしております。${storeName} スタッフ一同`);
    } finally {
      setReplyLoading(false);
    }
  };

  const saveToDB = async (answer: any, generatedReview: string) => {
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/save-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answer, generatedReview }),
      });
      if (res.ok) setSaved(true);
      else setSaveError("保存に失敗しました");
    } catch {
      setSaveError("DB接続エラー（モードで動作中）");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="口コミ生成"
        subtitle="アンケートに答えるだけで、AIが最適な口コミ文を生成します"
      />

      <div className="grid grid-cols-2 gap-6">
        {/* ── Left: Questionnaire ── */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>📋 お客様アンケート — {storeName}</CardTitle>
              {/* Language toggle */}
              <div className="flex gap-1.5">
                {(Object.keys(LANG_LABELS) as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                    style={{
                      background: lang === l ? "var(--accent)" : "transparent",
                      border: `1px solid ${lang === l ? "var(--accent)" : "var(--border)"}`,
                      color: lang === l ? "#fff" : "var(--muted2)",
                      cursor: "pointer",
                    }}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Visit reason */}
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                  ご来店のきっかけ
                </label>
                <select
                  className="input-base"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                >
                  <option value="">選択してください</option>
                  {VISIT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Menu checkboxes */}
              <div>
                <label className="block text-[12px] mb-2" style={{ color: "var(--muted2)" }}>
                  ご利用メニュー（複数可）
                </label>
                <div className="flex flex-wrap gap-2">
                  {MENU_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleMenu(m)}
                      className="px-3 py-1.5 rounded-full text-[12px] transition-all"
                      style={{
                        background: menus.includes(m) ? "rgba(59,130,246,0.2)" : "var(--surface2)",
                        border: `1px solid ${menus.includes(m) ? "rgba(59,130,246,0.6)" : "var(--border)"}`,
                        color: menus.includes(m) ? "var(--accent)" : "var(--muted2)",
                        cursor: "pointer",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star rating */}
              <div>
                <label className="block text-[12px] mb-2" style={{ color: "var(--muted2)" }}>
                  全体的な満足度
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 28,
                        color: n <= (hoverRating || rating) ? "var(--amber)" : "var(--border)",
                        transition: "color 0.1s",
                        padding: "0 2px",
                      }}
                    >
                      ★
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-[13px] self-center" style={{ color: "var(--muted2)" }}>
                      {rating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Staff + Atmosphere */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                    スタッフの対応
                  </label>
                  <select className="input-base" value={staffRating} onChange={(e) => setStaffRating(e.target.value)}>
                    <option value="">選択</option>
                    <option value="とても良かった">とても良かった</option>
                    <option value="良かった">良かった</option>
                    <option value="普通">普通</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                    店内の雰囲気
                  </label>
                  <select className="input-base" value={atmosphere} onChange={(e) => setAtmosphere(e.target.value)}>
                    <option value="">選択</option>
                    <option value="おしゃれで居心地が良かった">おしゃれで居心地良かった</option>
                    <option value="清潔感があった">清潔感があった</option>
                    <option value="リラックスできた">リラックスできた</option>
                  </select>
                </div>
              </div>

              {/* Free text */}
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                  感想（任意）
                </label>
                <textarea
                  className="input-base"
                  rows={3}
                  placeholder="特に良かった点など..."
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                  対策キーワード（AIが口コミに含めます）
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {storeKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-full text-[11px]"
                      style={{
                        background: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        color: "var(--accent)",
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={reviewLoading}
                className="w-full justify-center py-3 text-[14px]"
              >
                {reviewLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>✨ AIで口コミを生成する</>
                )}
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* ── Right: AI Output ── */}
        <div className="space-y-5">
          {/* Review output */}
          <Card glow>
            <CardHeader>
              <CardTitle>AI生成 口コミ文</CardTitle>
              {review && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? <><Check size={13} /> コピー済</> : <><Copy size={13} /> コピー</>}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={reviewLoading}>
                    <RefreshCw size={13} /> 再生成
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardBody>
              <AIPulse label="Claude AI — 口コミ生成エンジン" />
              <AIOutput loading={reviewLoading} minHeight={180}>
                {review || (
                  <span style={{ color: "var(--muted)" }}>
                    {`アンケートに回答してボタンを押すと、\nAIが自動で口コミ文を作成します。\n\n✓ 地域・業種キーワード入り\n✓ 自然な表現でステマ防止\n✓ AIO対策に最適な文章`}
                  </span>
                )}
              </AIOutput>

              {usedKeyword && (
                <div className="mt-2 text-[11px] flex items-center gap-3" style={{ color: "var(--muted)" }}>
                  <span>使用キーワード: <span style={{ color: "var(--accent)" }}>{usedKeyword}</span></span>
                  {saved && <span style={{ color: "var(--green)" }}>✓ DB保存済</span>}
                  {saveError && <span style={{ color: "var(--amber)", fontSize: 10 }}>{saveError}</span>}
                </div>
              )}

              {review && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="text-[12px] mb-3" style={{ color: "var(--muted)" }}>
                    投稿先を選択してください：
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm">🗺️ Googleマップへ投稿</Button>
                    <Button variant="ghost" size="sm">⭐ TripAdvisorへ</Button>
                    <Button variant="ghost" size="sm">🍽️ 食べログへ</Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Reply output */}
          <Card>
            <CardHeader>
              <CardTitle>🤖 オーナー返信文</CardTitle>
              {reply && <Badge variant="green">AI生成済</Badge>}
            </CardHeader>
            <CardBody>
              <AIPulse label="Claude AI — 返信生成エンジン" />
              <AIOutput loading={replyLoading} minHeight={100}>
                {reply || (
                  <span style={{ color: "var(--muted)" }}>
                    口コミ生成後に自動で返信文も作成されます
                  </span>
                )}
              </AIOutput>
              {reply && (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => navigator.clipboard.writeText(reply)}
                >
                  <Copy size={13} /> 返信文をコピー
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

