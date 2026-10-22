import React, { useState } from 'react';
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
} from 'lucide-react';
import { Project, TestRun, TestCase, TestSuite, Defect } from '../types';
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
  const [selectedSuiteIds, setSelectedSuiteIds] = useState<string[]>(testSuites.map((s) => s.id));

  const filteredRuns = testRuns.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleCreateRun = () => {
    if (!newRunTitle.trim()) return;

    // Filter cases in selected suites and sort from first to last (repository order)
    const casesToInclude = sortTestCasesChronological(
      testCases.filter((tc) => selectedSuiteIds.includes(tc.suiteId))
    );

    const newRun: Partial<TestRun> = {
      key: `RUN-${Math.floor(200 + Math.random() * 800)}`,
      projectId: project.id,
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
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Test Run</span>
          </button>
        </div>
      </div>

      {/* Runs List */}
      <div className="space-y-4">
        {filteredRuns.map((run) => {
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
        })}
      </div>

      {/* New Test Run Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Create New Test Run
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Run Title *
              </label>
              <input
                type="text"
                value={newRunTitle}
                onChange={(e) => setNewRunTitle(e.target.value)}
                placeholder="e.g. Sprint 43 Release Candidate Verification"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                Include Test Suites
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-800/60">
                {testSuites.map((s) => {
                  const isChecked = selectedSuiteIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedSuiteIds(selectedSuiteIds.filter((id) => id !== s.id));
                          } else {
                            setSelectedSuiteIds([...selectedSuiteIds, s.id]);
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {s.name}
                      </span>
                      <span className="text-slate-400 text-[10px]">({s.caseCount} tests)</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRun}
                className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Create &amp; Start Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
