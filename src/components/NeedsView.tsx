import { useMemo } from 'react';
import { Hammer, ArrowUpCircle, Star, PackageCheck, Trash2 } from 'lucide-react';
import type { ArcItem, Disposition, UserItemNote } from '../types/item';
import { DISPOSITION_INFO, RARITY_INFO, getBenchLabel, getTypeLabel } from '../constants/mappings';

interface NeedsViewProps {
  needsIds: string[];
  itemMap: Map<string, ArcItem>;
  notes: Record<string, UserItemNote>;
  onToggleNeed: (itemId: string) => void;
  onSelectItem: (item: ArcItem) => void;
  onSetDisposition: (itemId: string, disposition: Disposition) => void;
}

export function NeedsView({
  needsIds,
  itemMap,
  notes,
  onToggleNeed,
  onSelectItem,
  onSetDisposition,
}: NeedsViewProps) {
  const needItems = useMemo(() => {
    return needsIds
      .map((id) => itemMap.get(id))
      .filter((item): item is ArcItem => Boolean(item));
  }, [needsIds, itemMap]);

  const totalMaterials = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of needItems) {
      if (item.recipe) {
        for (const [matId, count] of Object.entries(item.recipe)) {
          totals.set(matId, (totals.get(matId) ?? 0) + count);
        }
      }
      if (item.upgradeCost) {
        for (const [matId, count] of Object.entries(item.upgradeCost)) {
          totals.set(matId, (totals.get(matId) ?? 0) + count);
        }
      }
    }
    return Array.from(totals.entries())
      .map(([matId, count]) => ({
        id: matId,
        count,
        item: itemMap.get(matId) ?? null,
      }))
      .sort((a, b) => b.count - a.count);
  }, [needItems, itemMap]);

  if (needItems.length === 0) {
    return (
      <div className="empty-state needs-empty">
        <Star size={40} className="empty-icon" />
        <h3>よく使うアイテムがまだ保存されていません</h3>
        <p>
          「アイテム一覧」タブの★ボタンからよく使う装備やアイテムを保存すると、
          ここに作成・アップグレードに必要な素材がまとめて表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className="needs-view">
      <section className="needs-summary-card">
        <div className="section-header">
          <div className="section-title">
            <PackageCheck size={20} />
            <h2>必要素材サマリー（合計）</h2>
          </div>
          <span className="section-sub">
            保存した {needItems.length} 件の作成・アップグレードに必要な全素材
          </span>
        </div>

        {totalMaterials.length === 0 ? (
          <p className="muted-text">
            保存されたアイテムには作成・アップグレード素材の情報が登録されていません。
          </p>
        ) : (
          <div className="summary-material-grid">
            {totalMaterials.map(({ id, count, item }) => {
              const disp: Disposition = notes[id]?.disposition ?? 'unset';
              const dispInfo = DISPOSITION_INFO[disp];
              return (
                <div key={id} className="summary-material-chip">
                  <div
                    className="summary-material-main"
                    onClick={() => item && onSelectItem(item)}
                    role="button"
                    tabIndex={0}
                  >
                    {item?.imageFilename && (
                      <img src={item.imageFilename} alt={item.nameJa} className="mini-thumb" />
                    )}
                    <div className="summary-material-info">
                      <span className="summary-material-name">{item?.nameJa ?? id}</span>
                      <span className={`mini-disp ${dispInfo.colorClass}`}>{dispInfo.label}</span>
                    </div>
                    <span className="material-count">×{count}</span>
                  </div>
                  {disp !== 'keep' && (
                    <button
                      type="button"
                      className="quick-keep-btn"
                      onClick={() => onSetDisposition(id, 'keep')}
                      title="この素材を「残す」に設定"
                    >
                      残すにする
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="needs-list-section">
        <div className="section-header">
          <div className="section-title">
            <Star size={20} />
            <h2>よく使うアイテム一覧（{needItems.length}件）</h2>
          </div>
        </div>

        <div className="needs-cards-grid">
          {needItems.map((item) => {
            const rarityInfo = RARITY_INFO[item.rarity] ?? {
              label: item.rarity,
              colorClass: 'rarity-common',
              order: 0,
            };
            const recipeEntries = item.recipe ? Object.entries(item.recipe) : [];
            const upgradeEntries = item.upgradeCost ? Object.entries(item.upgradeCost) : [];

            return (
              <div key={item.id} className="need-item-card">
                <div className="need-card-header">
                  <div className="need-card-title" onClick={() => onSelectItem(item)}>
                    {item.imageFilename && (
                      <img
                        src={item.imageFilename}
                        alt={item.nameJa}
                        className={`item-thumb ${rarityInfo.colorClass}`}
                      />
                    )}
                    <div>
                      <h3>{item.nameJa}</h3>
                      <div className="need-card-meta">
                        <span>{getTypeLabel(item.type)}</span>
                        <span className={`rarity-pill ${rarityInfo.colorClass}`}>
                          {rarityInfo.label}
                        </span>
                        {item.craftBench.length > 0 && (
                          <span className="bench-tag">
                            {item.craftBench.map(getBenchLabel).join(' / ')}
                            {item.stationLevelRequired ? ` Lv.${item.stationLevelRequired}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => onToggleNeed(item.id)}
                    title="ニーズ一覧から削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="need-card-body">
                  <div className="material-block">
                    <div className="material-block-title">
                      <Hammer size={14} />
                      <span>作成（クラフト）必要素材</span>
                    </div>
                    {recipeEntries.length === 0 ? (
                      <p className="muted-text small">クラフトレシピなし</p>
                    ) : (
                      <ul className="material-list">
                        {recipeEntries.map(([matId, count]) => {
                          const mat = itemMap.get(matId);
                          const matDisp = notes[matId]?.disposition ?? 'unset';
                          return (
                            <li
                              key={matId}
                              onClick={() => mat && onSelectItem(mat)}
                              className="material-row"
                            >
                              <div className="material-row-left">
                                {mat?.imageFilename && (
                                  <img
                                    src={mat.imageFilename}
                                    alt={mat.nameJa}
                                    className="mini-thumb"
                                  />
                                )}
                                <span>{mat?.nameJa ?? matId}</span>
                                <span
                                  className={`mini-disp ${DISPOSITION_INFO[matDisp].colorClass}`}
                                >
                                  {DISPOSITION_INFO[matDisp].shortLabel}
                                </span>
                              </div>
                              <span className="material-count">×{count}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {upgradeEntries.length > 0 && (
                    <div className="material-block">
                      <div className="material-block-title upgrade">
                        <ArrowUpCircle size={14} />
                        <span>アップグレード必要素材</span>
                      </div>
                      <ul className="material-list">
                        {upgradeEntries.map(([matId, count]) => {
                          const mat = itemMap.get(matId);
                          const matDisp = notes[matId]?.disposition ?? 'unset';
                          return (
                            <li
                              key={matId}
                              onClick={() => mat && onSelectItem(mat)}
                              className="material-row"
                            >
                              <div className="material-row-left">
                                {mat?.imageFilename && (
                                  <img
                                    src={mat.imageFilename}
                                    alt={mat.nameJa}
                                    className="mini-thumb"
                                  />
                                )}
                                <span>{mat?.nameJa ?? matId}</span>
                                <span
                                  className={`mini-disp ${DISPOSITION_INFO[matDisp].colorClass}`}
                                >
                                  {DISPOSITION_INFO[matDisp].shortLabel}
                                </span>
                              </div>
                              <span className="material-count">×{count}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
