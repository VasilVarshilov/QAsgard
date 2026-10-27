import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Sparkles,
  FileText,
  Layers,
  PlayCircle,
  Bug,
  BarChart3,
  Users,
  Plus,
  ChevronDown,
  Building2,
  FolderGit2,
  BookmarkCheck,
  Database,
  Cpu,
  Sun,
  Moon,
  Palette,
  Server,
  Code,
  Upload,
  FileDown,
  History,
  Bot,
  Settings,
  Check,
  Trash2,
  Edit2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Menu,
  Folder,
  HardDrive,
} from 'lucide-react';
import {
  Organization,
  Project,
  TestSuite,
  TestCase,
  Defect,
  TestRun,
  TestPlan,
  TestRepository,
  User,
  UserRole,
} from '../types';
import { getLogoUrl, getIconSvgUrl } from '../utils/logo';
import { getUserEmoji } from '../utils/userUtils';
import { PWAInstallButton } from './pwa/PWAInstallButton';

interface NavbarProps {
  currentOrg: Organization;
  currentProject: Project;
  projects: Project[];
  currentUser: User;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSelectProject: (project: Project) => void;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  onOpenSearch: () => void;
  onOpenCreateCase: () => void;
  onOpenCreateRun: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenPreferences?: () => void;
  onOpenCreateProject?: () => void;
  onRequestDeleteProject?: (project: Project) => void;
  onRequestEditProject?: (project: Project) => void;
  onRequestCopyProject?: (project: Project) => void;
  allProjectsProject?: Project;
  repositories?: TestRepository[];
  selectedRepositoryId?: string | null;
  onSelectRepository?: (repoId: string | null) => void;
  onOpenCreateRepository?: () => void;
  onOpenImportRepository?: () => void;
  testCases?: TestCase[];
  testSuites?: TestSuite[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentOrg,
  currentProject,
  projects,
  currentUser,
  activeTab,
  onSelectTab,
  onSelectProject,
  onSwitchUser,
  allUsers,
  onOpenSearch,
  onOpenCreateCase,
  onOpenCreateRun,
  isDarkMode,
  onToggleDarkMode,
  onOpenPreferences,
  onOpenCreateProject,
  onRequestDeleteProject,
  onRequestEditProject,
  onRequestCopyProject,
  allProjectsProject,
  repositories = [],
  selectedRepositoryId,
  onSelectRepository,
  onOpenCreateRepository,
  onOpenImportRepository,
  testCases = [],
  testSuites = [],
}) => {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const defaultRepoId = `repo-${currentProject.id}-default`;
  const projectRepos = React.useMemo(() => {
    if (currentProject.id === 'all') return repositories;
    const filtered = repositories.filter((r) => r.projectId === currentProject.id);
    if (filtered.length === 0) {
      return [
        {
          id: defaultRepoId,
          projectId: currentProject.id,
          name: 'Main Repository',
          description: `Default test repository for ${currentProject.name}`,
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    return filtered;
  }, [repositories, currentProject.id, currentProject.name, defaultRepoId]);

  const activeRepo = React.useMemo(() => {
    if (!selectedRepositoryId || selectedRepositoryId === 'all') {
      return projectRepos.find((r) => r.isDefault) || projectRepos[0];
    }
    return projectRepos.find((r) => r.id === selectedRepositoryId) || projectRepos[0];
  }, [projectRepos, selectedRepositoryId]);

  const activeRepoCases = React.useMemo(() => {
    if (currentProject.id === 'all' || selectedRepositoryId === 'all') {
      return testCases;
    }
    const targetId = activeRepo?.id || defaultRepoId;
    return testCases.filter((c) => (c.repositoryId || defaultRepoId) === targetId);
  }, [testCases, activeRepo?.id, defaultRepoId, currentProject.id, selectedRepositoryId]);

  const checkNavScroll = React.useCallback(() => {
    const el = navContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 6);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
    }
  }, []);

  React.useEffect(() => {
    checkNavScroll();
    const el = navContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkNavScroll, { passive: true });
    }
    window.addEventListener('resize', checkNavScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkNavScroll);
      window.removeEventListener('resize', checkNavScroll);
    };
  }, [checkNavScroll]);

  // Keep active tab scrolled into view automatically
  React.useEffect(() => {
    const el = navContainerRef.current;
    if (el) {
      const activeEl = el.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTab]);

  const handleScrollNav = (direction: 'left' | 'right') => {
    const el = navContainerRef.current;
    if (el) {
      const delta = direction === 'left' ? -220 : 220;
      el.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-500/10 text-purple-600 rounded">
            Admin
          </span>
        );
      case 'test_manager':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-600 rounded">
            Test Mgr
          </span>
        );
      case 'qa_lead':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 rounded">
            Test QA lead
          </span>
        );
      case 'qa_engineer':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 rounded">
            Test QA Eng
          </span>
        );
      case 'product_owner':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 rounded">
            Test Prod Owner
          </span>
        );
      case 'viewer':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-300 rounded">
            Test Viewer
          </span>
        );
    }
  };

  // Nav Panel: Dashboard, Test Repository, Test Runs, Defects, QA Copilot, Team, and Admin
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'repository', label: 'Test Repository', icon: Layers },
    { id: 'runs', label: 'Test Runs', icon: PlayCircle },
    { id: 'defects', label: 'Defects', icon: Bug },
    { id: 'qa-copilot', label: 'QA Copilot', icon: Bot, copilotBadge: true },
    { id: 'users', label: 'Team', icon: Users },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, adminBadge: true },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Brand and Context Selectors */}
        <div className="flex items-center space-x-3">
          <div
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onSelectTab('dashboard')}
            title="QAsgard - Към основното табло / Back to Dashboard"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTab('dashboard');
              }
            }}
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-slate-900 shadow-sm flex items-center justify-center shrink-0">
              <img
                src={getLogoUrl()}
                alt="QAsgard Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.dataset.fallbackTried) {
                    target.dataset.fallbackTried = '1';
                    target.src = getIconSvgUrl();
                  }
                }}
              />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base font-sans">
                  QAsgard
                </span>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide mt-0.5">
                Where Quality Rules
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Org & Project Selector */}
          <div className="relative">
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border transition-colors text-xs text-left cursor-pointer ${
                projects.length === 0
                  ? 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                  : currentProject?.id === 'all'
                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div
                className="flex items-center space-x-1.5 font-medium truncate max-w-[180px] sm:max-w-[280px] md:max-w-[360px] lg:max-w-[440px]"
                title={projects.length === 0 ? 'No projects yet' : `${currentProject?.name} [${currentProject?.key}]`}
              >
                {projects.length === 0 ? (
                  <>
                    <FolderGit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-400 font-medium">No projects yet</span>
                  </>
                ) : currentProject?.id === 'all' ? (
                  <>
                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate font-semibold">{currentProject.name}</span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded font-bold shrink-0 bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                      [{currentProject.key}]
                    </span>
                  </>
                ) : (
                  <>
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate font-semibold">{currentProject?.name}</span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded font-bold shrink-0 text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                      [{currentProject?.key}]
                    </span>
                  </>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute left-0 mt-1 w-88 sm:w-[460px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {currentOrg.name}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-[10px]">
                    {currentOrg.plan}
                  </span>
                </div>

                {projects.length === 0 ? (
                  <div className="py-7 px-4 text-center">
                    <FolderGit2 className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No projects yet
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 mb-3.5">
                      Create your first QA project to get started
                    </p>
                    {onOpenCreateProject && (
                      <button
                        onClick={() => {
                          setProjectDropdownOpen(false);
                          onOpenCreateProject();
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create your first project</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Primary Option: All Projects */}
                    <div className="px-2 pb-1.5">
                      <button
                        onClick={() => {
                          const allObj: Project = allProjectsProject || {
                            id: 'all',
                            organizationId: currentOrg.id,
                            name: 'All Projects',
                            key: 'ALL',
                            description:
                              'Enterprise consolidated overview displaying test cases, suites, test runs, and defects across all projects.',
                            suiteCount: projects.reduce((acc, p) => acc + p.suiteCount, 0),
                            caseCount: projects.reduce((acc, p) => acc + p.caseCount, 0),
                            openBugsCount: projects.reduce((acc, p) => acc + p.openBugsCount, 0),
                            updatedAt: new Date().toISOString(),
                          };
                          onSelectProject(allObj);
                          setProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-all cursor-pointer border ${
                          currentProject?.id === 'all'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-indigo-50/70 dark:bg-indigo-950/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-slate-800 dark:text-slate-200 border-indigo-200/70 dark:border-indigo-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              currentProject?.id === 'all'
                                ? 'bg-white/20 text-white'
                                : 'bg-indigo-600 text-white'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold flex items-center gap-1.5 leading-tight">
                              <span>All Projects</span>
                              <span
                                className={`text-[9px] font-mono px-1 py-0.2 rounded font-extrabold ${
                                  currentProject?.id === 'all'
                                    ? 'bg-white/25 text-white'
                                    : 'bg-indigo-200 text-indigo-900'
                                }`}
                              >
                                ALL
                              </span>
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                currentProject?.id === 'all' ? 'text-indigo-100' : 'text-slate-500'
                              }`}
                            >
                              All {projects.length} projects combined
                            </div>
                          </div>
                        </div>
                        {currentProject?.id === 'all' && (
                          <Check className="w-4 h-4 shrink-0 text-white" />
                        )}
                      </button>
                    </div>

                    <div className="px-3 pt-2 pb-1 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span className="uppercase tracking-wider text-[10px]">
                        Individual Projects ({projects.length})
                      </span>
                      {onOpenCreateProject && (
                        <button
                          onClick={() => {
                            setProjectDropdownOpen(false);
                            onOpenCreateProject();
                          }}
                          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                          title="Create a new QA project"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ New Project</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 px-1">
                  {projects.map((p) => {
                    const isSelected = p.id === currentProject.id;
                    return (
                      <div
                        key={p.id}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors my-0.5 group ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/50 dark:border-indigo-800/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div
                          onClick={() => {
                            onSelectProject(p);
                            setProjectDropdownOpen(false);
                          }}
                          className="pr-2 flex-1 min-w-0 cursor-pointer"
                          title={`${p.name} [${p.key}]`}
                        >
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-400">
                            {p.caseCount} tests • {p.openBugsCount} open bugs
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            {p.key}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          )}
                          {onRequestEditProject && p.id !== 'all' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectDropdownOpen(false);
                                onRequestEditProject(p);
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                              title={`Edit ${p.name} / Редактирай проект`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onRequestCopyProject && p.id !== 'all' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectDropdownOpen(false);
                                onRequestCopyProject(p);
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded transition-colors cursor-pointer"
                              title={`Copy ${p.name} / Копирай цял проект`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onRequestDeleteProject && p.id !== 'all' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectDropdownOpen(false);
                                onRequestDeleteProject(p);
                              }}
                              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title={`Delete ${p.name} and purge all data / Изтрий проекта`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {onOpenCreateProject && (
                  <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 px-2">
                    <button
                      onClick={() => {
                        setProjectDropdownOpen(false);
                        onOpenCreateProject();
                      }}
                      className="w-full py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Project</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

          {/* Repository Selector in Global Navbar */}
          {projects.length > 0 && currentProject.id !== 'all' && currentProject.id !== '' && (
            <div className="relative flex items-center">
              <span className="text-slate-300 dark:text-slate-700 font-mono text-xs mx-1 hidden sm:inline">
                /
              </span>
              <div className="relative">
                <button
                  onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border transition-colors text-xs text-left cursor-pointer ${
                    repoDropdownOpen
                      ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                  title={`Active Repository: ${activeRepo?.name} / Избери репозитори`}
                >
                  <Folder className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-[170px] md:max-w-[220px] font-semibold">
                    {selectedRepositoryId === 'all'
                      ? 'All Repositories'
                      : activeRepo?.name || 'Main Repository'}
                  </span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold hidden sm:inline">
                    {activeRepoCases.length} tests
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {repoDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        Repositories in [{currentProject.key}] ({projectRepos.length})
                      </span>
                      {onOpenCreateRepository && (
                        <button
                          onClick={() => {
                            setRepoDropdownOpen(false);
                            onOpenCreateRepository();
                          }}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                      {projectRepos.map((repo) => {
                        const isSelected =
                          selectedRepositoryId === repo.id ||
                          (!selectedRepositoryId && repo.isDefault);
                        const repoCases = testCases.filter(
                          (c) => (c.repositoryId || defaultRepoId) === repo.id
                        );
                        const repoSuites = testSuites.filter(
                          (s) => (s.repositoryId || defaultRepoId) === repo.id
                        );

                        return (
                          <div
                            key={repo.id}
                            onClick={() => {
                              onSelectRepository?.(repo.id);
                              setRepoDropdownOpen(false);
                            }}
                            className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-white font-medium'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Folder
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-400'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold truncate text-xs">{repo.name}</span>
                                  {repo.isDefault && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase font-mono">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {repoSuites.length} suites • {repoCases.length} tests
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                            )}
                          </div>
                        );
                      })}

                      {/* All Repos Option */}
                      {projectRepos.length > 1 && (
                        <div
                          onClick={() => {
                            onSelectRepository?.('all');
                            setRepoDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            selectedRepositoryId === 'all'
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-white font-medium'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-xs">
                              All Repositories (Combined)
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {testCases.length} cases
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1.5">
                      {onOpenCreateRepository && (
                        <button
                          onClick={() => {
                            setRepoDropdownOpen(false);
                            onOpenCreateRepository();
                          }}
                          className="flex-1 py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ New Repo</span>
                        </button>
                      )}
                      {onOpenImportRepository && (
                        <button
                          onClick={() => {
                            setRepoDropdownOpen(false);
                            onOpenImportRepository();
                          }}
                          className="flex-1 py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Upload className="w-3 h-3" />
                          <span>📥 Import Repo</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Search and Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors text-xs"
            title="Search test cases, suites, defects (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quick Search...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Quick Create buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onOpenCreateCase}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">New Case</span>
            </button>
            <button
              onClick={onOpenCreateRun}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>New Run</span>
            </button>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton variant="navbar" />

          {/* Light / Dark Mode Fluent Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* Settings / Personal Preferences Button */}
          {onOpenPreferences && (
            <button
              onClick={onOpenPreferences}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Settings & Personal Preferences (QA Copilot, Display)"
              aria-label="Personal Preferences"
            >
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Active Persona / User Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
              title="Switch Persona / Role for testing"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-sm shadow-xs shrink-0 select-none">
                {getUserEmoji(currentUser.avatar, currentUser.role)}
              </div>
              <div className="hidden lg:flex flex-col items-start text-left">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 leading-none">
                  {getRoleBadge(currentUser.role)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden lg:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-800 dark:text-white">
                    Persona &amp; RBAC Switcher
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test platform behavior under different roles
                  </div>
                </div>
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      u.id === currentUser.id
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 font-medium'
                        : ''
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs shrink-0 select-none">
                      {getUserEmoji(u.avatar, u.role)}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="text-xs text-slate-800 dark:text-slate-200 truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400">
                        {u.email}
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </button>
                ))}

                {onOpenPreferences && (
                  <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 px-2">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenPreferences();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Personal Preferences (QA Copilot)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="relative border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        {/* Left Scroll Arrow */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center bg-gradient-to-r from-slate-100 dark:from-slate-900 via-slate-100/90 dark:via-slate-900/90 to-transparent pl-1 pr-3">
            <button
              onClick={() => handleScrollNav('left')}
              className="p-1 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Scroll left to see more options"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right Scroll Arrow */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center bg-gradient-to-l from-slate-100 dark:from-slate-900 via-slate-100/90 dark:via-slate-900/90 to-transparent pr-1 pl-3">
            <button
              onClick={() => handleScrollNav('right')}
              className="p-1 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Scroll right to see more options"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Tabs Container */}
        <div
          ref={navContainerRef}
          className="px-4 sm:px-6 flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              activeTab === item.id ||
              (item.id === 'admin' &&
                [
                  'admin',
                  'workspace-storage',
                  'import-wizard',
                  'suite-export',
                  'plans',
                  'audit-trail',
                  'ai-studio',
                  'ai-governance',
                  'ai-arch',
                  'prd-viewer',
                  'db-schema',
                  'architecture',
                  'browser-arch',
                  'frontend-arch',
                  'mvp-code',
                  'case-spec',
                  'ux-design',
                ].includes(activeTab));

            return (
              <button
                key={item.id}
                data-active={isItemActive ? 'true' : 'false'}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 py-2.5 px-3.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all duration-150 cursor-pointer shrink-0 ${
                  isItemActive
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 font-bold shadow-2xs'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isItemActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
                {item.copilotBadge && (
                  <span className="ml-1 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-sm">
                    AI
                  </span>
                )}
                {item.id === 'admin' && (
                  <span className="ml-1 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 rounded-sm">
                    Admin Panel
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
