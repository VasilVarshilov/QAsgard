import React, { useState, useEffect } from 'react';
import { X, Copy, Layers, FileSpreadsheet, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Project, TestCase, TestSuite } from '../types';

interface CopyProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProject: Project | null;
  testCases: TestCase[];
  testSuites: TestSuite[];
  existingProjects: Project[];
  onCopyProject: (copyData: {
    sourceProjectId: string;
    newName: string;
    newKey: string;
    newDescription: string;
    includeSuites: boolean;
    includeCases: boolean;
  }) => void;
}

export const CopyProjectModal: React.FC<CopyProjectModalProps> = ({
  isOpen,
  onClose,
  sourceProject,
  testCases,
  testSuites,
  existingProjects,
  onCopyProject,
}) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [includeSuites, setIncludeSuites] = useState(true);
  const [includeCases, setIncludeCases] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate intelligent initial key and name when opening
  useEffect(() => {
    if (isOpen && sourceProject && sourceProject.id !== 'all') {
      setName(`${sourceProject.name} (Copy)`);
      setDescription(sourceProject.description || '');
      setIncludeSuites(true);
      setIncludeCases(true);
      setError(null);

      // Generate unique key
      const baseKey = sourceProject.key.toUpperCase();
      let candidateKey = `${baseKey}2`;
      let counter = 2;
      while (existingProjects.some((p) => p.key.toUpperCase() === candidateKey) && counter < 10) {
        counter++;
        candidateKey = `${baseKey}${counter}`;
      }
      if (candidateKey.length > 8) {
        candidateKey = `C${baseKey.slice(0, 6)}`;
      }
      setKey(candidateKey);
    }
  }, [isOpen, sourceProject, existingProjects]);

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

  if (!isOpen || !sourceProject || sourceProject.id === 'all') return null;

  const projectCases = testCases.filter((tc) => tc.projectId === sourceProject.id);
  const projectSuites = testSuites.filter((s) => s.projectId === sourceProject.id);

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

    const keyCollision = existingProjects.some((p) => p.key.toUpperCase() === formattedKey);
    if (keyCollision) {
      setError(`A project with key "${formattedKey}" already exists. Please choose a unique key.`);
      return;
    }

    onCopyProject({
      sourceProjectId: sourceProject.id,
      newName: trimmedName,
      newKey: formattedKey,
      newDescription: description.trim(),
      includeSuites,
      includeCases,
    });
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
        className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-xs text-slate-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#262838] flex items-center justify-between bg-gradient-to-r from-indigo-950/60 to-[#181926]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Copy / Clone Entire Project (Копирай проект)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Source: [{sourceProject.key}] {sourceProject.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Source Summary Card */}
          <div className="p-3 bg-[#13141f] border border-[#262838] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Source Project Content
              </span>
              <span className="text-xs font-bold text-white">
                {sourceProject.name} [{sourceProject.key}]
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-purple-300">
                <Layers className="w-3.5 h-3.5" />
                {projectSuites.length} suites
              </span>
              <span className="flex items-center gap-1 text-indigo-300">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {projectCases.length} cases
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">New Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Core Platform 2.0 Release Candidate"
              className="w-full bg-[#13141f] border border-[#2d3044] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">New Project Key *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  if (error) setError(null);
                }}
                maxLength={10}
                placeholder="e.g. ZUG2"
                className="w-36 bg-[#13141f] border border-[#2d3044] rounded-xl px-3 py-2 font-mono text-white text-xs uppercase focus:outline-none focus:border-indigo-500 transition-colors font-bold tracking-wider"
              />
              <span className="text-[11px] text-slate-400">
                All cloned test cases will be re-keyed (e.g. {key || 'PROJ'}-101)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cloned project description..."
              rows={2}
              className="w-full bg-[#13141f] border border-[#2d3044] rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Deep Clone Options */}
          <div className="p-3 bg-[#13141f] border border-[#262838] rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block mb-1">
              Clone Options / Опции за клониране:
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={includeSuites}
                onChange={(e) => {
                  setIncludeSuites(e.target.checked);
                  if (!e.target.checked) setIncludeCases(false);
                }}
                className="rounded border-[#3a3d54] bg-[#1e1f2e] text-indigo-600 cursor-pointer"
              />
              <span>
                Copy all {projectSuites.length} Test Suites (preserves entire folder hierarchy &amp;
                child suites)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={includeCases}
                disabled={!includeSuites}
                onChange={(e) => setIncludeCases(e.target.checked)}
                className="rounded border-[#3a3d54] bg-[#1e1f2e] text-indigo-600 cursor-pointer disabled:opacity-40"
              />
              <span className={!includeSuites ? 'opacity-40' : ''}>
                Copy all {projectCases.length} Test Cases (generates new IDs and re-links to cloned
                suites)
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#262838] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-[#202234] hover:bg-[#282a3f] text-slate-300 rounded-xl font-semibold cursor-pointer transition-colors"
            >
              Cancel / Отказ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone Project / Копирай проекта</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
