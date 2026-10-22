import React, { useState, useEffect } from 'react';
import { X, Edit2, Folder, Check } from 'lucide-react';
import { TestSuite } from '../types';

interface RenameSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite: TestSuite | null;
  onRenameSuite: (suiteId: string, newName: string) => void;
}

export const RenameSuiteModal: React.FC<RenameSuiteModalProps> = ({
  isOpen,
  onClose,
  suite,
  onRenameSuite,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen && suite) {
      setName(suite.name);
    }
  }, [isOpen, suite]);

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

  if (!isOpen || !suite) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRenameSuite(suite.id, name.trim());
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden text-xs text-slate-200"
      >
        <div className="p-4 border-b border-[#262838] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Edit2 className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm text-white">Rename Suite / Преименувай суит</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Suite Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new suite name..."
              className="w-full bg-[#13141f] border border-[#2d3044] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262838]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3f] text-slate-300 rounded-lg font-semibold cursor-pointer transition-colors"
            >
              Cancel / Отказ
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === suite.name}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Rename / Запази</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
