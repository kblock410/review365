"use client";

import { useMemo, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardBody,
  Button, Badge, PageHeader, AIPulse, AIOutput,
} from "@/components/ui";
import { LANG_LABELS } from "@/lib/utils";
import type { Language } from "@/types";
import { Copy, RefreshCw, Check } from "lucide-react";
import { useStore } from "@/lib/store-context";
import { getSurveyTemplate } from "@/lib/survey-templates";
import type { SurveyQuestion } from "@/lib/survey-templates/types";

type AnswerMap = Record<string, string | string[] | number>;

export default function SurveyPage() {
  const { currentStore } = useStore();
  const storeName = currentStore?.name ?? "店舗";
  const storeKeywords = currentStore?.keywords ?? [];
  const storeCategory = currentStore?.category ?? "restaurant";

  // 業種ごとのアンケートテンプレを取得
  const template = useMemo(
    () => getSurveyTemplate(storeCategory),
    [storeCategory]
  );

  // 店舗側カスタム選択肢の上書き（Q4: メニュー など）
  const questions = useMemo<SurveyQuestion[]>(() => {
    return template.questions.map((q) => {
      if (q.sourceFromStore) {
        const override = (currentStore as any)?.[q.sourceFromStore];
        if (Array.isArray(override) && override.length > 0) {
          return {
            ...q,
            options: override.map((v: string) => ({ value: v, label: v })),
          };
        }
      }
      return q;
    });
  }, [template, currentStore]);

  const [lang, setLang] = useState<Language>("ja");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [hoverRating, setHoverRating] = useState(0);

  const [review, setReview] = useState("");
  const [usedKeyword, setUsedKeyword] = useState("");
  const [reply, setReply] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const setAnswer = (key: string, value: string | string[] | number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMulti = (key: string, value: string) => {
    setAnswers((prev) => {
      const cur = (prev[key] as string[]) ?? [];
      const next = cur.includes(value)
        ? cur.filter((x) => x !== value)
        : [...cur, value];
      return { ...prev, [key]: next };
    });
  };

  const handleGenerate = async () => {
    setReviewLoading(true);
    setReview("");
    setReply("");

    // 回答を「ラベル文字列」に整形して AI に渡す（key/value よりも自然文を作りやすい）
    const labeledAnswers: Record<string, string | string[]> = {};
    for (const q of questions) {
      const v = answers[q.key];
      if (v == null || v === "") continue;
      if (q.type === "multi") {
        const labels = ((v as string[]) ?? [])
          .map((val) => q.options?.find((o) => o.value === val)?.label ?? val);
        labeledAnswers[q.question] = labels;
      } else if (q.type === "single") {
        const label = q.options?.find((o) => o.value === v)?.label ?? String(v);
        labeledAnswers[q.question] = label;
      } else {
        labeledAnswers[q.question] = String(v);
      }
    }

    const ratingValue = (answers["rating"] as number) ?? 0;

    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          keywords: storeKeywords,
          industry: template.aiContext.industry,
          promptHints: template.aiContext.promptHints,
          rating: ratingValue,
          language: lang,
          answers: labeledAnswers,
        }),
      });
      const data = await res.json();
      const generatedReview = data.review || "エラーが発生しました。";
      setReview(generatedReview);
      setUsedKeyword(data.keyword || "");
      generateReply(generatedReview, lang);
      saveToDB(labeledAnswers, generatedReview);
    } catch {
      const fallbackKw = storeKeywords[0] ?? storeName;
      setReview(
        `【サンプル出力】\n\n${storeName}（${template.aiContext.industry}）を利用しました。${fallbackKw}を探していて伺いましたが、料理も雰囲気も期待以上で大満足です。また必ず再訪します！`
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
          rating: (answers["rating"] as number) ?? 0,
        }),
      });
      const data = await res.json();
      setReply(data.reply || "");
    } catch {
      setReply(
        `この度はご来店いただきありがとうございます！またのご来店を心よりお待ちしております。${storeName} スタッフ一同`
      );
    } finally {
      setReplyLoading(false);
    }
  };

  const saveToDB = async (
    labeledAnswers: Record<string, string | string[]>,
    generatedReview: string
  ) => {
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/save-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentStore?.id,
          industry: template.aiContext.industry,
          answers: labeledAnswers,
          generatedReview,
          language: lang,
        }),
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

  // ── 質問描画ヘルパー ──
  const renderQuestion = (q: SurveyQuestion) => {
    const value = answers[q.key];

    if (q.type === "rating") {
      const max = q.max ?? 5;
      const current = (value as number) ?? 0;
      return (
        <div>
          <label className="block text-[12px] mb-2" style={{ color: "var(--muted2)" }}>
            {q.question}{q.required && <span style={{ color: "var(--red)" }}> *</span>}
          </label>
          <div className="flex gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setAnswer(q.key, n)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 28,
                  color: n <= (hoverRating || current) ? "var(--amber)" : "var(--border)",
                  transition: "color 0.1s",
                  padding: "0 2px",
                }}
              >
                ★
              </button>
            ))}
            {current > 0 && (
              <span className="ml-2 text-[13px] self-center" style={{ color: "var(--muted2)" }}>
                {current}/{max}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (q.type === "single") {
      return (
        <div>
          <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
            {q.question}{q.required && <span style={{ color: "var(--red)" }}> *</span>}
          </label>
          <select
            className="input-base"
            value={(value as string) ?? ""}
            onChange={(e) => setAnswer(q.key, e.target.value)}
          >
            <option value="">選択してください</option>
            {q.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (q.type === "multi") {
      const arr = (value as string[]) ?? [];
      return (
        <div>
          <label className="block text-[12px] mb-2" style={{ color: "var(--muted2)" }}>
            {q.question}{q.required && <span style={{ color: "var(--red)" }}> *</span>}
            <span className="ml-1 text-[11px]" style={{ color: "var(--muted)" }}>（複数可）</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {q.options?.map((o) => (
              <button
                key={o.value}
                onClick={() => toggleMulti(q.key, o.value)}
                className="px-3 py-1.5 rounded-full text-[12px] transition-all"
                style={{
                  background: arr.includes(o.value) ? "rgba(59,130,246,0.2)" : "var(--surface2)",
                  border: `1px solid ${arr.includes(o.value) ? "rgba(59,130,246,0.6)" : "var(--border)"}`,
                  color: arr.includes(o.value) ? "var(--accent)" : "var(--muted2)",
                  cursor: "pointer",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (q.type === "text") {
      return (
        <div>
          <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
            {q.question}{q.required && <span style={{ color: "var(--red)" }}> *</span>}
          </label>
          <textarea
            className="input-base"
            rows={3}
            placeholder={q.placeholder ?? ""}
            value={(value as string) ?? ""}
            onChange={(e) => setAnswer(q.key, e.target.value)}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="口コミ生成"
        subtitle={`${template.label} — アンケートに答えるだけで、AIが最適な口コミ文を生成します`}
      />

      <div className="grid grid-cols-2 gap-6">
        {/* ── Left: Questionnaire ── */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>📋 お客様アンケート — {storeName}</CardTitle>
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
              {questions.map((q) => (
                <div key={q.key}>{renderQuestion(q)}</div>
              ))}

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
