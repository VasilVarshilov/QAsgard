import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Project } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    key: string;
    description: string;
    initialSuiteName?: string;
  }) => void;
  existingProjects: Project[];
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  existingProjects,
}) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [initialSuiteName, setInitialSuiteName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-generate project key from project name initials or slug
  useEffect(() => {
    if (!isKeyManuallyEdited && name.trim()) {
      const words = name.trim().split(/[\s-_]+/);
      let autoKey = '';
      if (words.length === 1) {
        autoKey = words[0].slice(0, 4).toUpperCase();
      } else {
        autoKey = words
          .slice(0, 5)
          .map((w) => w[0] || '')
          .join('')
          .toUpperCase();
      }
      setKey(autoKey.replace(/[^A-Z0-9]/g, ''));
    }
  }, [name, isKeyManuallyEdited]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setKey('');
      setIsKeyManuallyEdited(false);
      setDescription('');
      setInitialSuiteName('');
      setError(null);
    }
  }, [isOpen]);

  // Keyboard shortcut listener: Esc to close, Enter in input to submit
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const formattedKey = key.trim().toUpperCase();

    if (!trimmedName) {
      setError('Project name is required.');
      return;
    }

    if (!formattedKey) {
      setError('Project key is required.');
      return;
    }

    if (!/^[A-Z0-9]{2,10}$/.test(formattedKey)) {
      setError('Project key must be 2 to 10 uppercase letters or numbers (e.g. ERP, PAY, MOBILE).');
      return;
    }

    const keyExists = existingProjects.some((p) => p.key.toUpperCase() === formattedKey);
    if (keyExists) {
      setError(`A project with key "${formattedKey}" already exists. Please choose a unique key.`);
      return;
    }

    setError(null);
    onCreateProject({
      name: trimmedName,
      key: formattedKey,
      description: description.trim(),
      initialSuiteName: initialSuiteName.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181926] border border-[#2e3146] text-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-xs relative animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-create-proj-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262838]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-create-proj-title" className="text-sm font-bold text-white">
                Create New Project
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure a dedicated test repository with isolated suites and runs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#25283c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Global Payments & Gateway"
              className="w-full bg-[#13141f] border border-[#2d3044] rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Project Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">
                Project Key <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Used as prefix for test case IDs (e.g. PAY-101)
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  setIsKeyManuallyEdited(true);
                  setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  if (error) setError(null);
                }}
                maxLength={10}
                placeholder="e.g. PAY"
                className="w-full bg-[#13141f] border border-[#2d3044] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-wider placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
              {key && /^[A-Z0-9]{2,10}$/.test(key) && (
                <div className="absolute right-3 top-2.5 text-emerald-400 flex items-center gap-1 text-[10px] font-mono">
                  <Check className="w-3.5 h-3.5" />
                  <span>Valid</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Description <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Short description of this system, product scope, and quality targets..."
              className="w-full bg-[#13141f] border border-[#2d3044] rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Initial Test Suite */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Default Test Suite{' '}
              <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={initialSuiteName}
              onChange={(e) => setInitialSuiteName(e.target.value)}
              placeholder={`e.g. ${name ? `${name} Core Suite` : 'Smoke & Regression Suite'}`}
              className="w-full bg-[#13141f] border border-[#2d3044] rounded-xl px-3.5 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              A root test folder will automatically be created in the suite tree.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#262838]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-[#202234] hover:bg-[#282a3e] text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !key.trim()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
