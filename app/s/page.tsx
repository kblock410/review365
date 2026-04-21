"use client";

import { useEffect, useState } from "react";

interface StoreItem {
  id: string;
  name: string;
  area: string;
  category: string;
}

/**
 * `/s` 直接アクセス時のフォールバック。
 * 本来 QR からは /s/[storeId] に飛ぶので、このページは案内用。
 */
export default function PublicSurveyIndex() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stores", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setStores(data.stores ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "system-ui, -apple-system, 'Noto Sans JP', sans-serif",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
        お客様アンケート
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        ご来店いただいた店舗を選択してください
      </div>
      {loading ? (
        <div style={{ color: "#94a3b8", fontSize: 14 }}>読み込み中...</div>
      ) : stores.length === 0 ? (
        <div style={{ color: "#94a3b8", fontSize: 14 }}>
          現在アンケートを実施中の店舗はありません
        </div>
      ) : (
        stores.map((s) => (
          <a
            key={s.id}
            href={`/s/${s.id}`}
            style={{
              display: "block",
              padding: "16px 18px",
              marginBottom: 10,
              borderRadius: 14,
              border: "2px solid #e2e8f0",
              background: "#fff",
              textDecoration: "none",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
              {s.name}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {s.area}
            </div>
          </a>
        ))
      )}
    </div>
  );
}
