/**
 * アンケートテンプレート共通型
 * 業種ごとに restaurant.ts / beauty.ts などを作り、この型に従う。
 */

export type SurveyQuestionType = "rating" | "single" | "multi" | "text";

export interface SurveyOption {
  value: string;
  label: string;
}

export interface SurveyQuestion {
  key: string;                       // 回答データのキー
  type: SurveyQuestionType;
  question: string;
  required: boolean;
  options?: SurveyOption[];
  max?: number;                      // rating 用
  placeholder?: string;              // text 用
  // 店舗レコードの列名（例: "menu_options"）を指定すると
  // 店舗ごとのカスタム選択肢でフォールバックを上書きできる
  sourceFromStore?: string;
}

export interface SurveyAIContext {
  industry: string;
  promptHints: string[];
}

export interface SurveyTemplate {
  category: string;                  // stores.category と一致させる
  label: string;
  aiContext: SurveyAIContext;
  questions: SurveyQuestion[];
}
