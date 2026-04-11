"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PenLine, MessageSquare,
  Cpu, Settings, Store, QrCode, BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/survey",     label: "口コミ生成",     icon: PenLine },
  { href: "/reviews",    label: "口コミ管理",     icon: MessageSquare },
  { href: "/aio",        label: "AIO診断",        icon: Cpu },
  { href: "/qr",         label: "QRコード発行",   icon: QrCode },
  { href: "/analytics",  label: "アンケート分析", icon: BarChart3 },
];

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
      <div
        className="mx-4 my-3 px-3 py-2 rounded-lg flex items-center gap-2"
        style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
      >
        <Store size={14} style={{ color: "var(--accent)" }} />
        <div>
          <div className="text-[12px] font-medium">銀座 美容室 Shion</div>
          <div className="text-[10px]" style={{ color: "var(--muted)" }}>MAP 順位 #7 ↑</div>
        </div>
      </div>
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
          Powered by Claude AI<br />v1.0.0 — デモ版
        </div>
      </div>
    </aside>
  );
}
