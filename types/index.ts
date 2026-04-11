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

