import React, { useState, useEffect } from 'react';
import { Search, X, Layers, PlayCircle, Bug, FileText, Folder, ArrowRight } from 'lucide-react';
import { TestCase, TestRun, Defect, TestSuite } from '../types';
import { PRD_SECTIONS } from '../data/prdDocument';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCases: TestCase[];
  testSuites: TestSuite[];
  testRuns: TestRun[];
  defects: Defect[];
  onSelectTestCase: (tc: TestCase) => void;
  onSelectRun: (runId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  testCases,
  testSuites,
  testRuns,
  defects,
  onSelectTestCase,
  onSelectRun,
  onNavigateToTab,
}) => {
  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingCases = q
    ? testCases
        .filter(
          (tc) =>
            tc.key.toLowerCase().includes(q) ||
            tc.title.toLowerCase().includes(q) ||
            tc.tags.some((t) => t.toLowerCase().includes(q))
        )
        .slice(0, 5)
    : [];

  const matchingRuns = q
    ? testRuns
        .filter((r) => r.key.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
        .slice(0, 3)
    : [];

  const matchingDefects = q
    ? defects
        .filter((d) => d.key.toLowerCase().includes(q) || d.title.toLowerCase().includes(q))
        .slice(0, 3)
    : [];

  const matchingPrd = q
    ? PRD_SECTIONS.filter(
        (s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search test cases, runs, bugs, or PRD requirements..."
            className="w-full text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {!query ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Universal Platform Search
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Search tests (e.g. "3DS", "PAY-101"), runs, defects, or PRD specifications.
              </p>
            </div>
          ) : (
            <>
              {/* Test Cases */}
              {matchingCases.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                    Test Cases
                  </div>
                  {matchingCases.map((tc) => (
                    <button
                      key={tc.id}
                      onClick={() => {
                        onNavigateToTab('repository');
                        onSelectTestCase(tc);
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                          {tc.key}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {tc.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Test Runs */}
              {matchingRuns.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                    Test Runs
                  </div>
                  {matchingRuns.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSelectRun(r.id);
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <PlayCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                          {r.key}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {r.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Defects */}
              {matchingDefects.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                    Defects &amp; Bugs
                  </div>
                  {matchingDefects.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        onNavigateToTab('defects');
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Bug className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                        <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                          {d.key}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {d.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* PRD Sections */}
              {matchingPrd.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                    PRD Specification Document
                  </div>
                  {matchingPrd.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onNavigateToTab('prd-viewer');
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {s.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {matchingCases.length === 0 &&
                matchingRuns.length === 0 &&
                matchingDefects.length === 0 &&
                matchingPrd.length === 0 && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No matching records found for "{query}"
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
