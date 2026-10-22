import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Layers,
  FileSpreadsheet,
  PlayCircle,
  Bug,
  BookmarkCheck,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { Project, TestCase, TestSuite, TestRun, Defect, TestPlan } from '../types';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  testCases: TestCase[];
  testSuites: TestSuite[];
  testRuns: TestRun[];
  defects: Defect[];
  testPlans: TestPlan[];
  onConfirmDelete: (projectId: string) => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  testCases,
  testSuites,
  testRuns,
  defects,
  testPlans,
  onConfirmDelete,
}) => {
  const [confirmKeyInput, setConfirmKeyInput] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmKeyInput('');
      setIsPurging(false);
    }
  }, [isOpen, project?.id]);

  if (!isOpen || !project || project.id === 'all') return null;

  // Calculate items that will be purged
  const pCases = testCases.filter((tc) => tc.projectId === project.id);
  const pSuites = testSuites.filter((s) => s.projectId === project.id);
  const pRuns = testRuns.filter((r) => r.projectId === project.id);
  const pDefects = defects.filter((d) => d.projectId === project.id);
  const pPlans = testPlans.filter((p) => p.projectId === project.id);

  const isConfirmed = confirmKeyInput.trim().toUpperCase() === project.key.toUpperCase();

  const handleDelete = () => {
    if (!isConfirmed || isPurging) return;
    setIsPurging(true);
    setTimeout(() => {
      onConfirmDelete(project.id);
      setIsPurging(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-xs">
        {/* Header Banner */}
        <div className="bg-rose-50 dark:bg-rose-950/40 p-4 border-b border-rose-100 dark:border-rose-900/40 flex items-start justify-between">
          <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                Delete Project &amp; Purge Data
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200/70 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300 font-semibold">
                  Изтриване на проект
                </span>
              </h3>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Permanently deletes project and all related artifacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
              Are you sure you want to delete{' '}
              <strong className="text-rose-600 dark:text-rose-400 font-bold">{project.name}</strong>{' '}
              <span className="font-mono text-slate-500">[{project.key}]</span>?
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              This action is permanent and cannot be undone. All repository suites, test cases,
              executions, bugs, and plans linked to this project will be deleted immediately.
            </p>
          </div>

          {/* Purge Breakdown Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                Data to be purged / Данни за изтриване:
              </span>
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                Total:{' '}
                {pSuites.length + pCases.length + pRuns.length + pDefects.length + pPlans.length}{' '}
                items
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  <strong>{pSuites.length}</strong> Test Suites
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  <strong>{pCases.length}</strong> Test Cases
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <PlayCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>{pRuns.length}</strong> Test Runs
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <Bug className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>
                  <strong>{pDefects.length}</strong> Logged Defects
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 col-span-2">
                <BookmarkCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span>
                  <strong>{pPlans.length}</strong> Milestone Test Plans
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                Type{' '}
                <strong className="font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                  {project.key}
                </strong>{' '}
                to confirm:
              </label>
              <button
                type="button"
                onClick={() => setConfirmKeyInput(project.key)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
              >
                Autofill key
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder={`Enter "${project.key}"`}
              value={confirmKeyInput}
              onChange={(e) => setConfirmKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isConfirmed) {
                  handleDelete();
                }
              }}
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 font-mono text-xs outline-none transition-all ${
                isConfirmed
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
              }`}
            />
            {isConfirmed && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" /> Key matched. Ready to delete.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel / Отказ
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isPurging}
            className={`px-4 py-2 font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
              isConfirmed && !isPurging
                ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-98'
                : 'bg-rose-200 dark:bg-rose-950/60 text-rose-400 dark:text-rose-600 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPurging ? 'Purging All Data...' : 'Delete Project & Purge Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
