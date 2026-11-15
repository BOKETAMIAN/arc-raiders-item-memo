import { useEffect, useState } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Recycle,
  Coins,
  Hammer,
  ArrowUpCircle,
  Wrench,
  Package,
} from 'lucide-react';
import type { ArcItem, Disposition, UserItemNote } from '../types/item';
import { RARITY_INFO, getBenchLabel, getTypeLabel } from '../constants/mappings';

interface ItemDetailModalProps {
  item: ArcItem;
  note: UserItemNote;
  isNeed: boolean;
  itemMap: Map<string, ArcItem>;
  usedByNeedIds: string[];
  onClose: () => void;
  onSetDisposition: (itemId: string, disposition: Disposition) => void;
  onSetMemo: (itemId: string, memo: string) => void;
  onToggleNeed: (itemId: string) => void;
  onSelectItem: (item: ArcItem) => void;
}

export function ItemDetailModal({
  item,
  note,
  isNeed,
  itemMap,
  usedByNeedIds,
  onClose,
  onSetDisposition,
  onSetMemo,
  onToggleNeed,
  onSelectItem,
}: ItemDetailModalProps) {
  const [memoText, setMemoText] = useState(note.memo);

  useEffect(() => {
    setMemoText(note.memo);
  }, [item.id, note.memo]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const rarityInfo = RARITY_INFO[item.rarity] ?? {
    label: item.rarity,
    colorClass: 'rarity-common',
    order: 0,
  };

  const renderMaterialMap = (map: Record<string, number> | null) => {
    if (!map || Object.keys(map).length === 0) return null;
    return (
      <div className="detail-chip-list">
        {Object.entries(map).map(([matId, count]) => {
          const mat = itemMap.get(matId);
          return (
            <button
              key={matId}
              type="button"
              className="detail-chip"
              onClick={() => mat && onSelectItem(mat)}
            >
              {mat?.imageFilename && (
                <img src={mat.imageFilename} alt={mat.nameJa} className="mini-thumb" />
              )}
              <span>{mat?.nameJa ?? matId}</span>
              <span className="material-count">×{count}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-title-group">
            {item.imageFilename && (
              <img
                src={item.imageFilename}
                alt={item.nameJa}
                className={`detail-thumb ${rarityInfo.colorClass}`}
              />
            )}
            <div>
              <h2>{item.nameJa}</h2>
              <div className="detail-sub">
                <span>{item.nameEn}</span>
                <span>•</span>
                <span>{getTypeLabel(item.type)}</span>
                <span className={`rarity-pill ${rarityInfo.colorClass}`}>{rarityInfo.label}</span>
              </div>
            </div>
          </div>

          <div className="modal-header-actions">
            <button
              type="button"
              className={`star-btn large ${isNeed ? 'active' : ''}`}
              onClick={() => onToggleNeed(item.id)}
              title={isNeed ? 'よく使うアイテムから解除' : 'よく使うアイテムに保存'}
            >
              <Star size={18} fill={isNeed ? 'currentColor' : 'none'} />
              <span>{isNeed ? '保存済み' : 'よく使うに保存'}</span>
            </button>
            <button type="button" className="btn-icon" onClick={onClose} aria-label="閉じる">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {item.descriptionJa && <p className="detail-desc">{item.descriptionJa}</p>}

          <div className="detail-stats">
            <div className="stat-box">
              <span className="stat-label">売値</span>
              <span className="stat-value">
                {item.value !== null ? `${item.value.toLocaleString()} CR` : '-'}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">重量</span>
              <span className="stat-value">{item.weightKg !== null ? `${item.weightKg} kg` : '-'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">最大スタック</span>
              <span className="stat-value">{item.stackSize !== null ? item.stackSize : '-'}</span>
            </div>
            {item.craftBench.length > 0 && (
              <div className="stat-box wide">
                <span className="stat-label">作成ステーション</span>
                <span className="stat-value">
                  {item.craftBench.map(getBenchLabel).join(' / ')}
                  {item.stationLevelRequired ? ` (Lv.${item.stationLevelRequired})` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h3>仕分け設定 &amp; メモ</h3>
            <div className="disp-group large">
              <button
                type="button"
                className={`disp-btn keep ${note.disposition === 'keep' ? 'active' : ''}`}
                onClick={() => onSetDisposition(item.id, 'keep')}
              >
                <ShieldCheck size={16} />
                <span>残す</span>
              </button>
              <button
                type="button"
                className={`disp-btn recycle ${note.disposition === 'recycle' ? 'active' : ''}`}
                onClick={() => onSetDisposition(item.id, 'recycle')}
              >
                <Recycle size={16} />
                <span>リサイクル</span>
              </button>
              <button
                type="button"
                className={`disp-btn sell ${note.disposition === 'sell' ? 'active' : ''}`}
                onClick={() => onSetDisposition(item.id, 'sell')}
              >
                <Coins size={16} />
                <span>売却</span>
              </button>
            </div>

            <textarea
              className="detail-memo-input"
              rows={3}
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              onBlur={() => onSetMemo(item.id, memoText.trim())}
              placeholder="用途や目標個数などのメモを入力（フォーカスを外すと自動保存されます）"
            />
          </div>

          {usedByNeedIds.length > 0 && (
            <div className="detail-section highlight-need">
              <h3>
                <Package size={16} /> この素材を必要としている保存済みアイテム（{usedByNeedIds.length}件）
              </h3>
              <div className="detail-chip-list">
                {usedByNeedIds.map((needId) => {
                  const needItem = itemMap.get(needId);
                  if (!needItem) return null;
                  return (
                    <button
                      key={needId}
                      type="button"
                      className="detail-chip"
                      onClick={() => onSelectItem(needItem)}
                    >
                      {needItem.imageFilename && (
                        <img
                          src={needItem.imageFilename}
                          alt={needItem.nameJa}
                          className="mini-thumb"
                        />
                      )}
                      <span>{needItem.nameJa}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {item.recipe && Object.keys(item.recipe).length > 0 && (
            <div className="detail-section">
              <h3>
                <Hammer size={16} /> 作成（クラフト）に必要な素材
              </h3>
              {renderMaterialMap(item.recipe)}
            </div>
          )}

          {item.upgradeCost && Object.keys(item.upgradeCost).length > 0 && (
            <div className="detail-section">
              <h3>
                <ArrowUpCircle size={16} /> アップグレードに必要な素材
              </h3>
              {renderMaterialMap(item.upgradeCost)}
            </div>
          )}

          {item.recyclesInto && Object.keys(item.recyclesInto).length > 0 && (
            <div className="detail-section">
              <h3>
                <Recycle size={16} /> リサイクルで得られる素材
              </h3>
              {renderMaterialMap(item.recyclesInto)}
            </div>
          )}

          {item.salvagesInto && Object.keys(item.salvagesInto).length > 0 && (
            <div className="detail-section">
              <h3>
                <Wrench size={16} /> 現地分解（Salvage）で得られる素材
              </h3>
              {renderMaterialMap(item.salvagesInto)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
