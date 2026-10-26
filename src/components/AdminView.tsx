import React, { useState } from 'react';
import {
  Upload,
  FileDown,
  BookmarkCheck,
  History,
  Sparkles,
  FileText,
  Database,
  Cpu,
  Server,
  Code,
  Layers,
  Palette,
  ShieldCheck,
  Search,
  ChevronRight,
  Boxes,
  Workflow,
  Wrench,
} from 'lucide-react';
import { HardDrive } from 'lucide-react';
import {
  Project,
  TestSuite,
  TestCase,
  TestRun,
  TestPlan,
  Defect,
  User,
  AuditLogEntry,
} from '../types';
import { getLogoUrl, getIconSvgUrl } from '../utils/logo';

import { ImportWizardView } from './ImportWizardView';
import { TestSuiteExportView } from './TestSuiteExportView';
import { TestPlansView } from './TestPlansView';
import { AuditTrailView } from './AuditTrailView';
import { AIQualityStudioView } from './AIQualityStudioView';
import { AIRequirementIntelligenceView } from './AIRequirementIntelligenceView';
import { AITestGenArchitectureView } from './AITestGenArchitectureView';
import { PRDViewer } from './PRDViewer';
import { DatabaseSchemaView } from './DatabaseSchemaView';
import { SolutionArchitectureView } from './SolutionArchitectureView';
import { BrowserArchitectureView } from './BrowserArchitectureView';
import { FrontendArchitectureView } from './FrontendArchitectureView';
import { MVPCodebaseViewer } from './MVPCodebaseViewer';
import { TestCaseManagementView } from './TestCaseManagementView';
import { UXDesignSystemView } from './UXDesignSystemView';
import { WorkspaceManagerView } from './WorkspaceManagerView';

export type AdminSubTabId =
  | 'import-wizard'
  | 'suite-export'
  | 'workspace-storage'
  | 'plans'
  | 'audit-trail'
  | 'ai-studio'
  | 'ai-governance'
  | 'ai-arch'
  | 'prd-viewer'
  | 'db-schema'
  | 'architecture'
  | 'browser-arch'
  | 'frontend-arch'
  | 'mvp-code'
  | 'case-spec'
  | 'ux-design';

interface AdminViewProps {
  project: Project;
  testSuites: TestSuite[];
  testCases: TestCase[];
  testRuns: TestRun[];
  testPlans: TestPlan[];
  defects?: Defect[];
  users?: User[];
  auditLogs: AuditLogEntry[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeSubTab?: AdminSubTabId;
  onSelectSubTab?: (subTab: AdminSubTabId) => void;
  onImportWizardCompleted: (newCases: Partial<TestCase>[], newSuites: Partial<TestSuite>[]) => void;
  onImportGeneratedCases: (cases: Partial<TestCase>[]) => void;
  onCreatePlan: (plan: Partial<TestPlan>) => void;
  onUpdateTestCase: (testCase: TestCase) => void;
  onAddTestCase?: (testCase: Partial<TestCase>) => void;
  onReloadWorkspace?: () => Promise<void>;
  initialSuiteId?: string | null;
  onBackToDashboard?: () => void;
}

interface AdminToolItem {
  id: AdminSubTabId;
  label: string;
  category: 'Testing Operations' | 'AI Quality Engine' | 'System Specs & Architecture';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const ADMIN_TOOLS: AdminToolItem[] = [
  // 1. Testing Operations
  {
    id: 'import-wizard',
    label: 'Universal Importer',
    category: 'Testing Operations',
    description: 'Bulk CSV, Excel, TestRail, and Qase repository migration wizard',
    icon: Upload,
    badge: 'Bulk',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    id: 'suite-export',
    label: 'Suite Exporter',
    category: 'Testing Operations',
    description: 'Export compliance test suites to PDF, Markdown, and ISO audits',
    icon: FileDown,
    badge: 'Export',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  },
  {
    id: 'plans',
    label: 'Test Plans',
    category: 'Testing Operations',
    description: 'Sprint milestones, release test matrix planning, and coverage gates',
    icon: BookmarkCheck,
    badge: 'Milestone',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    id: 'audit-trail',
    label: 'Audit Trail & Compliance',
    category: 'Testing Operations',
    description: 'Cryptographic SHA-256 tamper-evident logs for FDA 21 CFR and SOC 2',
    icon: History,
    badge: 'SOC 2',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    id: 'workspace-storage',
    label: 'Local DB & Storage',
    category: 'Testing Operations',
    description:
      '100% Browser IndexedDB engine, full ZIP/JSON export & restore, recovery points, and storage monitor',
    icon: HardDrive,
    badge: 'Local DB',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },

  // 2. AI Quality Engine
  {
    id: 'ai-studio',
    label: 'AI Quality Studio',
    category: 'AI Quality Engine',
    description: 'Deep automated test generation and scenario synthesis from requirements',
    icon: Sparkles,
    badge: 'Gemini',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  {
    id: 'ai-governance',
    label: 'Impact & Hygiene',
    category: 'AI Quality Engine',
    description: 'AI-assisted requirement intelligence, duplicate detection, and test gaps',
    icon: Sparkles,
    badge: 'Intelligence',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
  {
    id: 'ai-arch',
    label: 'AI Gen Architecture',
    category: 'AI Quality Engine',
    description: 'Technical blueprints for LLM agents and multi-stage verification',
    icon: Sparkles,
    badge: 'Flash Arch',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },

  // 3. System Specs & Architecture
  {
    id: 'prd-viewer',
    label: 'PRD Specification',
    category: 'System Specs & Architecture',
    description: 'Comprehensive Product Requirements Document for enterprise QA platforms',
    icon: FileText,
    badge: 'PRD',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    id: 'db-schema',
    label: 'Postgres DB Schema',
    category: 'System Specs & Architecture',
    description: 'Relational data model, indexes, triggers, and SQL schema diagrams',
    icon: Database,
    badge: 'PostgreSQL',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    id: 'architecture',
    label: 'Solution Architecture ($0 Stack)',
    category: 'System Specs & Architecture',
    description: 'Production zero-cost cloud architecture with Neon, Supabase, and Vercel',
    icon: Cpu,
    badge: 'Zero-Cost',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    id: 'browser-arch',
    label: 'Browser-Only Architecture',
    category: 'System Specs & Architecture',
    description:
      '100% Browser Local-First architecture, IndexedDB v3 engine, auto-save, and zero cloud hosting',
    icon: HardDrive,
    badge: 'Zero Database',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    id: 'frontend-arch',
    label: 'Next.js 15 Frontend',
    category: 'System Specs & Architecture',
    description: 'Next.js App Router, Server Components, and client state orchestration',
    icon: Code,
    badge: 'Next.js 15',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    id: 'mvp-code',
    label: 'MVP Codebase Viewer',
    category: 'System Specs & Architecture',
    description: 'Full stack source code reference for QAsgard microservices',
    icon: Code,
    badge: 'Full Source',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
  {
    id: 'case-spec',
    label: 'Case Management Spec',
    category: 'System Specs & Architecture',
    description: 'Formal technical specification for test suites, cases, and versions',
    icon: Layers,
    badge: 'Spec',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  },
  {
    id: 'ux-design',
    label: 'UX & Design System',
    category: 'System Specs & Architecture',
    description: 'Component tokens, accessibility rules, color palette, and micro-interactions',
    icon: Palette,
    badge: 'Fluent UI',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  },
];

export const AdminView: React.FC<AdminViewProps> = ({
  project,
  testSuites,
  testCases,
  testRuns,
  testPlans,
  defects = [],
  users = [],
  auditLogs,
  isDarkMode,
  onToggleDarkMode,
  activeSubTab = 'workspace-storage',
  onSelectSubTab,
  onImportWizardCompleted,
  onImportGeneratedCases,
  onCreatePlan,
  onUpdateTestCase,
  onAddTestCase,
  onReloadWorkspace,
  initialSuiteId,
  onBackToDashboard,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<AdminSubTabId>(activeSubTab);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const currentTab = onSelectSubTab ? activeSubTab : internalSubTab;
  const setTab = onSelectSubTab || setInternalSubTab;

  const filteredTools = ADMIN_TOOLS.filter((tool) => {
    const matchesSearch =
      tool.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = [
    'all',
    'Testing Operations',
    'AI Quality Engine',
    'System Specs & Architecture',
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Admin Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700 bg-slate-900 shadow-md shrink-0 flex items-center justify-center">
              <img
                src={getLogoUrl()}
                alt="QAsgard"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.dataset.fallbackTried) {
                    target.dataset.fallbackTried = '1';
                    target.src = getIconSvgUrl();
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Admin &amp; Platform Console
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {project.key} Scope
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Centralized administration for repository migration, audit compliance, AI engines,
                Local DB &amp; storage
              </p>
            </div>
          </div>

          {/* Quick Metrics & Exit Button */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2">
              <Boxes className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-slate-500 text-[11px]">Suites:</span>
              <strong className="text-slate-800 dark:text-white font-mono">
                {testSuites.length}
              </strong>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-500 text-[11px]">Audit Logs:</span>
              <strong className="text-slate-800 dark:text-white font-mono">
                {auditLogs.length}
              </strong>
            </div>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-2xs"
                title="Изход към основното табло"
              >
                <span>← Изход към таблото / Back to Dashboard</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Navigation Selector Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'all' ? 'All Admin Modules (15)' : cat}
              </button>
            ))}
          </div>

          {/* Search Admin Tools */}
          <div className="relative max-w-xs w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter admin tools..."
              className="w-full sm:w-60 pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Sub-Tabs Grid / Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 py-1">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setTab(tool.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={tool.description}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400 dark:text-indigo-600' : 'text-slate-500'}`}
                />
                <span>{tool.label}</span>
                {tool.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider ${tool.badgeColor || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
                  >
                    {tool.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Module Content View */}
      <div className="flex-1 p-0">
        {currentTab === 'import-wizard' && (
          <ImportWizardView
            project={project}
            testSuites={testSuites}
            onImportCompleted={onImportWizardCompleted}
          />
        )}

        {currentTab === 'suite-export' && (
          <TestSuiteExportView
            project={project}
            testSuites={testSuites}
            testCases={testCases}
            initialSuiteId={initialSuiteId}
          />
        )}

        {currentTab === 'plans' && (
          <TestPlansView
            project={project}
            testPlans={testPlans}
            testCases={testCases}
            onCreatePlan={onCreatePlan}
          />
        )}

        {currentTab === 'audit-trail' && <AuditTrailView project={project} auditLogs={auditLogs} />}

        {currentTab === 'ai-studio' && (
          <AIQualityStudioView
            project={project}
            testSuites={testSuites}
            testCases={testCases}
            onImportGeneratedCases={onImportGeneratedCases}
          />
        )}

        {currentTab === 'ai-governance' && (
          <AIRequirementIntelligenceView
            project={project}
            testSuites={testSuites}
            testCases={testCases}
            testRuns={testRuns}
            onUpdateTestCase={onUpdateTestCase}
            onAddTestCase={onAddTestCase}
          />
        )}

        {currentTab === 'ai-arch' && (
          <AITestGenArchitectureView
            project={project}
            testSuites={testSuites}
            onImportGeneratedCases={onImportGeneratedCases}
          />
        )}

        {currentTab === 'prd-viewer' && <PRDViewer />}

        {currentTab === 'db-schema' && <DatabaseSchemaView />}

        {currentTab === 'architecture' && <SolutionArchitectureView />}

        {currentTab === 'browser-arch' && <BrowserArchitectureView />}

        {currentTab === 'workspace-storage' && (
          <WorkspaceManagerView
            project={project}
            testSuites={testSuites}
            testCases={testCases}
            testRuns={testRuns}
            defects={defects}
            users={users}
            onReloadWorkspace={onReloadWorkspace || (async () => {})}
          />
        )}

        {currentTab === 'frontend-arch' && <FrontendArchitectureView />}

        {currentTab === 'mvp-code' && <MVPCodebaseViewer />}

        {currentTab === 'case-spec' && <TestCaseManagementView />}

        {currentTab === 'ux-design' && (
          <UXDesignSystemView isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />
        )}
      </div>
    </div>
  );
};
