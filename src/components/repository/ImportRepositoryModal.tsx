import React, { useState } from 'react';
import { Upload, X, Check, Folder } from 'lucide-react';
import { Project, TestSuite, TestCase } from '../../types';

interface ImportRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  activeRepositoryName?: string;
  onImport: (
    importedData: {
      project?: Partial<Project>;
      suites?: Partial<TestSuite>[];
      testCases?: Partial<TestCase>[];
    },
    mode: 'new' | 'new_repo' | 'merge',
    targetRepoName?: string
  ) => void;
}

export const ImportRepositoryModal: React.FC<ImportRepositoryModalProps> = ({
  isOpen,
  onClose,
  project,
  activeRepositoryName = 'Main Repository',
  onImport,
}) => {
  const [importJsonText, setImportJsonText] = useState('');
  const [importParsedData, setImportParsedData] = useState<{
    project?: Partial<Project>;
    suites?: Partial<TestSuite>[];
    testCases?: Partial<TestCase>[];
  } | null>(null);
  const [importTargetRepoName, setImportTargetRepoName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'new' | 'new_repo' | 'merge'>('new_repo');

  if (!isOpen) return null;

  const handleParseImportFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setImportJsonText(text);
        const parsed = JSON.parse(text);

        let projectInfo: Partial<Project> = {};
        let suitesList: Partial<TestSuite>[] = [];
        let casesList: Partial<TestCase>[] = [];

        if (parsed.project) {
          projectInfo = parsed.project;
        } else if (parsed.title) {
          projectInfo = { name: parsed.title, key: 'IMP' };
        }

        if (Array.isArray(parsed.suites)) {
          suitesList = parsed.suites;
        }

        if (Array.isArray(parsed.testCases)) {
          casesList = parsed.testCases;
        } else if (Array.isArray(parsed.cases)) {
          casesList = parsed.cases;
        } else if (Array.isArray(parsed)) {
          casesList = parsed;
        }

        if (suitesList.length === 0 && casesList.length === 0) {
          setImportError('No test suites or test cases found in this JSON file.');
          setImportParsedData(null);
          return;
        }

        setImportParsedData({
          project: projectInfo,
          suites: suitesList,
          testCases: casesList,
        });
        setImportMode('new_repo');
        setImportTargetRepoName(projectInfo.name || parsed.title || 'Imported Repository');
      } catch (err: any) {
        setImportError(`Invalid JSON format: ${err.message}`);
        setImportParsedData(null);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (!importParsedData) return;
    onImport(importParsedData, importMode, importTargetRepoName);
    handleClose();
  };

  const handleClose = () => {
    setImportParsedData(null);
    setImportError(null);
    setImportJsonText('');
    setImportTargetRepoName('');
    setImportMode('new_repo');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl text-xs overflow-hidden my-auto">
        {/* Header (sticky shrink-0) */}
        <div className="px-5 py-3.5 border-b border-[#262838] flex items-center justify-between shrink-0 bg-[#161724]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">
              Import Repository / Импорт на Репозитори
            </h3>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <p className="text-slate-400 leading-relaxed">
            Качете JSON бекъп на репозитори. Всички тестови пакети, йерархия и тестови случаи ще
            бъдат възстановени.
          </p>

          {/* File drop zone */}
          <div className="border-2 border-dashed border-[#2e3146] hover:border-emerald-500/60 rounded-xl py-3.5 px-4 text-center bg-[#141522] transition-colors">
            <input
              type="file"
              id="shared-repo-import-input"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleParseImportFile(file);
              }}
            />
            <label
              htmlFor="shared-repo-import-input"
              className="cursor-pointer flex flex-col items-center gap-1.5"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-slate-200 font-semibold">
                Кликнете за избор на JSON файл или плъзнете тук
              </div>
              <div className="text-[11px] text-slate-500">
                Поддържа експортирани бекъпи от QAsgard, Qase, TestRail JSON
              </div>
            </label>
          </div>

          {/* Error Display */}
          {importError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{importError}</span>
            </div>
          )}

          {/* Parsed Data Preview */}
          {importParsedData && (
            <div className="space-y-3 p-3.5 bg-[#141522] border border-[#2e3146] rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Преглед на данните от файла:</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  Валиден бекъп
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-[#1b1c2b] rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Изходно име:</span>
                  <span className="font-semibold text-white truncate block">
                    {importParsedData.project?.name || 'Unnamed'}
                  </span>
                </div>
                <div className="p-2 bg-[#1b1c2b] rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Код / Key:</span>
                  <span className="font-mono font-bold text-indigo-400 block">
                    {importParsedData.project?.key || 'AUTO'}
                  </span>
                </div>
                <div className="p-2 bg-[#1b1c2b] rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Намерени пакети:</span>
                  <span className="font-semibold text-emerald-400 block">
                    {importParsedData.suites?.length || 0} suites
                  </span>
                </div>
                <div className="p-2 bg-[#1b1c2b] rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Тестови случаи:</span>
                  <span className="font-semibold text-cyan-400 block">
                    {importParsedData.testCases?.length || 0} test cases
                  </span>
                </div>
              </div>

              {/* Target Project Indicator */}
              <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                    Текущ Проект (Целева Дестинация):
                  </span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Folder className="w-3.5 h-3.5 text-indigo-400" />
                    {project.name}
                    <span className="text-[10px] px-1.5 py-0.2 bg-indigo-900/80 text-indigo-300 font-mono rounded">
                      {project.key}
                    </span>
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
                  Активен Проект
                </span>
              </div>

              {/* Import Mode Selector */}
              <div className="pt-2 border-t border-[#262838] space-y-2.5">
                <span className="text-slate-300 font-semibold block text-[11px]">
                  Изберете как да се импортират данните:
                </span>

                {/* Mode 1: Add as a New Repository in this Project (DEFAULT & RECOMMENDED) */}
                <div
                  onClick={() => setImportMode('new_repo')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    importMode === 'new_repo'
                      ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-[#1b1c2b] border-[#2e3146] hover:bg-[#202235]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="importMode"
                      value="new_repo"
                      checked={importMode === 'new_repo'}
                      onChange={() => setImportMode('new_repo')}
                      className="accent-emerald-500 mt-0.5 cursor-pointer"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs">
                          Добави като ново Репозитори в "{project.name}"
                        </span>
                        <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/40">
                          Препоръчително
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Създава ново репозитори вътре в проект <b>{project.name}</b> [{project.key}
                        ]. Всички тестове се организират в него, без да се създава нов проект в
                        системата.
                      </p>

                      {importMode === 'new_repo' && (
                        <div
                          className="mt-2.5 pt-2 border-t border-emerald-500/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="text-[10px] font-medium text-emerald-300 block mb-1">
                            Име на новото Репозитори (Repository Name):
                          </label>
                          <input
                            type="text"
                            value={importTargetRepoName}
                            onChange={(e) => setImportTargetRepoName(e.target.value)}
                            placeholder="напр. Payments API, Mobile Checkout, Regression"
                            className="w-full bg-[#12131e] border border-emerald-500/60 focus:border-emerald-400 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mode 2: Merge into Active Repository */}
                <div
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    importMode === 'merge'
                      ? 'bg-indigo-950/30 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-[#1b1c2b] border-[#2e3146] hover:bg-[#202235]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="accent-indigo-500 mt-0.5 cursor-pointer"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <span className="font-bold text-white text-xs block">
                        Слей в активното Репозитори ({activeRepositoryName})
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Добавя всички тестови пакети и тестови случаи директно към текущо избраното
                        репозитори в проект {project.name}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mode 3: Create as a Brand New Project */}
                <div
                  onClick={() => setImportMode('new')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    importMode === 'new'
                      ? 'bg-amber-950/30 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-[#1b1c2b] border-[#2e3146] hover:bg-[#202235]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="importMode"
                      value="new"
                      checked={importMode === 'new'}
                      onChange={() => setImportMode('new')}
                      className="accent-amber-500 mt-0.5 cursor-pointer"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <span className="font-bold text-slate-300 text-xs block">
                        Създай като напълно нов самостоятелен Проект
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Ще добави нов проект в главното меню на проектите (не като репозитори към{' '}
                        {project.name}).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (sticky shrink-0 - ALWAYS VISIBLE!) */}
        <div className="px-5 py-3 border-t border-[#262838] bg-[#141522] flex items-center justify-between gap-2.5 shrink-0">
          <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
            {importMode === 'new_repo' && `Дестинация: Проект ${project.name}`}
            {importMode === 'merge' && `Сливане в: ${activeRepositoryName}`}
            {importMode === 'new' && 'Ще се създаде нов проект'}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!importParsedData}
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {importMode === 'new_repo'
                  ? `Импортирай като ново Репозитори в "${project.name}"`
                  : importMode === 'merge'
                    ? `Слей в ${activeRepositoryName}`
                    : 'Създай нов проект'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
