/**
 * 美容室向けアンケートテンプレート
 *
 * restaurant.ts と同じ SurveyTemplate 型に準拠。
 * stores.category = "beauty" の店舗に自動適用される。
 */

import type { SurveyTemplate } from "./types";

export const beautySurvey: SurveyTemplate = {
  category: "beauty",
  label: "美容室向けアンケート",
  aiContext: {
    industry: "美容室",
    promptHints: [
      "施術メニュー名（カット / カラー / 縮毛矯正 など）を必ず1つ以上含める",
      "エリア名と業種（例：銀座 美容室）を含める",
      "来店のきっかけやシーン（特別な日 / 結婚式前 など）を自然に含める",
      "仕上がりに対する感想を1つ含める",
      "スタッフの対応や店内の雰囲気に触れる",
      "再訪意向または推薦意向を自然に含める",
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
      key: "visitReason",
      type: "single",
      question: "ご来店のきっかけ",
      required: true,
      options: [
        { value: "instagram", label: "Instagramを見て" },
        { value: "googlemap", label: "Googleマップで見つけた" },
        { value: "referral", label: "友人・知人の紹介" },
        { value: "hotpepper", label: "ホットペッパー" },
        { value: "walkby", label: "お店の前を通って" },
        { value: "repeat", label: "以前から利用している" },
      ],
    },
    {
      key: "menus",
      type: "multi",
      question: "ご利用メニュー",
      required: true,
      // 店舗ごとに差し替え可能
      options: [
        { value: "cut", label: "カット" },
        { value: "color", label: "カラー" },
        { value: "perm", label: "パーマ" },
        { value: "straight", label: "縮毛矯正" },
        { value: "treatment", label: "トリートメント" },
        { value: "headspa", label: "ヘッドスパ" },
        { value: "setup", label: "セット・ヘアアレンジ" },
      ],
      sourceFromStore: "menu_options",
    },
    {
      key: "occasion",
      type: "single",
      question: "来店シーン",
      required: false,
      options: [
        { value: "daily", label: "日常のケア" },
        { value: "event", label: "特別な日の前" },
        { value: "wedding", label: "結婚式・パーティ" },
        { value: "business", label: "仕事の節目" },
        { value: "tourist", label: "旅行・観光中" },
      ],
    },
    {
      key: "staffRating",
      type: "single",
      question: "スタッフの対応",
      required: false,
      options: [
        { value: "excellent", label: "とても良かった" },
        { value: "good", label: "良かった" },
        { value: "normal", label: "普通" },
      ],
    },
    {
      key: "atmosphere",
      type: "single",
      question: "店内の雰囲気",
      required: false,
      options: [
        { value: "stylish", label: "おしゃれ" },
        { value: "clean", label: "清潔感があった" },
        { value: "relax", label: "リラックスできた" },
        { value: "luxury", label: "高級感があった" },
        { value: "casual", label: "カジュアル" },
      ],
    },
    {
      key: "goodPoints",
      type: "multi",
      question: "特に良かった点",
      required: false,
      options: [
        { value: "skill", label: "技術力" },
        { value: "counseling", label: "カウンセリング" },
        { value: "finish", label: "仕上がり" },
        { value: "service", label: "接客" },
        { value: "atmos", label: "店内の雰囲気" },
        { value: "clean", label: "清潔感" },
        { value: "access", label: "アクセス" },
        { value: "price", label: "価格" },
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
        { value: "friend", label: "友人" },
        { value: "family", label: "家族" },
        { value: "colleague", label: "同僚" },
        { value: "tourist", label: "観光客" },
        { value: "bride", label: "結婚式を控えた人" },
      ],
    },
    {
      key: "freeText",
      type: "text",
      question: "印象に残ったシーンや施術を一言で（任意）",
      required: false,
      placeholder: "例：縮毛矯正の仕上がりが自然で、担当者の対応もとても丁寧でした。",
    },
  ],
};

export default beautySurvey;
