import React, { useState, useEffect, useMemo } from 'react';
import {
  PlayCircle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  FastForward,
  MoreVertical,
  Calendar,
  X,
  Server,
  Layers,
  FileDown,
  Folder,
  Search,
} from 'lucide-react';
import { Project, TestRun, TestCase, TestSuite, Defect, TestRepository } from '../types';
import { exportTestRunAsPdf, sortTestCasesChronological } from '../utils/exportUtils';

interface TestRunsViewProps {
  project: Project;
  testRuns: TestRun[];
  testCases: TestCase[];
  testSuites: TestSuite[];
  onLaunchRun: (runId: string) => void;
  onCreateRun: (run: Partial<TestRun>) => void;
  allProjects?: Project[];
  defects?: Defect[];
  repositories?: TestRepository[];
  initialCreateContext?: {
    isOpen: boolean;
    repoId?: string;
    caseId?: string;
    suiteId?: string;
  } | null;
  onClearInitialCreateContext?: () => void;
}

export const TestRunsView: React.FC<TestRunsViewProps> = ({
  project,
  testRuns,
  testCases,
  testSuites,
  onLaunchRun,
  onCreateRun,
  allProjects,
  defects,
  repositories = [],
  initialCreateContext,
  onClearInitialCreateContext,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Run Form State
  const [newRunTitle, setNewRunTitle] = useState('');
  const [newRunDesc, setNewRunDesc] = useState('');
  const [newRunEnv, setNewRunEnv] = useState<'Production' | 'Staging' | 'QA-Develop' | 'Local'>(
    'Staging'
  );
  const [newAssignee, setNewAssignee] = useState('Admin');

  // Repository & Test Case Selection State for Create Run modal
  const [selectedRunRepoId, setSelectedRunRepoId] = useState<string>('all');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');

  // Available test cases dynamically filtered by the selected repository
  const availableCasesForRun = useMemo(() => {
    let list = testCases;
    if (project.id !== 'all') {
      list = list.filter((tc) => tc.projectId === project.id);
    }
    if (selectedRunRepoId !== 'all') {
      const defaultRepo = repositories.find((r) => r.isDefault) || repositories[0];
      list = list.filter((tc) => {
        if (tc.repositoryId) {
          return tc.repositoryId === selectedRunRepoId;
        }
        return defaultRepo ? defaultRepo.id === selectedRunRepoId : true;
      });
    }
    return sortTestCasesChronological(list);
  }, [testCases, project.id, selectedRunRepoId, repositories]);

  // Handle incoming context menu request (pre-select repo, suite, or test case)
  useEffect(() => {
    if (initialCreateContext?.isOpen) {
      setShowCreateModal(true);
      if (initialCreateContext.repoId) {
        setSelectedRunRepoId(initialCreateContext.repoId);
      }
      if (initialCreateContext.caseId) {
        const targetCase = testCases.find((c) => c.id === initialCreateContext.caseId);
        if (targetCase?.repositoryId) {
          setSelectedRunRepoId(targetCase.repositoryId);
        }
        setSelectedCaseIds([initialCreateContext.caseId]);
        if (targetCase) {
          setNewRunTitle(`Quick Run: ${targetCase.key} - ${targetCase.title}`);
        }
      } else if (initialCreateContext.suiteId) {
        const suiteCases = testCases.filter((c) => c.suiteId === initialCreateContext.suiteId);
        setSelectedCaseIds(suiteCases.map((c) => c.id));
        if (suiteCases[0]?.repositoryId) {
          setSelectedRunRepoId(suiteCases[0].repositoryId);
        }
        const s = testSuites.find((st) => st.id === initialCreateContext.suiteId);
        if (s) {
          setNewRunTitle(`Suite Run: ${s.name}`);
        }
      } else if (initialCreateContext.repoId) {
        const repo = repositories.find((r) => r.id === initialCreateContext.repoId);
        if (repo) {
          setNewRunTitle(`${repo.name} Verification Run`);
        }
        // Auto select all cases belonging to this repo
        const repoCases = testCases.filter((tc) => (tc.repositoryId || repositories[0]?.id) === initialCreateContext.repoId);
        setSelectedCaseIds(repoCases.map((c) => c.id));
      }
      onClearInitialCreateContext?.();
    }
  }, [initialCreateContext, testCases, testSuites, repositories, onClearInitialCreateContext]);

  // When opening modal fresh without preselection, default select all cases in available list
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setSelectedRunRepoId('all');
    setSelectedCaseIds(availableCasesForRun.map((c) => c.id));
    setNewRunTitle('');
    setNewRunDesc('');
    setCaseSearchQuery('');
  };

  const handleRepoChange = (newRepoId: string) => {
    setSelectedRunRepoId(newRepoId);
    let newCases = testCases;
    if (project.id !== 'all') {
      newCases = newCases.filter((tc) => tc.projectId === project.id);
    }
    if (newRepoId !== 'all') {
      const defaultRepo = repositories.find((r) => r.isDefault) || repositories[0];
      newCases = newCases.filter((tc) => {
        if (tc.repositoryId) return tc.repositoryId === newRepoId;
        return defaultRepo ? defaultRepo.id === newRepoId : true;
      });
    }
    setSelectedCaseIds(newCases.map((c) => c.id));
  };

  // Filtered cases by search query
  const searchedCases = useMemo(() => {
    if (!caseSearchQuery.trim()) return availableCasesForRun;
    const q = caseSearchQuery.toLowerCase();
    return availableCasesForRun.filter(
      (tc) =>
        tc.title.toLowerCase().includes(q) ||
        tc.key.toLowerCase().includes(q) ||
        tc.suiteName?.toLowerCase().includes(q)
    );
  }, [availableCasesForRun, caseSearchQuery]);

  const filteredRuns = testRuns.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleCreateRun = () => {
    if (!newRunTitle.trim()) return;

    // Filter cases that are selected
    const casesToInclude = availableCasesForRun.filter((tc) => selectedCaseIds.includes(tc.id));
    if (casesToInclude.length === 0) {
      return;
    }

    const newRun: Partial<TestRun> = {
      key: `RUN-${Math.floor(200 + Math.random() * 800)}`,
      projectId: project.id === 'all' ? (casesToInclude[0]?.projectId || 'proj-core') : project.id,
      title: newRunTitle,
      description: newRunDesc,
      environment: newRunEnv,
      status: 'active',
      assignedTo: newAssignee,
      createdAt: new Date().toISOString(),
      totalCases: casesToInclude.length,
      passedCount: 0,
      failedCount: 0,
      blockedCount: 0,
      skippedCount: 0,
      untestedCount: casesToInclude.length,
      executions: casesToInclude.map((tc) => ({
        id: `exec-${Date.now()}-${tc.id}`,
        runId: '',
        testCaseId: tc.id,
        testCaseKey: tc.key,
        testCaseTitle: tc.title,
        suiteName: tc.suiteName,
        status: 'untested',
        durationSeconds: 0,
        stepResults: tc.steps.map((st) => ({
          stepNumber: st.stepNumber,
          status: 'untested',
        })),
        defectIds: [],
      })),
    };

    onCreateRun(newRun);
    setShowCreateModal(false);
    setNewRunTitle('');
    setNewRunDesc('');
    setSelectedCaseIds([]);
    setCaseSearchQuery('');
  };

  const getEnvBadge = (env: string) => {
    switch (env) {
      case 'Production':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Staging':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'QA-Develop':
        return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Test Runs &amp; Executions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {project.id === 'all'
              ? 'Showing all test runs across all workspace projects.'
              : `Showing test runs for ${project.name} [${project.key}].`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({testRuns.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active ({testRuns.filter((r) => r.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completed ({testRuns.filter((r) => r.status === 'completed').length})
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Test Run</span>
          </button>
        </div>
      </div>

      {/* Runs List */}
      <div className="space-y-4">
        {filteredRuns.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <PlayCircle className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No test runs found
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
              {testRuns.length === 0
                ? 'No test execution runs created yet. Create a test run to start executing test cases.'
                : 'No test runs match the selected status filter.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create your first test run</span>
            </button>
          </div>
        ) : (
          filteredRuns.map((run) => {
          const total =
            run.passedCount +
              run.failedCount +
              run.blockedCount +
              run.skippedCount +
              run.untestedCount ||
            run.totalCases ||
            1;
          const completed = run.passedCount + run.failedCount + run.blockedCount;
          const progressPct = Math.round((completed / total) * 100);

          return (
            <div
              key={run.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {run.key}
                    </span>
                    {project.id === 'all' && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 rounded">
                        {allProjects?.find((p) => p.id === run.projectId)?.key || run.projectId}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getEnvBadge(run.environment)}`}
                    >
                      {run.environment}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                        run.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {run.title}
                  </h3>
                  {run.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{run.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => exportTestRunAsPdf(project, run, testCases, defects)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export Run Report as PDF / Експорт на Run резултати в PDF"
                  >
                    <FileDown className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={() => onLaunchRun(run.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Launch Runner
                  </button>
                </div>
              </div>

              {/* Progress and Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <span>
                    Execution Progress: <strong>{progressPct}%</strong>
                  </span>
                  <span>
                    {completed} / {total} cases finished
                  </span>
                </div>

                {/* Multi-segment Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    style={{ width: `${(run.passedCount / total) * 100}%` }}
                    className="bg-emerald-500"
                  />
                  <div
                    style={{ width: `${(run.failedCount / total) * 100}%` }}
                    className="bg-rose-500"
                  />
                  <div
                    style={{ width: `${(run.blockedCount / total) * 100}%` }}
                    className="bg-amber-500"
                  />
                  <div
                    style={{ width: `${(run.skippedCount / total) * 100}%` }}
                    className="bg-slate-400"
                  />
                  <div
                    style={{ width: `${(run.untestedCount / total) * 100}%` }}
                    className="bg-slate-200 dark:bg-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />{' '}
                      {run.passedCount} Passed
                    </span>
                    <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />{' '}
                      {run.failedCount} Failed
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                      <Ban className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />{' '}
                      {run.blockedCount} Blocked
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Assigned to:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {run.assignedTo || 'Unassigned'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* New Test Run Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Create New Test Run (Нов Test Run)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Изберете репозитори и маркирайте тестовите кейсове за изпълнение
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Run Title (Име на ръна) *
                </label>
                <input
                  type="text"
                  value={newRunTitle}
                  onChange={(e) => setNewRunTitle(e.target.value)}
                  placeholder="e.g. Sprint 43 Release Candidate Verification"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Environment
                  </label>
                  <select
                    value={newRunEnv}
                    onChange={(e) => setNewRunEnv(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  >
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                    <option value="QA-Develop">QA-Develop</option>
                    <option value="Local">Local</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* REPOSITORY SELECTION DROPDOWN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Target Repository (Репозитори за тестване) *
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {availableCasesForRun.length} cases available
                  </span>
                </div>
                <select
                  value={selectedRunRepoId}
                  onChange={(e) => handleRepoChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs cursor-pointer"
                >
                  <option value="all">🌐 All Repositories (Всички репозиторита)</option>
                  {repositories.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      📁 {repo.name} {repo.isDefault ? '— (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* DYNAMICALLY LOADED TEST CASES FOR SELECTED REPOSITORY */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Test Cases in Selected Repository ({selectedCaseIds.length} of{' '}
                    {availableCasesForRun.length} selected)
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedCaseIds(availableCasesForRun.map((c) => c.id))}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCaseIds([])}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {availableCasesForRun.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={caseSearchQuery}
                      onChange={(e) => setCaseSearchQuery(e.target.value)}
                      placeholder="Search test cases by title, key, or suite..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1 max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {availableCasesForRun.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Няма тестови кейсове в това репозитори / No test cases found in this repository.
                    </div>
                  ) : searchedCases.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Няма резултати за филтъра &quot;{caseSearchQuery}&quot;
                    </div>
                  ) : (
                    searchedCases.map((tc) => {
                      const isChecked = selectedCaseIds.includes(tc.id);
                      return (
                        <label
                          key={tc.id}
                          className="flex items-center gap-2.5 p-1.5 hover:bg-white dark:hover:bg-slate-800/80 rounded-md cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedCaseIds(selectedCaseIds.filter((id) => id !== tc.id));
                              } else {
                                setSelectedCaseIds([...selectedCaseIds, tc.id]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 shrink-0"
                          />
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 shrink-0">
                            {tc.key}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                            {tc.title}
                          </span>
                          {tc.suiteName && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px] shrink-0 hidden sm:inline">
                              {tc.suiteName}
                            </span>
                          )}
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                              tc.priority === 'highest' || tc.priority === 'high'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {tc.priority}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-[11px] text-slate-400">
                {selectedCaseIds.length === 0 ? (
                  <span className="text-amber-500 font-semibold">
                    ⚠️ Изберете поне един тест кейс
                  </span>
                ) : (
                  <span>
                    Ще бъдат включени{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {selectedCaseIds.length}
                    </strong>{' '}
                    кейса
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateRun}
                  disabled={selectedCaseIds.length === 0 || !newRunTitle.trim()}
                  className="px-4 py-1.5 bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer transition-all"
                >
                  Create &amp; Start Run ({selectedCaseIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
