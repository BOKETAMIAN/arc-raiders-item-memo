export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | string;

export type Disposition = 'unset' | 'keep' | 'recycle' | 'sell';

export interface ArcItem {
  id: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  type: string;
  rarity: Rarity;
  value: number | null;
  weightKg: number | null;
  stackSize: number | null;
  imageFilename: string;
  recipe: Record<string, number> | null;
  upgradeCost: Record<string, number> | null;
  recyclesInto: Record<string, number> | null;
  salvagesInto: Record<string, number> | null;
  craftBench: string[];
  stationLevelRequired: number | null;
}

export interface ItemsPayload {
  version: string | null;
  generatedAt: string;
  fetchedAt: string;
  itemCount: number;
  items: ArcItem[];
}

export interface UserItemNote {
  disposition: Disposition;
  memo: string;
  updatedAt: string;
}

export interface UserStorageState {
  notes: Record<string, UserItemNote>;
  needsIds: string[];
}
