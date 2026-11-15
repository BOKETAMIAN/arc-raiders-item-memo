import type { Disposition } from '../types/item';

export const TYPE_JA_MAP: Record<string, string> = {
  'Ammunition': '弾薬',
  'Assault Rifle': 'アサルトライフル',
  'Augment': 'オーグメント',
  'Basic Material': '基本素材',
  'Battle Rifle': 'バトルライフル',
  'Blueprint': '設計図',
  'Design': 'デザイン',
  'Hand Cannon': 'ハンドキャノン',
  'Key': '鍵',
  'LMG': '軽機関銃 (LMG)',
  'Misc': 'その他',
  'Modification': 'アタッチメント / MOD',
  'Nature': '自然物',
  'Outpost Furniture': '拠点家具',
  'Outpost Room': '拠点ルーム',
  'Pistol': 'ピストル',
  'Quick Use': 'クイック使用 / 消耗品',
  'Recyclable': 'リサイクル品',
  'Refined Material': '精製素材',
  'Research': '研究アイテム',
  'Shield': 'シールド',
  'Shotgun': 'ショットガン',
  'SMG': 'サブマシンガン (SMG)',
  'Sniper Rifle': 'スナイパーライフル',
  'Special': '特殊',
  'Stencil': 'ステンシル',
  'Topside Material': '地上素材',
  'Trinket': '換金品 / 小物',
};

export interface CategoryGroup {
  id: string;
  label: string;
  types: string[] | null;
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'all', label: 'すべて', types: null },
  {
    id: 'weapons',
    label: '武器・弾薬',
    types: [
      'Assault Rifle',
      'Battle Rifle',
      'SMG',
      'LMG',
      'Shotgun',
      'Sniper Rifle',
      'Hand Cannon',
      'Pistol',
      'Ammunition',
    ],
  },
  {
    id: 'gear',
    label: '装備・MOD',
    types: ['Shield', 'Augment', 'Modification'],
  },
  {
    id: 'consumables',
    label: '消耗品・鍵',
    types: ['Quick Use', 'Key', 'Special'],
  },
  {
    id: 'materials',
    label: '素材',
    types: ['Basic Material', 'Refined Material', 'Topside Material', 'Nature'],
  },
  {
    id: 'loot',
    label: 'リサイクル・換金',
    types: ['Recyclable', 'Trinket', 'Research'],
  },
  {
    id: 'blueprints',
    label: '設計図・拠点・他',
    types: ['Blueprint', 'Design', 'Stencil', 'Outpost Furniture', 'Outpost Room', 'Misc'],
  },
];

export const RARITY_INFO: Record<string, { label: string; colorClass: string; order: number }> = {
  Common: { label: 'コモン', colorClass: 'rarity-common', order: 1 },
  Uncommon: { label: 'アンコモン', colorClass: 'rarity-uncommon', order: 2 },
  Rare: { label: 'レア', colorClass: 'rarity-rare', order: 3 },
  Epic: { label: 'エピック', colorClass: 'rarity-epic', order: 4 },
  Legendary: { label: 'レジェンダリー', colorClass: 'rarity-legendary', order: 5 },
};

export const DISPOSITION_INFO: Record<
  Disposition,
  { label: string; shortLabel: string; colorClass: string }
> = {
  unset: { label: '未設定', shortLabel: '未設定', colorClass: 'disp-unset' },
  keep: { label: '残す', shortLabel: '残す', colorClass: 'disp-keep' },
  recycle: { label: 'リサイクル', shortLabel: 'リサイクル', colorClass: 'disp-recycle' },
  sell: { label: '売却', shortLabel: '売却', colorClass: 'disp-sell' },
};

export const BENCH_JA_MAP: Record<string, string> = {
  in_raid: 'レイド中クラフト',
  med_station: '医療ステーション',
  weapon_bench: '武器ベンチ',
  equipment_bench: '装備ベンチ',
  explosives_bench: '爆発物ベンチ',
  utility_bench: 'ユーティリティベンチ',
  workbench: '作業台',
  refiner: '精錬機',
};

export function getTypeLabel(type: string): string {
  return TYPE_JA_MAP[type] || type;
}

export function getBenchLabel(bench: string): string {
  return BENCH_JA_MAP[bench] || bench;
}
