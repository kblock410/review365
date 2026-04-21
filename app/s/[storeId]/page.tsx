"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import { getSurveyTemplate } from "@/lib/survey-templates";
import type { SurveyQuestion } from "@/lib/survey-templates/types";

type Step = "loading" | "notfound" | "survey" | "generating" | "review" | "posted";

type AnswerMap = Record<string, string | string[] | number>;

interface StoreDTO {
  id: string;
  name: string;
  area: string;
  category: string;
  keywords: string[] | null;
  menu_options: string[] | null;
  gbp_place_id: string | null;
}

const RATINGS_LABEL = ["", "残念でした", "もう少し", "普通でした", "良かったです", "最高でした！"];

export default function PublicSurveyPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);

  const [store, setStore] = useState<StoreDTO | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [generatedReview, setGeneratedReview] = useState("");
  const [copied, setCopied] = useState(false);
  const [surveyResponseId, setSurveyResponseId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // 店舗情報ロード
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stores/${encodeURIComponent(storeId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.store) {
          setStep("notfound");
          return;
        }
        setStore(data.store);
        setStep("survey");
      })
      .catch(() => {
        if (!cancelled) setStep("notfound");
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  // 業種テンプレ
  const template = useMemo(
    () => getSurveyTemplate(store?.category),
    [store?.category]
  );

  // 店舗カスタム選択肢の上書き（メニュー等）
  const questions = useMemo<SurveyQuestion[]>(() => {
    if (!store) return template.questions;
    return template.questions.map((q) => {
      if (q.sourceFromStore) {
        const override = (store as any)[q.sourceFromStore];
        if (Array.isArray(override) && override.length > 0) {
          return {
            ...q,
            options: override.map((v: string) => ({ value: v, label: v })),
          };
        }
      }
      return q;
    });
  }, [template, store]);

  const requiredQuestions = questions.filter((q) => q.required);
  const totalSteps = questions.length;
  const q = questions[currentQ];

  const C = "#3b82f6";

  const setAnswer = (key: string, value: string | string[] | number) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const toggleMulti = (key: string, value: string) => {
    setAnswers((prev) => {
      const cur = (prev[key] as string[]) ?? [];
      const next = cur.includes(value)
        ? cur.filter((x) => x !== value)
        : [...cur, value];
      return { ...prev, [key]: next };
    });
  };

  const canNext = () => {
    if (!q) return false;
    if (!q.required) return true;
    const v = answers[q.key];
    if (q.type === "multi") return Array.isArray(v) && v.length > 0;
    if (q.type === "rating") return typeof v === "number" && v > 0;
    return v !== undefined && v !== "";
  };

  const handleNext = () => {
    if (currentQ < totalSteps - 1) {
      setCurrentQ((x) => x + 1);
      return;
    }
    doGenerate();
  };

  const buildLabeledAnswers = () => {
    const out: Record<string, string | string[]> = {};
    for (const qq of questions) {
      const v = answers[qq.key];
      if (v == null || v === "") continue;
      if (qq.type === "multi") {
        out[qq.question] = ((v as string[]) ?? [])
          .map((val) => qq.options?.find((o) => o.value === val)?.label ?? val);
      } else if (qq.type === "single") {
        out[qq.question] =
          qq.options?.find((o) => o.value === v)?.label ?? String(v);
      } else if (qq.type === "rating") {
        // rating は別途 body.rating で渡すのでラベル化しない
      } else {
        out[qq.question] = String(v);
      }
    }
    return out;
  };

  const doGenerate = async () => {
    if (!store) return;
    setStep("generating");
    const labeledAnswers = buildLabeledAnswers();
    const rating = (answers["rating"] as number) ?? 0;
    const kwList = store.keywords ?? [];
    const kw = kwList[Math.floor(Math.random() * Math.max(kwList.length, 1))] ?? store.name;
    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: store.name,
          keywords: kwList,
          industry: template.aiContext.industry,
          promptHints: template.aiContext.promptHints,
          rating,
          language: "ja",
          answers: labeledAnswers,
        }),
      });
      const data = await res.json();
      const reviewText = data.review || makeSample(kw);
      setGeneratedReview(reviewText);
      // 回答をDB保存（レスポンスIDを保持して後で mark-posted に使う）
      try {
        const saveRes = await fetch("/api/save-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: store.id,
            industry: template.aiContext.industry,
            answers: labeledAnswers,
            generatedReview: reviewText,
            rating,
            language: "ja",
          }),
        });
        const saveData = await saveRes.json();
        if (saveData?.id) setSurveyResponseId(saveData.id);
      } catch {
        // 保存失敗しても口コミ表示自体は続行
      }
    } catch {
      setGeneratedReview(makeSample(kw));
    }
    setStep("review");
  };

  // 「Googleマップに投稿する」ボタンを押したとき
  const handlePostToGoogle = async () => {
    if (!store || !generatedReview) return;
    setPosting(true);

    // 口コミ本文をクリップボードにコピー（Google投稿画面で貼り付けやすくするため）
    try {
      await navigator.clipboard.writeText(generatedReview);
    } catch {
      // 失敗してもフローは続行
    }

    // DBに投稿フラグと reviews 行を記録
    try {
      await fetch("/api/mark-posted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyResponseId,
          storeId: store.id,
          rating: (answers["rating"] as number) ?? 0,
          reviewText: generatedReview,
          language: "ja",
        }),
      });
    } catch {
      // 失敗しても UX を止めない
    }

    // 新しいタブで Google Maps の口コミ投稿画面を開く
    // 店舗に place_id があればそれを使い、無ければ店名＋エリアで検索
    let googleUrl = "";
    if (store.gbp_place_id) {
      googleUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(store.gbp_place_id)}`;
    } else {
      const query = encodeURIComponent(`${store.name} ${store.area}`);
      googleUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    }
    window.open(googleUrl, "_blank", "noopener,noreferrer");

    setPosting(false);
    setStep("posted");
  };

  const makeSample = (kw: string) => {
    if (!store) return "";
    return `${store.name}（${template.aiContext.industry}）を利用しました。${kw}を探していて伺いましたが、想像以上に満足度が高く、また必ず再訪したいと思います！`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── UI ──
  if (step === "loading") {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>
        読み込み中...
      </div>
    );
  }

  if (step === "notfound" || !store) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
        <div style={{ fontSize: 16, color: "#0f172a", fontWeight: 700, marginBottom: 6 }}>
          店舗が見つかりません
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          URLが正しいかご確認ください
        </div>
      </div>
    );
  }

  const progress = ((currentQ + 1) / totalSteps) * 100;
  const logoLetter = store.name.charAt(0);

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #f8fafc; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: rgba(0,0,0,0); }
        .sel-btn {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; min-height: 56px; padding: 14px 18px; margin-bottom: 10px;
          border-radius: 14px; border: 2px solid #e2e8f0; background: #fff; color: #334155;
          font-size: 15px; font-family: inherit; font-weight: 400; text-align: left;
          cursor: pointer; -webkit-appearance: none; appearance: none;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .sel-btn.active { border-color: ${C}; background: ${C}18; color: ${C}; font-weight: 600; }
        .menu-btn {
          min-height: 58px; padding: 14px 8px; border-radius: 14px;
          border: 2px solid #e2e8f0; background: #fff; color: #334155;
          font-size: 15px; font-family: inherit; font-weight: 400; text-align: center;
          cursor: pointer; -webkit-appearance: none; appearance: none;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .menu-btn.active { border-color: ${C}; background: ${C}18; color: ${C}; font-weight: 600; }
        .star-btn {
          font-size: 48px; padding: 6px; background: none; border: none;
          cursor: pointer; color: #e2e8f0; line-height: 1;
          -webkit-appearance: none; appearance: none; transition: color 0.1s;
        }
        .star-btn.active { color: #f59e0b; }
        .next-btn {
          display: block; width: 100%; padding: 18px; border-radius: 16px;
          border: none; background: ${C}; color: #fff; font-size: 17px;
          font-family: inherit; font-weight: 700; cursor: pointer;
          -webkit-appearance: none; appearance: none; transition: opacity 0.2s;
        }
        .next-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
        .back-btn {
          display: block; width: 100%; padding: 12px; background: none; border: none;
          color: #94a3b8; font-size: 14px; font-family: inherit; cursor: pointer;
          margin-top: 4px; -webkit-appearance: none; appearance: none;
        }
        .action-btn {
          display: block; width: 100%; padding: 18px; border-radius: 14px;
          font-size: 16px; font-family: inherit; font-weight: 700;
          cursor: pointer; -webkit-appearance: none; appearance: none; margin-bottom: 12px;
        }
        textarea.free-text {
          width: 100%; padding: 16px; border-radius: 14px; border: 2px solid #e2e8f0;
          font-size: 15px; line-height: 1.7; resize: none; outline: none;
          font-family: inherit; background: #fff; color: #0f172a;
        }
      `}</style>

      <div
        style={{
          maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f8fafc",
          fontFamily: "system-ui, -apple-system, 'Noto Sans JP', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#fff", borderBottom: "1px solid #e2e8f0",
            padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: "50%", background: C,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0,
              }}
            >
              {logoLetter}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                {store.name}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>お客様アンケート</div>
            </div>
          </div>
          {step === "survey" && (
            <>
              <div
                style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 11, color: "#94a3b8", marginBottom: 6,
                }}
              >
                <span>質問 {currentQ + 1} / {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%", width: `${progress}%`, background: C,
                    borderRadius: 3, transition: "width 0.4s ease",
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "28px 20px 140px" }}>
          {step === "survey" && q && (
            <div>
              <div
                style={{
                  fontSize: 13, color: q.required ? "#ef4444" : "#94a3b8",
                  fontWeight: 600, marginBottom: 6,
                }}
              >
                {q.required ? "必須" : "任意"}
              </div>
              <div
                style={{
                  fontSize: 18, fontWeight: 700, color: "#0f172a",
                  marginBottom: 20, lineHeight: 1.5,
                }}
              >
                {q.question}
              </div>

              {q.type === "single" && (
                <>
                  {q.options?.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`sel-btn${answers[q.key] === o.value ? " active" : ""}`}
                      onClick={() => setAnswer(q.key, o.value)}
                    >
                      <span>{o.label}</span>
                      {answers[q.key] === o.value && <span>✓</span>}
                    </button>
                  ))}
                </>
              )}

              {q.type === "multi" && (
                <>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
                    複数選択できます
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {q.options?.map((o) => {
                      const arr = (answers[q.key] as string[]) ?? [];
                      const isOn = arr.includes(o.value);
                      return (
                        <button
                          key={o.value}
                          type="button"
                          className={`menu-btn${isOn ? " active" : ""}`}
                          onClick={() => toggleMulti(q.key, o.value)}
                        >
                          {isOn ? `✓ ${o.label}` : o.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {q.type === "rating" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 14 }}>
                    {Array.from({ length: q.max ?? 5 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`star-btn${n <= ((answers[q.key] as number) ?? 0) ? " active" : ""}`}
                        onClick={() => setAnswer(q.key, n)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {((answers[q.key] as number) ?? 0) > 0 && (
                    <div
                      style={{
                        textAlign: "center", fontSize: 16, color: "#f59e0b",
                        fontWeight: 700, marginBottom: 4,
                      }}
                    >
                      {RATINGS_LABEL[(answers[q.key] as number) ?? 0]}
                    </div>
                  )}
                </div>
              )}

              {q.type === "text" && (
                <textarea
                  className="free-text"
                  value={(answers[q.key] as string) ?? ""}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  placeholder={q.placeholder ?? ""}
                  rows={5}
                />
              )}
            </div>
          )}

          {step === "generating" && (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>✨</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                口コミ文を作成中...
              </div>
              <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8 }}>
                AIがあなたの体験をもとに
                <br />
                最適な文章を作成しています
              </div>
            </div>
          )}

          {step === "review" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  口コミ文が完成しました！
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  内容をご確認の上、Googleマップへ投稿してください
                </div>
              </div>
              <div
                style={{
                  background: "#fff", borderRadius: 16, padding: "20px",
                  border: "1.5px solid #e2e8f0", marginBottom: 14,
                  fontSize: 15, lineHeight: 1.8, color: "#1e293b",
                }}
              >
                {generatedReview}
              </div>
              <button
                type="button"
                className="action-btn"
                onClick={handleCopy}
                style={{ background: copied ? "#10b981" : C, color: "#fff", border: "none" }}
              >
                {copied ? "✓ コピーしました" : "📋 口コミ文をコピーする"}
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={handlePostToGoogle}
                disabled={posting}
                style={{
                  background: posting ? "#e2e8f0" : "#f0fdf4",
                  color: posting ? "#94a3b8" : "#16a34a",
                  border: `2px solid ${posting ? "#e2e8f0" : "#bbf7d0"}`,
                }}
              >
                {posting ? "投稿中..." : "🗺️ Googleマップに投稿する"}
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={doGenerate}
                style={{ background: "#fff", color: "#64748b", border: "2px solid #e2e8f0" }}
              >
                🔄 文章を書き直す
              </button>
              <div
                style={{
                  padding: "12px 14px", borderRadius: 10, background: "#fafafa",
                  border: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8", lineHeight: 1.6,
                }}
              >
                ※ AIが作成した文章案です。ご自身の体験に合わせて編集してからご投稿ください。
              </div>
            </div>
          )}

          {step === "posted" && (
            <div style={{ textAlign: "center", paddingTop: 32 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                ありがとうございます！
              </div>
              <div
                style={{
                  fontSize: 14, color: "#64748b", lineHeight: 1.8, marginBottom: 32,
                }}
              >
                口コミのご投稿ありがとうございます。
                <br />
                {store.name}スタッフ一同、
                <br />
                またのご来店をお待ちしております。
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        {step === "survey" && (
          <div
            style={{
              position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: "100%", maxWidth: 430, padding: "16px 20px 36px",
              background: "rgba(248,250,252,0.97)", borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              className="next-btn"
              onClick={handleNext}
              disabled={!canNext()}
            >
              {currentQ < totalSteps - 1 ? "次へ →" : "✨ AIで口コミ文を作成する"}
            </button>
            {currentQ > 0 && (
              <button type="button" className="back-btn" onClick={() => setCurrentQ((x) => x - 1)}>
                ← 戻る
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
