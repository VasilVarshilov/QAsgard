import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  itemName?: string;
  itemType: 'suite' | 'case' | 'bulk_cases';
  details?: string;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  itemName,
  itemType,
  details,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-xs text-slate-200"
      >
        {/* Header */}
        <div className="bg-rose-950/40 p-4 border-b border-rose-900/40 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-900/60 flex items-center justify-center shrink-0 border border-rose-800 text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-rose-300/90 font-medium">
                {itemType === 'suite'
                  ? 'Confirm Test Suite Deletion'
                  : itemType === 'bulk_cases'
                    ? 'Confirm Bulk Test Cases Deletion'
                    : 'Confirm Test Case Deletion'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          <p className="text-slate-300 leading-relaxed">{description}</p>

          {itemName && (
            <div className="p-2.5 rounded-xl bg-[#13141f] border border-[#262838] flex items-center gap-2">
              <span className="font-semibold text-rose-400 font-mono text-xs truncate">
                {itemName}
              </span>
            </div>
          )}

          {details && (
            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px]">
              {details}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141522] border-t border-[#262838] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-[#202234] hover:bg-[#282a3f] text-slate-300 rounded-xl font-semibold cursor-pointer transition-colors"
          >
            Cancel / Отказ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete / Изтрий</span>
          </button>
        </div>
      </div>
    </div>
  );
};
