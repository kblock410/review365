#!/bin/bash
set -e
echo "📱 スマホ用アンケートページを追加中..."

mkdir -p app/s

cat > app/s/layout.tsx << 'EOF'
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

export default function SurveyMobilePage() {
  const [step, setStep] = useState<Step>("survey");
  const [currentQ, setCurrentQ] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [visitReason, setVisitReason] = useState("");
  const [menus, setMenus] = useState<string[]>([]);
  const [staff, setStaff] = useState("");
  const [atmos, setAtmos] = useState("");
  const [freeText, setFreeText] = useState("");
  const [generatedReview, setGeneratedReview] = useState("");
  const [copied, setCopied] = useState(false);

  const toggleMenu = (m: string) =>
    setMenus(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const canNext = () => {
    if (currentQ === 0) return visitReason !== "";
    if (currentQ === 1) return menus.length > 0;
    if (currentQ === 2) return rating > 0;
    return true;
  };

  const handleNext = () => {
    if (currentQ < 3) { setCurrentQ(currentQ + 1); return; }
    generateReview();
  };

  const generateReview = async () => {
    setStep("generating");
    const kw = STORE.keywords[Math.floor(Math.random() * STORE.keywords.length)];
    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitReason, menus, rating, staffRating: staff, atmosphere: atmos, freeText, language: "ja" }),
      });
      const data = await res.json();
      setGeneratedReview(data.review || sampleReview(kw));
    } catch {
      setGeneratedReview(sampleReview(kw));
    }
    setStep("review");
  };

  const sampleReview = (kw: string) =>
    `${visitReason}で初めて${STORE.name}を訪問しました。${menus.join("・")}をお願いしたのですが、スタッフの方がとても丁寧で、仕上がりも大満足です！${kw}の中でもトップクラスのサロンだと思います。またぜひ来たいと思います！`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = ((currentQ + 1) / 4) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Noto Sans JP', sans-serif", maxWidth: 430, margin: "0 auto", position: "relative" }}>

      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 20px 12px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: STORE.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{STORE.logo}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{STORE.name}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>お客様アンケート</div>
          </div>
        </div>
        {step === "survey" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
              <span>質問 {currentQ + 1} / 4</span><span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: STORE.color, borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "24px 20px 120px" }}>

        {step === "survey" && (
          <div>
            {currentQ === 0 && (
              <div>
                <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>必須</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 20, lineHeight: 1.5 }}>ご来店のきっかけを<br />教えてください</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {VISIT_REASONS.map(r => (
                    <button key={r} onClick={() => setVisitReason(r)} style={{ padding: "14px 16px", borderRadius: 12, border: `2px solid ${visitReason === r ? STORE.color : "#e2e8f0"}`, background: visitReason === r ? `${STORE.color}18` : "#fff", color: visitReason === r ? STORE.color : "#334155", fontWeight: visitReason === r ? 600 : 400, fontSize: 14, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s" }}>
                      {r}{visitReason === r && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentQ === 1 && (
              <div>
                <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>必須</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8, lineHeight: 1.5 }}>ご利用メニューを<br />教えてください</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>複数選択できます</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {MENUS.map(m => (
                    <button key={m} onClick={() => toggleMenu(m)} style={{ padding: "14px 12px", borderRadius: 12, border: `2px solid ${menus.includes(m) ? STORE.color : "#e2e8f0"}`, background: menus.includes(m) ? `${STORE.color}18` : "#fff", color: menus.includes(m) ? STORE.color : "#334155", fontWeight: menus.includes(m) ? 600 : 400, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}>
                      {menus.includes(m) ? "✓ " : ""}{m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentQ === 2 && (
              <div>
                <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 8 }}>必須</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 24, lineHeight: 1.5 }}>全体的な満足度を<br />教えてください</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(n)} style={{ fontSize: 44, background: "none", border: "none", cursor: "pointer", padding: "4px 2px", color: n <= (hoverRating || rating) ? "#f59e0b" : "#e2e8f0", transition: "color 0.1s", lineHeight: 1 }}>★</button>
                  ))}
                </div>
                {rating > 0 && <div style={{ textAlign: "center", fontSize: 15, color: "#f59e0b", fontWeight: 600, marginBottom: 24 }}>{["","残念でした","もう少し","普通でした","良かったです","最高でした！"][rating]}</div>}
                {rating > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>スタッフの対応</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {["とても良かった","良かった","普通"].map(s => (
                          <button key={s} onClick={() => setStaff(s)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 12, border: `1.5px solid ${staff === s ? STORE.color : "#e2e8f0"}`, background: staff === s ? `${STORE.color}18` : "#fff", color: staff === s ? STORE.color : "#64748b", cursor: "pointer", fontWeight: staff === s ? 600 : 400 }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>店内の雰囲気</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {["おしゃれ","清潔感あり","くつろげた"].map(a => (
                          <button key={a} onClick={() => setAtmos(a)} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 12, border: `1.5px solid ${atmos === a ? STORE.color : "#e2e8f0"}`, background: atmos === a ? `${STORE.color}18` : "#fff", color: atmos === a ? STORE.color : "#64748b", cursor: "pointer", fontWeight: atmos === a ? 600 : 400 }}>{a}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentQ === 3 && (
              <div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>任意</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8, lineHeight: 1.5 }}>感想を自由にお書き<br />ください</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>特に良かった点・改善してほしい点など</div>
                <textarea value={freeText} onChange={e => setFreeText(e.target.value)} placeholder="例：スタッフの方がとても丁寧で..." rows={5} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, lineHeight: 1.7, resize: "none", outline: "none", fontFamily: "inherit", background: "#fff", color: "#0f172a", boxSizing: "border-box" }} />
                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                  <div style={{ fontSize: 12, color: "#0284c7", fontWeight: 600, marginBottom: 4 }}>🤖 AIが口コミ文を自動作成します</div>
                  <div style={{ fontSize: 12, color: "#0369a1", lineHeight: 1.6 }}>ご回答をもとに、Googleマップに投稿できる自然な口コミ文をAIが作成します。</div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "generating" && (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 56, marginBottom: 20, display: "inline-block", animation: "spin 1.5s linear infinite" }}>✨</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>口コミ文を作成中...</div>
            <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8 }}>AIがあなたの体験をもとに<br />最適な文章を作成しています</div>
          </div>
        )}

        {step === "review" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>口コミ文が完成しました！</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>内容をご確認の上、Googleマップへ投稿してください</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: "18px", border: "1.5px solid #e2e8f0", marginBottom: 14, fontSize: 14, lineHeight: 1.8, color: "#1e293b" }}>{generatedReview}</div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #e2e8f0", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#f59e0b", fontSize: 20, letterSpacing: 2 }}>{"★".repeat(rating)}{"☆".repeat(5-rating)}</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>投稿予定の評価</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              <button onClick={handleCopy} style={{ padding: "16px", borderRadius: 14, border: "none", background: copied ? "#10b981" : STORE.color, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "background 0.2s" }}>
                {copied ? "✓ コピーしました" : "📋 口コミ文をコピーする"}
              </button>
              <button onClick={() => setStep("posted")} style={{ padding: "16px", borderRadius: 14, border: "1.5px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>🗺️ Googleマップに投稿する</button>
              <button style={{ padding: "14px", borderRadius: 14, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 14, cursor: "pointer" }}>🔄 文章を書き直す</button>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fafafa", border: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
              ※ 上記はAIが作成した文章案です。ご自身の体験に合わせて編集してからご投稿ください。
            </div>
          </div>
        )}

        {step === "posted" && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>ありがとうございます！</div>
            <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8, marginBottom: 32 }}>口コミのご投稿ありがとうございます。<br />{STORE.name}のスタッフ一同、<br />またのご来店をお待ちしております。</div>
            <div style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: 20, padding: "24px 20px", color: "#fff", marginBottom: 16 }}>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>口コミ投稿特典</div>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 4 }}>10% OFF</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 16 }}>次回ご来店時にご利用いただけます</div>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 16px", fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>HYOBAN10</div>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>有効期限：2026年12月31日まで</div>
          </div>
        )}
      </div>

      {step === "survey" && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "16px 20px", background: "rgba(248,250,252,0.96)", backdropFilter: "blur(8px)", borderTop: "1px solid #e2e8f0" }}>
          <button onClick={handleNext} disabled={!canNext()} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: canNext() ? STORE.color : "#e2e8f0", color: canNext() ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 16, cursor: canNext() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
            {currentQ < 3 ? "次へ →" : "✨ AIで口コミ文を作成する"}
          </button>
          {currentQ > 0 && <button onClick={() => setCurrentQ(currentQ - 1)} style={{ width: "100%", padding: "8px", marginTop: 8, background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>← 戻る</button>}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      `}</style>
    </div>
  );
}
EOF

echo ""
echo "✅ スマホ用アンケートページ追加完了！"
echo ""
echo "ブラウザで以下にアクセスしてください："
echo "  http://localhost:3000/s"
echo ""
echo "スマホビューで確認するには："
echo "  Chrome DevTools (F12) → スマホアイコンをクリック"
