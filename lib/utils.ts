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

