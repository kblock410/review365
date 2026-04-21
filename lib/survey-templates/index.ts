/**
 * 業種ごとのアンケートテンプレート登録ハブ
 *
 * 新しい業種を追加する場合：
 *   1. lib/survey-templates/<category>.ts を作成（restaurant.ts を雛形に）
 *   2. 下の TEMPLATES に登録
 *   3. stores.category に同じキー（"restaurant", "beauty", "clinic" など）を入れる
 */

import type { SurveyTemplate } from "./types";
import { restaurantSurvey } from "./restaurant";
import { beautySurvey } from "./beauty";

// 将来追加分はここに並べていく
// import { clinicSurvey } from "./clinic";

const TEMPLATES: Record<string, SurveyTemplate> = {
  restaurant: restaurantSurvey,
  beauty: beautySurvey,
  // clinic: clinicSurvey,
};

/**
 * 店舗の category からテンプレートを取得する。
 * 未登録業種は restaurant をフォールバックとして返す（現状最初の実装なので）。
 * 本格運用時は "generic" テンプレを用意して差し替える方が望ましい。
 */
export function getSurveyTemplate(category: string | null | undefined): SurveyTemplate {
  if (category && TEMPLATES[category]) return TEMPLATES[category];
  return restaurantSurvey;
}

export { TEMPLATES };
export type { SurveyTemplate } from "./types";
