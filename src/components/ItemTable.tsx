import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Pencil,
  Recycle,
  ShieldCheck,
  Coins,
  Star,
  AlertTriangle,
} from 'lucide-react';
import type { ArcItem, Disposition, UserItemNote } from '../types/item';
import type { MaterialUsageInfo } from '../utils/materials';
import { RARITY_INFO, getTypeLabel } from '../constants/mappings';

export type SortKey = 'name' | 'type' | 'rarity' | 'value' | 'disposition';
export type SortDir = 'asc' | 'desc';

interface ItemTableProps {
  items: ArcItem[];
  notes: Record<string, UserItemNote>;
  needsSet: Set<string>;
  materialUsedByMap: Map<string, MaterialUsageInfo>;
  itemMap: Map<string, ArcItem>;
  onSetDisposition: (itemId: string, disposition: Disposition) => void;
  onSetMemo: (itemId: string, memo: string) => void;
  onToggleNeed: (itemId: string) => void;
  onSelectItem: (item: ArcItem) => void;
}

const PAGE_SIZE = 50;

export function ItemTable({
  items,
  notes,
  needsSet,
  materialUsedByMap,
  itemMap,
  onSetDisposition,
  onSetMemo,
  onToggleNeed,
  onSelectItem,
}: ItemTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'value' || key === 'rarity' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const sortedItems = useMemo(() => {
    const copy = [...items];
    const dir = sortDir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.nameJa.localeCompare(b.nameJa, 'ja') * dir;
        case 'type':
          return getTypeLabel(a.type).localeCompare(getTypeLabel(b.type), 'ja') * dir;
        case 'rarity': {
          const ra = RARITY_INFO[a.rarity]?.order ?? 0;
          const rb = RARITY_INFO[b.rarity]?.order ?? 0;
          return (ra - rb) * dir || a.nameJa.localeCompare(b.nameJa, 'ja');
        }
        case 'value': {
          const va = a.value ?? -1;
          const vb = b.value ?? -1;
          return (va - vb) * dir || a.nameJa.localeCompare(b.nameJa, 'ja');
        }
        case 'disposition': {
          const order: Record<Disposition, number> = { keep: 1, recycle: 2, sell: 3, unset: 4 };
          const da = order[notes[a.id]?.disposition ?? 'unset'];
          const db = order[notes[b.id]?.disposition ?? 'unset'];
          return (da - db) * dir || a.nameJa.localeCompare(b.nameJa, 'ja');
        }
        default:
          return 0;
      }
    });
    return copy;
  }, [items, sortKey, sortDir, notes]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedItems.slice(start, start + PAGE_SIZE);
  }, [sortedItems, safePage]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown size={14} className="sort-icon muted" />;
    return sortDir === 'asc' ? (
      <ArrowUp size={14} className="sort-icon active" />
    ) : (
      <ArrowDown size={14} className="sort-icon active" />
    );
  };

  const startMemoEdit = (itemId: string, currentMemo: string) => {
    setEditingMemoId(itemId);
    setMemoDraft(currentMemo);
  };

  const commitMemoEdit = (itemId: string) => {
    onSetMemo(itemId, memoDraft.trim());
    setEditingMemoId(null);
  };

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>条件に一致するアイテムが見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper-outer">
      <div className="table-meta-bar">
        <span>
          該当件数: <strong>{items.length}</strong> 件
          {totalPages > 1 && `（${safePage} / ${totalPages} ページ）`}
        </span>
        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="btn-icon"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="前のページ"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="page-num">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn-icon"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="次のページ"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="table-scroll">
        <table className="item-table">
          <thead>
            <tr>
              <th className="col-need">保存</th>
              <th className="col-name sortable" onClick={() => handleSort('name')}>
                <span className="th-inner">アイテム名 {renderSortIcon('name')}</span>
              </th>
              <th className="col-type sortable" onClick={() => handleSort('type')}>
                <span className="th-inner">カテゴリー / レア {renderSortIcon('type')}</span>
              </th>
              <th className="col-value sortable" onClick={() => handleSort('value')}>
                <span className="th-inner">売値 / 重さ {renderSortIcon('value')}</span>
              </th>
              <th className="col-disp sortable" onClick={() => handleSort('disposition')}>
                <span className="th-inner">仕分け（残す / リサイクル / 売却） {renderSortIcon('disposition')}</span>
              </th>
              <th className="col-memo">メモ</th>
              <th className="col-detail">詳細</th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((item) => {
              const note = notes[item.id];
              const disp: Disposition = note?.disposition ?? 'unset';
              const memo = note?.memo ?? '';
              const isNeed = needsSet.has(item.id);
              const usage = materialUsedByMap.get(item.id);
              const directCount = usage?.direct.length ?? 0;
              const subCount = usage?.sub.length ?? 0;
              const totalUsageCount = new Set([...(usage?.direct ?? []), ...(usage?.sub ?? [])]).size;
              const rarityInfo = RARITY_INFO[item.rarity] ?? {
                label: item.rarity,
                colorClass: 'rarity-common',
                order: 0,
              };
              const isWarning = totalUsageCount > 0 && (disp === 'sell' || disp === 'recycle');
              const usageTooltipParts: string[] = [];
              if (directCount > 0 && usage) {
                usageTooltipParts.push(
                  `直接必要: ${usage.direct.map((id) => itemMap.get(id)?.nameJa ?? id).join('、')}`
                );
              }
              if (subCount > 0 && usage) {
                usageTooltipParts.push(
                  `精製用素材: ${usage.sub.map((id) => itemMap.get(id)?.nameJa ?? id).join('、')}`
                );
              }

              return (
                <tr key={item.id} className={`row-${disp}`}>
                  <td className="col-need">
                    <button
                      type="button"
                      className={`star-btn ${isNeed ? 'active' : ''}`}
                      onClick={() => onToggleNeed(item.id)}
                      title={isNeed ? 'よく使うアイテムから解除' : 'よく使うアイテムに保存'}
                    >
                      <Star size={18} fill={isNeed ? 'currentColor' : 'none'} />
                    </button>
                  </td>

                  <td className="col-name">
                    <div className="item-name-cell" onClick={() => onSelectItem(item)}>
                      {item.imageFilename ? (
                        <img
                          src={item.imageFilename}
                          alt={item.nameJa}
                          className={`item-thumb ${rarityInfo.colorClass}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className={`item-thumb placeholder ${rarityInfo.colorClass}`} />
                      )}
                      <div className="item-name-texts">
                        <div className="item-name-row">
                          <span className="item-name-ja">{item.nameJa}</span>
                          {totalUsageCount > 0 && (
                            <span
                              className={`badge-material ${directCount === 0 ? 'sub' : ''} ${
                                isWarning ? 'warning' : ''
                              }`}
                              title={usageTooltipParts.join('\n')}
                            >
                              {isWarning && <AlertTriangle size={12} />}
                              {directCount > 0 ? `必要素材 (${totalUsageCount})` : `精製用素材 (${totalUsageCount})`}
                            </span>
                          )}
                        </div>
                        <span className="item-name-en">{item.nameEn}</span>
                      </div>
                    </div>
                  </td>

                  <td className="col-type">
                    <div className="type-cell">
                      <span className="type-badge">{getTypeLabel(item.type)}</span>
                      <span className={`rarity-pill ${rarityInfo.colorClass}`}>
                        {rarityInfo.label}
                      </span>
                    </div>
                  </td>

                  <td className="col-value">
                    <div className="value-cell">
                      <span className="value-price">
                        {item.value !== null ? `${item.value.toLocaleString()} CR` : '-'}
                      </span>
                      <span className="value-sub">
                        {item.weightKg !== null ? `${item.weightKg} kg` : '-'}
                        {item.stackSize !== null ? ` / 最大${item.stackSize}` : ''}
                      </span>
                    </div>
                  </td>

                  <td className="col-disp">
                    <div className="disp-group">
                      <button
                        type="button"
                        className={`disp-btn keep ${disp === 'keep' ? 'active' : ''}`}
                        onClick={() => onSetDisposition(item.id, 'keep')}
                        title="残す"
                      >
                        <ShieldCheck size={14} />
                        <span>残す</span>
                      </button>
                      <button
                        type="button"
                        className={`disp-btn recycle ${disp === 'recycle' ? 'active' : ''}`}
                        onClick={() => onSetDisposition(item.id, 'recycle')}
                        title="リサイクル"
                      >
                        <Recycle size={14} />
                        <span>リサイクル</span>
                      </button>
                      <button
                        type="button"
                        className={`disp-btn sell ${disp === 'sell' ? 'active' : ''}`}
                        onClick={() => onSetDisposition(item.id, 'sell')}
                        title="売却"
                      >
                        <Coins size={14} />
                        <span>売却</span>
                      </button>
                    </div>
                  </td>

                  <td className="col-memo">
                    {editingMemoId === item.id ? (
                      <div className="memo-edit-inline">
                        <input
                          type="text"
                          value={memoDraft}
                          onChange={(e) => setMemoDraft(e.target.value)}
                          onBlur={() => commitMemoEdit(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitMemoEdit(item.id);
                            if (e.key === 'Escape') setEditingMemoId(null);
                          }}
                          placeholder="メモを入力..."
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`memo-trigger ${memo ? 'has-memo' : ''}`}
                        onClick={() => startMemoEdit(item.id, memo)}
                        title={memo || 'クリックしてメモを追加'}
                      >
                        <Pencil size={13} className="memo-icon" />
                        <span className="memo-text">{memo || 'メモを追加...'}</span>
                      </button>
                    )}
                  </td>

                  <td className="col-detail">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => onSelectItem(item)}
                      title="詳細・レシピ・リサイクル結果を見る"
                    >
                      <Info size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-meta-bar bottom">
          <span />
          <div className="pagination">
            <button
              type="button"
              className="btn-icon"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="page-num">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn-icon"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
