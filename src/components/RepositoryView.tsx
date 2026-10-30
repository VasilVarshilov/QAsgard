import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronsDownUp,
  MoreVertical,
  CheckCircle2,
  Tag,
  Paperclip,
  Sparkles,
  X,
  FileText,
  Clock,
  Trash2,
  Copy,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  Minus,
  Bot,
  LayoutDashboard,
  BookmarkCheck,
  PlayCircle,
  SlidersHorizontal,
  Globe,
  Key,
  Bug,
  ChevronLeft,
  ChevronsUpDown,
  Check,
  ExternalLink,
  Edit2,
  Star,
  CornerDownRight,
  RefreshCw,
  Users,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  Project,
  TestRepository,
  TestSuite,
  TestCase,
  TestPriority,
  TestSeverity,
  TestLayer,
  AutomationStatus,
  Requirement,
  Defect,
  TestRun,
} from '../types';
import {
  exportSuiteAsPdf,
  exportSuiteAsJson,
  exportSuiteAsCsv,
  exportSuiteAsMarkdown,
  exportRepositoryAsJson,
  exportProjectAsJson,
  exportSingleTestCase,
  getTestCasesForSuite,
  getDescendantSuiteIds,
  sortTestCasesChronological,
} from '../utils/exportUtils';
import { SuiteTreeExplorer } from './repository/SuiteTreeExplorer';
import { TestCasePreviewPanel } from './repository/TestCasePreviewPanel';
import { RepositoryContextMenu, ContextMenuState } from './repository/RepositoryContextMenu';
import { RepositoryAICopilotModal } from './repository/RepositoryAICopilotModal';
import { TestCaseEditorModal } from './repository/TestCaseEditorModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { RenameSuiteModal } from './RenameSuiteModal';

interface RepositoryViewProps {
  project: Project;
  testSuites: TestSuite[];
  testCases: TestCase[];
  onAddTestCase: (testCase: Partial<TestCase>) => void;
  onUpdateTestCase: (testCase: TestCase) => void;
  onDeleteTestCase: (caseId: string) => void;
  onAddSuite: (suite: Partial<TestSuite>) => void;
  onUpdateSuite?: (suite: TestSuite) => void;
  onDeleteSuite?: (suiteId: string) => void;
  selectedSuiteId: string | null;
  onSelectSuite: (suiteId: string | null) => void;
  onNavigateToAI: () => void;
  onNavigateToExport?: () => void;
  onNavigateToTab?: (tab: string) => void;
  allProjects?: Project[];
  onSelectProject?: (project: Project) => void;
  onOpenCreateProject?: () => void;
  requirements?: Requirement[];
  defects?: Defect[];
  testRuns?: TestRun[];
  onRequestDeleteProject?: (project: Project) => void;
  onRequestEditProject?: (project: Project) => void;
  onRequestCopyProject?: (project: Project) => void;
  repositories?: TestRepository[];
  selectedRepositoryId?: string | null;
  onSelectRepository?: (repoId: string | null) => void;
  onCreateRepository?: (projectId: string, name: string, description?: string) => void;
  onUpdateRepository?: (repo: TestRepository) => void;
  onDeleteRepository?: (repoId: string, purgeData?: boolean) => void;
  onImportRepository?: (
    imported: {
      type?: string;
      project?: Partial<Project>;
      repositories?: Partial<TestRepository>[];
      suites?: Partial<TestSuite>[];
      testCases?: Partial<TestCase>[];
      testRuns?: any[];
      defects?: any[];
      requirements?: any[];
    },
    mode: 'new' | 'new_repo' | 'merge',
    targetRepoName?: string
  ) => void;
  onOpenCreateRepository?: () => void;
  onOpenImportRepository?: () => void;
  onRequestCreateRun?: (params: { repoId?: string; caseId?: string; suiteId?: string }) => void;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  project,
  testSuites,
  testCases,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  onAddSuite,
  onUpdateSuite,
  onDeleteSuite,
  selectedSuiteId,
  onSelectSuite,
  onNavigateToAI,
  onNavigateToExport,
  onNavigateToTab,
  allProjects = [],
  onSelectProject,
  onOpenCreateProject,
  requirements = [],
  defects = [],
  testRuns = [],
  onRequestDeleteProject,
  onRequestEditProject,
  onRequestCopyProject,
  repositories = [],
  selectedRepositoryId = null,
  onSelectRepository,
  onCreateRepository,
  onUpdateRepository,
  onDeleteRepository,
  onImportRepository,
  onOpenCreateRepository,
  onOpenImportRepository,
  onRequestCreateRun,
}) => {
  // Navigation sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedNavSections, setExpandedNavSections] = useState<Record<string, boolean>>({
    project: true,
    tests: true,
    execution: true,
    environments: true,
    issues: true,
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'title' | 'steps' | 'tags' | 'key'>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAutomation, setSelectedAutomation] = useState<string>('all');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Favorites Suites State (Persisted)
  const [favoriteSuiteIds, setFavoriteSuiteIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`fav_suites_${project.id}`);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Recent opened test cases (Persisted)
  const [recentCases, setRecentCases] = useState<TestCase[]>(() => {
    try {
      const stored = localStorage.getItem(`recent_cases_${project.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Hierarchy expand state
  const [expandedSuiteIds, setExpandedSuiteIds] = useState<Set<string>>(() => {
    return new Set(testSuites.map((s) => s.id));
  });

  // Active Test Case in 3-Column Preview Panel
  const [activeTestCase, setActiveTestCase] = useState<TestCase | null>(null);

  // Inline Quick Test Creator
  const [isQuickTestOpen, setIsQuickTestOpen] = useState(false);
  const [quickTestTitle, setQuickTestTitle] = useState('');
  const [quickTestPriority, setQuickTestPriority] = useState<TestPriority>('medium');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editorTestCase, setEditorTestCase] = useState<TestCase | null>(null);
  const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
  const [showAICopilotModal, setShowAICopilotModal] = useState(false);
  const [showProjectSelectorModal, setShowProjectSelectorModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSuiteTarget, setExportSuiteTarget] = useState<TestSuite | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Repository switcher and management states
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showCreateRepoModal, setShowCreateRepoModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [repoToRename, setRepoToRename] = useState<TestRepository | null>(null);
  const [renameRepoName, setRenameRepoName] = useState('');
  const [repoToDelete, setRepoToDelete] = useState<TestRepository | null>(null);
  const [deleteRepoMode, setDeleteRepoMode] = useState<'purge' | 'merge'>('purge');

  // Repository Import state
  const [showImportRepoModal, setShowImportRepoModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importParsedData, setImportParsedData] = useState<{
    type?: string;
    project?: Partial<Project>;
    repositories?: Partial<TestRepository>[];
    suites?: Partial<TestSuite>[];
    testCases?: Partial<TestCase>[];
    testRuns?: any[];
    defects?: any[];
    requirements?: any[];
  } | null>(null);
  const [importTargetRepoName, setImportTargetRepoName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'new' | 'new_repo' | 'merge'>('new_repo');

  const handleExportRepository = () => {
    const filename = exportRepositoryAsJson(project, projectSuites, projectCases);
    setExportSuccessMessage(`Repository exported: ${filename}`);
    setTimeout(() => setExportSuccessMessage(null), 3500);
    setShowExportModal(false);
  };

  const handleExportProject = (targetProject?: Project) => {
    const p = targetProject || project;
    const pRepos = (repositories || []).filter((r) => r.projectId === p.id);
    const pSuites = (testSuites || []).filter((s) => s.projectId === p.id);
    const pCases = (testCases || []).filter((c) => c.projectId === p.id);
    const pRuns = (testRuns || []).filter((r) => r.projectId === p.id);
    const pDefects = (defects || []).filter((d) => d.projectId === p.id);
    const pReqs = (requirements || []).filter((rq) => rq.projectId === p.id);
    const filename = exportProjectAsJson(p, pRepos, pSuites, pCases, pRuns, pDefects, pReqs);
    setExportSuccessMessage(`Project exported: ${filename}`);
    setTimeout(() => setExportSuccessMessage(null), 3500);
    setShowExportModal(false);
  };

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
        let reposList: Partial<TestRepository>[] = [];
        let runsList: any[] = [];
        let defectsList: any[] = [];
        let reqsList: any[] = [];

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

        if (Array.isArray(parsed.repositories)) {
          reposList = parsed.repositories;
        }

        if (Array.isArray(parsed.testRuns)) {
          runsList = parsed.testRuns;
        }

        if (Array.isArray(parsed.defects)) {
          defectsList = parsed.defects;
        }

        if (Array.isArray(parsed.requirements)) {
          reqsList = parsed.requirements;
        }

        if (suitesList.length === 0 && casesList.length === 0 && reposList.length === 0) {
          setImportError('No test suites, test cases, or repositories found in this JSON file.');
          setImportParsedData(null);
          return;
        }

        const isFullProject =
          parsed.type === 'qasgard_project_export' ||
          reposList.length > 0 ||
          runsList.length > 0 ||
          defectsList.length > 0;

        setImportParsedData({
          type: parsed.type || (isFullProject ? 'qasgard_project_export' : undefined),
          project: projectInfo,
          repositories: reposList.length > 0 ? reposList : undefined,
          suites: suitesList,
          testCases: casesList,
          testRuns: runsList.length > 0 ? runsList : undefined,
          defects: defectsList.length > 0 ? defectsList : undefined,
          requirements: reqsList.length > 0 ? reqsList : undefined,
        });

        if (isFullProject) {
          setImportMode('new');
        } else {
          setImportMode('new_repo');
        }
        setImportTargetRepoName(projectInfo.name || 'Imported Repository');
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

  const handleConfirmImportRepository = () => {
    if (!importParsedData || !onImportRepository) return;
    onImportRepository(importParsedData, importMode, importTargetRepoName);
    setShowImportRepoModal(false);
    setImportParsedData(null);
    setImportJsonText('');
    setExportSuccessMessage(
      `Repository "${importTargetRepoName || importParsedData.project?.name || project.name}" imported with ${
        importParsedData.testCases?.length || 0
      } test cases!`
    );
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'suite',
  });

  // Suite Form State
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDesc, setNewSuiteDesc] = useState('');
  const [newSuiteParentId, setNewSuiteParentId] = useState<string | null>(null);

  // Edit / Move Suite Form State
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null);
  const [editSuiteName, setEditSuiteName] = useState('');
  const [editSuiteDesc, setEditSuiteDesc] = useState('');
  const [editSuiteParentId, setEditSuiteParentId] = useState<string | null>(null);

  // Full Case Creation Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPreconditions, setNewPreconditions] = useState('');
  const [newSuiteId, setNewSuiteId] = useState(selectedSuiteId || testSuites[0]?.id || '');
  const [newPriority, setNewPriority] = useState<TestPriority>('high');
  const [newSeverity, setNewSeverity] = useState<TestSeverity>('blocker');
  const [newLayer, setNewLayer] = useState<TestLayer>('e2e');
  const [newAutomation, setNewAutomation] = useState<AutomationStatus>('manual');
  const [newTags, setNewTags] = useState('smoke, regression');

  // Multi-Selection State
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());

  // Collapsed suite section IDs in main test list view
  const [collapsedSectionSuiteIds, setCollapsedSectionSuiteIds] = useState<Set<string>>(new Set());
  const [viewGrouping, setViewGrouping] = useState<'suite' | 'flat'>('suite');

  // Deletion & Rename Modal States
  const [suiteToDelete, setSuiteToDelete] = useState<TestSuite | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<TestCase | null>(null);
  const [suiteToRename, setSuiteToRename] = useState<TestSuite | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Clipboard for Copy / Paste
  const [clipboardCases, setClipboardCases] = useState<TestCase[]>([]);

  // Check if currently viewing all projects
  const isAllProjects = project.id === 'all';

  const defaultRepoId = `repo-${project.id}-default`;

  const projectRepos = useMemo(() => {
    if (!repositories || repositories.length === 0) {
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

  const activeRepository = useMemo(() => {
    if (!selectedRepositoryId || selectedRepositoryId === 'all') {
      return projectRepos.find((r) => r.isDefault) || projectRepos[0];
    }
    return projectRepos.find((r) => r.id === selectedRepositoryId) || projectRepos[0];
  }, [projectRepos, selectedRepositoryId]);

  // Project data filters (scoped to active repository unless "all" is selected)
  const projectCases = useMemo(() => {
    let cases = isAllProjects ? testCases : testCases.filter((tc) => tc.projectId === project.id);
    if (!isAllProjects && selectedRepositoryId && selectedRepositoryId !== 'all') {
      const suiteMap = new Map(testSuites.map((s) => [s.id, s]));
      cases = cases.filter((c) => {
        const repoId = c.repositoryId || suiteMap.get(c.suiteId)?.repositoryId;
        if (!repoId) {
          return activeRepository?.isDefault || selectedRepositoryId === defaultRepoId;
        }
        return repoId === selectedRepositoryId;
      });
    }
    return cases;
  }, [testCases, testSuites, project.id, isAllProjects, selectedRepositoryId, activeRepository, defaultRepoId]);

  const projectSuites = useMemo(() => {
    let suites = isAllProjects ? testSuites : testSuites.filter((s) => s.projectId === project.id);
    if (!isAllProjects && selectedRepositoryId && selectedRepositoryId !== 'all') {
      suites = suites.filter((s) => {
        if (!s.repositoryId) {
          return activeRepository?.isDefault || selectedRepositoryId === defaultRepoId;
        }
        return s.repositoryId === selectedRepositoryId;
      });
    }
    return suites;
  }, [
    testSuites,
    project.id,
    isAllProjects,
    selectedRepositoryId,
    activeRepository,
    defaultRepoId,
  ]);

  // Selected suite
  const activeSuite = useMemo(() => {
    if (!selectedSuiteId) return null;
    return projectSuites.find((s) => s.id === selectedSuiteId) || null;
  }, [selectedSuiteId, projectSuites]);

  // Compute Breadcrumb Trail
  const breadcrumbTrail = useMemo(() => {
    const trail: TestSuite[] = [];
    if (!activeSuite) return trail;

    let curr: TestSuite | undefined = activeSuite;
    while (curr) {
      trail.unshift(curr);
      curr = curr.parentId ? projectSuites.find((s) => s.id === curr!.parentId) : undefined;
    }
    return trail;
  }, [activeSuite, projectSuites]);

  // Filtered Test Cases displayed
  const displayedCases = useMemo(() => {
    let cases = projectCases;

    if (selectedSuiteId) {
      cases = getTestCasesForSuite(selectedSuiteId, projectSuites, projectCases);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      cases = cases.filter((tc) => {
        if (searchField === 'title') return tc.title.toLowerCase().includes(q);
        if (searchField === 'key') return tc.key.toLowerCase().includes(q);
        if (searchField === 'tags') return tc.tags.some((t) => t.toLowerCase().includes(q));
        if (searchField === 'steps')
          return tc.steps.some(
            (s) => s.action.toLowerCase().includes(q) || s.expectedResult.toLowerCase().includes(q)
          );
        return (
          tc.title.toLowerCase().includes(q) ||
          tc.key.toLowerCase().includes(q) ||
          tc.description.toLowerCase().includes(q) ||
          tc.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    if (selectedPriority !== 'all') {
      cases = cases.filter((tc) => tc.priority === selectedPriority);
    }
    if (selectedAutomation !== 'all') {
      cases = cases.filter((tc) => tc.automationStatus === selectedAutomation);
    }
    if (selectedLayer !== 'all') {
      cases = cases.filter((tc) => tc.layer === selectedLayer);
    }

    return sortTestCasesChronological(cases);
  }, [
    projectCases,
    selectedSuiteId,
    projectSuites,
    searchQuery,
    searchField,
    selectedPriority,
    selectedAutomation,
    selectedLayer,
  ]);

  // Group displayed cases into suites for collapsible suite sections
  const suiteSections = useMemo(() => {
    if (viewGrouping === 'flat') return null;

    // Determine candidate suites to display as sections
    let candidateSuites: TestSuite[] = [];
    if (!selectedSuiteId) {
      // In All Cases: preserve root -> child tree order
      const rootSuites = projectSuites.filter((s) => !s.parentId);
      const orderList: TestSuite[] = [];
      const appendWithChildren = (suite: TestSuite) => {
        orderList.push(suite);
        const children = projectSuites.filter((s) => s.parentId === suite.id);
        children.forEach(appendWithChildren);
      };
      rootSuites.forEach(appendWithChildren);
      candidateSuites = orderList;
    } else {
      const active = projectSuites.find((s) => s.id === selectedSuiteId);
      if (!active) return null;
      const orderList: TestSuite[] = [active];
      const appendWithChildren = (parentSuite: TestSuite) => {
        const children = projectSuites.filter((s) => s.parentId === parentSuite.id);
        children.forEach((c) => {
          orderList.push(c);
          appendWithChildren(c);
        });
      };
      appendWithChildren(active);
      candidateSuites = orderList;
    }

    const sections = candidateSuites
      .map((s) => {
        const directCases = displayedCases.filter((tc) => tc.suiteId === s.id);
        const totalCases = getTestCasesForSuite(s.id, projectSuites, displayedCases);
        const parentSuite = s.parentId ? projectSuites.find((p) => p.id === s.parentId) : null;
        return {
          suite: s,
          parentSuite,
          directCases,
          totalCases,
        };
      })
      .filter((sec) => sec.directCases.length > 0 || sec.suite.id === selectedSuiteId);

    // Fallback: if there are test cases in displayedCases that don't match any candidate suite
    const coveredCaseIds = new Set(sections.flatMap((sec) => sec.directCases.map((c) => c.id)));
    const unassigned = displayedCases.filter((tc) => !coveredCaseIds.has(tc.id));
    if (unassigned.length > 0) {
      sections.push({
        suite: {
          id: 'unassigned',
          name: 'General / Other Cases',
          projectId: project.id,
          caseCount: unassigned.length,
        },
        parentSuite: null,
        directCases: unassigned,
        totalCases: unassigned,
      });
    }

    return sections;
  }, [viewGrouping, selectedSuiteId, projectSuites, displayedCases, project.id]);

  // Update Recent Cases on opening
  const handleOpenTestCase = (tc: TestCase) => {
    setActiveTestCase(tc);
    setRecentCases((prev) => {
      const filtered = prev.filter((item) => item.id !== tc.id);
      const next = [tc, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(`recent_cases_${project.id}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Toggle favorite suite
  const handleToggleFavorite = (suiteId: string) => {
    setFavoriteSuiteIds((prev) => {
      const next = new Set(prev);
      if (next.has(suiteId)) next.delete(suiteId);
      else next.add(suiteId);
      try {
        localStorage.setItem(`fav_suites_${project.id}`, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Expand / Collapse all suites in left tree explorer
  const handleExpandAll = () => {
    setExpandedSuiteIds(new Set(projectSuites.map((s) => s.id)));
  };

  const handleCollapseAll = () => {
    setExpandedSuiteIds(new Set());
  };

  // Toggle expand for a suite in left explorer tree
  // When collapsing, recursively folds all child suites into this parent suite
  const handleToggleExpand = (id: string) => {
    setExpandedSuiteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        const descendants = getDescendantSuiteIds(id, projectSuites);
        descendants.forEach((dId) => next.delete(dId));
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fold all child suites into parent suite (keeping parent suite visible)
  const handleCollapseChildren = (id: string) => {
    setExpandedSuiteIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      const descendants = getDescendantSuiteIds(id, projectSuites);
      descendants.forEach((dId) => next.delete(dId));
      return next;
    });
  };

  // Unfold all child suites under parent suite
  const handleExpandChildren = (id: string) => {
    setExpandedSuiteIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      const descendants = getDescendantSuiteIds(id, projectSuites);
      descendants.forEach((dId) => next.add(dId));
      return next;
    });
  };

  // Toggle fold for suite sections in main test list
  const toggleFoldSection = (suiteId: string) => {
    setCollapsedSectionSuiteIds((prev) => {
      const next = new Set(prev);
      if (next.has(suiteId)) {
        next.delete(suiteId);
      } else {
        next.add(suiteId);
      }
      return next;
    });
  };

  // Keyboard Shortcuts: Ctrl+N, Ctrl+Shift+N, Ctrl+D, Ctrl+F, Delete, ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + F: Focus search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Ctrl + Shift + N: New Suite
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setNewSuiteParentId(selectedSuiteId || null);
        setShowCreateSuiteModal(true);
      }
      // Ctrl + N: New Test Case (Qase Full-Screen Editor)
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setEditorTestCase(null);
        setIsEditorModalOpen(true);
      }

      // Ctrl + D: Duplicate selected case
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        if (activeTestCase) {
          e.preventDefault();
          handleDuplicateTestCase(activeTestCase);
        }
      }

      // Delete: Delete selected cases
      if (e.key === 'Delete' && selectedCaseIds.size > 0) {
        if (confirm(`Delete ${selectedCaseIds.size} selected test cases?`)) {
          selectedCaseIds.forEach((id) => onDeleteTestCase(id));
          setSelectedCaseIds(new Set());
        }
      }

      // ESC: Close context menu or preview
      if (e.key === 'Escape') {
        if (contextMenu.isOpen) {
          setContextMenu((prev) => ({ ...prev, isOpen: false }));
        } else if (activeTestCase) {
          setActiveTestCase(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTestCase, selectedCaseIds, selectedSuiteId, projectSuites, contextMenu.isOpen]);

  // Duplicate Test Case
  const handleDuplicateTestCase = (tc: TestCase) => {
    const clonedKey = `${project.key}-${Math.floor(100 + Math.random() * 899)}`;
    const cloned: Partial<TestCase> = {
      ...tc,
      id: undefined,
      key: clonedKey,
      title: `${tc.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAddTestCase(cloned);
  };

  // Duplicate Suite
  const handleDuplicateSuite = (suite: TestSuite) => {
    const targetRepoId =
      suite.repositoryId ||
      (selectedRepositoryId && selectedRepositoryId !== 'all'
        ? selectedRepositoryId
        : activeRepository?.id || defaultRepoId);
    onAddSuite({
      name: `${suite.name} (Copy)`,
      description: suite.description,
      parentId: suite.parentId,
      projectId: project.id,
      repositoryId: targetRepoId,
      caseCount: 0,
      order: Date.now(),
    });
  };

  // Reorder suite up / down within sibling suites
  const handleReorderSuite = (suiteId: string, direction: 'up' | 'down') => {
    if (!onUpdateSuite) return;
    const target = projectSuites.find((s) => s.id === suiteId);
    if (!target) return;

    // Siblings share the exact same parentId
    const siblings = projectSuites
      .filter((s) => (s.parentId || null) === (target.parentId || null))
      .sort((a, b) => {
        if (typeof a.order === 'number' && typeof b.order === 'number') return a.order - b.order;
        if (typeof a.order === 'number') return -1;
        if (typeof b.order === 'number') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

    const index = siblings.findIndex((s) => s.id === suiteId);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return;

    const reordered = [...siblings];
    const temp = reordered[index];
    reordered[index] = reordered[swapIndex];
    reordered[swapIndex] = temp;

    reordered.forEach((suite, idx) => {
      onUpdateSuite({
        ...suite,
        order: (idx + 1) * 10,
      });
    });
  };

  // Move suite via drag-drop
  const handleMoveSuite = (sourceId: string, targetParentId: string | null) => {
    if (!onUpdateSuite) return;
    const source = projectSuites.find((s) => s.id === sourceId);
    if (source) {
      onUpdateSuite({
        ...source,
        parentId: targetParentId,
      });
      if (targetParentId) {
        setExpandedSuiteIds((prev) => new Set([...prev, targetParentId]));
      }
    }
  };

  // Move test cases to suite via drag-drop
  const handleMoveCasesToSuite = (caseIds: string[], targetSuiteId: string) => {
    const targetSuite = projectSuites.find((s) => s.id === targetSuiteId);
    if (!targetSuite) return;

    caseIds.forEach((id) => {
      const tc = projectCases.find((c) => c.id === id);
      if (tc) {
        onUpdateTestCase({
          ...tc,
          suiteId: targetSuite.id,
          suiteName: targetSuite.name,
        });
      }
    });
  };

  // Quick test inline add
  const handleCreateQuickTest = () => {
    if (!quickTestTitle.trim()) return;
    const targetSuite = activeSuite || projectSuites[0];
    const generatedKey = `${project.key}-${Math.floor(20 + Math.random() * 970)}`;

    onAddTestCase({
      title: quickTestTitle.trim(),
      key: generatedKey,
      suiteId: targetSuite ? targetSuite.id : 'default-suite',
      suiteName: targetSuite ? targetSuite.name : 'General',
      priority: quickTestPriority,
      severity: 'normal',
      type: 'functional',
      layer: 'e2e',
      automationStatus: 'manual',
      status: 'actual',
      description: 'Quick test created via inline repository creator.',
      steps: [
        {
          stepNumber: 1,
          action: 'Perform scenario action verification',
          expectedResult: 'System fulfills expected business requirement assertion',
          data: '',
        },
      ],
      tags: ['quick-test'],
      requirementRefs: [],
      attachments: [],
      comments: [],
    });

    setQuickTestTitle('');
    setIsQuickTestOpen(false);
  };

  // Save Full Case
  const handleSaveFullTestCase = () => {
    if (!newTitle.trim()) return;
    const targetSuite = projectSuites.find((s) => s.id === newSuiteId) || projectSuites[0];
    const generatedKey = `${project.key}-${Math.floor(100 + Math.random() * 899)}`;

    onAddTestCase({
      title: newTitle.trim(),
      key: generatedKey,
      description: newDescription.trim(),
      preconditions: newPreconditions.trim(),
      suiteId: targetSuite ? targetSuite.id : 'default',
      suiteName: targetSuite ? targetSuite.name : 'General',
      priority: newPriority,
      severity: newSeverity,
      layer: newLayer,
      automationStatus: newAutomation,
      status: 'actual',
      type: 'functional',
      steps: [
        {
          stepNumber: 1,
          action: 'Initialize verification steps',
          expectedResult: 'System confirms ready state',
        },
      ],
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      attachments: [],
      comments: [],
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDescription('');
    setNewPreconditions('');
  };

  // Save from Full-Screen Qase Editor
  const handleSaveEditorTestCase = (payload: Partial<TestCase>, createAnother?: boolean) => {
    if (editorTestCase) {
      const updated = {
        ...editorTestCase,
        ...payload,
      } as TestCase;
      onUpdateTestCase(updated);
      if (activeTestCase?.id === updated.id) {
        setActiveTestCase(updated);
      }
    } else {
      onAddTestCase({
        ...payload,
        repositoryId: payload.repositoryId || activeRepository?.id || defaultRepoId,
      });
    }

    if (!createAnother) {
      setIsEditorModalOpen(false);
      setEditorTestCase(null);
    }
  };

  // Save Suite
  const handleSaveSuite = () => {
    if (!newSuiteName.trim()) return;
    const targetRepoId =
      selectedRepositoryId && selectedRepositoryId !== 'all'
        ? selectedRepositoryId
        : activeRepository?.id || defaultRepoId;
    onAddSuite({
      name: newSuiteName.trim(),
      description: newSuiteDesc.trim(),
      parentId: newSuiteParentId,
      projectId: project.id,
      repositoryId: targetRepoId,
      caseCount: 0,
      order: Date.now(),
    });
    if (newSuiteParentId) {
      setExpandedSuiteIds((prev) => new Set([...prev, newSuiteParentId]));
    }
    setNewSuiteName('');
    setNewSuiteDesc('');
    setNewSuiteParentId(null);
    setShowCreateSuiteModal(false);
  };

  const handleOpenEditSuite = (suite: TestSuite) => {
    setEditingSuite(suite);
    setEditSuiteName(suite.name);
    setEditSuiteDesc(suite.description || '');
    setEditSuiteParentId(suite.parentId || null);
  };

  const handleSaveEditSuite = () => {
    if (!editingSuite || !editSuiteName.trim() || !onUpdateSuite) return;
    onUpdateSuite({
      ...editingSuite,
      name: editSuiteName.trim(),
      description: editSuiteDesc.trim(),
      parentId: editSuiteParentId,
    });
    if (editSuiteParentId) {
      setExpandedSuiteIds((prev) => new Set([...prev, editSuiteParentId]));
    }
    setEditingSuite(null);
  };

  // Handler for quick rename suite modal
  const handleConfirmRenameSuite = (suiteId: string, newName: string) => {
    const target = projectSuites.find((s) => s.id === suiteId);
    if (!target || !onUpdateSuite) return;
    onUpdateSuite({
      ...target,
      name: newName,
    });
    setSuiteToRename(null);
  };

  // Handler for delete suite confirmation
  const handleConfirmDeleteSuite = () => {
    if (!suiteToDelete) return;
    const targetId = suiteToDelete.id;
    if (selectedSuiteId === targetId) {
      onSelectSuite(null);
    }
    setFavoriteSuiteIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
    setExpandedSuiteIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
    if (onDeleteSuite) {
      onDeleteSuite(targetId);
    }
    setSuiteToDelete(null);
  };

  // Handler for delete test case confirmation
  const handleConfirmDeleteCase = () => {
    if (!caseToDelete) return;
    onDeleteTestCase(caseToDelete.id);
    if (activeTestCase?.id === caseToDelete.id) {
      setActiveTestCase(null);
    }
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      next.delete(caseToDelete.id);
      return next;
    });
    setCaseToDelete(null);
  };

  // Handler for bulk delete test cases confirmation
  const handleConfirmBulkDelete = () => {
    selectedCaseIds.forEach((id) => {
      onDeleteTestCase(id);
      if (activeTestCase?.id === id) {
        setActiveTestCase(null);
      }
    });
    setSelectedCaseIds(new Set());
    setShowBulkDeleteConfirm(false);
  };

  return (
    <div
      onClick={() => {
        if (contextMenu.isOpen) setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }}
      className="flex h-[calc(100vh-3.5rem)] bg-[#13141f] text-slate-200 overflow-hidden font-sans select-none antialiased"
    >
      {/* =========================================================================
          COLUMN 1: LEFT NAVIGATION SIDEBAR
      ========================================================================= */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-56'
        } shrink-0 bg-[#181926] border-r border-[#262838] flex flex-col transition-all duration-200 select-none z-30`}
      >
        {/* Project Selector Header */}
        <div className="p-3 border-b border-[#262838] flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                {allProjects.length === 0 || !project.id ? (
                  <Folder className="w-4 h-4" />
                ) : isAllProjects ? (
                  <Layers className="w-4 h-4" />
                ) : (
                  project.key.slice(0, 2)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-100 truncate block leading-tight">
                  {allProjects.length === 0 || !project.id ? 'No projects yet' : project.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono leading-none block">
                  {allProjects.length === 0 || !project.id ? '0 projects' : project.key}
                </span>
              </div>
              <button
                onClick={() => setShowProjectSelectorModal(true)}
                className="p-1 hover:bg-[#262838] rounded text-slate-400 hover:text-white cursor-pointer"
                title="Switch Project"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
              </button>
              {onRequestEditProject && !isAllProjects && (
                <button
                  type="button"
                  onClick={() => onRequestEditProject(project)}
                  className="p-1 hover:bg-[#262838] hover:text-indigo-400 rounded text-slate-400 transition-colors cursor-pointer"
                  title={`Edit ${project.name} / Редактирай проект`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onRequestCopyProject && !isAllProjects && (
                <button
                  type="button"
                  onClick={() => onRequestCopyProject(project)}
                  className="p-1 hover:bg-[#262838] hover:text-purple-400 rounded text-slate-400 transition-colors cursor-pointer"
                  title={`Copy ${project.name} / Копирай цял проект`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              {onRequestDeleteProject && !isAllProjects && (
                <button
                  type="button"
                  onClick={() => onRequestDeleteProject(project)}
                  className="p-1 hover:bg-rose-950/60 hover:text-rose-400 rounded text-slate-400 transition-colors cursor-pointer"
                  title={`Delete ${project.name} and purge all data / Изтрий проекта`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => setShowProjectSelectorModal(true)}
              className="mx-auto w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-indigo-500 transition-colors"
              title={`Current: ${project.name} [${project.key}] - Click to switch`}
            >
              {isAllProjects ? <Layers className="w-4 h-4" /> : project.key.slice(0, 2)}
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#262838] cursor-pointer ml-1"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sidebar Nav Items: Dashboard, Test Repository, Test Runs, Defects, QA Copilot, Team, Admin */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs font-medium no-scrollbar">
          {/* Dashboard */}
          <button
            onClick={() => onNavigateToTab?.('dashboard')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-[#202234] hover:text-white transition-colors cursor-pointer"
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400 shrink-0" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          {/* Test Repository */}
          <button
            onClick={() => {
              onNavigateToTab?.('repository');
              onSelectSuite(null);
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold cursor-pointer"
            title="Test Repository"
          >
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            {!sidebarCollapsed && <span className="flex-1 text-left">Test Repository</span>}
            {!sidebarCollapsed && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                {projectCases.length}
              </span>
            )}
          </button>

          {/* Test Runs */}
          <button
            onClick={() => onNavigateToTab?.('runs')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-[#202234] hover:text-white transition-colors cursor-pointer"
            title="Test Runs"
          >
            <PlayCircle className="w-4 h-4 text-purple-400 shrink-0" />
            {!sidebarCollapsed && <span>Test Runs</span>}
          </button>

          {/* Defects */}
          <button
            onClick={() => onNavigateToTab?.('defects')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-[#202234] hover:text-white transition-colors cursor-pointer"
            title="Defects"
          >
            <Bug className="w-4 h-4 text-rose-400 shrink-0" />
            {!sidebarCollapsed && <span className="flex-1 text-left">Defects</span>}
            {!sidebarCollapsed && defects.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                {defects.length}
              </span>
            )}
          </button>

          {/* QA Copilot */}
          <button
            onClick={() => {
              if (onNavigateToTab) onNavigateToTab('qa-copilot');
              else setShowAICopilotModal(true);
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-[#202234] hover:text-white transition-colors cursor-pointer"
            title="QA Copilot"
          >
            <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
            {!sidebarCollapsed && <span>QA Copilot</span>}
          </button>

          {/* Team */}
          <button
            onClick={() => onNavigateToTab?.('users')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-[#202234] hover:text-white transition-colors cursor-pointer"
            title="Team"
          >
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            {!sidebarCollapsed && <span>Team</span>}
          </button>

          <div className="pt-2 border-t border-[#202234] mt-2">
            {/* Admin Panel */}
            <button
              onClick={() => onNavigateToTab?.('admin')}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-amber-300/90 hover:bg-[#202234] hover:text-amber-200 transition-colors cursor-pointer"
              title="Admin Panel (15 Tools)"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              {!sidebarCollapsed && <span className="flex-1 text-left">Admin</span>}
              {!sidebarCollapsed && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Tools
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE (Toolbar + 3-Column Split: Suite Tree | Test List | Preview)
      ========================================================================= */}
      {allProjects.length === 0 || !project.id ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#13141f]">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
            <Folder className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No projects yet</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Create your first QA project to start authoring test suites, folders, and test cases.
          </p>
          <div className="flex items-center gap-3">
            {onOpenCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-md hover:shadow-indigo-500/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create your first project</span>
              </button>
            )}
            {onOpenImportRepository && (
              <button
                onClick={onOpenImportRepository}
                className="px-5 py-2.5 bg-[#202234] hover:bg-[#282a40] text-slate-200 border border-[#2e3146] rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Existing Repository</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 bg-[#13141f]">
        {/* TOP TOOLBAR: Title, Counts, Search, AI Copilot, Actions */}
        <header className="px-5 py-2.5 border-b border-[#262838] bg-[#181926] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Project Pill */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#202234] border border-[#2e3146] text-xs">
              <span className="font-mono text-indigo-400 font-bold">[{project.key}]</span>
              <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                {project.name}
              </span>
            </div>

            <span className="text-slate-600 font-mono">/</span>

            {/* Interactive Repository Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRepoDropdown((prev) => !prev)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({
                    isOpen: true,
                    x: e.clientX,
                    y: e.clientY,
                    type: 'repo',
                    targetRepo: activeRepository,
                  });
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-[#202234] hover:from-indigo-900/60 hover:to-[#282a3e] border border-indigo-500/40 hover:border-indigo-400 text-white font-bold text-xs cursor-pointer transition-all shadow-sm group"
                title="Switch repository (Десен бутон за Create Test Run / Switch or right-click to test run)"
              >
                <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="max-w-[200px] truncate text-white">
                  {selectedRepositoryId === 'all'
                    ? 'All Repositories (Combined)'
                    : activeRepository?.name || 'Main Repository'}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                  {projectCases.length} cases
                </span>
                <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
              </button>

              {/* Repository Dropdown Menu */}
              {showRepoDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-80 bg-[#181926] border border-[#2e3146] rounded-xl shadow-2xl z-50 overflow-hidden text-xs py-1 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#262838] flex items-center justify-between bg-[#141522]">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Repositories in {project.key} ({projectRepos.length})
                    </span>
                    <button
                      onClick={() => {
                        setShowRepoDropdown(false);
                        setShowCreateRepoModal(true);
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ New Repo</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {projectRepos.map((repo) => {
                      const isSelected =
                        selectedRepositoryId === repo.id ||
                        (!selectedRepositoryId && repo.isDefault);
                      const casesInRepo = (
                        isAllProjects
                          ? testCases
                          : testCases.filter((tc) => tc.projectId === project.id)
                      ).filter((c) => (c.repositoryId || defaultRepoId) === repo.id).length;
                      const suitesInRepo = (
                        isAllProjects
                          ? testSuites
                          : testSuites.filter((s) => s.projectId === project.id)
                      ).filter((s) => (s.repositoryId || defaultRepoId) === repo.id).length;

                      return (
                        <div
                          key={repo.id}
                          onClick={() => {
                            onSelectRepository?.(repo.id);
                            setShowRepoDropdown(false);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowRepoDropdown(false);
                            setContextMenu({
                              isOpen: true,
                              x: e.clientX,
                              y: e.clientY,
                              type: 'repo',
                              targetRepo: repo,
                            });
                          }}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                              : 'hover:bg-[#202235] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Folder
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-indigo-400' : 'text-slate-400'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold truncate text-xs">{repo.name}</span>
                                {repo.isDefault && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 uppercase font-mono">
                                    Default
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {suitesInRepo} suites • {casesInRepo} cases
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 mr-1" />}
                            {!repo.isDefault && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRepoToRename(repo);
                                    setRenameRepoName(repo.name);
                                    setShowRepoDropdown(false);
                                  }}
                                  className="p-1 hover:bg-[#2c2f48] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                                  title="Rename Repository"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteRepoMode('purge');
                                    setRepoToDelete(repo);
                                    setShowRepoDropdown(false);
                                  }}
                                  className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                  title="Delete Repository"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Option for All Repositories Combined */}
                    {projectRepos.length > 1 && (
                      <div
                        onClick={() => {
                          onSelectRepository?.('all');
                          setShowRepoDropdown(false);
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          selectedRepositoryId === 'all'
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                            : 'hover:bg-[#202235] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-xs">
                            All Repositories (Combined View)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {
                            (isAllProjects
                              ? testCases
                              : testCases.filter((tc) => tc.projectId === project.id)
                            ).length
                          }{' '}
                          cases
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 border-t border-[#262838] bg-[#141522]">
                    <button
                      onClick={() => {
                        setShowRepoDropdown(false);
                        setShowCreateRepoModal(true);
                      }}
                      className="w-full py-1.5 px-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Repository to {project.key}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Copilot Toolbar Button */}
            <button
              onClick={() => setShowAICopilotModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Open Context-Aware AI Copilot"
            >
              <Bot className="w-3.5 h-3.5 text-amber-200" />
              <span>+ AI Copilot</span>
            </button>

            <button
              onClick={() => {
                setEditorTestCase(null);
                setIsEditorModalOpen(true);
              }}
              className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Create Test Case (Qase Full-Screen Editor, Ctrl+N)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Manual test</span>
            </button>

            <button
              onClick={() => {
                setNewSuiteParentId(selectedSuiteId || null);
                setShowCreateSuiteModal(true);
              }}
              className="px-2.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg text-xs font-medium cursor-pointer"
              title="Create Suite (Ctrl+Shift+N)"
            >
              + Suite
            </button>

            <button
              onClick={() => {
                setExportSuiteTarget(activeSuite || null);
                setShowExportModal(true);
              }}
              className="px-2.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Export Repository / Test Suite (JSON, PDF, CSV, Markdown)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => {
                if (onOpenImportRepository) {
                  onOpenImportRepository();
                } else {
                  setImportError(null);
                  setImportParsedData(null);
                  setImportJsonText('');
                  setImportMode('new_repo');
                  setImportTargetRepoName('');
                  setShowImportRepoModal(true);
                }
              }}
              className="px-2.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-emerald-400 hover:text-emerald-300 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Import Repository / Импорт на репозитори (JSON Backup)"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>
        </header>

        {/* BREADCRUMB NAVIGATION & SEARCH BAR */}
        <div className="px-5 py-2 border-b border-[#262838] bg-[#141522] flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-slate-400 font-medium overflow-x-auto no-scrollbar">
            <span
              onClick={() => onSelectSuite(null)}
              className="hover:text-indigo-400 cursor-pointer"
            >
              Repository
            </span>
            {breadcrumbTrail.map((b) => (
              <React.Fragment key={b.id}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span
                  onClick={() => onSelectSuite(b.id)}
                  className={`hover:text-indigo-400 cursor-pointer truncate ${
                    selectedSuiteId === b.id ? 'text-white font-bold' : ''
                  }`}
                >
                  {b.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Instant Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1e1f2e] border border-[#2d3044] rounded-lg overflow-hidden focus-within:border-indigo-500 transition-colors w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 ml-2.5 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases... (Ctrl+F)"
                className="bg-transparent text-xs text-white placeholder:text-slate-500 px-2 py-1 focus:outline-none flex-1 min-w-0"
              />
              {searchQuery && (
                <X
                  className="w-3.5 h-3.5 text-slate-400 mr-2 cursor-pointer hover:text-white"
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="p-1.5 bg-[#1e1f2e] hover:bg-[#25283c] border border-[#2d3044] rounded-lg text-slate-300 hover:text-white cursor-pointer"
                title="Filter test cases"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-1 w-56 max-h-[calc(100vh-120px)] overflow-y-auto bg-[#1e1f2e] border border-[#2e3146] rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Priority</label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full bg-[#141522] border border-[#2d3044] rounded px-2 py-1 text-slate-200"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Automation</label>
                    <select
                      value={selectedAutomation}
                      onChange={(e) => setSelectedAutomation(e.target.value)}
                      className="w-full bg-[#141522] border border-[#2d3044] rounded px-2 py-1 text-slate-200"
                    >
                      <option value="all">All Statuses</option>
                      <option value="manual">Manual</option>
                      <option value="automated">Automated</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPriority('all');
                      setSelectedAutomation('all');
                      setSelectedLayer('all');
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-center text-[10px] text-indigo-400 hover:text-indigo-300 pt-1 border-t border-[#262838]"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3-COLUMN SPLIT: SUITE TREE | TEST LIST | INLINE PREVIEW PANEL
        ========================================================================= */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* COLUMN 2: SUITE TREE EXPLORER */}
          <div className="w-80 lg:w-96 shrink-0 border-r border-[#262838] flex flex-col min-h-0 bg-[#161724]">
            <SuiteTreeExplorer
              suites={projectSuites}
              cases={projectCases}
              selectedSuiteId={selectedSuiteId}
              onSelectSuite={(id) => {
                onSelectSuite(id);
              }}
              expandedSuiteIds={expandedSuiteIds}
              onToggleExpand={handleToggleExpand}
              onCollapseChildren={handleCollapseChildren}
              onExpandChildren={handleExpandChildren}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              favoriteSuiteIds={favoriteSuiteIds}
              onToggleFavorite={handleToggleFavorite}
              recentCases={recentCases}
              onSelectRecentCase={(tc) => handleOpenTestCase(tc)}
              onContextMenu={(e, type, suite) => {
                setContextMenu({
                  isOpen: true,
                  x: e.clientX,
                  y: e.clientY,
                  type: 'suite',
                  targetSuite: suite,
                });
              }}
              onAddSuite={(parentId) => {
                setNewSuiteParentId(parentId || null);
                setShowCreateSuiteModal(true);
              }}
              onRenameSuite={(suite) => setSuiteToRename(suite)}
              onDeleteSuite={(suiteId) => {
                const s = projectSuites.find((item) => item.id === suiteId);
                if (s) setSuiteToDelete(s);
              }}
              onMoveSuite={handleMoveSuite}
              onMoveCasesToSuite={handleMoveCasesToSuite}
              onReorderSuite={handleReorderSuite}
            />
          </div>

          {/* COLUMN 3: TEST CASES LIST */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#13141f] overflow-hidden">
            {/* Header of Test List */}
            <div className="p-3 bg-[#181926] border-b border-[#262838] flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    displayedCases.length > 0 && selectedCaseIds.size === displayedCases.length
                  }
                  onChange={() => {
                    if (selectedCaseIds.size === displayedCases.length) {
                      setSelectedCaseIds(new Set());
                    } else {
                      setSelectedCaseIds(new Set(displayedCases.map((c) => c.id)));
                    }
                  }}
                  className="rounded border-[#3a3d54] bg-[#1e1f2e] text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold text-white">
                  {activeSuite ? activeSuite.name : 'All Cases'} ({displayedCases.length})
                </span>
                {activeSuite && activeSuite.id !== 'unassigned' && (
                  <div className="flex items-center gap-1 ml-1.5">
                    <button
                      type="button"
                      onClick={() => setSuiteToRename(activeSuite)}
                      className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-[#25283c] rounded cursor-pointer transition-colors"
                      title={`Rename suite "${activeSuite.name}" / Преименувай суит`}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuiteToDelete(activeSuite)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded cursor-pointer transition-colors"
                      title={`Delete suite "${activeSuite.name}" / Изтрий суит`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Bulk action buttons when cases selected */}
                {selectedCaseIds.size > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#202234] px-2.5 py-1 rounded-lg border border-[#2e3146]">
                    <span className="text-[11px] font-bold text-indigo-300">
                      {selectedCaseIds.size} selected
                    </span>
                    <div className="h-3 w-px bg-slate-700 mx-1" />
                    <button
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="p-1 hover:text-rose-400 text-slate-400 cursor-pointer transition-colors"
                      title="Bulk Delete Selected Cases / Изтрий избраните кейсове"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedCaseIds(new Set())}
                      className="text-[10px] text-slate-400 hover:text-white cursor-pointer ml-1"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Suite Sections Fold / Unfold Toolbar Controls */}
                {viewGrouping === 'suite' && (
                  <div className="flex items-center gap-1 bg-[#1e2030] p-0.5 rounded-lg border border-[#2e3146]">
                    <button
                      onClick={() =>
                        setCollapsedSectionSuiteIds(new Set(projectSuites.map((s) => s.id)))
                      }
                      className="px-2 py-0.5 hover:bg-[#282a3f] hover:text-white text-slate-300 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Fold / Collapse all suite sections (Прибери всички)"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span>Fold All</span>
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => setCollapsedSectionSuiteIds(new Set())}
                      className="px-2 py-0.5 hover:bg-[#282a3f] hover:text-white text-slate-300 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Unfold / Expand all suite sections (Разпъни всички)"
                    >
                      <ChevronDown className="w-3 h-3 text-indigo-400" />
                      <span>Unfold All</span>
                    </button>
                  </div>
                )}

                {/* View Grouping Toggle: Suites vs Flat */}
                <button
                  onClick={() => setViewGrouping((prev) => (prev === 'suite' ? 'flat' : 'suite'))}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                    viewGrouping === 'suite'
                      ? 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300'
                      : 'bg-[#1e2030] border-[#2e3146] text-slate-400 hover:text-slate-200'
                  }`}
                  title={
                    viewGrouping === 'suite'
                      ? 'Switch to flat test list'
                      : 'Group test cases by suite with fold/unfold arrows'
                  }
                >
                  <Layers className="w-3 h-3" />
                  <span>{viewGrouping === 'suite' ? 'By Suite' : 'Flat'}</span>
                </button>
              </div>
            </div>

            {/* Test Cases Table Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#202234] p-2 no-scrollbar">
              {displayedCases.length === 0 ? (
                <div className="p-12 text-center space-y-3 text-slate-400">
                  <div className="w-12 h-12 rounded-xl bg-[#1a1b2c] text-slate-500 flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">No test cases found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {projectCases.length === 0
                      ? 'Your test repository is empty. Create your first manual test or use quick add.'
                      : 'No test cases match the active filter or suite.'}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditorTestCase(null);
                        setIsEditorModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Manual test</span>
                    </button>
                    <button
                      onClick={() => setIsQuickTestOpen(true)}
                      className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              ) : viewGrouping === 'suite' && suiteSections && suiteSections.length > 0 ? (
                <div className="space-y-3">
                  {suiteSections.map((sec) => {
                    const isFolded = collapsedSectionSuiteIds.has(sec.suite.id);
                    return (
                      <div
                        key={sec.suite.id}
                        className="rounded-xl border border-[#262838] bg-[#161724] overflow-hidden shadow-xs transition-all"
                      >
                        {/* Collapsible Suite Section Header */}
                        <div
                          onClick={() => toggleFoldSection(sec.suite.id)}
                          onContextMenu={(e) => {
                            if (sec.suite.id !== 'unassigned') {
                              e.preventDefault();
                              setContextMenu({
                                isOpen: true,
                                x: e.clientX,
                                y: e.clientY,
                                type: 'suite',
                                targetSuite: sec.suite,
                              });
                            }
                          }}
                          className="px-3 py-2 bg-[#1b1c2b] hover:bg-[#202235] border-b border-[#262838] flex items-center justify-between cursor-pointer transition-colors select-none"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Fold / Unfold Arrow button (Стрелка за прибиране/разпъване) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFoldSection(sec.suite.id);
                              }}
                              title={
                                isFolded
                                  ? `Unfold "${sec.suite.name}" (разпъни ${sec.directCases.length} тест кейса)`
                                  : `Fold "${sec.suite.name}" (прибери ${sec.directCases.length} тест кейса)`
                              }
                              className={`w-5 h-5 flex items-center justify-center rounded transition-all cursor-pointer shrink-0 ${
                                isFolded
                                  ? 'bg-[#141522] text-slate-400 hover:text-white border border-slate-700/60'
                                  : 'bg-indigo-950/70 text-indigo-400 hover:bg-indigo-900 border border-indigo-800/50'
                              }`}
                            >
                              {isFolded ? (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                            </button>

                            {/* Folder Icon */}
                            {isFolded ? (
                              <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                            )}

                            {/* Suite Name & Breadcrumb */}
                            <div className="flex items-center gap-1.5 truncate">
                              {sec.parentSuite && (
                                <span className="text-[10px] text-slate-400 truncate">
                                  {sec.parentSuite.name} /
                                </span>
                              )}
                              <span className="font-semibold text-xs text-white truncate">
                                {sec.suite.name}
                              </span>
                            </div>

                            {/* Case Count Badge */}
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#25283c] text-indigo-300 border border-[#363a54] shrink-0">
                              {sec.directCases.length}{' '}
                              {sec.directCases.length === 1 ? 'case' : 'cases'}
                            </span>

                            {isFolded && (
                              <span className="text-[10px] text-slate-400 font-mono italic shrink-0">
                                (Folded / Прибран)
                              </span>
                            )}
                          </div>

                          {/* Quick Suite Actions */}
                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setNewSuiteParentId(sec.suite.id);
                                setShowCreateSuiteModal(true);
                              }}
                              className="text-[10px] text-slate-400 hover:text-indigo-300 px-2 py-0.5 rounded hover:bg-[#25283c] cursor-pointer transition-colors"
                              title={`Create child suite inside "${sec.suite.name}"`}
                            >
                              + Child Suite
                            </button>
                            <button
                              onClick={() => {
                                setEditorTestCase({
                                  ...({} as TestCase),
                                  suiteId: sec.suite.id,
                                  suiteName: sec.suite.name,
                                });
                                setIsEditorModalOpen(true);
                              }}
                              className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded hover:bg-[#25283c] cursor-pointer transition-colors"
                              title={`Add test case directly to "${sec.suite.name}"`}
                            >
                              + Case
                            </button>
                            {sec.suite.id !== 'unassigned' && (
                              <>
                                <button
                                  onClick={() => setSuiteToRename(sec.suite)}
                                  className="text-[10px] text-slate-400 hover:text-cyan-300 px-1.5 py-0.5 rounded hover:bg-[#25283c] cursor-pointer transition-colors flex items-center gap-1"
                                  title={`Rename suite "${sec.suite.name}" / Преименувай`}
                                >
                                  <Edit2 className="w-3 h-3 text-cyan-400" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  onClick={() => setSuiteToDelete(sec.suite)}
                                  className="text-[10px] text-slate-400 hover:text-rose-400 px-1.5 py-0.5 rounded hover:bg-rose-950/40 cursor-pointer transition-colors flex items-center gap-1"
                                  title={`Delete suite "${sec.suite.name}" / Изтрий суит`}
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Cases under this Suite */}
                        {!isFolded && (
                          <div className="divide-y divide-[#202234] p-1.5">
                            {sec.directCases.length === 0 ? (
                              <div className="py-3 text-center text-xs text-slate-400 italic">
                                No test cases directly in this suite level. (Check child suites)
                              </div>
                            ) : (
                              sec.directCases.map((tc) => {
                                const isSelected = selectedCaseIds.has(tc.id);
                                const isRowActive = activeTestCase?.id === tc.id;
                                return (
                                  <div
                                    key={tc.id}
                                    draggable
                                    onDragStart={(e) => {
                                      const idsToDrag = isSelected
                                        ? Array.from(selectedCaseIds)
                                        : [tc.id];
                                      e.dataTransfer.setData(
                                        'application/json',
                                        JSON.stringify({ type: 'cases', caseIds: idsToDrag })
                                      );
                                    }}
                                    onClick={() => handleOpenTestCase(tc)}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      setContextMenu({
                                        isOpen: true,
                                        x: e.clientX,
                                        y: e.clientY,
                                        type: 'case',
                                        targetCase: tc,
                                      });
                                    }}
                                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                                      isRowActive
                                        ? 'bg-[#202234] border border-indigo-500/50'
                                        : 'hover:bg-[#1a1c2b] border border-transparent'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCaseIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(tc.id)) next.delete(tc.id);
                                          else next.add(tc.id);
                                          return next;
                                        });
                                      }}
                                      onChange={() => {}}
                                      className="rounded border-[#3a3d54] bg-[#1e1f2e] text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                                    />

                                    {/* Priority Icon */}
                                    <div className="shrink-0">
                                      {tc.priority === 'high' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                                      ) : tc.priority === 'low' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                                      ) : (
                                        <Minus className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                                      )}
                                    </div>

                                    {/* Case Key Link */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300">
                                        {tc.key}
                                      </span>
                                      {isAllProjects && (
                                        <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#25283c] text-slate-300 border border-[#363a54]">
                                          {allProjects.find((p) => p.id === tc.projectId)?.key ||
                                            tc.projectId}
                                        </span>
                                      )}
                                    </div>

                                    {/* Title */}
                                    <span className="text-xs font-medium text-slate-200 truncate flex-1 group-hover:text-white">
                                      {tc.title}
                                    </span>

                                    {/* Requirement Tags */}
                                    {tc.requirementRefs && tc.requirementRefs.length > 0 && (
                                      <div className="hidden lg:flex items-center gap-1 shrink-0">
                                        {tc.requirementRefs.map((r) => (
                                          <span
                                            key={r}
                                            className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/40"
                                          >
                                            {r}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Status */}
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 shrink-0">
                                      {tc.status}
                                    </span>

                                    {/* Quick Action Buttons on hover */}
                                    <div
                                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleDuplicateTestCase(tc)}
                                        className="p-1 hover:bg-[#25283c] text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
                                        title="Duplicate Case (Ctrl+D)"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCaseToDelete(tc)}
                                        className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                        title="Delete Test Case / Изтрий тест кейс"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setContextMenu({
                                            isOpen: true,
                                            x: e.clientX,
                                            y: e.clientY,
                                            type: 'case',
                                            targetCase: tc,
                                          });
                                        }}
                                        className="p-1 hover:bg-[#25283c] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                                        title="More test case options & actions..."
                                      >
                                        <MoreVertical className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                displayedCases.map((tc) => {
                  const isSelected = selectedCaseIds.has(tc.id);
                  const isRowActive = activeTestCase?.id === tc.id;

                  return (
                    <div
                      key={tc.id}
                      draggable
                      onDragStart={(e) => {
                        const idsToDrag = isSelected ? Array.from(selectedCaseIds) : [tc.id];
                        e.dataTransfer.setData(
                          'application/json',
                          JSON.stringify({ type: 'cases', caseIds: idsToDrag })
                        );
                      }}
                      onClick={() => handleOpenTestCase(tc)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          isOpen: true,
                          x: e.clientX,
                          y: e.clientY,
                          type: 'case',
                          targetCase: tc,
                        });
                      }}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                        isRowActive
                          ? 'bg-[#202234] border border-indigo-500/50'
                          : 'hover:bg-[#1a1c2b] border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCaseIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(tc.id)) next.delete(tc.id);
                            else next.add(tc.id);
                            return next;
                          });
                        }}
                        onChange={() => {}}
                        className="rounded border-[#3a3d54] bg-[#1e1f2e] text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                      />

                      {/* Priority Icon */}
                      <div className="shrink-0">
                        {tc.priority === 'high' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                        ) : tc.priority === 'low' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                        )}
                      </div>

                      {/* Case Key Link */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300">
                          {tc.key}
                        </span>
                        {isAllProjects && (
                          <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#25283c] text-slate-300 border border-[#363a54]">
                            {allProjects.find((p) => p.id === tc.projectId)?.key || tc.projectId}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <span className="text-xs font-medium text-slate-200 truncate flex-1 group-hover:text-white">
                        {tc.title}
                      </span>

                      {/* Requirement Tags */}
                      {tc.requirementRefs && tc.requirementRefs.length > 0 && (
                        <div className="hidden lg:flex items-center gap-1 shrink-0">
                          {tc.requirementRefs.map((r) => (
                            <span
                              key={r}
                              className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/40"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Status */}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 shrink-0">
                        {tc.status}
                      </span>

                      {/* Quick Action Buttons on hover */}
                      <div
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleDuplicateTestCase(tc)}
                          className="p-1 hover:bg-[#25283c] text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
                          title="Duplicate Case (Ctrl+D)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCaseToDelete(tc)}
                          className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete Test Case / Изтрий тест кейс"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({
                              isOpen: true,
                              x: e.clientX,
                              y: e.clientY,
                              type: 'case',
                              targetCase: tc,
                            });
                          }}
                          className="p-1 hover:bg-[#25283c] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                          title="More test case options & actions..."
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Quick test input bar */}
              <div className="pt-2 px-1">
                {!isQuickTestOpen ? (
                  <button
                    onClick={() => setIsQuickTestOpen(true)}
                    className="px-3 py-1.5 bg-[#1a1c2b] hover:bg-[#202234] border border-[#2d3044] rounded-lg text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quick test</span>
                  </button>
                ) : (
                  <div className="p-3 bg-[#1e1f2e] border border-indigo-500/50 rounded-xl space-y-2.5 animate-in fade-in duration-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-indigo-400" />
                        Quick Add Test Case
                      </span>
                      <button
                        onClick={() => setIsQuickTestOpen(false)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={quickTestTitle}
                        onChange={(e) => setQuickTestTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateQuickTest();
                        }}
                        placeholder="e.g. TC-004 Verify XML invoice checksum generation"
                        className="flex-1 bg-[#141522] border border-[#2d3044] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <select
                        value={quickTestPriority}
                        onChange={(e) => setQuickTestPriority(e.target.value as TestPriority)}
                        className="bg-[#141522] border border-[#2d3044] rounded-lg px-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button
                        onClick={handleCreateQuickTest}
                        disabled={!quickTestTitle.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 4: INLINE TEST CASE PREVIEW PANEL */}
          {activeTestCase && (
            <TestCasePreviewPanel
              testCase={activeTestCase}
              onClose={() => setActiveTestCase(null)}
              onUpdateTestCase={(updated) => {
                onUpdateTestCase(updated);
                setActiveTestCase(updated);
              }}
              onDeleteTestCase={(id) => {
                onDeleteTestCase(id);
                setActiveTestCase(null);
              }}
              onDuplicateTestCase={handleDuplicateTestCase}
              requirements={requirements}
              suites={projectSuites}
              defects={defects}
              testRuns={testRuns}
              project={project}
              onTriggerAIForCase={(tc, action) => {
                setShowAICopilotModal(true);
              }}
              onOpenFullEditor={(tc) => {
                setEditorTestCase(tc);
                setIsEditorModalOpen(true);
              }}
            />
          )}
        </div>
      </div>
      )}

      {/* =========================================================================
          WINDOWS EXPLORER STYLE CONTEXT MENU
      ========================================================================= */}
      <RepositoryContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onCreateTestRun={(target) => {
          if (onRequestCreateRun) {
            if (target.type === 'case') {
              onRequestCreateRun({
                caseId: target.testCase?.id,
                repoId: target.testCase?.repositoryId || selectedRepositoryId || undefined,
                suiteId: target.testCase?.suiteId,
              });
            } else if (target.type === 'suite') {
              onRequestCreateRun({
                suiteId: target.suite?.id === '__repo_root__' ? undefined : target.suite?.id,
                repoId: target.suite?.repositoryId || selectedRepositoryId || undefined,
              });
            } else if (target.type === 'repo') {
              onRequestCreateRun({
                repoId: target.repoId || selectedRepositoryId || undefined,
              });
            }
          }
        }}
        isSuiteExpanded={Boolean(
          contextMenu.targetSuite && expandedSuiteIds.has(contextMenu.targetSuite.id)
        )}
        onToggleExpandSuite={handleToggleExpand}
        onFoldAllChildSuites={handleCollapseChildren}
        onUnfoldAllChildSuites={handleExpandChildren}
        onNewTestCase={(suiteId) => {
          setEditorTestCase(null);
          if (suiteId) {
            onSelectSuite(suiteId);
          }
          setIsEditorModalOpen(true);
        }}
        onNewSuite={(parentId) => {
          setNewSuiteParentId(parentId || null);
          setShowCreateSuiteModal(true);
        }}
        onRenameSuite={(suite) => {
          setSuiteToRename(suite);
        }}
        onDuplicateSuite={handleDuplicateSuite}
        onToggleFavoriteSuite={handleToggleFavorite}
        isFavoriteSuite={Boolean(
          contextMenu.targetSuite && favoriteSuiteIds.has(contextMenu.targetSuite.id)
        )}
        onDeleteSuite={(id) => {
          const s = projectSuites.find((item) => item.id === id);
          if (s) setSuiteToDelete(s);
        }}
        onExportSuite={(suite) => {
          setExportSuiteTarget(suite);
          setShowExportModal(true);
        }}
        onAICopilotForSuite={(suite) => {
          onSelectSuite(suite.id);
          setShowAICopilotModal(true);
        }}
        onOpenTestCase={handleOpenTestCase}
        onDuplicateTestCase={handleDuplicateTestCase}
        onDeleteTestCase={(id) => {
          const c = projectCases.find((item) => item.id === id);
          if (c) setCaseToDelete(c);
        }}
        onExportTestCase={(tc) => {
          const name = exportSingleTestCase(project, tc, 'json');
          setExportSuccessMessage(`Downloaded ${tc.key} as ${name}`);
          setTimeout(() => setExportSuccessMessage(null), 3500);
        }}
        onAICopilotForCase={(tc) => setShowAICopilotModal(true)}
      />

      {/* =========================================================================
          CONTEXT-AWARE AI COPILOT MODAL
      ========================================================================= */}
      {showAICopilotModal && (
        <RepositoryAICopilotModal
          isOpen={showAICopilotModal}
          onClose={() => setShowAICopilotModal(false)}
          project={project}
          selectedSuite={activeSuite}
          existingCases={projectCases}
          requirements={requirements}
          onImportGeneratedCases={(cases) => {
            cases.forEach((c) => onAddTestCase(c));
          }}
        />
      )}

      {/* =========================================================================
          MODAL: CREATE SUITE
      ========================================================================= */}
      {showCreateSuiteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#262838]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                Create New Test Suite
              </h3>
              <button
                onClick={() => setShowCreateSuiteModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Suite Name *</label>
                <input
                  type="text"
                  value={newSuiteName}
                  onChange={(e) => setNewSuiteName(e.target.value)}
                  placeholder="e.g. Master Data Units"
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Parent Suite (Hierarchical)
                </label>
                <select
                  value={newSuiteParentId || ''}
                  onChange={(e) => setNewSuiteParentId(e.target.value || null)}
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="">Root Suite (No Parent)</option>
                  {projectSuites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Description</label>
                <textarea
                  value={newSuiteDesc}
                  onChange={(e) => setNewSuiteDesc(e.target.value)}
                  placeholder="Scope, boundary..."
                  rows={2}
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262838]">
              <button
                onClick={() => setShowCreateSuiteModal(false)}
                className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSuite}
                disabled={!newSuiteName.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold cursor-pointer"
              >
                Create Suite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT SUITE / SET PARENT SUITE
      ========================================================================= */}
      {editingSuite && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#262838]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                Edit Suite: {editingSuite.name}
              </h3>
              <button
                onClick={() => setEditingSuite(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Suite Name *</label>
                <input
                  type="text"
                  value={editSuiteName}
                  onChange={(e) => setEditSuiteName(e.target.value)}
                  placeholder="e.g. Master Data Units"
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Parent Suite (Hierarchical nesting)
                </label>
                <select
                  value={editSuiteParentId || ''}
                  onChange={(e) => setEditSuiteParentId(e.target.value || null)}
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="">Root Suite (No Parent)</option>
                  {projectSuites
                    .filter((s) => s.id !== editingSuite.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Choose which parent suite this suite should be folded inside.
                </p>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Description</label>
                <textarea
                  value={editSuiteDesc}
                  onChange={(e) => setEditSuiteDesc(e.target.value)}
                  placeholder="Scope, boundary..."
                  rows={2}
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262838]">
              <button
                onClick={() => setEditingSuite(null)}
                className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditSuite}
                disabled={!editSuiteName.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE TEST CASE
      ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#262838]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Create New Test Case
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. TC-002 Verify ISYSCOMPARE Installation"
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Suite</label>
                  <select
                    value={newSuiteId}
                    onChange={(e) => setNewSuiteId(e.target.value)}
                    className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none"
                  >
                    {projectSuites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TestPriority)}
                    className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Test objective..."
                  rows={2}
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Preconditions</label>
                <input
                  type="text"
                  value={newPreconditions}
                  onChange={(e) => setNewPreconditions(e.target.value)}
                  placeholder="System prerequisites..."
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262838]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFullTestCase}
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold cursor-pointer"
              >
                Create Test Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULL-SCREEN QASE-STYLE TEST CASE CREATOR / EDITOR MODAL (+ Manual test)
      ========================================================================= */}
      {isEditorModalOpen && (
        <TestCaseEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => {
            setIsEditorModalOpen(false);
            setEditorTestCase(null);
          }}
          onSaveTestCase={handleSaveEditorTestCase}
          initialTestCase={editorTestCase}
          suites={projectSuites}
          defaultSuiteId={selectedSuiteId || projectSuites[0]?.id || null}
          project={project}
          requirements={requirements}
        />
      )}

      {/* =========================================================================
          MODAL: SWITCH PROJECT
      ========================================================================= */}
      {showProjectSelectorModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#262838]">
              <span className="font-bold text-white">Select Project Repository</span>
              <button
                onClick={() => setShowProjectSelectorModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {allProjects.length === 0 ? (
                <div className="py-6 px-3 text-center">
                  <Folder className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-70" />
                  <p className="text-xs font-semibold text-slate-300">No projects yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                    Create your first QA project to get started
                  </p>
                </div>
              ) : (
                <>
                  {/* All Projects Choice */}
                  <div
                    onClick={() => {
                      onSelectProject?.({
                        id: 'all',
                        organizationId: project.organizationId || 'org-1',
                        name: 'All Projects',
                        key: 'ALL',
                        description:
                          'Enterprise consolidated overview displaying test cases, suites, test runs, and defects across all projects.',
                        suiteCount: allProjects.reduce((acc, p) => acc + p.suiteCount, 0),
                        caseCount: allProjects.reduce((acc, p) => acc + p.caseCount, 0),
                        openBugsCount: allProjects.reduce((acc, p) => acc + p.openBugsCount, 0),
                        updatedAt: new Date().toISOString(),
                      });
                      onSelectSuite(null);
                      setShowProjectSelectorModal(false);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors mb-2 ${
                      isAllProjects
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                        : 'bg-[#1e1f2e] border-indigo-900/50 text-slate-200 hover:bg-[#25283c]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isAllProjects ? 'bg-indigo-500 text-white' : 'bg-[#262838] text-indigo-400'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-semibold">All Projects</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ALL • All {allProjects.length} projects combined
                        </span>
                      </div>
                    </div>
                    {isAllProjects && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>

                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 pb-0.5">
                    Individual Projects
                  </div>
                </>
              )}

              {allProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject?.(p);
                    onSelectSuite(null);
                    setShowProjectSelectorModal(false);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                    p.id === project.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-[#1e1f2e] border-[#2e3146] text-slate-300 hover:bg-[#25283c]'
                  }`}
                >
                  <div>
                    <span className="block">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.key} • {p.caseCount} cases
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.id === project.id && <Check className="w-4 h-4 text-indigo-400" />}
                    {p.id !== 'all' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProjectSelectorModal(false);
                          handleExportProject(p);
                        }}
                        className="p-1 hover:bg-[#262838] text-slate-400 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                        title={`Export Full Backup for ${p.name} / Експорт на цял проект`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onRequestEditProject && p.id !== 'all' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProjectSelectorModal(false);
                          onRequestEditProject(p);
                        }}
                        className="p-1 hover:bg-[#262838] text-slate-400 hover:text-indigo-400 rounded transition-colors cursor-pointer"
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
                          setShowProjectSelectorModal(false);
                          onRequestCopyProject(p);
                        }}
                        className="p-1 hover:bg-[#262838] text-slate-400 hover:text-purple-400 rounded transition-colors cursor-pointer"
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
                          setShowProjectSelectorModal(false);
                          onRequestDeleteProject(p);
                        }}
                        className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title={`Delete ${p.name} and purge all data / Изтрий проекта`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#262838] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowProjectSelectorModal(false);
                  setShowImportRepoModal(true);
                  setImportMode('new');
                }}
                className="flex-1 py-2 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-xs"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import Project</span>
              </button>
              {onOpenCreateProject && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectSelectorModal(false);
                    onOpenCreateProject();
                  }}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create Project</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification for Export */}
      {exportSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {/* MODAL: EXPORT SUITE / REPOSITORY */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#262838] pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">
                  Export{' '}
                  {exportSuiteTarget
                    ? `Suite: ${exportSuiteTarget.name}`
                    : `${project.name} Repository`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportSuiteTarget(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-slate-400">
                Choose an export format to instantly download test procedures, step assertions, and
                coverage metadata:
              </p>
              <div className="text-[11px] font-mono text-indigo-400">
                Scope:{' '}
                {exportSuiteTarget
                  ? `${getTestCasesForSuite(exportSuiteTarget.id, projectSuites, projectCases).length} Cases in ${exportSuiteTarget.name}`
                  : `${sortTestCasesChronological(projectCases).length} Cases in [${project.key}]`}
              </div>
            </div>

            {/* Format Option Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  const casesToExport = sortTestCasesChronological(
                    getTestCasesForSuite(exportSuiteTarget?.id, projectSuites, projectCases)
                  );
                  const name = exportSuiteAsPdf(
                    project,
                    exportSuiteTarget?.name || 'Complete_Repository',
                    casesToExport
                  );
                  setExportSuccessMessage(`Generated & downloaded ${name}`);
                  setTimeout(() => setExportSuccessMessage(null), 3500);
                  setShowExportModal(false);
                }}
                className="p-3 bg-[#1e1f2e] hover:bg-[#25283c] border border-[#2e3146] hover:border-indigo-500 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white group-hover:text-indigo-400">
                    PDF Document
                  </span>
                  <FileText className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Formatted ISO 29119 test specification with tables
                </p>
              </button>

              <button
                onClick={() => {
                  const casesToExport = sortTestCasesChronological(
                    getTestCasesForSuite(exportSuiteTarget?.id, projectSuites, projectCases)
                  );
                  const name = exportSuiteAsJson(
                    project,
                    exportSuiteTarget?.name || 'Complete_Repository',
                    casesToExport,
                    projectSuites
                  );
                  setExportSuccessMessage(`Downloaded ${name}`);
                  setTimeout(() => setExportSuccessMessage(null), 3500);
                  setShowExportModal(false);
                }}
                className="p-3 bg-[#1e1f2e] hover:bg-[#25283c] border border-[#2e3146] hover:border-indigo-500 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white group-hover:text-indigo-400">
                    JSON Package
                  </span>
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Full structured JSON with all steps &amp; parameters
                </p>
              </button>

              <button
                onClick={() => {
                  const casesToExport = sortTestCasesChronological(
                    getTestCasesForSuite(exportSuiteTarget?.id, projectSuites, projectCases)
                  );
                  const name = exportSuiteAsCsv(
                    project,
                    exportSuiteTarget?.name || 'Complete_Repository',
                    casesToExport
                  );
                  setExportSuccessMessage(`Downloaded ${name}`);
                  setTimeout(() => setExportSuccessMessage(null), 3500);
                  setShowExportModal(false);
                }}
                className="p-3 bg-[#1e1f2e] hover:bg-[#25283c] border border-[#2e3146] hover:border-indigo-500 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white group-hover:text-indigo-400">
                    CSV (Excel)
                  </span>
                  <Tag className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  UTF-8 BOM spreadsheet for Excel &amp; Google Sheets
                </p>
              </button>

              <button
                onClick={() => {
                  const casesToExport = sortTestCasesChronological(
                    getTestCasesForSuite(exportSuiteTarget?.id, projectSuites, projectCases)
                  );
                  const name = exportSuiteAsMarkdown(
                    project,
                    exportSuiteTarget?.name || 'Complete_Repository',
                    casesToExport
                  );
                  setExportSuccessMessage(`Downloaded ${name}`);
                  setTimeout(() => setExportSuccessMessage(null), 3500);
                  setShowExportModal(false);
                }}
                className="p-3 bg-[#1e1f2e] hover:bg-[#25283c] border border-[#2e3146] hover:border-indigo-500 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white group-hover:text-indigo-400">
                    Markdown (.md)
                  </span>
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  GitHub / Jira formatted documentation
                </p>
              </button>

              {/* Complete Repository Backup Card */}
              <button
                onClick={handleExportRepository}
                className="col-span-2 p-3 bg-gradient-to-r from-emerald-950/30 via-indigo-950/30 to-[#1e1f2e] hover:from-emerald-900/40 hover:to-[#25283c] border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white group-hover:text-emerald-300">
                      Complete Repository Backup (.json)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Repo
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Exports active repository structure ({activeRepository?.name || 'Main'}) into a standardized JSON file.
                </p>
              </button>

              {/* Complete Project Backup Card */}
              <button
                onClick={() => handleExportProject()}
                className="col-span-2 p-3 bg-gradient-to-r from-purple-950/30 via-indigo-950/30 to-[#1e1f2e] hover:from-purple-900/40 hover:to-[#25283c] border border-purple-500/40 hover:border-purple-400 rounded-xl text-left transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white group-hover:text-purple-300">
                      Full Project Backup (.json) / Експорт на цял Проект
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    All Repos + Runs
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Exports entire project ({project.name}): all {repositories.filter(r => r.projectId === project.id).length || 1} repositories, suites, cases, test runs, defects, and requirements for full disaster recovery / migration.
                </p>
              </button>
            </div>

            {/* Advanced Exporter Link */}
            {onNavigateToExport && (
              <div className="pt-2 border-t border-[#262838] flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Need formal sign-off or custom presets?
                </span>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    if (exportSuiteTarget) {
                      onSelectSuite(exportSuiteTarget.id);
                    }
                    onNavigateToExport();
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Advanced Document Exporter</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: IMPORT REPOSITORY (Responsive, Sticky Footer, Multiple Repo Options) */}
      {showImportRepoModal && (
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
              <button
                onClick={() => {
                  setShowImportRepoModal(false);
                  setImportParsedData(null);
                  setImportError(null);
                  setImportJsonText('');
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
              <p className="text-slate-400 leading-relaxed">
                Upload a previously exported Repository JSON backup file. All test suites, hierarchy
                levels, test cases, step procedures, and metadata will be restored.
              </p>

              {/* File drop zone / picker */}
              <div className="border-2 border-dashed border-[#2e3146] hover:border-emerald-500/60 rounded-xl py-3.5 px-4 text-center bg-[#141522] transition-colors">
                <input
                  type="file"
                  id="repo-import-input"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleParseImportFile(file);
                  }}
                />
                <label
                  htmlFor="repo-import-input"
                  className="cursor-pointer flex flex-col items-center gap-1.5"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-slate-200 font-semibold">
                    Click to select a JSON file or drag and drop
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Supports exported repository backups &amp; suite JSON files
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
                    <span className="font-semibold text-white">
                      {importParsedData.type === 'qasgard_project_export' || (importParsedData.repositories && importParsedData.repositories.length > 0)
                        ? 'Project Backup Preview:'
                        : 'Repository Preview:'}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                      {importParsedData.type === 'qasgard_project_export' ? 'Full Project Backup' : 'Repository Backup'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-[#1b1c2b] rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Source Project</span>
                      <span className="font-semibold text-white truncate block">
                        {importParsedData.project?.name || 'Unnamed Project'}
                      </span>
                    </div>
                    <div className="p-2 bg-[#1b1c2b] rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Source Key</span>
                      <span className="font-mono font-bold text-indigo-400 block">
                        {importParsedData.project?.key || 'AUTO'}
                      </span>
                    </div>
                    <div className="p-2 bg-[#1b1c2b] rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Repositories</span>
                      <span className="font-semibold text-purple-400 block">
                        {importParsedData.repositories?.length || 1} repos
                      </span>
                    </div>
                    <div className="p-2 bg-[#1b1c2b] rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Suites Detected</span>
                      <span className="font-semibold text-emerald-400 block">
                        {importParsedData.suites?.length || 0} suites
                      </span>
                    </div>
                    <div className="p-2 bg-[#1b1c2b] rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Test Cases</span>
                      <span className="font-semibold text-cyan-400 block">
                        {importParsedData.testCases?.length || 0} test cases
                      </span>
                    </div>
                    {importParsedData.testRuns && importParsedData.testRuns.length > 0 && (
                      <div className="p-2 bg-[#1b1c2b] rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Test Runs</span>
                        <span className="font-semibold text-amber-400 block">
                          {importParsedData.testRuns.length} runs
                        </span>
                      </div>
                    )}
                    {importParsedData.defects && importParsedData.defects.length > 0 && (
                      <div className="p-2 bg-[#1b1c2b] rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Defects</span>
                        <span className="font-semibold text-rose-400 block">
                          {importParsedData.defects.length} defects
                        </span>
                      </div>
                    )}
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
                            Създава ново репозитори вътре в проект <b>{project.name}</b> [
                            {project.key}]. Всички тестове се организират в него без да се създава
                            нов проект в системата.
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
                            Слей в активното Репозитори (
                            {activeRepository?.name || 'Main Repository'})
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Добавя всички тестови пакети и случаи директно към текущо избраното
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
                            Ще добави нов проект в главното меню на проектите (не като репозитори
                            към {project.name}).
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
                {importMode === 'merge' && `Сливане в: ${activeRepository?.name || 'Main Repo'}`}
                {importMode === 'new' && 'Ще се създаде нов проект'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportRepoModal(false);
                    setImportParsedData(null);
                    setImportError(null);
                    setImportJsonText('');
                  }}
                  className="px-3.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importParsedData}
                  onClick={handleConfirmImportRepository}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {importMode === 'new_repo'
                      ? `Импортирай като ново Репозитори в "${project.name}"`
                      : importMode === 'merge'
                        ? `Слей в ${activeRepository?.name || 'активното'}`
                        : 'Създай нов проект'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW REPOSITORY */}
      {showCreateRepoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#262838] pb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">
                  Add New Repository to {project.key}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateRepoModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Create an isolated test repository inside project{' '}
              <span className="text-white font-semibold">{project.name}</span> (e.g. for API, Mobile
              App, or Feature modules).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Repository Name *</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="e.g. API Integration, Mobile iOS/Android, Billing"
                  className="w-full bg-[#141522] border border-[#2e3146] focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  placeholder="Describe the scope or components tested in this repository..."
                  rows={2}
                  className="w-full bg-[#141522] border border-[#2e3146] focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262838]">
              <button
                type="button"
                onClick={() => {
                  setShowCreateRepoModal(false);
                  setNewRepoName('');
                  setNewRepoDesc('');
                }}
                className="px-3.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newRepoName.trim()}
                onClick={() => {
                  if (onCreateRepository) {
                    onCreateRepository(project.id, newRepoName, newRepoDesc);
                  }
                  setShowCreateRepoModal(false);
                  setNewRepoName('');
                  setNewRepoDesc('');
                  setExportSuccessMessage(`Repository "${newRepoName.trim()}" created!`);
                  setTimeout(() => setExportSuccessMessage(null), 3000);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Repository</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RENAME REPOSITORY */}
      {repoToRename && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#262838] pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Rename Repository</h3>
              </div>
              <button
                onClick={() => setRepoToRename(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Repository Name</label>
              <input
                type="text"
                value={renameRepoName}
                onChange={(e) => setRenameRepoName(e.target.value)}
                className="w-full bg-[#141522] border border-[#2e3146] focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262838]">
              <button
                type="button"
                onClick={() => setRepoToRename(null)}
                className="px-3.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!renameRepoName.trim()}
                onClick={() => {
                  if (onUpdateRepository && repoToRename) {
                    onUpdateRepository({
                      ...repoToRename,
                      name: renameRepoName.trim(),
                    });
                  }
                  setRepoToRename(null);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE REPOSITORY */}
      {repoToDelete &&
        (() => {
          const affectedSuites = testSuites.filter(
            (s) => (s.repositoryId || 'default-repo') === repoToDelete.id
          ).length;
          const affectedCases = testCases.filter(
            (tc) => (tc.repositoryId || 'default-repo') === repoToDelete.id
          ).length;

          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
              <div className="bg-[#181926] border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
                <div className="flex items-center justify-between border-b border-[#262838] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        Изтриване на репозитори / Delete Repository
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">
                        {repoToDelete.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRepoToDelete(null)}
                    className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-[#202234]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats banner */}
                <div className="bg-[#141522] border border-[#262838] rounded-xl p-3 flex items-center justify-around text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">
                      Репозитори
                    </div>
                    <div
                      className="text-white font-bold text-xs truncate max-w-[130px]"
                      title={repoToDelete.name}
                    >
                      {repoToDelete.name}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-[#262838]" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">
                      Тестови комплекти
                    </div>
                    <div className="text-indigo-400 font-bold text-xs font-mono">
                      {affectedSuites} suites
                    </div>
                  </div>
                  <div className="h-6 w-px bg-[#262838]" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">
                      Тестови случаи
                    </div>
                    <div className="text-amber-400 font-bold text-xs font-mono">
                      {affectedCases} cases
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  <div className="text-slate-300 font-semibold text-[11px]">
                    Изберете как да се изтрие репозиторито:
                  </div>

                  {/* Option 1: Full Purge (No merge) - Default */}
                  <div
                    onClick={() => setDeleteRepoMode('purge')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deleteRepoMode === 'purge'
                        ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40 text-white'
                        : 'bg-[#1b1c2b] border-[#292c3f] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deleteRepoMode"
                        checked={deleteRepoMode === 'purge'}
                        onChange={() => setDeleteRepoMode('purge')}
                        className="mt-1 accent-rose-500 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            Изтрий изцяло (Пълно изтриване, БЕЗ merge)
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Перманентно
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Изтрива репозиторито и{' '}
                          <strong className="text-rose-300">перманентно премахва</strong> всичките
                          му {affectedSuites} комплекта и {affectedCases} тестови случая. Данните{' '}
                          <strong className="text-white">НЕ се сливат</strong> в Main Repository.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Merge to Main & Delete */}
                  <div
                    onClick={() => setDeleteRepoMode('merge')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deleteRepoMode === 'merge'
                        ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/40 text-white'
                        : 'bg-[#1b1c2b] border-[#292c3f] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deleteRepoMode"
                        checked={deleteRepoMode === 'merge'}
                        onChange={() => setDeleteRepoMode('merge')}
                        className="mt-1 accent-indigo-500 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            Слей в Main Repository и изтрий
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Merge to Main
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Всички {affectedSuites} тестови комплекта и {affectedCases} тестови случая
                          ще бъдат запазени и автоматично прехвърлени към основното Main Repository.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {deleteRepoMode === 'purge' && (
                  <div className="bg-rose-500/10 border border-rose-500/25 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>
                      Внимание: Пълното изтриване е необратимо. Всички тестове в "
                      {repoToDelete.name}" ще бъдат изтрити завинаги без сливане.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262838]">
                  <button
                    type="button"
                    onClick={() => setRepoToDelete(null)}
                    className="px-3.5 py-2 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg cursor-pointer"
                  >
                    Отказ / Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteRepository && repoToDelete) {
                        const isPurge = deleteRepoMode === 'purge';
                        onDeleteRepository(repoToDelete.id, isPurge);
                      }
                      setRepoToDelete(null);
                    }}
                    className={`px-4 py-2 text-white rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                      deleteRepoMode === 'purge'
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40 ring-1 ring-rose-400/50'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {deleteRepoMode === 'purge'
                        ? `Изтрий изцяло "${repoToDelete.name}" (БЕЗ merge)`
                        : 'Слей и изтрий'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* RENAME SUITE MODAL */}
      {suiteToRename && (
        <RenameSuiteModal
          isOpen={Boolean(suiteToRename)}
          onClose={() => setSuiteToRename(null)}
          suite={suiteToRename}
          onRenameSuite={(suiteId, newName) => {
            if (onUpdateSuite && suiteToRename) {
              onUpdateSuite({
                ...suiteToRename,
                name: newName,
              });
            }
            setSuiteToRename(null);
          }}
        />
      )}

      {/* CONFIRM DELETE SUITE MODAL */}
      {suiteToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(suiteToDelete)}
          onClose={() => setSuiteToDelete(null)}
          title={`Delete Test Suite "${suiteToDelete.name}"?`}
          description={`Are you sure you want to permanently delete "${suiteToDelete.name}"? This action will remove this suite and all nested child suites, along with all associated test cases.`}
          itemName={suiteToDelete.name}
          itemType="suite"
          onConfirm={() => {
            if (onDeleteSuite) {
              onDeleteSuite(suiteToDelete.id);
            }
            if (selectedSuiteId === suiteToDelete.id) {
              onSelectSuite(null);
            }
            setSuiteToDelete(null);
          }}
        />
      )}

      {/* CONFIRM DELETE SINGLE TEST CASE MODAL */}
      {caseToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(caseToDelete)}
          onClose={() => setCaseToDelete(null)}
          title={`Delete Test Case "${caseToDelete.key}"?`}
          description={`Are you sure you want to permanently delete test case "${caseToDelete.key}: ${caseToDelete.title}" from suite "${caseToDelete.suiteName}"?`}
          itemName={`[${caseToDelete.key}] ${caseToDelete.title}`}
          itemType="case"
          onConfirm={() => {
            onDeleteTestCase(caseToDelete.id);
            if (activeTestCase?.id === caseToDelete.id) {
              setActiveTestCase(null);
            }
            setCaseToDelete(null);
          }}
        />
      )}

      {/* CONFIRM BULK DELETE TEST CASES MODAL */}
      {showBulkDeleteConfirm && (
        <ConfirmDeleteModal
          isOpen={showBulkDeleteConfirm}
          onClose={() => setShowBulkDeleteConfirm(false)}
          title={`Delete ${selectedCaseIds.size} Selected Test Cases?`}
          description={`Are you sure you want to permanently delete all ${selectedCaseIds.size} selected test cases? This action cannot be undone.`}
          itemType="bulk_cases"
          onConfirm={() => {
            selectedCaseIds.forEach((id) => onDeleteTestCase(id));
            if (activeTestCase && selectedCaseIds.has(activeTestCase.id)) {
              setActiveTestCase(null);
            }
            setSelectedCaseIds(new Set());
            setShowBulkDeleteConfirm(false);
          }}
        />
      )}
    </div>
  );
};
