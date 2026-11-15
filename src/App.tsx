import { useMemo, useState } from 'react';
import {
  Search,
  Database,
  Star,
  List,
  X,
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useItemsData } from './hooks/useItemsData';
import { useUserStorage } from './hooks/useUserStorage';
import { CATEGORY_GROUPS, RARITY_INFO, getTypeLabel } from './constants/mappings';
import type { ArcItem, Disposition } from './types/item';
import { ItemTable } from './components/ItemTable';
import { NeedsView } from './components/NeedsView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { SettingsModal } from './components/SettingsModal';

type ActiveTab = 'items' | 'needs';

export function App() {
  const { items, itemMap, availableTypes, meta, loading, error } = useItemsData();
  const {
    notes,
    needsIds,
    getNote,
    setDisposition,
    setMemo,
    toggleNeed,
    exportJson,
    importJson,
    resetAll,
  } = useUserStorage();

  const [activeTab, setActiveTab] = useState<ActiveTab>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryGroupId, setCategoryGroupId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [dispFilter, setDispFilter] = useState<'all' | Disposition>('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [onlyMaterials, setOnlyMaterials] = useState(false);
  const [onlyMemo, setOnlyMemo] = useState(false);

  const [detailItem, setDetailItem] = useState<ArcItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const needsSet = useMemo(() => new Set(needsIds), [needsIds]);

  // ニーズアイテムが必要とする素材の逆引きマップ (素材ID -> 必要としているニーズアイテムID配列)
  const materialUsedByMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const needId of needsIds) {
      const needItem = itemMap.get(needId);
      if (!needItem) continue;
      const matIds = new Set<string>([
        ...Object.keys(needItem.recipe ?? {}),
        ...Object.keys(needItem.upgradeCost ?? {}),
      ]);
      for (const matId of matIds) {
        const list = map.get(matId) ?? [];
        list.push(needId);
        map.set(matId, list);
      }
    }
    return map;
  }, [needsIds, itemMap]);

  const activeGroup = useMemo(
    () => CATEGORY_GROUPS.find((g) => g.id === categoryGroupId) ?? CATEGORY_GROUPS[0],
    [categoryGroupId]
  );

  const groupFilteredTypes = useMemo(() => {
    if (!activeGroup.types) return availableTypes;
    return availableTypes.filter((t) => activeGroup.types?.includes(t));
  }, [activeGroup, availableTypes]);

  const handleGroupChange = (groupId: string) => {
    setCategoryGroupId(groupId);
    setSelectedType('all');
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (activeGroup.types && !activeGroup.types.includes(item.type)) {
        return false;
      }
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      if (rarityFilter !== 'all' && item.rarity !== rarityFilter) {
        return false;
      }
      const note = notes[item.id];
      const disp: Disposition = note?.disposition ?? 'unset';
      if (dispFilter !== 'all' && disp !== dispFilter) {
        return false;
      }
      if (onlyMaterials && !materialUsedByMap.has(item.id)) {
        return false;
      }
      if (onlyMemo && !(note?.memo && note.memo.trim().length > 0)) {
        return false;
      }
      if (q) {
        const hay = `${item.nameJa} ${item.nameEn} ${note?.memo ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    items,
    activeGroup,
    selectedType,
    rarityFilter,
    dispFilter,
    onlyMaterials,
    onlyMemo,
    searchQuery,
    notes,
    materialUsedByMap,
  ]);

  const stats = useMemo(() => {
    let keep = 0;
    let recycle = 0;
    let sell = 0;
    for (const n of Object.values(notes)) {
      if (n.disposition === 'keep') keep++;
      else if (n.disposition === 'recycle') recycle++;
      else if (n.disposition === 'sell') sell++;
    }
    return { keep, recycle, sell };
  }, [notes]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">ARC</div>
            <div>
              <h1>ARC Raiders アイテム仕分けメモ</h1>
              <p className="brand-sub">残す・リサイクル・売却 ＆ ニーズ素材管理</p>
            </div>
          </div>

          <nav className="main-tabs" aria-label="メインナビゲーション">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
              onClick={() => setActiveTab('items')}
            >
              <List size={17} />
              <span>アイテム一覧</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'needs' ? 'active' : ''}`}
              onClick={() => setActiveTab('needs')}
            >
              <Star size={17} />
              <span>ニーズアイテム</span>
              {needsIds.length > 0 && <span className="tab-badge">{needsIds.length}</span>}
            </button>
          </nav>

          <div className="header-right">
            <div className="header-stats" title="仕分け設定済みの件数">
              <span className="stat-pill keep">残す {stats.keep}</span>
              <span className="stat-pill recycle">リサイクル {stats.recycle}</span>
              <span className="stat-pill sell">売却 {stats.sell}</span>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSettingsOpen(true)}
            >
              <Database size={16} />
              <span>バックアップ</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {loading && (
          <div className="center-message">
            <Loader2 size={28} className="spin" />
            <p>アイテムデータを読み込み中...</p>
          </div>
        )}

        {error && (
          <div className="center-message error">
            <AlertCircle size={28} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && activeTab === 'items' && (
          <>
            <section className="filter-panel">
              <div className="category-tabs" role="tablist" aria-label="カテゴリーグループ">
                {CATEGORY_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className={`cat-tab ${categoryGroupId === group.id ? 'active' : ''}`}
                    onClick={() => handleGroupChange(group.id)}
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              <div className="filter-controls">
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="アイテム名（日本語/英語）・メモで検索..."
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search"
                      onClick={() => setSearchQuery('')}
                      aria-label="検索をクリア"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="select-group">
                  <Filter size={14} className="filter-icon" />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    aria-label="詳細カテゴリー"
                  >
                    <option value="all">カテゴリー: すべて</option>
                    {groupFilteredTypes.map((t) => (
                      <option key={t} value={t}>
                        {getTypeLabel(t)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={dispFilter}
                    onChange={(e) => setDispFilter(e.target.value as 'all' | Disposition)}
                    aria-label="仕分けステータス"
                  >
                    <option value="all">仕分け: すべて</option>
                    <option value="keep">残す</option>
                    <option value="recycle">リサイクル</option>
                    <option value="sell">売却</option>
                    <option value="unset">未設定</option>
                  </select>

                  <select
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    aria-label="レアリティ"
                  >
                    <option value="all">レア: すべて</option>
                    {Object.entries(RARITY_INFO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="toggle-filters">
                  <label className="check-pill">
                    <input
                      type="checkbox"
                      checked={onlyMaterials}
                      onChange={(e) => setOnlyMaterials(e.target.checked)}
                    />
                    <span>必要素材のみ</span>
                  </label>
                  <label className="check-pill">
                    <input
                      type="checkbox"
                      checked={onlyMemo}
                      onChange={(e) => setOnlyMemo(e.target.checked)}
                    />
                    <span>メモありのみ</span>
                  </label>
                </div>
              </div>
            </section>

            <ItemTable
              items={filteredItems}
              notes={notes}
              needsSet={needsSet}
              materialUsedByMap={materialUsedByMap}
              itemMap={itemMap}
              onSetDisposition={setDisposition}
              onSetMemo={setMemo}
              onToggleNeed={toggleNeed}
              onSelectItem={setDetailItem}
            />
          </>
        )}

        {!loading && !error && activeTab === 'needs' && (
          <NeedsView
            needsIds={needsIds}
            itemMap={itemMap}
            notes={notes}
            onToggleNeed={toggleNeed}
            onSelectItem={setDetailItem}
            onSetDisposition={setDisposition}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          アイテムデータ提供:{' '}
          <a href="https://arctracker.io" target="_blank" rel="noreferrer">
            ARC Tracker
          </a>{' '}
          {meta?.itemCount ? `(${meta.itemCount} items)` : ''}
        </p>
      </footer>

      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          note={getNote(detailItem.id)}
          isNeed={needsSet.has(detailItem.id)}
          itemMap={itemMap}
          usedByNeedIds={materialUsedByMap.get(detailItem.id) ?? []}
          onClose={() => setDetailItem(null)}
          onSetDisposition={setDisposition}
          onSetMemo={setMemo}
          onToggleNeed={toggleNeed}
          onSelectItem={setDetailItem}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          meta={meta}
          notesCount={Object.keys(notes).length}
          needsCount={needsIds.length}
          onExportJson={exportJson}
          onImportJson={importJson}
          onResetAll={resetAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
