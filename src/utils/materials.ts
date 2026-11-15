import type { ArcItem } from '../types/item';

/** 精錬機等で上位素材を作成できる素材カテゴリー */
const CRAFTABLE_MATERIAL_TYPES = new Set([
  'Refined Material',
  'Topside Material',
  'Basic Material',
]);

export interface MaterialUsageInfo {
  direct: string[];
  sub: string[];
}

export interface CollectedMaterialsResult {
  /** ニーズアイテムが直接必要とする素材の合計数 */
  directTotals: Map<string, number>;
  /** 精製可能な必要素材を精錬機等で作る場合に必要な下位素材の合計数 */
  refinedSubTotals: Map<string, number>;
  /** 素材ID -> その素材を必要とするニーズアイテムID（直接 / 精製用） */
  materialUsedByMap: Map<string, MaterialUsageInfo>;
}

/**
 * ニーズ登録されたアイテムの必要素材と、精錬機等で作れる素材の元になる下位素材を再帰的に収集する。
 */
export function collectNeedMaterials(
  needsIds: string[],
  itemMap: Map<string, ArcItem>
): CollectedMaterialsResult {
  const directTotals = new Map<string, number>();
  const refinedSubTotals = new Map<string, number>();
  const materialUsedByMap = new Map<string, MaterialUsageInfo>();

  const addUsedBy = (matId: string, needId: string, kind: 'direct' | 'sub') => {
    const entry = materialUsedByMap.get(matId) ?? { direct: [], sub: [] };
    if (!entry[kind].includes(needId)) {
      entry[kind].push(needId);
    }
    materialUsedByMap.set(matId, entry);
  };

  const expandSubMaterials = (
    matId: string,
    multiplier: number,
    rootNeedId: string,
    ancestors: Set<string>
  ) => {
    if (ancestors.has(matId)) return;
    const matItem = itemMap.get(matId);
    if (!matItem || !matItem.recipe || !CRAFTABLE_MATERIAL_TYPES.has(matItem.type)) {
      return;
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(matId);

    for (const [subId, subCount] of Object.entries(matItem.recipe)) {
      const totalSub = subCount * multiplier;
      refinedSubTotals.set(subId, (refinedSubTotals.get(subId) ?? 0) + totalSub);
      addUsedBy(subId, rootNeedId, 'sub');
      expandSubMaterials(subId, totalSub, rootNeedId, nextAncestors);
    }
  };

  for (const needId of needsIds) {
    const needItem = itemMap.get(needId);
    if (!needItem) continue;

    const combinedDirect = new Map<string, number>();
    if (needItem.recipe) {
      for (const [matId, count] of Object.entries(needItem.recipe)) {
        combinedDirect.set(matId, (combinedDirect.get(matId) ?? 0) + count);
      }
    }
    if (needItem.upgradeCost) {
      for (const [matId, count] of Object.entries(needItem.upgradeCost)) {
        combinedDirect.set(matId, (combinedDirect.get(matId) ?? 0) + count);
      }
    }

    for (const [matId, count] of combinedDirect.entries()) {
      directTotals.set(matId, (directTotals.get(matId) ?? 0) + count);
      addUsedBy(matId, needId, 'direct');
      expandSubMaterials(matId, count, needId, new Set([needId]));
    }
  }

  return {
    directTotals,
    refinedSubTotals,
    materialUsedByMap,
  };
}

/**
 * 指定された素材が精製可能（recipeを持つ素材カテゴリー）かどうかを返す
 */
export function isCraftableMaterial(item: ArcItem | undefined): boolean {
  if (!item || !item.recipe) return false;
  return CRAFTABLE_MATERIAL_TYPES.has(item.type) && Object.keys(item.recipe).length > 0;
}
