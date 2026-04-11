"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, PageHeader } from "@/components/ui";
import { MOCK_STORE } from "@/lib/utils";
import { QrCode, Copy, Download, Check, Globe, Smartphone } from "lucide-react";

const BASE_URL = "https://review365.app/survey"; // 本番URL

const SURVEY_TYPES = [
  { id: "google", label: "Google マップ用", icon: "🗺️", color: "#4285f4", desc: "Google口コミに誘導" },
  { id: "tripadvisor", label: "TripAdvisor用", icon: "🦉", color: "#00aa6c", desc: "インバウンド向け" },
  { id: "general", label: "汎用アンケート", icon: "📋", color: "#6366f1", desc: "データ収集のみ" },
];

function QRCodeDisplay({ url, size = 180 }: { url: string; size?: number }) {
  // QRコードをSVGで簡易表示（実際はqrcode.reactライブラリを使用）
  const cells = 21;
  const cellSize = size / cells;
  
  // ダミーQRパターン（実際の実装ではqrcodeライブラリを使用）
  return (
    <div
      className="flex items-center justify-center rounded-xl p-4"
      style={{ background: "#fff", width: size + 32, height: size + 32 }}
    >
      <div
        style={{
          width: size,
          height: size,
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cells} ${cells}'%3E%3Crect width='${cells}' height='${cells}' fill='white'/%3E%3Crect x='0' y='0' width='7' height='7' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='1' width='5' height='5' fill='black'/%3E%3Crect x='2' y='2' width='3' height='3' fill='white'/%3E%3Crect x='3' y='3' width='1' height='1' fill='black'/%3E%3Crect x='14' y='0' width='7' height='7' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='15' y='1' width='5' height='5' fill='black'/%3E%3Crect x='16' y='2' width='3' height='3' fill='white'/%3E%3Crect x='17' y='3' width='1' height='1' fill='black'/%3E%3Crect x='0' y='14' width='7' height='7' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='15' width='5' height='5' fill='black'/%3E%3Crect x='2' y='16' width='3' height='3' fill='white'/%3E%3Crect x='3' y='17' width='1' height='1' fill='black'/%3E%3C/svg%3E")`,
          backgroundSize: "cover",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

export default function QRPage() {
  const [selectedType, setSelectedType] = useState("google");
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"ja" | "en" | "zh" | "all">("all");

  const surveyUrl = `${BASE_URL}/${MOCK_STORE.id}?type=${selectedType}&lang=${lang}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="QRコード・URL発行"
        subtitle="アンケートURLとQRコードを発行して店頭・LINEで共有"
      />

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Settings */}
        <div className="space-y-5">
          {/* Survey type */}
          <Card>
            <CardHeader><CardTitle>アンケートタイプを選択</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {SURVEY_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left"
                  style={{
                    background: selectedType === t.id ? `${t.color}15` : "var(--surface2)",
                    border: `1px solid ${selectedType === t.id ? t.color + "60" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <div className="text-[14px] font-medium">{t.label}</div>
                    <div className="text-[12px]" style={{ color: "var(--muted)" }}>{t.desc}</div>
                  </div>
                  {selectedType === t.id && (
                    <Check size={16} style={{ color: t.color, marginLeft: "auto" }} />
                  )}
                </button>
              ))}
            </CardBody>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader><CardTitle>言語設定</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "all", label: "🌏 自動（端末に合わせる）" },
                  { value: "ja", label: "🇯🇵 日本語固定" },
                  { value: "en", label: "🇺🇸 英語固定" },
                  { value: "zh", label: "🇨🇳 中国語固定" },
                ].map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLang(l.value as any)}
                    className="p-3 rounded-lg text-[13px] transition-all"
                    style={{
                      background: lang === l.value ? "rgba(59,130,246,0.15)" : "var(--surface2)",
                      border: `1px solid ${lang === l.value ? "rgba(59,130,246,0.5)" : "var(--border)"}`,
                      color: lang === l.value ? "var(--accent)" : "var(--muted2)",
                      cursor: "pointer",
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="text-[12px] mt-3" style={{ color: "var(--muted)" }}>
                「自動」はお客様のスマートフォンの言語設定に合わせて自動変換されます
              </p>
            </CardBody>
          </Card>

          {/* URL */}
          <Card>
            <CardHeader>
              <CardTitle>発行されたURL</CardTitle>
              <Badge variant="green">有効</Badge>
            </CardHeader>
            <CardBody>
              <div
                className="p-3 rounded-lg text-[12px] break-all mb-3 font-mono"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--accent2)" }}
              >
                {surveyUrl}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCopy} className="flex-1 justify-center">
                  {copied ? <><Check size={13} /> コピー済</> : <><Copy size={13} /> URLをコピー</>}
                </Button>
                <Button size="sm" variant="ghost">
                  <Smartphone size={13} /> LINEで送る
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: QR Display */}
        <div className="space-y-5">
          <Card glow>
            <CardHeader>
              <CardTitle>QRコード</CardTitle>
              <Button size="sm" variant="ghost">
                <Download size={13} /> ダウンロード
              </Button>
            </CardHeader>
            <CardBody className="flex flex-col items-center py-8">
              <QRCodeDisplay url={surveyUrl} size={200} />
              <div className="mt-6 text-center">
                <div className="text-[14px] font-medium mb-1">{MOCK_STORE.name}</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                  {SURVEY_TYPES.find(t => t.id === selectedType)?.label}
                </div>
              </div>
              <div
                className="mt-6 p-4 rounded-xl text-center w-full"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
              >
                <div className="text-[12px] mb-2" style={{ color: "var(--muted)" }}>印刷用POPに使用</div>
                <div className="text-[13px]">このQRコードをスキャンして<br/>口コミを投稿してください 🙏</div>
              </div>
            </CardBody>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader><CardTitle>QR読み取り統計</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "今月のスキャン", value: "124回" },
                  { label: "回答率", value: "68%" },
                  { label: "口コミ転換率", value: "42%" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-3 rounded-lg text-center"
                    style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
                  >
                    <div className="font-mono text-xl font-semibold mb-1">{s.value}</div>
                    <div className="text-[11px]" style={{ color: "var(--muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
