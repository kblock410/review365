"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, PenLine, MessageSquare,
  Cpu, Settings, Store, QrCode, BarChart3,
  ChevronDown, Check, Plus,
} from "lucide-react";
import { useStore } from "@/lib/store-context";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/survey",     label: "口コミ生成",     icon: PenLine },
  { href: "/reviews",    label: "口コミ管理",     icon: MessageSquare },
  { href: "/aio",        label: "AIO診断",        icon: Cpu },
  { href: "/qr",         label: "QRコード発行",   icon: QrCode },
  { href: "/analytics",  label: "アンケート分析", icon: BarChart3 },
];

const CATEGORY_LABELS: Record<string, string> = {
  beauty: "美容",
  restaurant: "飲食",
  clinic: "クリニック",
  other: "その他",
};

function StoreSwitcher() {
  const { stores, currentStore, switchStore, loading } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative mx-4 my-3">
      {/* 現在の店舗 — クリックで開閉 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
        style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)",
        }}
      >
        <Store size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <div className="flex-1 text-left min-w-0">
          {loading ? (
            <div className="text-[11px]" style={{ color: "var(--muted)" }}>
              読み込み中…
            </div>
          ) : (
            <>
              <div className="text-[12px] font-medium truncate">
                {currentStore?.name ?? "店舗を選択"}
              </div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                {currentStore
                  ? `${currentStore.area} · ${CATEGORY_LABELS[currentStore.category] ?? currentStore.category}`
                  : "—"}
              </div>
            </>
          )}
        </div>
        <ChevronDown
          size={12}
          style={{
            color: "var(--muted)",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
          }}
        />
      </button>

      {/* ドロップダウン */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="px-3 py-2 text-[10px] font-medium tracking-widest uppercase"
            style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
          >
            店舗を切り替え
          </div>

          {stores.length === 0 ? (
            <div className="px-3 py-3 text-[12px]" style={{ color: "var(--muted)" }}>
              店舗がありません
            </div>
          ) : (
            stores.map((store, idx) => {
              const isActive = store.id === currentStore?.id;
              return (
                <button
                  key={store.id}
                  onClick={() => {
                    switchStore(store.id);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  style={{
                    borderBottom:
                      idx < stores.length - 1 ? "1px solid var(--border)" : "none",
                    background: isActive ? "rgba(59,130,246,0.06)" : undefined,
                  }}
                >
                  {/* アクティブインジケーター */}
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: isActive ? "var(--accent)" : "transparent",
                      border: isActive ? "none" : "1px solid var(--muted)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[12px] font-medium truncate"
                      style={{ color: isActive ? "var(--accent)" : undefined }}
                    >
                      {store.name}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                      {store.area}
                      {store.average_rating
                        ? ` · ★${store.average_rating}`
                        : ""}
                    </div>
                  </div>
                  {isActive && (
                    <Check size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  )}
                </button>
              );
            })
          )}

          {/* 新規追加リンク */}
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[12px] transition-colors hover:bg-white/[0.04]"
            style={{
              color: "var(--muted)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <Plus size={12} />
            <span>新しい店舗を追加</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="fixed top-0 left-0 bottom-0 w-[220px] flex flex-col"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)", zIndex: 40 }}
    >
      <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="gradient-text font-mono text-[22px] font-bold tracking-tight">ヒョーバン</div>
        <div className="text-[11px] mt-1 tracking-wide" style={{ color: "var(--muted)" }}>
          AI MEO / AIO Platform
        </div>
      </div>

      {/* 店舗スイッチャー */}
      <StoreSwitcher />

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={`nav-link${active ? " active" : ""}`}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-5" style={{ borderTop: "1px solid var(--border)" }}>
        <Link href="/settings" className="nav-link" style={{ padding: "8px 0" }}>
          <Settings size={14} />
          <span className="text-[12px]">設定</span>
        </Link>
        <div className="text-[10px] mt-3" style={{ color: "var(--muted)" }}>
          Powered by Claude AI<br />v1.0.0
        </div>
      </div>
    </aside>
  );
}
