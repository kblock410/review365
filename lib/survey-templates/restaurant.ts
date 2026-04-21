/**
 * 飲食店向けアンケートテンプレート
 *
 * このファイルは「業種=restaurant」の店舗が選択されたときに適用される。
 * 美容室など他業種を追加する場合は、同じ形に従って
 *   lib/survey-templates/beauty.ts
 *   lib/survey-templates/clinic.ts
 * など並列に作成し、index.ts で業種キーごとにマップする。
 *
 * { question, options, key, type, required } を使い回せる構造にしてある。
 */

import type { SurveyTemplate } from "./types";

export const restaurantSurvey: SurveyTemplate = {
  category: "restaurant",
  label: "飲食店向けアンケート",
  // AI に渡す業種ヒント（口コミ生成プロンプトで利用）
  aiContext: {
    industry: "飲食店",
    // 口コミに自然に織り込みたいキーワード種別
    promptHints: [
      "料理名・メニュー名を必ず1つ以上含める",
      "エリア名と業種（例：渋谷 居酒屋）を含める",
      "来店シーン（デート / 家族 / 接待 など）を含める",
      "店内の雰囲気を表す形容を1つ含める",
      "再訪意向や推薦意向を自然に含める",
    ],
  },
  questions: [
    {
      key: "rating",
      type: "rating",
      question: "総合満足度",
      required: true,
      max: 5,
    },
    {
      key: "visitScene",
      type: "single",
      question: "来店シーン",
      required: true,
      options: [
        { value: "alone", label: "ひとりで" },
        { value: "date", label: "デート" },
        { value: "family", label: "家族" },
        { value: "friends", label: "友人" },
        { value: "girls", label: "女子会" },
        { value: "business", label: "接待・会食" },
        { value: "tourist", label: "観光" },
      ],
    },
    {
      key: "menus",
      type: "multi",
      question: "注文したメニュー",
      required: false,
      // 店舗ごとに差し替え可能（store.menu_options が存在すればそちらを優先）
      // 未設定店舗向けの汎用フォールバック
      options: [
        { value: "signature", label: "看板メニュー" },
        { value: "course", label: "コース料理" },
        { value: "drink", label: "ドリンク" },
        { value: "dessert", label: "デザート" },
        { value: "seasonal", label: "季節限定メニュー" },
      ],
      sourceFromStore: "menu_options",
    },
    {
      key: "goodPoints",
      type: "multi",
      question: "特に良かった点",
      required: false,
      options: [
        { value: "taste", label: "料理の味" },
        { value: "freshness", label: "食材の鮮度" },
        { value: "volume", label: "ボリューム" },
        { value: "cospa", label: "コスパ" },
        { value: "service", label: "接客" },
        { value: "atmosphere", label: "店内の雰囲気" },
        { value: "clean", label: "清潔感" },
        { value: "seat", label: "個室・席の配置" },
        { value: "access", label: "アクセス" },
        { value: "price", label: "価格" },
      ],
    },
    {
      key: "vibe",
      type: "single",
      question: "この店を一言で表すと",
      required: false,
      options: [
        { value: "hidden", label: "隠れ家的" },
        { value: "lively", label: "賑やか" },
        { value: "calm", label: "落ち着く" },
        { value: "luxury", label: "高級感" },
        { value: "casual", label: "カジュアル" },
        { value: "authentic", label: "本格派" },
        { value: "local", label: "地元密着" },
      ],
    },
    {
      key: "revisit",
      type: "single",
      question: "また来たい度",
      required: true,
      options: [
        { value: "definitely", label: "必ず来たい" },
        { value: "yes", label: "来たい" },
        { value: "maybe", label: "どちらとも言えない" },
        { value: "no", label: "もう来ない" },
      ],
    },
    {
      key: "recommendTo",
      type: "multi",
      question: "誰に勧めたいですか？",
      required: false,
      options: [
        { value: "lover", label: "恋人" },
        { value: "family", label: "家族" },
        { value: "friend", label: "友人" },
        { value: "colleague", label: "同僚" },
        { value: "tourist", label: "観光客" },
        { value: "solo", label: "一人で来る人" },
      ],
    },
    {
      key: "freeText",
      type: "text",
      question: "印象に残ったシーンや料理を一言で（任意）",
      required: false,
      placeholder: "例：名物の煮込みが絶品で、また訪れたい一軒でした。",
    },
  ],
};

export default restaurantSurvey;
