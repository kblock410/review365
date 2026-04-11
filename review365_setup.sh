#!/bin/bash
set -e
echo '🚀 口コミ365 セットアップ開始...'

mkdir -p "types"
cat > "types/index.ts" << 'EOF_TYPES_INDEX_TS'
// ─── Review types ───────────────────────────────────────────
export type Language = "ja" | "en" | "zh" | "ko";

export interface Review {
  id: string;
  reviewerName: string;
  rating: number; // 1-5
  text: string;
  language: Language;
  date: string;
  replied: boolean;
  replyText?: string;
  source: "google" | "tripadvisor" | "tabelog";
  isLocal?: boolean; // Googleローカルガイド
}

// ─── Survey types ────────────────────────────────────────────
export interface SurveyAnswer {
  visitReason: string;
  menus: string[];
  rating: number;
  staffRating: string;
  atmosphere: string;
  freeText: string;
  language: Language;
}

// ─── Store types ─────────────────────────────────────────────
export interface Store {
  id: string;
  name: string;
  category: "beauty" | "restaurant" | "clinic" | "other";
  area: string;
  keywords: string[];
  averageRating: number;
  totalReviews: number;
  mapRank?: number;
}

// ─── Dashboard types ─────────────────────────────────────────
export interface DashboardStats {
  impressions: number;
  impressionsDelta: number;
  totalReviews: number;
  reviewsDelta: number;
  averageRating: number;
  ratingDelta: number;
  mapRank: number;
  prevMapRank: number;
  phoneClicks: number;
  routeSearches: number;
  websiteClicks: number;
}

// ─── AIO types ───────────────────────────────────────────────
export interface AIOResult {
  keyword: string;
  chatgpt: number;   // 0-100%
  gemini: number;
  googleAI: number;
}

export interface CitationStatus {
  platform: string;
  status: "registered" | "unregistered" | "needs-review";
  url?: string;
}

// ─── API Response types ───────────────────────────────────────
export interface GenerateReviewResponse {
  review: string;
  keyword: string;
}

export interface GenerateReplyResponse {
  reply: string;
}

export interface AIOAdviceResponse {
  advice: string;
}

EOF_TYPES_INDEX_TS

mkdir -p "lib"
cat > "lib/utils.ts" << 'EOF_LIB_UTILS_TS'
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Review, DashboardStats, AIOResult, CitationStatus, Store } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Mock Data ────────────────────────────────────────────────
export const MOCK_STORE: Store = {
  id: "store_001",
  name: "銀座 美容室 Shion",
  category: "beauty",
  area: "銀座",
  keywords: ["銀座 美容室", "銀座 縮毛矯正", "銀座 ヘアサロン", "銀座 ヘアカット"],
  averageRating: 4.7,
  totalReviews: 247,
  mapRank: 7,
};

export const MOCK_STATS: DashboardStats = {
  impressions: 15240,
  impressionsDelta: 1369,
  totalReviews: 247,
  reviewsDelta: 32,
  averageRating: 4.7,
  ratingDelta: 0.1,
  mapRank: 7,
  prevMapRank: 99,
  phoneClicks: 408,
  routeSearches: 658,
  websiteClicks: 826,
};

export const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    reviewerName: "田中 M",
    rating: 5,
    text: "初めて銀座美容室 Shionを利用しました。縮毛矯正をお願いしたのですが、カウンセリングが丁寧で仕上がりも大満足です！スタッフの方も親切で、また来ます。",
    language: "ja",
    date: "2026/3/28",
    replied: true,
    replyText: "この度はご来店いただきありがとうございます！縮毛矯正をお気に召していただけて嬉しいです。またのご来店をお待ちしております。",
    source: "google",
    isLocal: false,
  },
  {
    id: "r2",
    reviewerName: "Sarah K",
    rating: 5,
    text: "Amazing salon in Ginza! The staff was incredibly friendly and my hair looks fantastic after the color treatment. Highly recommend to anyone visiting Tokyo!",
    language: "en",
    date: "2026/3/25",
    replied: false,
    source: "google",
    isLocal: true,
  },
  {
    id: "r3",
    reviewerName: "李 小明",
    rating: 4,
    text: "银座很好的发廊！服务非常棒，发型师技术超级好。店内环境也很舒适。下次还会来的！",
    language: "zh",
    date: "2026/3/20",
    replied: false,
    source: "google",
    isLocal: false,
  },
  {
    id: "r4",
    reviewerName: "山田 K",
    rating: 3,
    text: "カラーをしましたが、思っていた色と少し違いました。接客は丁寧でしたが、仕上がりのイメージ共有をもう少し丁寧にしてほしかったです。",
    language: "ja",
    date: "2026/3/18",
    replied: false,
    source: "google",
    isLocal: false,
  },
  {
    id: "r5",
    reviewerName: "Hiroshi T",
    rating: 5,
    text: "銀座でこんなにコスパが良いサロンは初めてです。トリートメントをしてもらいましたが髪がツヤツヤになりました！定期的に通いたいと思います。",
    language: "ja",
    date: "2026/3/15",
    replied: true,
    replyText: "ありがとうございます！またのご来店を心よりお待ちしております🌸",
    source: "google",
    isLocal: true,
  },
  {
    id: "r6",
    reviewerName: "박 지수",
    rating: 5,
    text: "긴자에서 정말 좋은 미용실을 찾았어요! 스태프분들이 친절하고 헤어 스타일도 완벽하게 나왔습니다. 강추합니다!",
    language: "ko",
    date: "2026/3/10",
    replied: false,
    source: "google",
    isLocal: false,
  },
];

export const MOCK_AIO: AIOResult[] = [
  { keyword: "銀座 美容室", chatgpt: 100, gemini: 0, googleAI: 50 },
  { keyword: "銀座 縮毛矯正", chatgpt: 50, gemini: 0, googleAI: 30 },
  { keyword: "銀座 ヘアサロン", chatgpt: 20, gemini: 0, googleAI: 10 },
  { keyword: "銀座 カラー", chatgpt: 60, gemini: 0, googleAI: 40 },
];

export const MOCK_CITATIONS: CitationStatus[] = [
  { platform: "Googleマップ", status: "registered" },
  { platform: "Apple Maps", status: "registered" },
  { platform: "Yahoo!マップ", status: "registered" },
  { platform: "食べログ", status: "needs-review" },
  { platform: "Foursquare", status: "unregistered" },
  { platform: "TripAdvisor", status: "registered" },
  { platform: "Bing Maps", status: "registered" },
  { platform: "Waze", status: "unregistered" },
];

export const CHANNEL_DATA = [
  { name: "友人・知人のおすすめ", value: 43.8, count: 200, color: "#3b82f6" },
  { name: "Instagram", value: 25.4, count: 116, color: "#06b6d4" },
  { name: "Google検索", value: 16.6, count: 76, color: "#10b981" },
  { name: "店頭の看板", value: 8.8, count: 40, color: "#f59e0b" },
  { name: "Googleマップ", value: 5.5, count: 25, color: "#8b5cf6" },
];

export const IMPRESSIONS_DATA = [
  { month: "11月", value: 8200 },
  { month: "12月", value: 9100 },
  { month: "1月", value: 10500 },
  { month: "2月", value: 12800 },
  { month: "3月", value: 13900 },
  { month: "4月", value: 15240 },
];

export const REVIEW_GROWTH_DATA = [
  { month: "11月", value: 158 },
  { month: "12月", value: 178 },
  { month: "1月", value: 195 },
  { month: "2月", value: 215 },
  { month: "3月", value: 232 },
  { month: "4月", value: 247 },
];

// ─── Helpers ─────────────────────────────────────────────────
export const LANG_LABELS: Record<string, string> = {
  ja: "🇯🇵 JA",
  en: "🇺🇸 EN",
  zh: "🇨🇳 ZH",
  ko: "🇰🇷 KO",
};

export const MENU_OPTIONS = [
  "カット", "カラー", "縮毛矯正", "トリートメント",
  "パーマ", "ヘッドスパ", "ブリーチ",
];

export const VISIT_REASONS = [
  { value: "Instagram", label: "Instagramを見て" },
  { value: "Googleマップ", label: "Googleマップで見つけた" },
  { value: "友人の紹介", label: "友人・知人の紹介" },
  { value: "ホットペッパー", label: "ホットペッパー" },
  { value: "お店の前を通って", label: "お店の前を通って" },
];

export function getRatingColor(rating: number): string {
  if (rating >= 4) return "text-green-400";
  if (rating >= 3) return "text-amber-400";
  return "text-red-400";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export function formatDelta(n: number, prefix = "+"): string {
  return n > 0 ? `${prefix}${n.toLocaleString()}` : n.toLocaleString();
}

EOF_LIB_UTILS_TS

mkdir -p "app"
cat > "app/globals.css" << 'EOF_APP_GLOBALS_CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0a0e1a;
  --surface: #111827;
  --surface2: #1a2235;
  --border: #1e2d47;
  --accent: #3b82f6;
  --accent2: #06b6d4;
  --green: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --muted: #64748b;
  --muted2: #94a3b8;
}

* {
  box-sizing: border-box;
}

body {
  background: var(--bg);
  color: #f1f5f9;
  font-family: var(--font-noto), sans-serif;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted); }

/* Grid background */
.grid-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

/* Animations */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

@keyframes typing-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
.animate-slide-up { animation: slide-up 0.3s ease-out; }
.animate-fade-in { animation: fade-in 0.2s ease-out; }

/* Glow effect */
.glow-blue { box-shadow: 0 0 24px rgba(59,130,246,0.15); }
.glow-green { box-shadow: 0 0 24px rgba(16,185,129,0.15); }

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Top accent bar colors */
.accent-blue::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--accent), var(--accent2)); }
.accent-green::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--green); }
.accent-amber::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--amber); }
.accent-red::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--red); }

/* Card */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

/* Input base */
.input-base {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: #f1f5f9;
  font-family: inherit;
  font-size: 13px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.2s;
}
.input-base:focus { border-color: var(--accent); }
.input-base::placeholder { color: var(--muted); }

/* Sidebar nav */
.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 13px;
  color: var(--muted2);
  cursor: pointer;
  border-left: 2px solid transparent;
  transition: all 0.15s;
  text-decoration: none;
}
.nav-link:hover { color: #f1f5f9; background: rgba(59,130,246,0.06); }
.nav-link.active { color: var(--accent); background: rgba(59,130,246,0.1); border-left-color: var(--accent); }

EOF_APP_GLOBALS_CSS

mkdir -p "app"
cat > "app/layout.tsx" << 'EOF_APP_LAYOUT_TSX'
import type { Metadata } from "next";
import { Noto_Sans_JP, Space_Grotesk } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "口コミ365 — AI MEO / AIO Platform",
  description: "AIが口コミ作成・返信・AIO対策をサポートする店舗集客プラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${noto.variable} ${space.variable}`}>
      <body className="font-sans bg-bg text-white antialiased">{children}</body>
    </html>
  );
}

EOF_APP_LAYOUT_TSX

mkdir -p "app"
cat > "app/page.tsx" << 'EOF_APP_PAGE_TSX'
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}

EOF_APP_PAGE_TSX

mkdir -p "components/layout"
cat > "components/layout/Sidebar.tsx" << 'EOF_COMPONENTS_LAYOUT_SIDEBAR_TSX'
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenLine,
  MessageSquare,
  Cpu,
  Settings,
  Store,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/survey", label: "口コミ生成", icon: PenLine },
  { href: "/reviews", label: "口コミ管理", icon: MessageSquare },
  { href: "/aio", label: "AIO診断", icon: Cpu },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 w-[220px] flex flex-col"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="gradient-text font-mono text-[22px] font-bold tracking-tight"
        >
          口コミ365
        </div>
        <div className="text-[11px] mt-1 tracking-wide" style={{ color: "var(--muted)" }}>
          AI MEO / AIO Platform
        </div>
      </div>

      {/* Store badge */}
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

      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link${active ? " active" : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="p-5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <Link href="/settings" className="nav-link" style={{ padding: "8px 0" }}>
          <Settings size={14} />
          <span className="text-[12px]">設定</span>
        </Link>
        <div className="text-[10px] mt-3" style={{ color: "var(--muted)" }}>
          Powered by Claude AI
          <br />
          v1.0.0 — デモ版
        </div>
      </div>
    </aside>
  );
}

EOF_COMPONENTS_LAYOUT_SIDEBAR_TSX

mkdir -p "components/ui"
cat > "components/ui/index.tsx" << 'EOF_COMPONENTS_UI_INDEX_TSX'
"use client";

import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes } from "react";

// ─── Card ─────────────────────────────────────────────────────
export function Card({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={cn("card", glow && "glow-blue", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("px-5 py-4 flex items-center justify-between", className)}
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-medium">{children}</h3>;
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

// ─── Badge ────────────────────────────────────────────────────
type BadgeVariant = "green" | "amber" | "blue" | "red" | "gray";

const badgeStyles: Record<BadgeVariant, string> = {
  green: "bg-green-500/10 text-green-400",
  amber: "bg-amber-500/10 text-amber-400",
  blue: "bg-blue-500/10 text-blue-400",
  red: "bg-red-500/10 text-red-400",
  gray: "bg-white/5 text-slate-400",
};

export function Badge({
  children,
  variant = "gray",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-[11px] font-medium",
        badgeStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────
type ButtonVariant = "primary" | "ghost" | "danger";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center gap-2 font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white border-0",
    ghost:
      "bg-transparent border text-slate-300 hover:border-blue-500 hover:text-blue-400",
    danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2.5 text-[13px]",
    lg: "px-6 py-3 text-[14px]",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      style={
        variant === "ghost"
          ? { borderColor: "var(--border)" }
          : undefined
      }
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Stars ────────────────────────────────────────────────────
export function Stars({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <span style={{ fontSize: size, color: "var(--amber)", letterSpacing: 1 }}>
      {"★".repeat(Math.floor(rating))}
      {"☆".repeat(5 - Math.floor(rating))}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────
export function ProgressBar({
  value,
  color = "blue",
  className,
}: {
  value: number; // 0-100
  color?: string;
  className?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "linear-gradient(90deg, #3b82f6, #06b6d4)",
    green: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
  };

  return (
    <div
      className={cn("h-1 rounded-full overflow-hidden", className)}
      style={{ background: "var(--border)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: colorMap[color] || color,
        }}
      />
    </div>
  );
}

// ─── AIPulse indicator ───────────────────────────────────────
export function AIPulse({ label = "Claude AI" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] tracking-wide mb-3"
      style={{ color: "var(--accent2)" }}>
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
        style={{ background: "var(--accent2)" }}
      />
      {label}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  delta,
  deltaPositive = true,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  accent?: "blue" | "green" | "amber" | "red";
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background:
            accent === "blue"
              ? "linear-gradient(90deg,#3b82f6,#06b6d4)"
              : accent === "green"
              ? "#10b981"
              : accent === "amber"
              ? "#f59e0b"
              : "#ef4444",
        }}
      />
      <div
        className="text-[11px] uppercase tracking-wider mb-2"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </div>
      <div className="font-mono text-3xl font-semibold tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {delta && (
        <div
          className="text-[12px] mt-1"
          style={{ color: deltaPositive ? "var(--green)" : "var(--red)" }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── Section title ────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-7">
      <h1 className="font-mono text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm mt-1" style={{ color: "var(--muted2)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── AI Output box ────────────────────────────────────────────
export function AIOutput({
  children,
  loading,
  minHeight = 120,
  className,
}: {
  children: ReactNode;
  loading?: boolean;
  minHeight?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-4 text-[13px] leading-relaxed whitespace-pre-wrap relative",
        className
      )}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        minHeight,
        color: "#f1f5f9",
      }}
    >
      {children}
      {loading && (
        <span
          className="inline-block w-2 h-2 rounded-full ml-1 align-middle animate-pulse"
          style={{ background: "var(--accent)" }}
        />
      )}
    </div>
  );
}

EOF_COMPONENTS_UI_INDEX_TSX

mkdir -p "app/api/generate-review"
cat > "app/api/generate-review/route.ts" << 'EOF_APP_API_GENERATE-REVIEW_ROUTE_TS'
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { SurveyAnswer, GenerateReviewResponse } from "@/types";
import { MOCK_STORE } from "@/lib/utils";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_MAP: Record<string, string> = {
  ja: "日本語",
  en: "英語",
  zh: "中国語（繁体字）",
  ko: "韓国語",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SurveyAnswer;
    const { visitReason, menus, rating, staffRating, atmosphere, freeText, language } = body;

    const store = MOCK_STORE;
    // Pick a keyword randomly to avoid repetition
    const keyword = store.keywords[Math.floor(Math.random() * store.keywords.length)];
    const langLabel = LANG_MAP[language] ?? "日本語";

    const prompt = `あなたは「${store.name}」を訪問した顧客です。以下のアンケート回答をもとに、Googleマップに投稿する自然でリアルな口コミ文を${langLabel}で作成してください。

【アンケート回答】
- 来店のきっかけ: ${visitReason || "未回答"}
- 利用メニュー: ${menus.length > 0 ? menus.join("、") : "未回答"}
- 総合満足度: ${rating > 0 ? `★${"★".repeat(rating)}（${rating}/5）` : "未回答"}
- スタッフの対応: ${staffRating || "未回答"}
- 店内の雰囲気: ${atmosphere || "未回答"}
- 自由記述: ${freeText || "特になし"}

【制約】
- 必ず「${keyword}」を自然な文脈で含める
- ${language === "ja" ? "150〜250文字程度" : "100〜180 words"}
- ステマと思われない自然な個人の感想として書く
- 具体的な体験・感情を含める
- 末尾に再来店意向や他者への推薦を含める
- 口コミ文のみを出力（余計な説明・括弧書き不要）`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const review = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json<GenerateReviewResponse>({ review, keyword });
  } catch (error) {
    console.error("Generate review error:", error);
    return NextResponse.json({ error: "Failed to generate review" }, { status: 500 });
  }
}

EOF_APP_API_GENERATE-REVIEW_ROUTE_TS

mkdir -p "app/api/generate-reply"
cat > "app/api/generate-reply/route.ts" << 'EOF_APP_API_GENERATE-REPLY_ROUTE_TS'
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { GenerateReplyResponse } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_MAP: Record<string, string> = {
  ja: "日本語",
  en: "英語",
  zh: "中国語（繁体字）",
  ko: "韓国語",
};

export async function POST(req: NextRequest) {
  try {
    const { reviewText, language, storeName, rating } = await req.json();

    const langLabel = LANG_MAP[language] ?? "日本語";
    const isLowRating = rating <= 3;

    const prompt = `「${storeName ?? "店舗"}」のオーナーとして、以下の口コミに${langLabel}で返信文を作成してください。

【口コミ】（★${rating}/5）
${reviewText}

【要件】
- ${langLabel}で返信すること
- ${isLowRating
    ? "低評価への誠実な対応：謝罪・改善への意欲・再来店の歓迎を含める"
    : "感謝と温かみのある返信：お礼・共感・再来店の歓迎を含める"}
- 80〜120文字程度（日本語）/ 60〜90 words（英語）
- 店舗の雰囲気に合った上品な言葉遣い
- 返信文のみを出力（余計な説明・括弧書き不要）`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const reply = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json<GenerateReplyResponse>({ reply });
  } catch (error) {
    console.error("Generate reply error:", error);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}

EOF_APP_API_GENERATE-REPLY_ROUTE_TS

mkdir -p "app/api/aio-advice"
cat > "app/api/aio-advice/route.ts" << 'EOF_APP_API_AIO-ADVICE_ROUTE_TS'
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AIOAdviceResponse } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { storeName, area, keywords, weakKeyword, totalReviews, rating } =
      await req.json();

    const prompt = `あなたはAIO（AI Search Optimization）の専門家です。
以下の店舗情報をもとに、AIが推薦する店舗になるための具体的な改善アドバイスを3〜4点、日本語で提供してください。

【店舗情報】
- 店舗名: ${storeName}
- エリア: ${area}
- 対策キーワード: ${keywords?.join("、")}
- 現在の口コミ数: ${totalReviews}件
- 平均評価: ★${rating}
- 表示確率が低いキーワード: ${weakKeyword}

【要件】
- 各アドバイスは具体的な行動レベルで記述
- 「${weakKeyword}」の表示確率改善に重点を置く
- ChatGPT・Gemini・Google AIモードの仕組みを踏まえた対策
- マークダウンの見出し（##）と箇条書き（-）を使ってわかりやすく整形する
- 実行優先度（高・中・低）を各項目に付ける`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const advice = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json<AIOAdviceResponse>({ advice });
  } catch (error) {
    console.error("AIO advice error:", error);
    return NextResponse.json({ error: "Failed to generate advice" }, { status: 500 });
  }
}

EOF_APP_API_AIO-ADVICE_ROUTE_TS

mkdir -p "app/dashboard"
cat > "app/dashboard/layout.tsx" << 'EOF_APP_DASHBOARD_LAYOUT_TSX'
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main
        className="relative z-10"
        style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}
      >
        {children}
      </main>
    </div>
  );
}

EOF_APP_DASHBOARD_LAYOUT_TSX

mkdir -p "app/dashboard"
cat > "app/dashboard/page.tsx" << 'EOF_APP_DASHBOARD_PAGE_TSX'
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Card, CardHeader, CardTitle, CardBody,
  StatCard, Badge, Button, PageHeader, ProgressBar,
} from "@/components/ui";
import {
  MOCK_STATS, IMPRESSIONS_DATA, REVIEW_GROWTH_DATA,
  CHANNEL_DATA, MOCK_STORE, formatDelta,
} from "@/lib/utils";
import { AlertCircle, Camera, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const s = MOCK_STATS;

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="ダッシュボード"
        subtitle={`${MOCK_STORE.name} — 過去30日間の概要`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Googleマップ 表示回数"
          value={s.impressions.toLocaleString()}
          delta={`↑ ${formatDelta(s.impressionsDelta)} 先月比`}
          accent="blue"
        />
        <StatCard
          label="口コミ件数（累計）"
          value={s.totalReviews}
          delta={`↑ +${s.reviewsDelta} 今月`}
          accent="green"
        />
        <StatCard
          label="平均 ★ 評価"
          value={s.averageRating.toFixed(1)}
          delta={`↑ +${s.ratingDelta}`}
          accent="amber"
        />
        <StatCard
          label="MAP 順位（銀座 美容室）"
          value={`#${s.mapRank}`}
          delta={`↑ 圏外 → ${s.mapRank}位`}
          accent="red"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Impressions chart */}
        <Card glow>
          <CardHeader>
            <CardTitle>表示回数 推移</CardTitle>
            <Badge variant="blue">6ヶ月</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-mono text-3xl font-semibold">
                {s.impressions.toLocaleString()}
              </span>
              <span className="text-sm text-green-400">↑ +{s.impressionsDelta.toLocaleString()}</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={IMPRESSIONS_DATA}>
                <defs>
                  <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#1a2235", border: "1px solid #1e2d47", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#3b82f6" }}
                  formatter={(v: number) => [v.toLocaleString(), "表示回数"]}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#impGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Channel pie */}
        <Card>
          <CardHeader>
            <CardTitle>集客チャネル分析</CardTitle>
            <Badge variant="blue">今月</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={CHANNEL_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={62} paddingAngle={2}>
                    {CHANNEL_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {CHANNEL_DATA.map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span style={{ color: "#94a3b8" }}>{d.name}</span>
                      <span className="font-medium">{d.value}%</span>
                    </div>
                    <ProgressBar value={d.value} color={d.color} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 text-[12px]" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
              総回答数 <strong className="text-white">457件</strong>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Review growth + Actions */}
      <div className="grid grid-cols-2 gap-5">
        {/* Review growth */}
        <Card>
          <CardHeader>
            <CardTitle>口コミ数 推移</CardTitle>
            <Badge variant="green">増加中</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-mono text-3xl font-semibold">{s.totalReviews}件</span>
            </div>
            <div className="text-[12px] mb-2" style={{ color: "var(--muted)" }}>
              目標 300件まで あと{300 - s.totalReviews}件
            </div>
            <ProgressBar value={(s.totalReviews / 300) * 100} color="blue" className="mb-4" />
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={REVIEW_GROWTH_DATA}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "#1a2235", border: "1px solid #1e2d47", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v, "件"]}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* AI Actions */}
        <Card>
          <CardHeader>
            <CardTitle>AIアクション提案</CardTitle>
            <Badge variant="blue">3件</Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            <div
              className="p-4 rounded-xl flex gap-3"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              <AlertCircle size={18} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-[13px] font-medium mb-1">低評価への返信が必要</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>未返信の★3以下が3件あります</div>
                <Link href="/reviews">
                  <Button variant="ghost" size="sm" className="mt-2">確認する →</Button>
                </Link>
              </div>
            </div>
            <div
              className="p-4 rounded-xl flex gap-3"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              <Camera size={18} style={{ color: "var(--accent2)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-[13px] font-medium mb-1">写真の更新</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>最終更新から14日経過しています</div>
              </div>
            </div>
            <div
              className="p-4 rounded-xl flex gap-3"
              style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)" }}
            >
              <Target size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="text-[13px] font-medium mb-1">AIO対策キーワード改善</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>「銀座 縮毛矯正」の表示確率が低下中</div>
                <Link href="/aio">
                  <Button size="sm" className="mt-2">今すぐ診断 →</Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

EOF_APP_DASHBOARD_PAGE_TSX

mkdir -p "app/survey"
cat > "app/survey/layout.tsx" << 'EOF_APP_SURVEY_LAYOUT_TSX'
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main className="relative z-10" style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}>
        {children}
      </main>
    </div>
  );
}

EOF_APP_SURVEY_LAYOUT_TSX

mkdir -p "app/survey"
cat > "app/survey/page.tsx" << 'EOF_APP_SURVEY_PAGE_TSX'
"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardBody,
  Button, Badge, PageHeader, AIPulse, AIOutput,
} from "@/components/ui";
import {
  MOCK_STORE, MENU_OPTIONS, VISIT_REASONS, LANG_LABELS,
} from "@/lib/utils";
import type { Language, SurveyAnswer } from "@/types";
import { Copy, RefreshCw, Send, Star, Check } from "lucide-react";

export default function SurveyPage() {
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
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setReview(data.review || "エラーが発生しました。");
      setUsedKeyword(data.keyword || "");
      // Auto-generate reply
      generateReply(data.review, lang);
    } catch {
      setReview(
        `【サンプル出力】\n\nInstagramで見かけて初めて訪問しました。${MOCK_STORE.keywords[0]}の中でも特に丁寧なカウンセリングで、縮毛矯正をお願いしたのですが仕上がりが想像以上に自然でサラサラに！スタッフの方がとても親切で、上品な空間でリラックスできました。また絶対来ます！`
      );
      setUsedKeyword(MOCK_STORE.keywords[0]);
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
          storeName: MOCK_STORE.name,
          rating,
        }),
      });
      const data = await res.json();
      setReply(data.reply || "");
    } catch {
      setReply("この度はご来店いただきありがとうございます！またのご来店を心よりお待ちしております。銀座 美容室 Shion スタッフ一同");
    } finally {
      setReplyLoading(false);
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
              <CardTitle>📋 お客様アンケート — {MOCK_STORE.name}</CardTitle>
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
                  {MOCK_STORE.keywords.map((kw) => (
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
                <div className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
                  使用キーワード:{" "}
                  <span style={{ color: "var(--accent)" }}>{usedKeyword}</span>
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

EOF_APP_SURVEY_PAGE_TSX

mkdir -p "app/reviews"
cat > "app/reviews/layout.tsx" << 'EOF_APP_REVIEWS_LAYOUT_TSX'
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main className="relative z-10" style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}>
        {children}
      </main>
    </div>
  );
}

EOF_APP_REVIEWS_LAYOUT_TSX

mkdir -p "app/reviews"
cat > "app/reviews/page.tsx" << 'EOF_APP_REVIEWS_PAGE_TSX'
"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardBody,
  Badge, Button, PageHeader, Stars, AIPulse, AIOutput,
} from "@/components/ui";
import { MOCK_REVIEWS, MOCK_STORE, LANG_LABELS } from "@/lib/utils";
import type { Review } from "@/types";
import { MessageSquare, RefreshCw, Check, Send } from "lucide-react";

type Filter = "all" | "unreplied" | "low";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
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
          storeName: MOCK_STORE.name,
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
          : "この度はご来店いただきありがとうございます！またのご来店を心よりお待ちしております。銀座 美容室 Shion スタッフ一同";
      setGeneratedReplies((prev) => ({ ...prev, [review.id]: fallback }));
    } finally {
      setGeneratingId(null);
    }
  };

  const handleConfirmReply = (id: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, replied: true, replyText: generatedReplies[id] }
          : r
      )
    );
    setConfirmedReplies((prev) => new Set([...prev, id]));
  };

  const getLangBadge = (lang: string) => {
    const v = lang === "ja" ? "amber" : lang === "en" ? "blue" : "green";
    return <Badge variant={v as any}>{LANG_LABELS[lang] ?? lang.toUpperCase()}</Badge>;
  };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="口コミ管理"
        subtitle="Googleマップの口コミを一元管理・AIで返信"
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
                borderBottom: `2px solid ${filter === f ? "var(--accent)" : "transparent"}`,
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

EOF_APP_REVIEWS_PAGE_TSX

mkdir -p "app/aio"
cat > "app/aio/layout.tsx" << 'EOF_APP_AIO_LAYOUT_TSX'
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main className="relative z-10" style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}>
        {children}
      </main>
    </div>
  );
}

EOF_APP_AIO_LAYOUT_TSX

mkdir -p "app/aio"
cat > "app/aio/page.tsx" << 'EOF_APP_AIO_PAGE_TSX'
"use client";

import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardBody,
  Badge, Button, PageHeader, ProgressBar, AIPulse, AIOutput,
} from "@/components/ui";
import { MOCK_AIO, MOCK_CITATIONS, MOCK_STORE, getScoreColor } from "@/lib/utils";
import type { AIOResult, CitationStatus } from "@/types";
import { Sparkles, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const AI_ENGINES = [
  { key: "chatgpt", label: "ChatGPT", color: "#10b981" },
  { key: "gemini", label: "Gemini", color: "#8b5cf6" },
  { key: "googleAI", label: "Google AIモード", color: "#3b82f6" },
];

function ScorePill({ value }: { value: number }) {
  const color = value >= 70 ? "#10b981" : value >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <span
      className="font-mono text-xl font-semibold"
      style={{ color }}
    >
      {value}%
    </span>
  );
}

function CitationIcon({ status }: { status: CitationStatus["status"] }) {
  if (status === "registered") return <CheckCircle2 size={15} color="#10b981" />;
  if (status === "unregistered") return <XCircle size={15} color="#ef4444" />;
  return <AlertCircle size={15} color="#f59e0b" />;
}

export default function AIOPage() {
  const [advice, setAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [weakKw, setWeakKw] = useState(MOCK_AIO[2].keyword); // default: 最弱キーワード

  const handleGetAdvice = async () => {
    setAdviceLoading(true);
    setAdvice("");
    try {
      const res = await fetch("/api/aio-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: MOCK_STORE.name,
          area: MOCK_STORE.area,
          keywords: MOCK_STORE.keywords,
          weakKeyword: weakKw,
          totalReviews: MOCK_STORE.totalReviews,
          rating: MOCK_STORE.averageRating,
        }),
      });
      const data = await res.json();
      setAdvice(data.advice || "アドバイスを取得できませんでした。");
    } catch {
      setAdvice(
        `## 優先度：高\n\n**① 「${weakKw}」キーワードを含む口コミを増やす**\n- 月10件以上の高品質な口コミに「${weakKw}」を自然に含める\n- AIはGoogleマップの口コミを信用情報として最優先で参照する\n\n## 優先度：高\n\n**② Googleビジネスプロフィールのサービス欄を更新**\n- 「${MOCK_STORE.area}」「縮毛矯正」を明記\n- 写真を週2回定期更新し、アクティブな店舗と認識させる\n\n## 優先度：中\n\n**③ 最新情報投稿にキーワードを含める**\n- GBPの最新情報投稿に「${weakKw}」を定期的に含める\n- AIが読み取れる構造化された情報を継続的に発信`
      );
    } finally {
      setAdviceLoading(false);
    }
  };

  // Citation score
  const registeredCount = MOCK_CITATIONS.filter((c) => c.status === "registered").length;
  const citationScore = Math.round((registeredCount / MOCK_CITATIONS.length) * 100);

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="AIO診断"
        subtitle="ChatGPT・Gemini・Google AIモードでの表示確率を診断します"
      />

      <div className="grid grid-cols-2 gap-5">
        {/* ── Left Column ── */}
        <div className="space-y-5">
          {/* AIO Score table */}
          <Card>
            <CardHeader>
              <CardTitle>キーワード × AI表示確率</CardTitle>
              <Badge variant="blue">リアルタイム診断</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {/* Header row */}
              <div
                className="grid px-5 py-2 text-[11px]"
                style={{
                  color: "var(--muted)",
                  borderBottom: "1px solid var(--border)",
                  gridTemplateColumns: "1fr 80px 80px 100px",
                }}
              >
                <span>キーワード</span>
                <span className="text-center">ChatGPT</span>
                <span className="text-center">Gemini</span>
                <span className="text-center">Google AI</span>
              </div>

              {MOCK_AIO.map((aio, idx) => (
                <div
                  key={aio.keyword}
                  className="grid px-5 py-3.5 items-center cursor-pointer hover:bg-white/[0.02] transition-colors"
                  style={{
                    gridTemplateColumns: "1fr 80px 80px 100px",
                    borderBottom: idx < MOCK_AIO.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                  onClick={() => setWeakKw(aio.keyword)}
                >
                  <span className="text-[13px] font-medium">{aio.keyword}</span>
                  <div className="text-center"><ScorePill value={aio.chatgpt} /></div>
                  <div className="text-center"><ScorePill value={aio.gemini} /></div>
                  <div className="text-center"><ScorePill value={aio.googleAI} /></div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* MAP Health Score */}
          <Card>
            <CardHeader>
              <CardTitle>MAP健康診断スコア</CardTitle>
              <Badge variant="amber">要改善</Badge>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="font-mono text-5xl font-bold"
                  style={{ color: "var(--amber)" }}
                >
                  C
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold">68 / 100</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>
                    総合スコア
                  </div>
                  <ProgressBar value={68} color="amber" className="mt-2 w-48" />
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "基本情報", grade: "A", score: 95, v: "green" },
                  { label: "写真", grade: "B", score: 70, v: "blue" },
                  { label: "口コミ", grade: "B", score: 75, v: "blue" },
                  { label: "最新情報", grade: "D", score: 30, v: "red" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-[13px] w-20" style={{ color: "var(--muted2)" }}>
                      {item.label}
                    </span>
                    <ProgressBar value={item.score} color={item.v} className="flex-1" />
                    <Badge variant={item.v as any} className="w-8 text-center">
                      {item.grade}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">
          {/* AIO Advice */}
          <Card glow>
            <CardHeader>
              <CardTitle>✨ AIO対策 AIアドバイス</CardTitle>
              <Button size="sm" onClick={handleGetAdvice} disabled={adviceLoading}>
                {adviceLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    診断中...
                  </>
                ) : (
                  <><Sparkles size={13} /> 診断する</>
                )}
              </Button>
            </CardHeader>
            <CardBody>
              <div className="mb-3">
                <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                  診断するキーワード
                </label>
                <select
                  className="input-base"
                  value={weakKw}
                  onChange={(e) => setWeakKw(e.target.value)}
                >
                  {MOCK_STORE.keywords.map((kw) => (
                    <option key={kw} value={kw}>{kw}</option>
                  ))}
                </select>
              </div>
              <AIPulse label="Claude AI — AIO最適化エンジン" />
              <AIOutput loading={adviceLoading} minHeight={200}>
                {advice || (
                  <span style={{ color: "var(--muted)" }}>
                    {`キーワードを選択して「診断する」ボタンを押すと、\nAIがあなたの店舗のAIO対策について\n具体的なアドバイスを生成します。\n\n• ChatGPT / Gemini / Google AIモードの仕組みを分析\n• 表示確率を上げる具体的な施策を提案\n• 優先度付きで実行プランを提示`}
                  </span>
                )}
              </AIOutput>
            </CardBody>
          </Card>

          {/* Citation status */}
          <Card>
            <CardHeader>
              <CardTitle>サイテーション状況</CardTitle>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold" style={{ color: getScoreColor(citationScore) }}>
                  {citationScore}
                </span>
                <span className="text-[12px]" style={{ color: "var(--muted)" }}>/ 100</span>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="px-5 pb-4 pt-3">
                <ProgressBar
                  value={citationScore}
                  color={citationScore >= 80 ? "green" : citationScore >= 50 ? "amber" : "red"}
                  className="mb-4"
                />
              </div>
              <div className="divide-y" style={{ borderTop: "1px solid var(--border)" }}>
                {MOCK_CITATIONS.map((c) => (
                  <div
                    key={c.platform}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="text-[13px]">{c.platform}</span>
                    <div className="flex items-center gap-2">
                      <CitationIcon status={c.status} />
                      <span
                        className="text-[12px]"
                        style={{
                          color:
                            c.status === "registered"
                              ? "var(--green)"
                              : c.status === "unregistered"
                              ? "var(--red)"
                              : "var(--amber)",
                        }}
                      >
                        {c.status === "registered"
                          ? "登録済"
                          : c.status === "unregistered"
                          ? "未登録"
                          : "要確認"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <Button className="w-full justify-center" size="sm">
                  未登録メディアに一括登録する
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

EOF_APP_AIO_PAGE_TSX

mkdir -p "app/settings"
cat > "app/settings/layout.tsx" << 'EOF_APP_SETTINGS_LAYOUT_TSX'
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg">
      <Sidebar />
      <main className="relative z-10" style={{ marginLeft: 220, minHeight: "100vh", padding: "32px 36px" }}>
        {children}
      </main>
    </div>
  );
}

EOF_APP_SETTINGS_LAYOUT_TSX

mkdir -p "app/settings"
cat > "app/settings/page.tsx" << 'EOF_APP_SETTINGS_PAGE_TSX'
"use client";

import {
  Card, CardHeader, CardTitle, CardBody,
  Button, Badge, PageHeader,
} from "@/components/ui";
import { MOCK_STORE } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="animate-slide-up max-w-2xl">
      <PageHeader title="設定" subtitle="店舗情報・API設定・プラン管理" />

      <div className="space-y-5">
        {/* Store info */}
        <Card>
          <CardHeader>
            <CardTitle>店舗情報</CardTitle>
            <Badge variant="green">登録済</Badge>
          </CardHeader>
          <CardBody className="space-y-4">
            {[
              { label: "店舗名", value: MOCK_STORE.name },
              { label: "エリア", value: MOCK_STORE.area },
              { label: "業種", value: "美容室" },
              { label: "対策キーワード", value: MOCK_STORE.keywords.join("　/　") },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-[12px] mb-1" style={{ color: "var(--muted2)" }}>
                  {item.label}
                </label>
                <div
                  className="input-base"
                  style={{ color: "#f1f5f9", cursor: "default" }}
                >
                  {item.value}
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm">編集する</Button>
          </CardBody>
        </Card>

        {/* API key */}
        <Card>
          <CardHeader>
            <CardTitle>Anthropic API設定</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="mb-4">
              <label className="block text-[12px] mb-1.5" style={{ color: "var(--muted2)" }}>
                APIキー
              </label>
              <input
                type="password"
                className="input-base"
                placeholder="sk-ant-..."
                defaultValue="sk-ant-***************************"
              />
              <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>
                .env.local の ANTHROPIC_API_KEY に設定してください
              </p>
            </div>
            <Button size="sm">保存する</Button>
          </CardBody>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader>
            <CardTitle>現在のプラン</CardTitle>
            <Badge variant="amber">運用代行プラン</Badge>
          </CardHeader>
          <CardBody>
            <div className="font-mono text-2xl font-semibold mb-1">¥30,000 <span className="text-sm font-normal" style={{ color: "var(--muted)" }}>/ 月（税別）</span></div>
            <div className="text-[13px] space-y-1 mt-3" style={{ color: "var(--muted2)" }}>
              <div>✓ GBP連携・アンケート作成</div>
              <div>✓ 最新情報投稿（週2回）</div>
              <div>✓ 口コミ返信（週3回）</div>
            </div>
            <Button className="mt-4" size="sm">総合コンサルプランにアップグレード</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

EOF_APP_SETTINGS_PAGE_TSX

echo '✅ 全ファイル作成完了！'
echo ''
echo '次のステップ:'
echo '  npm run dev'
