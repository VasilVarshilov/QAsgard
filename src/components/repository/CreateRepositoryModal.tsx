import React, { useState } from 'react';
import { Folder, X, Plus } from 'lucide-react';
import { Project } from '../../types';

interface CreateRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onCreate: (projectId: string, name: string, description?: string) => void;
}

export const CreateRepositoryModal: React.FC<CreateRepositoryModalProps> = ({
  isOpen,
  onClose,
  project,
  onCreate,
}) => {
  const [repoName, setRepoName] = useState('');
  const [repoDesc, setRepoDesc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim()) return;
    onCreate(project.id, repoName.trim(), repoDesc.trim() || undefined);
    setRepoName('');
    setRepoDesc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
      <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
        <div className="flex items-center justify-between border-b border-[#262838] pb-3">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Add New Repository to {project.key}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-400 leading-relaxed">
          Създайте самостоятелно тестово репозитори в проект{' '}
          <span className="text-white font-semibold">{project.name}</span> (напр. за API, Web
          Frontend, Mobile, или микросървиси).
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Repository Name / Име на Репозитори *
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g. API Integration, Mobile iOS/Android, Billing Services"
              className="w-full bg-[#141522] border border-[#2e3146] focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Description / Описание (незадължително)
            </label>
            <textarea
              value={repoDesc}
              onChange={(e) => setRepoDesc(e.target.value)}
              placeholder="Опишете обхвата на тестовете в това репозитори..."
              rows={2}
              className="w-full bg-[#141522] border border-[#2e3146] focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#262838]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!repoName.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Създай Репозитори</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
