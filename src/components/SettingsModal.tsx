import { useRef, useState } from 'react';
import { Download, Upload, Trash2, X, Database } from 'lucide-react';

interface SettingsModalProps {
  meta: {
    generatedAt: string;
    fetchedAt: string;
    itemCount: number;
  } | null;
  notesCount: number;
  needsCount: number;
  onExportJson: () => string;
  onImportJson: (jsonStr: string) => { ok: boolean; message: string };
  onResetAll: () => void;
  onClose: () => void;
}

export function SettingsModal({
  meta,
  notesCount,
  needsCount,
  onExportJson,
  onImportJson,
  onResetAll,
  onClose,
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleDownload = () => {
    const json = onExportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `arc-raiders-memo-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ ok: true, text: '設定ファイルをダウンロードしました。' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = onImportJson(String(reader.result ?? ''));
      setStatusMsg({ ok: result.ok, text: result.message });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onResetAll();
    setConfirmReset(false);
    setStatusMsg({ ok: true, text: 'すべてのメモと保存済みアイテムを初期化しました。' });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>データ管理・バックアップ</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-info-box">
            <div className="settings-info-row">
              <Database size={16} />
              <span>
                収録アイテム数: <strong>{meta?.itemCount ?? 0}</strong> 件
              </span>
            </div>
            {meta?.fetchedAt && (
              <div className="settings-info-sub">
                APIデータ取得日時: {new Date(meta.fetchedAt).toLocaleString('ja-JP')}
              </div>
            )}
            <div className="settings-info-sub">
              現在の保存データ: 仕分け/メモ {notesCount} 件 ・ ニーズ登録 {needsCount} 件（ブラウザに自動保存）
            </div>
          </div>

          <div className="settings-actions">
            <button type="button" className="btn-primary" onClick={handleDownload}>
              <Download size={16} />
              <span>バックアップをエクスポート (JSON)</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              <span>バックアップから復元 (JSON)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {statusMsg && (
            <div className={`status-banner ${statusMsg.ok ? 'success' : 'error'}`}>
              {statusMsg.text}
            </div>
          )}

          <div className="settings-danger-zone">
            <p className="muted-text small">
              ※ メモと保存データはログイン不要でブラウザ（localStorage）に保存されます。別のPC/スマホに移行する際はエクスポート機能をご利用ください。
            </p>
            <button
              type="button"
              className={`btn-danger ${confirmReset ? 'confirming' : ''}`}
              onClick={handleReset}
            >
              <Trash2 size={16} />
              <span>
                {confirmReset
                  ? '本当にすべて削除しますか？（もう一度クリックで確定）'
                  : '保存データをすべて初期化'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
