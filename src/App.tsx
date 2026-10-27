/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_ORGANIZATION,
  INITIAL_PROJECTS,
  INITIAL_USERS,
  INITIAL_SUITES,
  INITIAL_TEST_CASES,
  INITIAL_TEST_RUNS,
  INITIAL_TEST_PLANS,
  INITIAL_DEFECTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_REQUIREMENTS,
  ALL_PROJECTS_ID,
  ALL_PROJECTS,
  EMPTY_PROJECT,
  DEMO_PROJECT_IDS,
  isDemoProject,
  isDemoProjectId,
  isDemoUser,
} from './data/mockData';
import {
  Organization,
  Project,
  TestRepository,
  User,
  TestSuite,
  TestCase,
  TestRun,
  TestPlan,
  Defect,
  TestExecution,
  DefectStatus,
  UserRole,
  AuditLogEntry,
  QACopilotPreferences,
  Requirement,
} from './types';
import { Navbar } from './components/Navbar';
import {
  DashboardPage,
  RepositoryPage,
  TestRunsPage,
  DefectsPage,
  QACopilotPage,
  UserManagementPage,
  AdminPage,
} from './pages';
import { LiveTestRunnerModal } from './components/LiveTestRunnerModal';
import { QACopilotFloatingDrawer } from './components/QACopilotFloatingDrawer';
import { PreferencesModal } from './components/PreferencesModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AdminSubTabId } from './components/AdminView';
import { CreateProjectModal } from './components/CreateProjectModal';
import { DeleteProjectModal } from './components/DeleteProjectModal';
import { EditProjectModal } from './components/EditProjectModal';
import { useHashLocation } from './hooks/useHashLocation';
import { CopyProjectModal } from './components/CopyProjectModal';
import { loadCopilotPreferences, saveCopilotPreferences } from './utils/copilotPreferences';
import { sortTestCasesChronological, getDescendantSuiteIds } from './utils/exportUtils';
import { getUserEmoji } from './utils/userUtils';
import { browserDb } from './services/storage/indexedDb';
import { WorkspaceManagerView } from './components/WorkspaceManagerView';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { ImportRepositoryModal } from './components/repository/ImportRepositoryModal';
import { CreateRepositoryModal } from './components/repository/CreateRepositoryModal';

const ADMIN_SUBTABS = new Set([
  'import-wizard',
  'suite-export',
  'workspace-storage',
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
]);

export default function App() {
  const [currentOrg] = useState<Organization>(INITIAL_ORGANIZATION);
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const deletedIds = new Set<string>(
        JSON.parse(localStorage.getItem('qasgard_deleted_project_ids') || '[]')
      );
      const saved = localStorage.getItem('qasgard_projects');
      if (!saved) return [];
      const list = JSON.parse(saved);
      if (!Array.isArray(list)) return [];
      const clean = list.filter((p: Project) => !deletedIds.has(p.id) && !isDemoProject(p));
      localStorage.setItem('qasgard_projects', JSON.stringify(clean));
      return clean;
    } catch {
      return [];
    }
  });

  const [requirements, setRequirements] = useState<Requirement[]>(INITIAL_REQUIREMENTS);
  const [isDbReady, setIsDbReady] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('Just now');

  const reloadFromBrowserDb = async () => {
    try {
      const data = await browserDb.initializeWorkspace();
      const deletedIds = new Set<string>(
        JSON.parse(localStorage.getItem('qasgard_deleted_project_ids') || '[]')
      );
      if (data.projects) {
        const filteredProjects = data.projects.filter(
          (p) => !deletedIds.has(p.id) && !isDemoProject(p)
        );
        setProjects(filteredProjects);
        if (filteredProjects.length === 0) {
          setCurrentProject(EMPTY_PROJECT);
        } else if (!filteredProjects.some((p) => p.id === currentProject.id)) {
          setCurrentProject(filteredProjects[0]);
        }
      }
      if (data.suites) {
        setTestSuites(data.suites.filter((s) => !isDemoProjectId(s.projectId)));
      }
      if (data.testCases) {
        setTestCases(
          sortTestCasesChronological(data.testCases.filter((c) => !isDemoProjectId(c.projectId)))
        );
      }
      if (data.defects) {
        setDefects(data.defects.filter((d) => !isDemoProjectId(d.projectId)));
      }
      if (data.testRuns) {
        setTestRuns(data.testRuns.filter((r) => !isDemoProjectId(r.projectId)));
      }
      if (data.testPlans) {
        setTestPlans(data.testPlans.filter((p) => !isDemoProjectId(p.projectId)));
      }
      if (data.auditLogs) {
        setAuditLogs(
          data.auditLogs.filter((log) => {
            const str = JSON.stringify(log).toLowerCase();
            return (
              !str.includes('zugferd') &&
              !str.includes('finflow') &&
              !str.includes('shopsphere') &&
              !str.includes('auth0') &&
              !str.includes('payment gateway')
            );
          })
        );
      }
      if (data.users) {
        setUsers(data.users.filter((u) => !isDemoUser(u)));
      }
      if (data.requirements) {
        setRequirements(data.requirements.filter((r) => !isDemoProjectId(r.projectId)));
      }

      // Restore Previous Session & Navigation State on Startup
      const [savedSuiteId, savedTab, savedProjectId, savedAdminSubTab] = await Promise.all([
        browserDb.getWorkspaceMeta<string>('lastSelectedSuiteId'),
        browserDb.getWorkspaceMeta<string>('lastActiveTab'),
        browserDb.getWorkspaceMeta<string>('lastActiveProjectId'),
        browserDb.getWorkspaceMeta<AdminSubTabId>('lastAdminSubTab'),
      ]);

      if (savedTab) setActiveTab(savedTab);
      if (savedAdminSubTab) setAdminSubTab(savedAdminSubTab);
      if (savedProjectId && data.projects) {
        const proj = data.projects.find((p) => p.id === savedProjectId && !isDemoProject(p));
        if (proj) setCurrentProject(proj);
      }
      if (savedSuiteId) setSelectedSuiteId(savedSuiteId);

      setIsDbReady(true);
      setLastAutoSaveTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err) {
      console.error('IndexedDB startup error:', err);
    }
  };

  useEffect(() => {
    reloadFromBrowserDb();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('qasgard_projects', JSON.stringify(projects));
    } catch {
      // ignore
    }
    if (isDbReady) {
      browserDb.syncCollection('projects', projects).catch(console.error);
    }
  }, [projects, isDbReady]);

  const [currentProject, setCurrentProject] = useState<Project>(
    () => projects[0] || EMPTY_PROJECT
  );

  // Multiple Repositories state per project
  const [repositories, setRepositories] = useState<TestRepository[]>(() => {
    try {
      const saved = localStorage.getItem('qasgard_repositories');
      if (saved) {
        const parsed: TestRepository[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((r) => !isDemoProjectId(r.projectId));
          localStorage.setItem('qasgard_repositories', JSON.stringify(clean));
          return clean;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('qasgard_repositories', JSON.stringify(repositories));
    } catch {
      // ignore
    }
  }, [repositories]);

  // Persistent selected repository ID per project
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(() => {
    try {
      const initialProjId = (projects[0] || ALL_PROJECTS)?.id;
      return localStorage.getItem(`qasgard_active_repo_${initialProjId}`) || null;
    } catch {
      return null;
    }
  });

  // Pending Create Run context request (from context menu right click on repo or test case)
  const [pendingCreateRunContext, setPendingCreateRunContext] = useState<{
    isOpen: boolean;
    repoId?: string;
    caseId?: string;
    suiteId?: string;
  } | null>(null);

  const handleRequestCreateRunFromContext = (params: {
    repoId?: string;
    caseId?: string;
    suiteId?: string;
  }) => {
    setActiveTab('runs');
    setPendingCreateRunContext({
      isOpen: true,
      repoId: params.repoId,
      caseId: params.caseId,
      suiteId: params.suiteId,
    });
  };

  // When currentProject changes, sync its active repository
  useEffect(() => {
    if (!currentProject || currentProject.id === ALL_PROJECTS_ID) {
      setSelectedRepositoryId('all');
      return;
    }
    try {
      const saved = localStorage.getItem(`qasgard_active_repo_${currentProject.id}`);
      const projectRepos = repositories.filter((r) => r.projectId === currentProject.id);
      if (saved && (saved === 'all' || projectRepos.some((r) => r.id === saved))) {
        setSelectedRepositoryId(saved);
      } else {
        const defaultRepo = projectRepos.find((r) => r.isDefault) || projectRepos[0];
        setSelectedRepositoryId(defaultRepo?.id || `repo-${currentProject.id}-default`);
      }
    } catch {
      // ignore
    }
  }, [currentProject?.id, repositories]);

  const handleSelectRepository = (repoId: string | null) => {
    setSelectedRepositoryId(repoId);
    if (repoId && currentProject?.id && currentProject.id !== ALL_PROJECTS_ID) {
      try {
        localStorage.setItem(`qasgard_active_repo_${currentProject.id}`, repoId);
      } catch {
        // ignore
      }
    }
  };

  const projectRepositories = useMemo(() => {
    if (!currentProject || currentProject.id === ALL_PROJECTS_ID) return repositories;
    let list = repositories.filter((r) => r.projectId === currentProject.id);
    if (list.length === 0) {
      const defaultRepo: TestRepository = {
        id: `repo-${currentProject.id}-default`,
        projectId: currentProject.id,
        name: 'Main Repository',
        description: `Default test repository for ${currentProject.name}`,
        isDefault: true,
        createdAt: new Date().toISOString(),
      };
      list = [defaultRepo];
    }
    return list;
  }, [repositories, currentProject?.id, currentProject?.name]);

  const handleCreateRepository = (projectId: string, name: string, description?: string) => {
    const newRepo: TestRepository = {
      id: `repo-${Date.now()}`,
      projectId,
      name: name.trim() || 'New Repository',
      description: description?.trim() || '',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setRepositories((prev) => [...prev, newRepo]);
    handleSelectRepository(newRepo.id);
    return newRepo;
  };

  const handleUpdateRepository = (repo: TestRepository) => {
    setRepositories((prev) => prev.map((r) => (r.id === repo.id ? repo : r)));
  };

  const handleDeleteRepository = (repoId: string, purgeData: boolean = true) => {
    const repo = repositories.find((r) => r.id === repoId);
    if (!repo || repo.isDefault) return;

    const defaultRepo =
      projectRepositories.find((r) => r.isDefault && r.id !== repoId) || projectRepositories[0];

    if (purgeData) {
      // Completely DELETE all test suites and test cases inside this repository (NO MERGE!)
      const casesToDelete = testCases.filter((c) => c.repositoryId === repoId);
      const suitesToDelete = testSuites.filter((s) => s.repositoryId === repoId);

      setTestCases((prev) => prev.filter((c) => c.repositoryId !== repoId));
      setTestSuites((prev) => prev.filter((s) => s.repositoryId !== repoId));

      // Decrement project test and suite stats
      setProjects((prev) =>
        prev.map((p) =>
          p.id === repo.projectId
            ? {
                ...p,
                suiteCount: Math.max(0, (p.suiteCount || 0) - suitesToDelete.length),
                caseCount: Math.max(0, (p.caseCount || 0) - casesToDelete.length),
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );

      if (currentProject.id === repo.projectId) {
        setCurrentProject((prev) => ({
          ...prev,
          suiteCount: Math.max(0, (prev.suiteCount || 0) - suitesToDelete.length),
          caseCount: Math.max(0, (prev.caseCount || 0) - casesToDelete.length),
          updatedAt: new Date().toISOString(),
        }));
      }

      if (isDbReady) {
        casesToDelete.forEach((c) => browserDb.delete('testCases', c.id).catch(console.error));
        suitesToDelete.forEach((s) => browserDb.delete('suites', s.id).catch(console.error));
      }
    } else {
      // Reassign to default repo if user explicitly chose merge
      if (defaultRepo) {
        setTestSuites((prev) =>
          prev.map((s) => (s.repositoryId === repoId ? { ...s, repositoryId: defaultRepo.id } : s))
        );
        setTestCases((prev) =>
          prev.map((c) => (c.repositoryId === repoId ? { ...c, repositoryId: defaultRepo.id } : c))
        );
      }
    }

    setRepositories((prev) => prev.filter((r) => r.id !== repoId));
    if (selectedRepositoryId === repoId) {
      handleSelectRepository(defaultRepo?.id || null);
    }

    // Add audit log
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'DELETE',
      entityType: 'test_case',
      entityId: repoId,
      entityKey: currentProject.key,
      entityTitle: repo.name,
      summary: purgeData
        ? `Permanently deleted repository "${repo.name}" and purged all test suites and cases`
        : `Deleted repository "${repo.name}" and merged tests into "${defaultRepo?.name}"`,
      complianceReason: 'Repository deletion confirmed by user',
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('qasgard_users');
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (u) =>
              u.name !== 'Sarah Chen' &&
              u.name !== 'Marcus Vance' &&
              u.name !== 'Elena Rostova' &&
              u.name !== 'David Kim' &&
              u.name !== 'Alex Mercer' &&
              !(u.email && u.email.includes('finflow.io'))
          );
          return clean;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('qasgard_users', JSON.stringify(users));
    } catch {
      // ignore
    }
    if (isDbReady) {
      browserDb.syncCollection('users', users).catch(console.error);
    }
  }, [users, isDbReady]);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    return (
      users.find((u) => u.role === 'admin') ||
      users[0] || {
        id: 'usr-admin',
        name: 'Workspace Admin',
        email: 'admin@qasgard.local',
        avatar: '',
        role: 'admin',
        organizationId: currentOrg.id,
        status: 'active',
      }
    );
  });

  const [testSuites, setTestSuites] = useState<TestSuite[]>(() => {
    try {
      const saved = localStorage.getItem('qasgard_suites');
      const loaded: TestSuite[] = saved ? JSON.parse(saved) : INITIAL_SUITES;
      return loaded.filter((s) => !isDemoProjectId(s.projectId));
    } catch {
      return INITIAL_SUITES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qasgard_suites', JSON.stringify(testSuites));
    } catch {
      // ignore
    }
    if (isDbReady) {
      browserDb.putMany('suites', testSuites).catch(console.error);
    }
  }, [testSuites, isDbReady]);

  const [testCases, setTestCases] = useState<TestCase[]>(() => {
    try {
      const saved = localStorage.getItem('qasgard_cases');
      const loaded: TestCase[] = saved ? JSON.parse(saved) : INITIAL_TEST_CASES;
      return sortTestCasesChronological(loaded.filter((c) => !isDemoProjectId(c.projectId)));
    } catch {
      return sortTestCasesChronological(INITIAL_TEST_CASES);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qasgard_cases', JSON.stringify(testCases));
    } catch {
      // ignore
    }
    if (isDbReady) {
      browserDb.putMany('testCases', testCases).catch(console.error);
    }
  }, [testCases, isDbReady]);

  const [testRuns, setTestRuns] = useState<TestRun[]>(() => {
    try {
      const saved = localStorage.getItem('qasgard_runs');
      const loaded: TestRun[] = saved ? JSON.parse(saved) : INITIAL_TEST_RUNS;
      return loaded.filter((r) => !isDemoProjectId(r.projectId));
    } catch {
      return INITIAL_TEST_RUNS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qasgard_runs', JSON.stringify(testRuns));
    } catch {
      // ignore
    }
    if (isDbReady) {
      browserDb.putMany('testRuns', testRuns).catch(console.error);
    }
  }, [testRuns, isDbReady]);

  const [testPlans, setTestPlans] = useState<TestPlan[]>(() => {
    try {
      const saved = localStorage.getItem('qasgard_plans');
      const loaded: TestPlan[] = saved ? JSON.parse(saved) : INITIAL_TEST_PLANS;
      return loaded.filter((p) => !isDemoProjectId(p.projectId));
    } catch {
      return INITIAL_TEST_PLANS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qasgard_plans', JSON.stringify(testPlans));
    } catch {
      // ignore
    }
    if (isDbReady) {
      browserDb.putMany('testPlans', testPlans).catch(console.error);
    }
  }, [testPlans, isDbReady]);

  const [defects, setDefects] = useState<Defect[]>(() => {
    try {
      const saved = localStorage.getItem('qasgard_defects');
      const loaded: Defect[] = saved ? JSON.parse(saved) : INITIAL_DEFECTS;
      return loaded.filter((d) => !isDemoProjectId(d.projectId));
    } catch {
      return INITIAL_DEFECTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qasgard_defects', JSON.stringify(defects));
    } catch {
      // ignore
    }
    if (isDbReady) {
      browserDb.putMany('defects', defects).catch(console.error);
    }
  }, [defects, isDbReady]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  useEffect(() => {
    if (isDbReady) {
      browserDb.putMany('auditLogs', auditLogs).catch(console.error);
    }
  }, [auditLogs, isDbReady]);

  // Set of valid project IDs to guard against orphaned entities
  const existingProjectIds = useMemo(() => new Set(projects.map((p) => p.id)), [projects]);

  // Virtual "All Projects" aggregated object
  const allProjectsCombined: Project = useMemo(() => {
    const validSuites = testSuites.filter((s) => existingProjectIds.has(s.projectId));
    const validCases = testCases.filter((tc) => existingProjectIds.has(tc.projectId));
    const validDefects = defects.filter((d) => existingProjectIds.has(d.projectId));
    const totalOpenBugs = validDefects.filter(
      (d) => d.status === 'open' || d.status === 'in_progress'
    ).length;

    return {
      id: ALL_PROJECTS_ID,
      organizationId: currentOrg.id,
      name: 'All Projects',
      key: 'ALL',
      description:
        'Enterprise consolidated overview displaying test cases, suites, test runs, and defects across all workspace projects.',
      suiteCount: validSuites.length,
      caseCount: validCases.length,
      openBugsCount: totalOpenBugs,
      updatedAt: new Date().toISOString(),
    };
  }, [testSuites, testCases, defects, currentOrg.id, existingProjectIds]);

  const isAllProjects = currentProject.id === ALL_PROJECTS_ID;

  // Auto-recover current project if it was deleted or workspace is empty
  useEffect(() => {
    if (projects.length === 0) {
      if (currentProject.id !== '') {
        setCurrentProject(EMPTY_PROJECT);
        setSelectedSuiteId(null);
      }
    } else if (
      currentProject.id !== ALL_PROJECTS_ID &&
      !projects.some((p) => p.id === currentProject.id)
    ) {
      setCurrentProject(projects[0]);
      setSelectedSuiteId(null);
    }
  }, [projects, currentProject.id]);

  // Live dynamic project statistics for dropdown selection
  const projectsWithCounts = useMemo(() => {
    return projects.map((p) => {
      const pCases = testCases.filter((tc) => tc.projectId === p.id).length;
      const pSuites = testSuites.filter((s) => s.projectId === p.id).length;
      const pBugs = defects.filter(
        (d) => d.projectId === p.id && (d.status === 'open' || d.status === 'in_progress')
      ).length;
      return {
        ...p,
        caseCount: pCases,
        suiteCount: pSuites,
        openBugsCount: pBugs,
      };
    });
  }, [projects, testCases, testSuites, defects]);

  // Filtered datasets based on selected project (data only from loaded project, or all if "All projects")
  const activeTestSuites = useMemo(() => {
    if (isAllProjects) return testSuites.filter((s) => existingProjectIds.has(s.projectId));
    return testSuites.filter((s) => s.projectId === currentProject.id);
  }, [testSuites, currentProject.id, isAllProjects, existingProjectIds]);

  const activeTestCases = useMemo(() => {
    if (isAllProjects) return testCases.filter((tc) => existingProjectIds.has(tc.projectId));
    return testCases.filter((tc) => tc.projectId === currentProject.id);
  }, [testCases, currentProject.id, isAllProjects, existingProjectIds]);

  const activeTestRuns = useMemo(() => {
    if (isAllProjects) return testRuns.filter((r) => existingProjectIds.has(r.projectId));
    return testRuns.filter((r) => r.projectId === currentProject.id);
  }, [testRuns, currentProject.id, isAllProjects, existingProjectIds]);

  const activeDefects = useMemo(() => {
    if (isAllProjects) return defects.filter((d) => existingProjectIds.has(d.projectId));
    return defects.filter((d) => d.projectId === currentProject.id);
  }, [defects, currentProject.id, isAllProjects, existingProjectIds]);

  const activeTestPlans = useMemo(() => {
    if (isAllProjects) return testPlans.filter((p) => existingProjectIds.has(p.projectId));
    return testPlans.filter((p) => p.projectId === currentProject.id);
  }, [testPlans, currentProject.id, isAllProjects, existingProjectIds]);

  useEffect(() => {
    if (isDbReady) {
      browserDb.putMany('requirements', requirements).catch(console.error);
      setLastAutoSaveTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }
  }, [requirements, isDbReady]);

  const activeRequirements = useMemo(() => {
    if (isAllProjects) return requirements.filter((req) => existingProjectIds.has(req.projectId));
    return requirements.filter((req) => req.projectId === currentProject.id);
  }, [requirements, currentProject.id, isAllProjects, existingProjectIds]);

  const [activeTab, setActiveTab] = useHashLocation('dashboard');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTabId>('import-wizard');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);

  // Auto-persist navigation and session states so page refresh / browser restart restores exactly where the user was
  useEffect(() => {
    if (isDbReady && selectedSuiteId) {
      browserDb.setWorkspaceMeta('lastSelectedSuiteId', selectedSuiteId).catch(console.error);
    }
  }, [selectedSuiteId, isDbReady]);

  useEffect(() => {
    if (isDbReady && activeTab) {
      browserDb.setWorkspaceMeta('lastActiveTab', activeTab).catch(console.error);
    }
  }, [activeTab, isDbReady]);

  useEffect(() => {
    if (isDbReady && currentProject?.id) {
      browserDb.setWorkspaceMeta('lastActiveProjectId', currentProject.id).catch(console.error);
    }
  }, [currentProject?.id, isDbReady]);

  useEffect(() => {
    if (isDbReady && adminSubTab) {
      browserDb.setWorkspaceMeta('lastAdminSubTab', adminSubTab).catch(console.error);
    }
  }, [adminSubTab, isDbReady]);

  // Modals state
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToCopy, setProjectToCopy] = useState<Project | null>(null);
  const [isImportRepoModalOpen, setIsImportRepoModalOpen] = useState(false);
  const [isCreateRepoModalOpen, setIsCreateRepoModalOpen] = useState(false);
  const [activeRunningRunId, setActiveRunningRunId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  // Synchronize documentElement dark mode class for root, portal, and modal components
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Tab Navigation router: maps sub-tabs to Admin panel seamlessly
  const handleNavigateTab = (tab: string) => {
    if (ADMIN_SUBTABS.has(tab)) {
      setActiveTab('admin');
      setAdminSubTab(tab as AdminSubTabId);
    } else {
      setActiveTab(tab);
    }
  };

  // Create Project handler
  const handleCreateProject = (projectData: {
    name: string;
    key: string;
    description: string;
    initialSuiteName?: string;
  }) => {
    const newProjectId = `proj-${Date.now()}`;
    const newProjKey = projectData.key.toUpperCase().trim();
    const newProject: Project = {
      id: newProjectId,
      organizationId: currentOrg.id,
      name: projectData.name.trim(),
      key: newProjKey,
      description: projectData.description.trim(),
      suiteCount: 1,
      caseCount: 0,
      openBugsCount: 0,
      updatedAt: new Date().toISOString(),
    };

    const initialSuite: TestSuite = {
      id: `suite-${Date.now()}`,
      projectId: newProjectId,
      name: projectData.initialSuiteName?.trim() || `${projectData.name} Core Suite`,
      description: `Default test suite for ${projectData.name}`,
      caseCount: 0,
    };

    setProjects((prev) => [newProject, ...prev]);
    setTestSuites((prev) => [...prev, initialSuite]);
    setCurrentProject(newProject);
    setSelectedSuiteId(initialSuite.id);
    setActiveTab('repository');

    // Audit log entry
    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'CREATE',
      entityType: 'project',
      entityId: newProjectId,
      entityKey: newProjKey,
      entityTitle: newProject.name,
      summary: `Created new project "${newProject.name}" [${newProjKey}]`,
      complianceReason: 'Project provisioning authorized by user',
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // Import Repository handler (import as a new project, as a new repository in this project, or merge into current repository)
  const handleImportRepository = (
    importedData: {
      project?: Partial<Project>;
      suites?: Partial<TestSuite>[];
      testCases?: Partial<TestCase>[];
    },
    mode: 'new' | 'new_repo' | 'merge',
    targetRepoName?: string
  ) => {
    if (mode === 'new') {
      const newProjectId = `proj-${Date.now()}`;
      const baseKey = (importedData.project?.key || 'IMP').toUpperCase().trim();
      let finalKey = baseKey;
      let counter = 1;
      while (projects.some((p) => p.key === finalKey)) {
        finalKey = `${baseKey}${counter++}`;
      }

      const newProject: Project = {
        id: newProjectId,
        organizationId: currentOrg.id,
        name: importedData.project?.name || `Imported Repository (${finalKey})`,
        key: finalKey,
        description: importedData.project?.description || 'Imported test repository',
        suiteCount: importedData.suites?.length || 1,
        caseCount: importedData.testCases?.length || 0,
        openBugsCount: 0,
        updatedAt: new Date().toISOString(),
      };

      const newDefaultRepo: TestRepository = {
        id: `repo-${newProjectId}-default`,
        projectId: newProjectId,
        name: 'Main Repository',
        description: `Default test repository for ${newProject.name}`,
        isDefault: true,
        createdAt: new Date().toISOString(),
      };

      const suiteIdMap = new Map<string, string>();
      const newSuites: TestSuite[] = (importedData.suites || []).map((s, idx) => {
        const newSuiteId = `suite-${Date.now()}-${idx}`;
        if (s.id) suiteIdMap.set(s.id, newSuiteId);
        return {
          id: newSuiteId,
          projectId: newProjectId,
          repositoryId: newDefaultRepo.id,
          name: s.name || `Suite ${idx + 1}`,
          description: s.description || '',
          parentId: null,
          caseCount: 0,
        };
      });

      (importedData.suites || []).forEach((oldS, idx) => {
        if (oldS.parentId && suiteIdMap.has(oldS.parentId)) {
          newSuites[idx].parentId = suiteIdMap.get(oldS.parentId) || null;
        }
      });

      if (newSuites.length === 0) {
        newSuites.push({
          id: `suite-${Date.now()}`,
          projectId: newProjectId,
          repositoryId: newDefaultRepo.id,
          name: `${newProject.name} Core Suite`,
          description: 'Default test suite',
          caseCount: importedData.testCases?.length || 0,
        });
      }

      const newCases: TestCase[] = (importedData.testCases || []).map((tc, idx) => {
        const mappedSuiteId =
          (tc.suiteId && suiteIdMap.get(tc.suiteId)) || newSuites[0]?.id || 'default';
        const targetSuite = newSuites.find((s) => s.id === mappedSuiteId);
        return {
          id: `case-${Date.now()}-${idx}`,
          projectId: newProjectId,
          repositoryId: newDefaultRepo.id,
          key:
            tc.key && !tc.key.includes('-')
              ? `${finalKey}-${tc.key}`
              : tc.key || `${finalKey}-${Math.floor(100 + idx)}`,
          title: tc.title || `Test Case ${idx + 1}`,
          description: tc.description || '',
          preconditions: tc.preconditions || '',
          suiteId: mappedSuiteId,
          suiteName: targetSuite?.name || tc.suiteName || 'General',
          priority: tc.priority || 'medium',
          severity: tc.severity || 'normal',
          type: tc.type || 'functional',
          layer: tc.layer || 'e2e',
          behavior: tc.behavior || 'positive',
          automationStatus: tc.automationStatus || 'manual',
          status: tc.status || 'actual',
          tags: tc.tags || ['imported'],
          steps: tc.steps || [],
          requirementRefs: tc.requirementRefs || [],
          attachments: tc.attachments || [],
          comments: tc.comments || [],
          customFields: Array.isArray(tc.customFields) ? tc.customFields : [],
          createdAt: tc.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      setProjects((prev) => [newProject, ...prev]);
      setRepositories((prev) => [...prev, newDefaultRepo]);
      setSelectedRepositoryId(newDefaultRepo.id);
      setTestSuites((prev) => [...prev, ...newSuites]);
      setTestCases((prev) => [...prev, ...newCases]);
      setCurrentProject(newProject);
      setSelectedSuiteId(newSuites[0]?.id || null);

      if (isDbReady) {
        browserDb.put('projects', newProject).catch(console.error);
        browserDb.putMany('suites', newSuites).catch(console.error);
        browserDb.putMany('testCases', newCases).catch(console.error);
      }
    } else if (mode === 'new_repo') {
      // Create as a NEW REPOSITORY within the CURRENT PROJECT
      let targetProjectId = currentProject.id;
      let targetProjectKey = currentProject.key;
      let targetProject = currentProject;

      // If current view is "All Projects", resolve to the first real project
      if (targetProjectId === ALL_PROJECTS_ID || !targetProjectId) {
        const firstReal = projects.find((p) => p.id !== ALL_PROJECTS_ID) || projects[0];
        if (firstReal) {
          targetProjectId = firstReal.id;
          targetProjectKey = firstReal.key;
          targetProject = firstReal;
          setCurrentProject(firstReal);
        }
      }

      const existingReposForTarget = repositories.filter((r) => r.projectId === targetProjectId);
      const repoName =
        targetRepoName?.trim() ||
        importedData.project?.name ||
        `Repository ${existingReposForTarget.length + 1}`;
      const newRepoId = `repo-${Date.now()}`;
      const newRepo: TestRepository = {
        id: newRepoId,
        projectId: targetProjectId,
        name: repoName,
        description:
          importedData.project?.description ||
          `Imported repository backup for ${targetProject.name}`,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };

      const suiteIdMap = new Map<string, string>();
      const newSuites: TestSuite[] = (importedData.suites || []).map((s, idx) => {
        const newSuiteId = `suite-${Date.now()}-${idx}`;
        if (s.id) suiteIdMap.set(s.id, newSuiteId);
        return {
          id: newSuiteId,
          projectId: targetProjectId,
          repositoryId: newRepoId,
          name: s.name || `Suite ${idx + 1}`,
          description: s.description || '',
          parentId: null,
          caseCount: 0,
        };
      });

      (importedData.suites || []).forEach((oldS, idx) => {
        if (oldS.parentId && suiteIdMap.has(oldS.parentId)) {
          newSuites[idx].parentId = suiteIdMap.get(oldS.parentId) || null;
        }
      });

      if (newSuites.length === 0) {
        newSuites.push({
          id: `suite-${Date.now()}`,
          projectId: targetProjectId,
          repositoryId: newRepoId,
          name: `${repoName} Core Suite`,
          description: 'Default test suite',
          caseCount: importedData.testCases?.length || 0,
        });
      }

      const newCases: TestCase[] = (importedData.testCases || []).map((tc, idx) => {
        const mappedSuiteId =
          (tc.suiteId && suiteIdMap.get(tc.suiteId)) || newSuites[0]?.id || 'default';
        const targetSuite = newSuites.find((s) => s.id === mappedSuiteId);
        return {
          id: `case-${Date.now()}-${idx}`,
          projectId: targetProjectId,
          repositoryId: newRepoId,
          key:
            tc.key && !tc.key.includes('-')
              ? `${targetProjectKey}-${tc.key}`
              : tc.key || `${targetProjectKey}-${Math.floor(200 + idx)}`,
          title: tc.title || `Test Case ${idx + 1}`,
          description: tc.description || '',
          preconditions: tc.preconditions || '',
          suiteId: mappedSuiteId,
          suiteName: targetSuite?.name || tc.suiteName || 'General',
          priority: tc.priority || 'medium',
          severity: tc.severity || 'normal',
          type: tc.type || 'functional',
          layer: tc.layer || 'e2e',
          behavior: tc.behavior || 'positive',
          automationStatus: tc.automationStatus || 'manual',
          status: tc.status || 'actual',
          tags: Array.from(new Set([...(tc.tags || []), 'imported'])),
          steps: tc.steps || [],
          requirementRefs: tc.requirementRefs || [],
          attachments: tc.attachments || [],
          comments: tc.comments || [],
          customFields: Array.isArray(tc.customFields) ? tc.customFields : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Update repositories: add the new repository under target project
      setRepositories((prev) => [...prev, newRepo]);
      setSelectedRepositoryId(newRepoId);
      setTestSuites((prev) => [...prev, ...newSuites]);
      setTestCases((prev) => [...prev, ...newCases]);
      setSelectedSuiteId(newSuites[0]?.id || null);

      // Update project suiteCount and caseCount
      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjectId
            ? {
                ...p,
                suiteCount: (p.suiteCount || 0) + newSuites.length,
                caseCount: (p.caseCount || 0) + newCases.length,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );

      if (currentProject.id === targetProjectId) {
        setCurrentProject((prev) => ({
          ...prev,
          suiteCount: (prev.suiteCount || 0) + newSuites.length,
          caseCount: (prev.caseCount || 0) + newCases.length,
          updatedAt: new Date().toISOString(),
        }));
      }

      if (isDbReady) {
        browserDb.putMany('suites', newSuites).catch(console.error);
        browserDb.putMany('testCases', newCases).catch(console.error);
      }

      // Add audit log
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          role: currentUser.role,
        },
        action: 'CREATE',
        entityType: 'test_case',
        entityId: newRepoId,
        entityKey: targetProjectKey,
        entityTitle: newRepo.name,
        summary: `Imported repository "${newRepo.name}" (${newSuites.length} suites, ${newCases.length} cases) into project "${targetProject.name}"`,
        complianceReason: 'Repository import executed by user',
        ipAddress: '192.168.1.104',
        integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);
    } else {
      // Merge into current active repository
      let targetProjectId = currentProject.id;
      let targetProjectKey = currentProject.key;
      let targetProject = currentProject;

      if (targetProjectId === ALL_PROJECTS_ID || !targetProjectId) {
        const firstReal = projects.find((p) => p.id !== ALL_PROJECTS_ID) || projects[0];
        if (firstReal) {
          targetProjectId = firstReal.id;
          targetProjectKey = firstReal.key;
          targetProject = firstReal;
          setCurrentProject(firstReal);
        }
      }

      const targetRepoId =
        selectedRepositoryId || projectRepositories[0]?.id || `repo-${targetProjectId}-default`;

      const suiteIdMap = new Map<string, string>();
      const newSuites: TestSuite[] = (importedData.suites || []).map((s, idx) => {
        const newSuiteId = `suite-${Date.now()}-${idx}`;
        if (s.id) suiteIdMap.set(s.id, newSuiteId);
        return {
          id: newSuiteId,
          projectId: targetProjectId,
          repositoryId: targetRepoId,
          name: s.name || `Imported Suite ${idx + 1}`,
          description: s.description || '',
          parentId: null,
          caseCount: 0,
        };
      });

      (importedData.suites || []).forEach((oldS, idx) => {
        if (oldS.parentId && suiteIdMap.has(oldS.parentId)) {
          newSuites[idx].parentId = suiteIdMap.get(oldS.parentId) || null;
        }
      });

      const fallbackSuite = activeTestSuites[0] || newSuites[0];

      const newCases: TestCase[] = (importedData.testCases || []).map((tc, idx) => {
        const mappedSuiteId =
          (tc.suiteId && suiteIdMap.get(tc.suiteId)) || fallbackSuite?.id || 'default';
        const targetSuite =
          newSuites.find((s) => s.id === mappedSuiteId) ||
          activeTestSuites.find((s) => s.id === mappedSuiteId);

        return {
          id: `case-${Date.now()}-${idx}`,
          projectId: targetProjectId,
          repositoryId: targetRepoId,
          key: `${targetProjectKey}-${Math.floor(200 + Math.random() * 800)}`,
          title: tc.title || `Imported Case ${idx + 1}`,
          description: tc.description || '',
          preconditions: tc.preconditions || '',
          suiteId: mappedSuiteId,
          suiteName: targetSuite?.name || tc.suiteName || 'General',
          priority: tc.priority || 'medium',
          severity: tc.severity || 'normal',
          type: tc.type || 'functional',
          layer: tc.layer || 'e2e',
          behavior: tc.behavior || 'positive',
          automationStatus: tc.automationStatus || 'manual',
          status: tc.status || 'actual',
          tags: Array.from(new Set([...(tc.tags || []), 'imported'])),
          steps: tc.steps || [],
          requirementRefs: tc.requirementRefs || [],
          attachments: tc.attachments || [],
          comments: tc.comments || [],
          customFields: Array.isArray(tc.customFields) ? tc.customFields : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      if (newSuites.length > 0) {
        setTestSuites((prev) => [...prev, ...newSuites]);
        if (isDbReady) browserDb.putMany('suites', newSuites).catch(console.error);
      }
      if (newCases.length > 0) {
        setTestCases((prev) => [...prev, ...newCases]);
        if (isDbReady) browserDb.putMany('testCases', newCases).catch(console.error);
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjectId
            ? {
                ...p,
                suiteCount: (p.suiteCount || 0) + newSuites.length,
                caseCount: (p.caseCount || 0) + newCases.length,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );

      if (currentProject.id === targetProjectId) {
        setCurrentProject((prev) => ({
          ...prev,
          suiteCount: (prev.suiteCount || 0) + newSuites.length,
          caseCount: (prev.caseCount || 0) + newCases.length,
          updatedAt: new Date().toISOString(),
        }));
      }
    }
  };

  // Delete Project handler & cascade purge of all project artifacts
  const handleConfirmDeleteProject = (projectId: string) => {
    const pToDelete = projects.find((p) => p.id === projectId);
    if (!pToDelete) return;

    // Record in persistent deleted project IDs so it NEVER resurrects
    try {
      const deletedIds = new Set<string>(
        JSON.parse(localStorage.getItem('qasgard_deleted_project_ids') || '[]')
      );
      deletedIds.add(projectId);
      localStorage.setItem('qasgard_deleted_project_ids', JSON.stringify(Array.from(deletedIds)));
    } catch {
      // ignore
    }

    // Explicitly delete from IndexedDB
    browserDb.delete('projects', projectId).catch(console.error);

    // 1. Purge the project itself
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    // 2. Cascade purge all related entities
    setTestSuites((prev) => prev.filter((s) => s.projectId !== projectId));
    setTestCases((prev) => prev.filter((tc) => tc.projectId !== projectId));
    setTestRuns((prev) => prev.filter((r) => r.projectId !== projectId));
    setDefects((prev) => prev.filter((d) => d.projectId !== projectId));
    setTestPlans((prev) => prev.filter((p) => p.projectId !== projectId));

    // 3. Purge cached project-specific localStorage
    try {
      localStorage.removeItem(`fav_suites_${projectId}`);
      localStorage.removeItem(`recent_cases_${projectId}`);
      localStorage.removeItem(`qasgard_case_draft_${projectId}`);
    } catch {
      // ignore
    }

    // 4. Switch current project if active project was deleted
    if (currentProject.id === projectId) {
      const remainingProjects = projects.filter((p) => p.id !== projectId);
      if (remainingProjects.length > 0) {
        setCurrentProject(remainingProjects[0]);
      } else {
        setCurrentProject(EMPTY_PROJECT);
      }
      setSelectedSuiteId(null);
    }

    // 5. Audit log entry for project decommissioning
    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'DELETE',
      entityType: 'project',
      entityId: projectId,
      entityKey: pToDelete.key,
      entityTitle: pToDelete.name,
      summary: `Permanently deleted project "${pToDelete.name}" [${pToDelete.key}] and purged all associated test suites, test cases, test runs, defects, and milestone plans`,
      complianceReason:
        'Project decommissioning & total cascade data deletion requested by authorized user',
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    setProjectToDelete(null);
  };

  // Edit Project handler
  const handleUpdateProject = (updated: {
    id: string;
    name: string;
    key: string;
    description: string;
  }) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== updated.id) return p;
        return {
          ...p,
          name: updated.name,
          key: updated.key,
          description: updated.description,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    if (currentProject.id === updated.id) {
      setCurrentProject((prev) => ({
        ...prev,
        name: updated.name,
        key: updated.key,
        description: updated.description,
        updatedAt: new Date().toISOString(),
      }));
    }

    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'UPDATE',
      entityType: 'project',
      entityId: updated.id,
      entityKey: updated.key,
      entityTitle: updated.name,
      summary: `Updated project configuration for "${updated.name}" [${updated.key}]`,
      complianceReason: 'Project settings modification authorized by user',
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
    setProjectToEdit(null);
  };

  // Copy / Clone Entire Project handler
  const handleCopyProject = (copyData: {
    sourceProjectId: string;
    newName: string;
    newKey: string;
    newDescription: string;
    includeSuites: boolean;
    includeCases: boolean;
  }) => {
    const source = projects.find((p) => p.id === copyData.sourceProjectId);
    if (!source) return;

    const newProjectId = `proj-${Date.now()}`;
    const newProjectKey = copyData.newKey.toUpperCase().trim();

    // Deep clone suites preserving hierarchy
    const suiteIdMap: Record<string, string> = {};
    const suitesToClone = copyData.includeSuites
      ? testSuites.filter((s) => s.projectId === source.id)
      : [];

    const newSuites: TestSuite[] = suitesToClone.map((oldSuite, idx) => {
      const newId = `suite-${Date.now()}-${idx}`;
      suiteIdMap[oldSuite.id] = newId;
      return {
        ...oldSuite,
        id: newId,
        projectId: newProjectId,
        name: oldSuite.name,
        description: oldSuite.description,
        parentId: null,
      };
    });

    // Re-link parentId references
    newSuites.forEach((ns, idx) => {
      const oldSuite = suitesToClone[idx];
      if (oldSuite.parentId && suiteIdMap[oldSuite.parentId]) {
        ns.parentId = suiteIdMap[oldSuite.parentId];
      } else {
        ns.parentId = null;
      }
    });

    // If no suites were cloned, create a starter suite
    if (newSuites.length === 0) {
      const starterSuite: TestSuite = {
        id: `suite-${Date.now()}`,
        projectId: newProjectId,
        name: `${copyData.newName} Core Suite`,
        description: `Initial suite for ${copyData.newName}`,
        caseCount: 0,
      };
      newSuites.push(starterSuite);
    }

    // Clone test cases if requested
    const casesToClone =
      copyData.includeCases && copyData.includeSuites
        ? testCases.filter((tc) => tc.projectId === source.id)
        : [];

    const newCases: TestCase[] = casesToClone.map((oldCase, idx) => {
      const newCaseId = `case-${Date.now()}-${idx}`;
      const newKey = `${newProjectKey}-${100 + idx + 1}`;
      const newSuiteId = suiteIdMap[oldCase.suiteId] || newSuites[0]?.id || 'suite-1';
      const targetSuite = newSuites.find((s) => s.id === newSuiteId);

      return {
        ...oldCase,
        id: newCaseId,
        key: newKey,
        projectId: newProjectId,
        suiteId: newSuiteId,
        suiteName: targetSuite ? targetSuite.name : oldCase.suiteName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const newProject: Project = {
      id: newProjectId,
      organizationId: currentOrg.id,
      name: copyData.newName.trim(),
      key: newProjectKey,
      description: copyData.newDescription.trim(),
      suiteCount: newSuites.length,
      caseCount: newCases.length,
      openBugsCount: 0,
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProject, ...prev]);
    setTestSuites((prev) => [...prev, ...newSuites]);
    setTestCases((prev) => [...prev, ...newCases]);

    // Switch to cloned project
    setCurrentProject(newProject);
    setSelectedSuiteId(newSuites[0]?.id || null);
    setActiveTab('repository');

    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'CREATE',
      entityType: 'project',
      entityId: newProjectId,
      entityKey: newProjectKey,
      entityTitle: newProject.name,
      summary: `Cloned whole project from "${source.name}" [${source.key}] into new project "${newProject.name}" [${newProjectKey}] (${newSuites.length} suites, ${newCases.length} cases cloned)`,
      complianceReason: 'Project replication authorized by user',
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
    setProjectToCopy(null);
  };

  // QA Copilot User Preferences (persisted per user)
  const [copilotPrefs, setCopilotPrefs] = useState<QACopilotPreferences>(() =>
    loadCopilotPreferences(currentUser?.id)
  );

  const handleUpdateCopilotPrefs = (updated: Partial<QACopilotPreferences>) => {
    setCopilotPrefs((prev) => {
      const next = { ...prev, ...updated };
      saveCopilotPreferences(next, currentUser?.id);
      return next;
    });
  };

  const handleResetCopilotPosition = () => {
    if (typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 170);
      const defaultY = Math.max(60, window.innerHeight - 80);
      handleUpdateCopilotPrefs({
        position: { x: defaultX, y: defaultY },
        state: 'minimized',
      });
    }
  };

  // Cmd+K hotkey for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Test Cases
  const handleAddTestCase = (tc: Partial<TestCase>) => {
    const targetProjectId =
      tc.projectId ||
      (currentProject.id !== ALL_PROJECTS_ID
        ? currentProject.id
        : testSuites.find((s) => s.id === tc.suiteId)?.projectId ||
          projects[0]?.id ||
          '');

    const parentProj = projects.find((p) => p.id === targetProjectId) || currentProject;
    const projectKeyPrefix = parentProj.id !== ALL_PROJECTS_ID ? parentProj.key : 'TC';

    const fullCase: TestCase = {
      id: `case-${Date.now()}`,
      key: tc.key || `${projectKeyPrefix}-${Math.floor(100 + Math.random() * 900)}`,
      projectId: targetProjectId,
      suiteId: tc.suiteId || activeTestSuites[0]?.id || testSuites[0]?.id || 'suite-1',
      suiteName: tc.suiteName || activeTestSuites[0]?.name || testSuites[0]?.name || 'General',
      title: tc.title || 'Untitled Test Case',
      description: tc.description || '',
      preconditions: tc.preconditions || '',
      type: tc.type || 'functional',
      priority: tc.priority || 'medium',
      severity: tc.severity || 'normal',
      layer: tc.layer || 'e2e',
      status: 'actual',
      automationStatus: tc.automationStatus || 'automated',
      steps: tc.steps || [],
      tags: tc.tags || [],
      attachments: tc.attachments || [],
      comments: tc.comments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTestCases((prev) => [fullCase, ...prev]);

    // Update suite case count
    setTestSuites((prev) =>
      prev.map((s) => (s.id === fullCase.suiteId ? { ...s, caseCount: s.caseCount + 1 } : s))
    );

    // Record audit event
    const createAudit: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'CREATE',
      entityType: 'test_case',
      entityId: fullCase.id,
      entityKey: fullCase.key,
      entityTitle: fullCase.title,
      summary: `Authored new test case in suite "${fullCase.suiteName}"`,
      complianceReason: `QA Lifecycle Verification Creation`,
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [createAudit, ...prev]);
  };

  const handleUpdateTestCase = (updated: TestCase) => {
    setTestCases((prev) => prev.map((tc) => (tc.id === updated.id ? updated : tc)));

    const updateAudit: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'UPDATE',
      entityType: 'test_case',
      entityId: updated.id,
      entityKey: updated.key,
      entityTitle: updated.title,
      summary: `Updated test case details and step assertions`,
      complianceReason: `Compliance-traceable modification by ${currentUser.name}`,
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [updateAudit, ...prev]);
  };

  const handleDeleteTestCase = (caseId: string) => {
    const targetCase = testCases.find((tc) => tc.id === caseId);
    setTestCases((prev) => prev.filter((tc) => tc.id !== caseId));

    if (targetCase) {
      setTestSuites((prev) =>
        prev.map((s) =>
          s.id === targetCase.suiteId ? { ...s, caseCount: Math.max(0, s.caseCount - 1) } : s
        )
      );

      const deleteAudit: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          role: currentUser.role,
        },
        action: 'DELETE',
        entityType: 'test_case',
        entityId: targetCase.id,
        entityKey: targetCase.key,
        entityTitle: targetCase.title,
        summary: `Deleted test case from suite "${targetCase.suiteName}"`,
        complianceReason: `Test case decommission authorized by QA Lead`,
        ipAddress: '192.168.1.104',
        integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      };
      setAuditLogs((prev) => [deleteAudit, ...prev]);
    }
  };

  // Handlers for Test Suites
  const handleAddSuite = (s: Partial<TestSuite>) => {
    const targetProjectId =
      s.projectId ||
      (currentProject.id !== ALL_PROJECTS_ID
        ? currentProject.id
        : projects[0]?.id || '');

    const targetRepoId =
      s.repositoryId ||
      (selectedRepositoryId && selectedRepositoryId !== 'all'
        ? selectedRepositoryId
        : projectRepositories.find((r) => r.isDefault)?.id || projectRepositories[0]?.id || `repo-${targetProjectId}-default`);

    const newSuite: TestSuite = {
      id: `suite-${Date.now()}`,
      projectId: targetProjectId,
      repositoryId: targetRepoId,
      parentId: s.parentId !== undefined ? s.parentId : null,
      order: s.order !== undefined ? s.order : Date.now(),
      name: s.name || 'New Suite',
      description: s.description || '',
      caseCount: 0,
    };
    setTestSuites((prev) => [...prev, newSuite]);
  };

  const handleUpdateSuite = (updated: TestSuite) => {
    setTestSuites((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    // Sync suiteName on all test cases in this suite
    setTestCases((prev) =>
      prev.map((tc) => (tc.suiteId === updated.id ? { ...tc, suiteName: updated.name } : tc))
    );

    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'UPDATE',
      entityType: 'test_suite',
      entityId: updated.id,
      entityKey: updated.name,
      entityTitle: updated.name,
      summary: `Renamed/updated test suite "${updated.name}"`,
      complianceReason: 'Suite modification authorized by QA Lead',
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const handleDeleteSuite = (suiteId: string) => {
    const targetSuite = testSuites.find((s) => s.id === suiteId);
    if (!targetSuite) return;

    // Collect target suite and all nested child suite IDs recursively
    const descendantIds = new Set(getDescendantSuiteIds(suiteId, testSuites));
    descendantIds.add(suiteId);

    // 1. Remove suites
    setTestSuites((prev) => prev.filter((s) => !descendantIds.has(s.id)));

    // 2. Cascade purge test cases in these suites
    setTestCases((prev) => prev.filter((tc) => !descendantIds.has(tc.suiteId)));

    // 3. Clear selectedSuiteId if it was in the purged hierarchy
    if (selectedSuiteId && descendantIds.has(selectedSuiteId)) {
      setSelectedSuiteId(null);
    }

    // 4. Record audit log
    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
      action: 'DELETE',
      entityType: 'test_suite',
      entityId: suiteId,
      entityKey: targetSuite.name,
      entityTitle: targetSuite.name,
      summary: `Deleted test suite "${targetSuite.name}" and purged all ${descendantIds.size - 1} child suites and associated test cases`,
      complianceReason: 'Test suite decommissioning authorized by QA Lead',
      ipAddress: '192.168.1.104',
      integrityHash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const handleImportWizardCompleted = (
    newCases: Partial<TestCase>[],
    newSuites: Partial<TestSuite>[]
  ) => {
    const targetProjectId =
      currentProject.id !== ALL_PROJECTS_ID ? currentProject.id : projects[0]?.id || '';

    if (newSuites.length > 0) {
      const suitesToAdd: TestSuite[] = newSuites.map((s, idx) => ({
        id: `suite-imp-${Date.now()}-${idx}`,
        projectId: s.projectId || targetProjectId,
        name: s.name || 'Imported Suite',
        description: s.description || 'Imported via Universal Importer',
        caseCount: s.caseCount || 0,
      }));
      setTestSuites((prev) => [...prev, ...suitesToAdd]);
    }

    newCases.forEach((tc) => {
      handleAddTestCase(tc);
    });

    setActiveTab('repository');
  };

  // Handlers for Test Runs
  const handleCreateRun = (runDraft: Partial<TestRun>) => {
    const targetProjectId =
      runDraft.projectId ||
      (currentProject.id !== ALL_PROJECTS_ID
        ? currentProject.id
        : projects[0]?.id || '');

    const fullRun: TestRun = {
      id: `run-${Date.now()}`,
      key: runDraft.key || `RUN-${Math.floor(200 + Math.random() * 800)}`,
      projectId: targetProjectId,
      title: runDraft.title || 'New Regression Run',
      description: runDraft.description || '',
      environment: runDraft.environment || 'Staging',
      status: 'active',
      assignedTo: runDraft.assignedTo || currentUser.name,
      createdAt: new Date().toISOString(),
      totalCases: runDraft.totalCases || activeTestCases.length,
      passedCount: 0,
      failedCount: 0,
      blockedCount: 0,
      skippedCount: 0,
      untestedCount: runDraft.totalCases || activeTestCases.length,
      executions: runDraft.executions || [],
    };
    setTestRuns((prev) => [fullRun, ...prev]);
  };

  const handleUpdateExecution = (runId: string, execution: TestExecution) => {
    setTestRuns((prevRuns) =>
      prevRuns.map((r) => {
        if (r.id !== runId) return r;
        const updatedExecs = r.executions.map((ex) => (ex.id === execution.id ? execution : ex));

        const passed = updatedExecs.filter((e) => e.status === 'passed').length;
        const failed = updatedExecs.filter((e) => e.status === 'failed').length;
        const blocked = updatedExecs.filter((e) => e.status === 'blocked').length;
        const skipped = updatedExecs.filter((e) => e.status === 'skipped').length;
        const untested = updatedExecs.filter((e) => e.status === 'untested').length;

        return {
          ...r,
          executions: updatedExecs,
          passedCount: passed,
          failedCount: failed,
          blockedCount: blocked,
          skippedCount: skipped,
          untestedCount: untested,
        };
      })
    );
  };

  const handleCompleteRun = (runId: string) => {
    setTestRuns((prev) =>
      prev.map((r) =>
        r.id === runId
          ? {
              ...r,
              status: 'completed',
              completedAt: new Date().toISOString(),
            }
          : r
      )
    );
    setActiveRunningRunId(null);
    alert('Test run marked as completed and results logged.');
  };

  // Handlers for Defects
  const handleFileDefect = (def: Partial<Defect>) => {
    const targetProjectId =
      def.projectId ||
      (currentProject.id !== ALL_PROJECTS_ID
        ? currentProject.id
        : (def.testCaseId
            ? testCases.find((c) => c.id === def.testCaseId)?.projectId
            : undefined) ||
          projects[0]?.id ||
          '');

    const targetCase = def.testCaseId ? testCases.find((c) => c.id === def.testCaseId) : undefined;
    const targetRun = def.runId ? testRuns.find((r) => r.id === def.runId) : undefined;

    const fullDefect: Defect = {
      id: `def-${Date.now()}`,
      key: def.key || `DEF-${Math.floor(100 + Math.random() * 900)}`,
      projectId: targetProjectId,
      testCaseId: def.testCaseId,
      testCaseKey: def.testCaseKey || targetCase?.key,
      testCaseTitle: def.testCaseTitle || targetCase?.title,
      runId: def.runId,
      runKey: def.runKey || targetRun?.key,
      title: def.title || 'Untitled Defect',
      description: def.description || '',
      severity: def.severity || 'major',
      priority: def.priority || 'high',
      status: 'open',
      assignee: def.assignee || currentUser?.name || 'Admin',
      reporter: def.reporter || currentUser?.name || 'Admin',
      reproductionSteps: def.reproductionSteps || [],
      comments: def.comments || [],
      attachments: def.attachments || [],
      createdAt: def.createdAt || new Date().toISOString(),
    };
    setDefects((prev) => [fullDefect, ...prev]);
  };

  const handleUpdateDefectStatus = (defectId: string, status: DefectStatus) => {
    setDefects((prev) => prev.map((d) => (d.id === defectId ? { ...d, status } : d)));
  };

  const handleUpdateDefect = (updated: Defect) => {
    setDefects((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (isDbReady) {
      browserDb.put('defects', updated).catch(console.error);
    }
  };

  const handleDeleteDefect = (defectId: string) => {
    setDefects((prev) => prev.filter((d) => d.id !== defectId));
    if (isDbReady) {
      browserDb.delete('defects', defectId).catch(console.error);
    }
  };

  // Handlers for Plans
  const handleCreatePlan = (plan: Partial<TestPlan>) => {
    const targetProjectId =
      plan.projectId ||
      (currentProject.id !== ALL_PROJECTS_ID
        ? currentProject.id
        : projects[0]?.id || '');

    const fullPlan: TestPlan = {
      id: `plan-${Date.now()}`,
      key: plan.key || `PLAN-${Math.floor(10 + Math.random() * 90)}`,
      projectId: targetProjectId,
      title: plan.title || 'Sprint Test Plan',
      description: plan.description || '',
      milestone: plan.milestone || 'v4.3.0',
      targetRelease: plan.targetRelease || '2026-11-01',
      caseCount: plan.caseCount || activeTestCases.length,
      testCaseIds: plan.testCaseIds || activeTestCases.map((c) => c.id),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setTestPlans((prev) => [fullPlan, ...prev]);
  };

  // Import AI-generated test cases
  const handleImportGeneratedCases = (cases: Partial<TestCase>[]) => {
    cases.forEach((c) => handleAddTestCase(c));
  };

  // User management
  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    if (currentUser.id === userId) {
      setCurrentUser({ ...currentUser, role: newRole });
    }
  };

  const handleInviteUser = (u: Partial<User>) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: u.name || 'New Member',
      email: u.email || 'member@qasgard.io',
      avatar: u.avatar || getUserEmoji(undefined, u.role),
      role: u.role || 'qa_engineer',
      organizationId: currentOrg.id,
      status: 'active',
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (isDbReady) {
      browserDb.delete('users', userId).catch(console.error);
    }
    if (currentUser.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUser(remaining[0]);
      } else {
        setCurrentUser({
          id: 'usr-admin',
          name: 'Workspace Admin',
          email: 'admin@qasgard.io',
          avatar: '👑',
          role: 'admin',
          organizationId: currentOrg.id,
          status: 'active',
        });
      }
    }
  };

  const handleResetUsers = () => {
    setUsers([]);
    setCurrentUser({
      id: 'usr-admin',
      name: 'Workspace Admin',
      email: 'admin@qasgard.io',
      avatar: '👑',
      role: 'admin',
      organizationId: currentOrg.id,
      status: 'active',
    });
    try {
      localStorage.setItem('qasgard_users', JSON.stringify([]));
    } catch {
      // ignore
    }
    if (isDbReady) {
      browserDb.syncCollection('users', []).catch(console.error);
    }
  };

  const activeRunningRun = testRuns.find((r) => r.id === activeRunningRunId);

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'} flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200`}
    >
      {/* Top Navigation */}
      <Navbar
        currentOrg={currentOrg}
        currentProject={currentProject}
        projects={projectsWithCounts}
        allProjectsProject={allProjectsCombined}
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        onSelectProject={(p) => {
          setCurrentProject(p);
          setSelectedSuiteId(null);
        }}
        onSwitchUser={setCurrentUser}
        allUsers={users}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCreateCase={() => {
          handleNavigateTab('repository');
        }}
        onOpenCreateRun={() => {
          handleNavigateTab('runs');
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenPreferences={() => setIsPreferencesModalOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
        onRequestDeleteProject={setProjectToDelete}
        onRequestEditProject={setProjectToEdit}
        onRequestCopyProject={setProjectToCopy}
        repositories={projectRepositories}
        selectedRepositoryId={selectedRepositoryId}
        onSelectRepository={handleSelectRepository}
        onOpenCreateRepository={() => setIsCreateRepoModalOpen(true)}
        onOpenImportRepository={() => setIsImportRepoModalOpen(true)}
        testCases={activeTestCases}
        testSuites={activeTestSuites}
      />

      {/* Main Tab Views: Dashboard, Test Repository, Test Runs, Defects, QA Copilot, Team, and Admin */}
      <div className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardPage
            project={currentProject}
            testCases={activeTestCases}
            testSuites={activeTestSuites}
            testRuns={activeTestRuns}
            defects={activeDefects}
            onNavigate={handleNavigateTab}
            onLaunchRun={(runId) => setActiveRunningRunId(runId)}
            onRequestDeleteProject={setProjectToDelete}
            onRequestEditProject={setProjectToEdit}
            onRequestCopyProject={setProjectToCopy}
            repositories={projectRepositories}
            selectedRepositoryId={selectedRepositoryId}
            onSelectRepository={handleSelectRepository}
            onOpenCreateRepository={() => setIsCreateRepoModalOpen(true)}
            onOpenImportRepository={() => setIsImportRepoModalOpen(true)}
            onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
            projectCount={projects.length}
          />
        )}

        {activeTab === 'repository' && (
          <RepositoryPage
            project={currentProject}
            testSuites={activeTestSuites}
            testCases={activeTestCases}
            onAddTestCase={handleAddTestCase}
            onUpdateTestCase={handleUpdateTestCase}
            onDeleteTestCase={handleDeleteTestCase}
            onAddSuite={handleAddSuite}
            onUpdateSuite={handleUpdateSuite}
            onDeleteSuite={handleDeleteSuite}
            selectedSuiteId={selectedSuiteId}
            onSelectSuite={setSelectedSuiteId}
            onNavigateToAI={() => handleNavigateTab('ai-studio')}
            onNavigateToExport={() => handleNavigateTab('suite-export')}
            onNavigateToTab={handleNavigateTab}
            allProjects={projectsWithCounts}
            onSelectProject={(p) => {
              setCurrentProject(p);
              setSelectedSuiteId(null);
            }}
            onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
            onRequestDeleteProject={setProjectToDelete}
            onRequestEditProject={setProjectToEdit}
            onRequestCopyProject={setProjectToCopy}
            requirements={activeRequirements}
            defects={activeDefects}
            testRuns={activeTestRuns}
            repositories={projectRepositories}
            selectedRepositoryId={selectedRepositoryId}
            onSelectRepository={handleSelectRepository}
            onCreateRepository={handleCreateRepository}
            onUpdateRepository={handleUpdateRepository}
            onDeleteRepository={handleDeleteRepository}
            onImportRepository={handleImportRepository}
            onOpenCreateRepository={() => setIsCreateRepoModalOpen(true)}
            onOpenImportRepository={() => setIsImportRepoModalOpen(true)}
            onRequestCreateRun={handleRequestCreateRunFromContext}
          />
        )}

        {activeTab === 'runs' && (
          <TestRunsPage
            project={currentProject}
            testRuns={activeTestRuns}
            testCases={activeTestCases}
            testSuites={activeTestSuites}
            onLaunchRun={(runId) => setActiveRunningRunId(runId)}
            onCreateRun={handleCreateRun}
            allProjects={projectsWithCounts}
            defects={activeDefects}
            repositories={projectRepositories}
            initialCreateContext={pendingCreateRunContext}
            onClearInitialCreateContext={() => setPendingCreateRunContext(null)}
          />
        )}

        {activeTab === 'defects' && (
          <DefectsPage
            project={currentProject}
            defects={activeDefects}
            testCases={activeTestCases}
            onUpdateDefectStatus={handleUpdateDefectStatus}
            onCreateDefect={handleFileDefect}
            onUpdateDefect={handleUpdateDefect}
            onDeleteDefect={handleDeleteDefect}
            allProjects={projectsWithCounts}
            allTestCases={testCases}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'qa-copilot' && (
          <QACopilotPage
            project={currentProject}
            testSuites={activeTestSuites}
            testCases={activeTestCases}
            defects={activeDefects}
            currentUser={currentUser}
            onAddTestCase={handleAddTestCase}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementPage
            organization={currentOrg}
            users={users}
            onUpdateRole={handleUpdateRole}
            onInviteUser={handleInviteUser}
            onDeleteUser={handleDeleteUser}
            onResetUsers={handleResetUsers}
            copilotPrefs={copilotPrefs}
            onUpdateCopilotPrefs={handleUpdateCopilotPrefs}
            onOpenPreferencesModal={() => setIsPreferencesModalOpen(true)}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* Unified Admin Panel (contains Universal Importer, Suite Exporter, Test Plans, Audit Trail, Local DB & Storage, AI Studio, Governance, Arch Specs, DB Schema, UX Design) */}
        {(activeTab === 'admin' || ADMIN_SUBTABS.has(activeTab)) && (
          <AdminPage
            project={currentProject}
            testSuites={activeTestSuites}
            testCases={activeTestCases}
            testRuns={activeTestRuns}
            testPlans={activeTestPlans}
            defects={activeDefects}
            users={users}
            auditLogs={auditLogs}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onBackToDashboard={() => setActiveTab('dashboard')}
            activeSubTab={ADMIN_SUBTABS.has(activeTab) ? (activeTab as AdminSubTabId) : adminSubTab}
            onSelectSubTab={(sub) => {
              setActiveTab('admin');
              setAdminSubTab(sub);
            }}
            onImportWizardCompleted={handleImportWizardCompleted}
            onImportGeneratedCases={handleImportGeneratedCases}
            onCreatePlan={handleCreatePlan}
            onUpdateTestCase={handleUpdateTestCase}
            onAddTestCase={handleAddTestCase}
            onReloadWorkspace={reloadFromBrowserDb}
            initialSuiteId={selectedSuiteId}
          />
        )}
      </div>

      {/* Live Test Runner Modal */}
      {activeRunningRun && (
        <LiveTestRunnerModal
          run={activeRunningRun}
          testCases={activeTestCases}
          testSuites={activeTestSuites}
          project={currentProject}
          onClose={() => setActiveRunningRunId(null)}
          onUpdateExecution={handleUpdateExecution}
          onFileDefect={handleFileDefect}
          onCompleteRun={handleCompleteRun}
          currentUser={currentUser}
          defects={activeDefects}
        />
      )}

      {/* Global Cmd+K Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        testCases={activeTestCases}
        testSuites={activeTestSuites}
        testRuns={activeTestRuns}
        defects={activeDefects}
        onSelectTestCase={(tc) => {
          setSelectedSuiteId(tc.suiteId);
        }}
        onSelectRun={(runId) => {
          setActiveRunningRunId(runId);
        }}
        onNavigateToTab={setActiveTab}
      />

      {/* Draggable & Smart Floating QA Copilot Drawer */}
      <QACopilotFloatingDrawer
        project={currentProject}
        testSuites={activeTestSuites}
        testCases={activeTestCases}
        defects={activeDefects}
        currentUser={currentUser}
        selectedSuiteId={selectedSuiteId}
        preferences={copilotPrefs}
        onUpdatePreferences={handleUpdateCopilotPrefs}
        onOpenPreferencesModal={() => setIsPreferencesModalOpen(true)}
      />

      {/* Personal Preferences Modal */}
      <PreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        preferences={copilotPrefs}
        onUpdatePreferences={handleUpdateCopilotPrefs}
        onResetPosition={handleResetCopilotPosition}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
        existingProjects={projects}
      />

      {/* Delete Project & Cascade Purge Modal */}
      <DeleteProjectModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        project={projectToDelete}
        testCases={testCases}
        testSuites={testSuites}
        testRuns={testRuns}
        defects={defects}
        testPlans={testPlans}
        onConfirmDelete={handleConfirmDeleteProject}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={!!projectToEdit}
        onClose={() => setProjectToEdit(null)}
        project={projectToEdit}
        onUpdateProject={handleUpdateProject}
        existingProjects={projects}
      />

      {/* Copy / Clone Entire Project Modal */}
      <CopyProjectModal
        isOpen={!!projectToCopy}
        onClose={() => setProjectToCopy(null)}
        sourceProject={projectToCopy}
        testCases={testCases}
        testSuites={testSuites}
        existingProjects={projects}
        onCopyProject={handleCopyProject}
      />

      {/* Global Import Repository Modal */}
      <ImportRepositoryModal
        isOpen={isImportRepoModalOpen}
        onClose={() => setIsImportRepoModalOpen(false)}
        project={currentProject}
        activeRepositoryName={
          projectRepositories.find((r) => r.id === selectedRepositoryId)?.name || 'Main Repository'
        }
        onImport={(importedData, mode, targetRepoName) => {
          handleImportRepository(importedData, mode, targetRepoName);
          setIsImportRepoModalOpen(false);
        }}
      />

      {/* Global Create Repository Modal */}
      <CreateRepositoryModal
        isOpen={isCreateRepoModalOpen}
        onClose={() => setIsCreateRepoModalOpen(false)}
        project={currentProject}
        onCreate={(projectId, name, desc) => {
          handleCreateRepository(projectId, name, desc);
          setIsCreateRepoModalOpen(false);
        }}
      />

      {/* Floating Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
