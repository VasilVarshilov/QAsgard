import React from 'react';
import {
  Layers,
  PlayCircle,
  Bug,
  Sparkles,
  TrendingUp,
  Cpu,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Edit2,
  Copy,
  Folder,
  Upload,
  Plus,
  Check,
} from 'lucide-react';
import { Project, TestCase, TestRun, Defect, TestSuite, TestRepository } from '../types';

interface DashboardViewProps {
  project: Project;
  testCases: TestCase[];
  testSuites: TestSuite[];
  testRuns: TestRun[];
  defects: Defect[];
  onNavigate: (tab: string) => void;
  onLaunchRun: (runId: string) => void;
  onRequestDeleteProject?: (project: Project) => void;
  onRequestEditProject?: (project: Project) => void;
  onRequestCopyProject?: (project: Project) => void;
  repositories?: TestRepository[];
  selectedRepositoryId?: string | null;
  onSelectRepository?: (repoId: string | null) => void;
  onOpenCreateRepository?: () => void;
  onOpenImportRepository?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  testCases,
  testSuites,
  testRuns,
  defects,
  onNavigate,
  onLaunchRun,
  onRequestDeleteProject,
  onRequestEditProject,
  onRequestCopyProject,
  repositories = [],
  selectedRepositoryId,
  onSelectRepository,
  onOpenCreateRepository,
  onOpenImportRepository,
}) => {
  const defaultRepoId = `repo-${project.id}-default`;
  const projectRepos = React.useMemo(() => {
    if (project.id === 'all') return repositories;
    const filtered = repositories.filter((r) => r.projectId === project.id);
    if (filtered.length === 0) {
      return [
        {
          id: defaultRepoId,
          projectId: project.id,
          name: 'Main Repository',
          description: `Default test repository for ${project.name}`,
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    return filtered;
  }, [repositories, project.id, project.name, defaultRepoId]);

  const activeRepo = React.useMemo(() => {
    if (!selectedRepositoryId || selectedRepositoryId === 'all') {
      return projectRepos.find((r) => r.isDefault) || projectRepos[0];
    }
    return projectRepos.find((r) => r.id === selectedRepositoryId) || projectRepos[0];
  }, [projectRepos, selectedRepositoryId]);

  const automatedCases = testCases.filter((tc) => tc.automationStatus === 'automated').length;
  const automationPercentage =
    testCases.length > 0 ? Math.round((automatedCases / testCases.length) * 100) : 0;

  // Active run calculation
  const activeRuns = testRuns.filter((r) => r.status === 'active');
  const primaryRun = activeRuns[0] || testRuns[0];

  const totalExecutions = primaryRun
    ? primaryRun.passedCount +
      primaryRun.failedCount +
      primaryRun.blockedCount +
      primaryRun.skippedCount +
      primaryRun.untestedCount
    : 0;
  const passRate =
    primaryRun && primaryRun.passedCount + primaryRun.failedCount > 0
      ? Math.round(
          (primaryRun.passedCount / (primaryRun.passedCount + primaryRun.failedCount)) * 100
        )
      : 80;

  const openDefects = defects.filter((d) => d.status === 'open' || d.status === 'in_progress');
  const blockerDefects = openDefects.filter(
    (d) => d.severity === 'blocker' || d.severity === 'critical'
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-300" />
                QAsgard Realm • Where Quality Rules
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {project.id === 'all'
                  ? '• Viewing: All Projects Consolidated [ALL]'
                  : `• Project: ${project.key}`}
              </span>
              {project.id !== 'all' && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-xs text-indigo-200">
                  <Folder className="w-3 h-3 text-indigo-300" />
                  <span className="text-slate-300">Active Repo:</span>
                  <span className="font-bold text-white">
                    {activeRepo?.name || 'Main Repository'}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {project.id === 'all' ? 'All Projects • Enterprise Quality Dashboard' : project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {project.id === 'all'
                ? 'Consolidated quality overview across all workspace projects, showing aggregate execution health, repository volume, and active defect tracking.'
                : project.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onOpenCreateRepository && project.id !== 'all' && (
              <button
                onClick={onOpenCreateRepository}
                className="px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                title="Create New Repository in this Project"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Repo</span>
              </button>
            )}
            {onOpenImportRepository && project.id !== 'all' && (
              <button
                onClick={onOpenImportRepository}
                className="px-3 py-2 text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500/40 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                title="Import Repository Backup (JSON)"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>📥 Import Repo</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('ai-studio')}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-100" />
              Launch AI Studio
            </button>
            <button
              onClick={() => onNavigate('repository')}
              className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-all cursor-pointer"
            >
              View Repository
            </button>
            {onRequestEditProject && project.id !== 'all' && (
              <button
                onClick={() => onRequestEditProject(project)}
                className="px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/20 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                title={`Edit ${project.name} / Редактирай проект`}
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-300" />
                <span>Edit Project</span>
              </button>
            )}
            {onRequestCopyProject && project.id !== 'all' && (
              <button
                onClick={() => onRequestCopyProject(project)}
                className="px-3 py-2 text-xs font-semibold bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 hover:text-white border border-indigo-400/30 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                title={`Copy ${project.name} / Копирай цял проект`}
              >
                <Copy className="w-3.5 h-3.5 text-indigo-300" />
                <span>Copy Project</span>
              </button>
            )}
            {onRequestDeleteProject && project.id !== 'all' && (
              <button
                onClick={() => onRequestDeleteProject(project)}
                className="px-3 py-2 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white border border-rose-400/30 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                title={`Delete ${project.name} and purge all data / Изтрий проекта`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PROJECT REPOSITORIES SECTION (Direct Selector & Management from Dashboard!) */}
      {project.id !== 'all' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Репозиторита в проект "{project.name}" ({projectRepos.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Изберете върху кое репозитори работите. Тестовете и пакетите се зареждат според
                избраното репозитори.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onOpenCreateRepository && (
                <button
                  onClick={onOpenCreateRepository}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Ново Репозитори</span>
                </button>
              )}
              {onOpenImportRepository && (
                <button
                  onClick={onOpenImportRepository}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>📥 Импорт на Репозитори</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {projectRepos.map((repo) => {
              const isActive =
                selectedRepositoryId === repo.id || (!selectedRepositoryId && repo.isDefault);
              const repoCases = testCases.filter(
                (c) => (c.repositoryId || defaultRepoId) === repo.id
              );
              const repoSuites = testSuites.filter(
                (s) => (s.repositoryId || defaultRepoId) === repo.id
              );

              return (
                <div
                  key={repo.id}
                  onClick={() => onSelectRepository?.(repo.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {repo.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                            {repo.description || 'Test repository'}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          Активно
                        </span>
                      )}
                      {!isActive && repo.isDefault && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-center">
                      <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Suites</span>
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {repoSuites.length}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Tests</span>
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {repoCases.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center gap-2">
                    {isActive ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('repository');
                        }}
                        className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <span>Отвори в Test Repository</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRepository?.(repo.id);
                          }}
                          className="flex-1 py-1.5 px-2 bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Избери</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRepository?.(repo.id);
                            onNavigate('repository');
                          }}
                          className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors"
                          title="Избери и отвори склад"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Test Cases */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Repository Tests
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {testCases.length}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +4 this week
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Across {testSuites.length} test suites
          </div>
        </div>

        {/* Automation Ratio */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Automation Ratio
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {automationPercentage}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({automatedCases}/{testCases.length})
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${automationPercentage}%` }}
            />
          </div>
        </div>

        {/* Active Test Runs & Pass Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Latest Run Pass Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {passRate}%
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              in {primaryRun?.environment || 'Staging'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {primaryRun
              ? `${primaryRun.passedCount} passed, ${primaryRun.failedCount} failed`
              : 'No runs'}
          </div>
        </div>

        {/* Open Defects */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Open Defects
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {openDefects.length}
            </span>
            {blockerDefects > 0 && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {blockerDefects} Blocker
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {defects.filter((d) => d.status === 'resolved').length} resolved this sprint
          </div>
        </div>
      </div>

      {/* Main Grid: Active Run Execution + Suite Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Run Spotlight */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                Active Test Run in Progress
              </h2>
            </div>
            {primaryRun && (
              <button
                onClick={() => onLaunchRun(primaryRun.id)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Launch Live Runner
              </button>
            )}
          </div>

          {primaryRun ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {primaryRun.key}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {primaryRun.title}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Assigned to:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {primaryRun.assignedTo}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Env:{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {primaryRun.environment}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {primaryRun.passedCount + primaryRun.failedCount + primaryRun.blockedCount} /{' '}
                      {totalCases(primaryRun)} Completed
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      {Math.round(
                        ((primaryRun.passedCount +
                          primaryRun.failedCount +
                          primaryRun.blockedCount) /
                          (totalCases(primaryRun) || 1)) *
                          100
                      )}
                      % progress
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg h-3 overflow-hidden flex">
                <div
                  style={{ width: `${pct(primaryRun.passedCount, primaryRun)}%` }}
                  className="bg-emerald-500"
                  title={`Passed: ${primaryRun.passedCount}`}
                />
                <div
                  style={{ width: `${pct(primaryRun.failedCount, primaryRun)}%` }}
                  className="bg-rose-500"
                  title={`Failed: ${primaryRun.failedCount}`}
                />
                <div
                  style={{ width: `${pct(primaryRun.blockedCount, primaryRun)}%` }}
                  className="bg-amber-500"
                  title={`Blocked: ${primaryRun.blockedCount}`}
                />
                <div
                  style={{ width: `${pct(primaryRun.skippedCount, primaryRun)}%` }}
                  className="bg-slate-400"
                  title={`Skipped: ${primaryRun.skippedCount}`}
                />
                <div
                  style={{ width: `${pct(primaryRun.untestedCount, primaryRun)}%` }}
                  className="bg-slate-200 dark:bg-slate-700"
                  title={`Untested: ${primaryRun.untestedCount}`}
                />
              </div>

              {/* Execution Summary Tags */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 py-1.5 rounded-lg font-medium">
                  <div className="text-base font-bold">{primaryRun.passedCount}</div>
                  <div className="text-[10px]">Passed</div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 py-1.5 rounded-lg font-medium">
                  <div className="text-base font-bold">{primaryRun.failedCount}</div>
                  <div className="text-[10px]">Failed</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 py-1.5 rounded-lg font-medium">
                  <div className="text-base font-bold">{primaryRun.blockedCount}</div>
                  <div className="text-[10px]">Blocked</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1.5 rounded-lg font-medium">
                  <div className="text-base font-bold">{primaryRun.skippedCount}</div>
                  <div className="text-[10px]">Skipped</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 py-1.5 rounded-lg font-medium">
                  <div className="text-base font-bold">{primaryRun.untestedCount}</div>
                  <div className="text-[10px]">Untested</div>
                </div>
              </div>

              {/* Sample Executions preview */}
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Recent Executions in this Run
                </div>
                {primaryRun.executions.slice(0, 4).map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ex.status === 'passed'
                            ? 'bg-emerald-500'
                            : ex.status === 'failed'
                              ? 'bg-rose-500'
                              : ex.status === 'blocked'
                                ? 'bg-amber-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                      <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                        {ex.testCaseKey}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                        {ex.testCaseTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {ex.suiteName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ex.status === 'passed'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : ex.status === 'failed'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              : ex.status === 'blocked'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ex.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              No active runs currently
            </div>
          )}
        </div>

        {/* Right Column: AI Superpowers & Quick Nav */}
        <div className="space-y-4">
          {/* AI Spotlight Widget */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Gemini AI Quality Copilot
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Accelerate QA Workflows</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Generate full test suites from raw PRD requirements, find duplicate assertions, and
              diagnose flaky failures automatically.
            </p>
            <div className="pt-2 space-y-1.5">
              <button
                onClick={() => onNavigate('ai-studio')}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-xs flex items-center justify-between group cursor-pointer"
              >
                <span>Generate Tests from User Stories</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('ai-studio')}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-xs flex items-center justify-between group cursor-pointer"
              >
                <span>Run Duplicate Test Scanner</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('ai-studio')}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-xs flex items-center justify-between group cursor-pointer"
              >
                <span>Analyze Coverage Gaps &amp; Blindspots</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Test Suites Health */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Test Suites
              </h3>
              <button
                onClick={() => onNavigate('repository')}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center cursor-pointer"
              >
                View all <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
            <div className="space-y-2">
              {testSuites.map((suite) => (
                <div key={suite.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[170px]">
                    {suite.name}
                  </span>
                  <span className="text-slate-400 dark:text-slate-400 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                    {suite.caseCount} tests
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function totalCases(run: TestRun): number {
  return (
    run.passedCount + run.failedCount + run.blockedCount + run.skippedCount + run.untestedCount
  );
}

function pct(count: number, run: TestRun): number {
  const total = totalCases(run);
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}
