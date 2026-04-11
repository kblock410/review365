#!/bin/bash
set -e
echo "📱 iOS対応版に修正中..."

cat > app/s/layout.tsx << 'EOF'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お客様アンケート",
  other: {
    "viewport": "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  },
};

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
EOF

cat > app/s/page.tsx << 'EOF'
"use client";

import { useState } from "react";

type Step = "survey" | "generating" | "review" | "posted";

const STORE = {
  name: "銀座 美容室 Shion",
  logo: "S",
  color: "#3b82f6",
  keywords: ["銀座 美容室", "銀座 縮毛矯正", "銀座 ヘアサロン"],
};

const MENUS = ["カット", "カラー", "縮毛矯正", "トリートメント", "パーマ", "ヘッドスパ"];
const VISIT_REASONS = ["Instagramを見て", "Googleマップで見つけた", "友人・知人の紹介", "ホットペッパー", "お店の前を通って"];
const RATINGS_LABEL = ["", "残念でした", "もう少し", "普通でした", "良かったです", "最高でした！"];

export default function SurveyMobilePage() {
  const [step, setStep] = useState<Step>("survey");
  const [currentQ, setCurrentQ] = useState(0);
  const [rating, setRating] = useState(0);
  const [visitReason, setVisitReason] = useState("");
  const [menus, setMenus] = useState<string[]>([]);
  const [staff, setStaff] = useState("");
  const [atmos, setAtmos] = useState("");
  const [freeText, setFreeText] = useState("");
  const [generatedReview, setGeneratedReview] = useState("");
  const [copied, setCopied] = useState(false);

  const C = STORE.color;

  const toggleMenu = (m: string) =>
    setMenus(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const canNext = () => {
    if (currentQ === 0) return visitReason !== "";
    if (currentQ === 1) return menus.length > 0;
    if (currentQ === 2) return rating > 0;
    return true;
  };

  const handleNext = () => {
    if (currentQ < 3) { setCurrentQ(q => q + 1); return; }
    doGenerate();
  };

  const doGenerate = async () => {
    setStep("generating");
    const kw = STORE.keywords[Math.floor(Math.random() * STORE.keywords.length)];
    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitReason, menus, rating, staffRating: staff, atmosphere: atmos, freeText, language: "ja" }),
      });
      const data = await res.json();
      setGeneratedReview(data.review || makeSample(kw));
    } catch {
      setGeneratedReview(makeSample(kw));
    }
    setStep("review");
  };

  const makeSample = (kw: string) =>
    `${visitReason}で初めて${STORE.name}を訪問しました。${menus.join("・")}をお願いしたのですが、スタッフの方がとても丁寧で仕上がりも大満足です！${kw}の中でもトップクラスのサロンだと思います。またぜひ来たいと思います！`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = ((currentQ + 1) / 4) * 100;

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #f8fafc; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: rgba(0,0,0,0); }
        .sel-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 56px;
          padding: 14px 18px;
          margin-bottom: 10px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          background: #fff;
          color: #334155;
          font-size: 15px;
          font-family: inherit;
          font-weight: 400;
          text-align: left;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .sel-btn.active {
          border-color: ${C};
          background: ${C}18;
          color: ${C};
          font-weight: 600;
        }
        .menu-btn {
          min-height: 58px;
          padding: 14px 8px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          background: #fff;
          color: #334155;
          font-size: 15px;
          font-family: inherit;
          font-weight: 400;
          text-align: center;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .menu-btn.active {
          border-color: ${C};
          background: ${C}18;
          color: ${C};
          font-weight: 600;
        }
        .sub-btn {
          flex: 1;
          min-height: 48px;
          padding: 10px 4px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .sub-btn.active {
          border-color: ${C};
          background: ${C}18;
          color: ${C};
          font-weight: 600;
        }
        .star-btn {
          font-size: 48px;
          padding: 6px;
          background: none;
          border: none;
          cursor: pointer;
          color: #e2e8f0;
          line-height: 1;
          -webkit-appearance: none;
          appearance: none;
          transition: color 0.1s;
        }
        .star-btn.active { color: #f59e0b; }
        .next-btn {
          display: block;
          width: 100%;
          padding: 18px;
          border-radius: 16px;
          border: none;
          background: ${C};
          color: #fff;
          font-size: 17px;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          transition: opacity 0.2s;
        }
        .next-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .back-btn {
          display: block;
          width: 100%;
          padding: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          margin-top: 4px;
          -webkit-appearance: none;
          appearance: none;
        }
        .action-btn {
          display: block;
          width: 100%;
          padding: 18px;
          border-radius: 14px;
          font-size: 16px;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          margin-bottom: 12px;
        }
      `}</style>

      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, 'Noto Sans JP', sans-serif" }}>

        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: C, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
              {STORE.logo}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{STORE.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>お客様アンケート</div>
            </div>
          </div>
          {step === "survey" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                <span>質問 {currentQ + 1} / 4</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: C, borderRadius: 3, transition: "width 0.4s ease" }} />
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "28px 20px 140px" }}>

          {/* Q0 */}
          {step === "survey" && currentQ === 0 && (
            <div>
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 6 }}>必須</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 24, lineHeight: 1.5 }}>
                ご来店のきっかけを<br />教えてください
              </div>
              {VISIT_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`sel-btn${visitReason === r ? " active" : ""}`}
                  onClick={() => setVisitReason(r)}
                >
                  <span>{r}</span>
                  {visitReason === r && <span>✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Q1 */}
          {step === "survey" && currentQ === 1 && (
            <div>
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 6 }}>必須</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8, lineHeight: 1.5 }}>
                ご利用メニューを<br />教えてください
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>複数選択できます</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {MENUS.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`menu-btn${menus.includes(m) ? " active" : ""}`}
                    onClick={() => toggleMenu(m)}
                  >
                    {menus.includes(m) ? `✓ ${m}` : m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q2 */}
          {step === "survey" && currentQ === 2 && (
            <div>
              <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 6 }}>必須</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 24, lineHeight: 1.5 }}>
                全体的な満足度を<br />教えてください
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn${n <= rating ? " active" : ""}`}
                    onClick={() => setRating(n)}
                  >★</button>
                ))}
              </div>
              {rating > 0 && (
                <div style={{ textAlign: "center", fontSize: 16, color: "#f59e0b", fontWeight: 700, marginBottom: 28 }}>
                  {RATINGS_LABEL[rating]}
                </div>
              )}
              {rating > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 10, fontWeight: 500 }}>スタッフの対応</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["とても良かった", "良かった", "普通"].map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`sub-btn${staff === s ? " active" : ""}`}
                          onClick={() => setStaff(s)}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 10, fontWeight: 500 }}>店内の雰囲気</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["おしゃれ", "清潔感あり", "くつろげた"].map(a => (
                        <button
                          key={a}
                          type="button"
                          className={`sub-btn${atmos === a ? " active" : ""}`}
                          onClick={() => setAtmos(a)}
                        >{a}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Q3 */}
          {step === "survey" && currentQ === 3 && (
            <div>
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>任意</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8, lineHeight: 1.5 }}>
                感想を自由にお書き<br />ください
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>特に良かった点など</div>
              <textarea
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                placeholder="例：スタッフの方がとても丁寧で..."
                rows={5}
                style={{ width: "100%", padding: "16px", borderRadius: 14, border: "2px solid #e2e8f0", fontSize: 15, lineHeight: 1.7, resize: "none", outline: "none", fontFamily: "inherit", background: "#fff", color: "#0f172a" }}
              />
              <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                <div style={{ fontSize: 13, color: "#0284c7", fontWeight: 600, marginBottom: 4 }}>🤖 AIが口コミ文を自動作成します</div>
                <div style={{ fontSize: 12, color: "#0369a1", lineHeight: 1.6 }}>ご回答をもとにGoogleマップへ投稿できる口コミ文をAIが作成します。</div>
              </div>
            </div>
          )}

          {/* Generating */}
          {step === "generating" && (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>✨</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>口コミ文を作成中...</div>
              <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8 }}>AIがあなたの体験をもとに<br />最適な文章を作成しています</div>
            </div>
          )}

          {/* Review */}
          {step === "review" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>口コミ文が完成しました！</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>内容をご確認の上、Googleマップへ投稿してください</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1.5px solid #e2e8f0", marginBottom: 14, fontSize: 15, lineHeight: 1.8, color: "#1e293b" }}>
                {generatedReview}
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #e2e8f0", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#f59e0b", fontSize: 22, letterSpacing: 2 }}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
                <span style={{ fontSize: 13, color: "#64748b" }}>投稿予定の評価</span>
              </div>
              <button type="button" className="action-btn" onClick={handleCopy}
                style={{ background: copied ? "#10b981" : C, color: "#fff", border: "none" }}>
                {copied ? "✓ コピーしました" : "📋 口コミ文をコピーする"}
              </button>
              <button type="button" className="action-btn" onClick={() => setStep("posted")}
                style={{ background: "#f0fdf4", color: "#16a34a", border: "2px solid #bbf7d0" }}>
                🗺️ Googleマップに投稿する
              </button>
              <button type="button" className="action-btn" onClick={doGenerate}
                style={{ background: "#fff", color: "#64748b", border: "2px solid #e2e8f0" }}>
                🔄 文章を書き直す
              </button>
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fafafa", border: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                ※ AIが作成した文章案です。ご自身の体験に合わせて編集してからご投稿ください。
              </div>
            </div>
          )}

          {/* Posted */}
          {step === "posted" && (
            <div style={{ textAlign: "center", paddingTop: 32 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>ありがとうございます！</div>
              <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8, marginBottom: 32 }}>
                口コミのご投稿ありがとうございます。<br />{STORE.name}スタッフ一同、<br />またのご来店をお待ちしております。
              </div>
              <div style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: 20, padding: "28px 24px", color: "#fff", marginBottom: 16 }}>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>口コミ投稿特典</div>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>10% OFF</div>
                <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 18 }}>次回ご来店時にご利用いただけます</div>
                <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 12, padding: "10px 20px", fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>
                  HYOBAN10
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>有効期限：2026年12月31日まで</div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        {step === "survey" && (
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "16px 20px 36px", background: "rgba(248,250,252,0.97)", borderTop: "1px solid #e2e8f0" }}>
            <button
              type="button"
              className="next-btn"
              onClick={handleNext}
              disabled={!canNext()}
            >
              {currentQ < 3 ? "次へ →" : "✨ AIで口コミ文を作成する"}
            </button>
            {currentQ > 0 && (
              <button type="button" className="back-btn" onClick={() => setCurrentQ(q => q - 1)}>
                ← 戻る
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
EOF

echo "✅ iOS対応版に修正完了！"
echo "npm run dev を再起動してから、iPhoneで http://192.168.11.22:3000/s にアクセスしてください"
