import fs from 'node:fs/promises';
import path from 'node:path';

const API_URL = 'https://arctracker.io/api/items';
const OUTPUT_PATH = path.resolve(process.cwd(), 'public/data/items.json');

async function main() {
  console.log(`Fetching items from ${API_URL}...`);
  const res = await fetch(API_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'arc-raiders-item-memo-builder/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch API: ${res.status} ${res.statusText}`);
  }

  const raw = await res.json();
  if (!Array.isArray(raw.items)) {
    throw new Error('Unexpected API response: items array missing');
  }

  const normalizedItems = raw.items.map((item) => ({
    id: item.id,
    nameJa: item.name?.ja || item.name?.en || item.id,
    nameEn: item.name?.en || item.id,
    descriptionJa: item.description?.ja || item.description?.en || '',
    type: item.type || 'Misc',
    rarity: item.rarity || 'Common',
    value: typeof item.value === 'number' ? item.value : null,
    weightKg: typeof item.weightKg === 'number' ? item.weightKg : null,
    stackSize: typeof item.stackSize === 'number' ? item.stackSize : null,
    imageFilename: item.imageFilename || '',
    recipe: item.recipe && typeof item.recipe === 'object' ? item.recipe : null,
    upgradeCost: item.upgradeCost && typeof item.upgradeCost === 'object' ? item.upgradeCost : null,
    recyclesInto: item.recyclesInto && typeof item.recyclesInto === 'object' ? item.recyclesInto : null,
    salvagesInto: item.salvagesInto && typeof item.salvagesInto === 'object' ? item.salvagesInto : null,
    craftBench: Array.isArray(item.craftBench) ? item.craftBench : [],
    stationLevelRequired: typeof item.stationLevelRequired === 'number' ? item.stationLevelRequired : null,
  }));

  const payload = {
    version: raw.version || null,
    generatedAt: raw.generatedAt || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    itemCount: normalizedItems.length,
    items: normalizedItems,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload), 'utf-8');
  console.log(`Saved ${normalizedItems.length} items to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
