import React, { useState } from 'react';
import {
  Layers,
  Code,
  FolderTree,
  Cpu,
  Copy,
  Check,
  Download,
  Zap,
  Layout,
  Sliders,
  Radio,
  FileCode,
  Terminal,
  Globe,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  FRONTEND_ARCHITECTURE_MARKDOWN,
  FRONTEND_MODULES_SPECIFICATION,
} from '../data/frontendArchitectureDoc';

export const FrontendArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'modules' | 'folders' | 'zustand' | 'api-layer' | 'full-spec'
  >('modules');
  const [copied, setCopied] = useState(false);

  const handleCopySpec = () => {
    navigator.clipboard.writeText(FRONTEND_ARCHITECTURE_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSpec = () => {
    const blob = new Blob([FRONTEND_ARCHITECTURE_MARKDOWN], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qasgard_nextjs15_frontend_architecture.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1">
                <Code className="w-3 h-3 text-blue-400" />
                Next.js 15 App Router + Zustand Architecture
              </span>
              <span className="text-xs text-slate-400">
                • TypeScript • Tailwind • ShadCN • RSC Streaming
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Principal Frontend Architecture Blueprint
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Feature-sliced modular architecture engineered for sub-second page loads, zero
              client-state overhead, keyboard-first execution workflows, and optimistic server
              action mutations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySpec}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-blue-200" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied Specs!' : 'Copy Architecture Spec'}</span>
            </button>
            <button
              onClick={handleDownloadSpec}
              className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'modules'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            8 Core Modules &amp; Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'folders'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Next.js Folder Structure
          </button>
          <button
            onClick={() => setActiveTab('zustand')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'zustand'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Zustand State Architecture
          </button>
          <button
            onClick={() => setActiveTab('api-layer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'api-layer'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            API Layer &amp; Server Actions
          </button>
          <button
            onClick={() => setActiveTab('full-spec')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'full-spec'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Full Specification (.md)
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden md:block">
          React Server Components • Server Actions
        </div>
      </div>

      {/* TAB 1: 8 CORE MODULES */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FRONTEND_MODULES_SPECIFICATION.map((mod, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {mod.module}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                    {mod.route}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Rendering Strategy
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                    {mod.rendering}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Key Components
                  </span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {mod.components.map((comp) => (
                      <span
                        key={comp}
                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-[10px]"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    State Management
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-[11px] font-mono">
                    {mod.state}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: FOLDER STRUCTURE */}
      {activeTab === 'folders' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs shadow-2xs">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Feature-Sliced Next.js 15 Directory Architecture
            </h2>
            <p className="text-slate-500">
              Isolating business domains into self-contained modules (`src/features/*`) prevents
              cross-module tangling.
            </p>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] overflow-y-auto">
            {`src/
├── app/                              # Next.js 15 App Router
│   ├── layout.tsx                    # Root shell with providers
│   ├── (auth)/                       # Auth route group
│   │   ├── login/page.tsx
│   │   └── callback/route.ts         # Supabase PKCE exchange
│   ├── (dashboard)/                  # Workspace layout
│   │   ├── layout.tsx                # App shell (Navbar, Sidebar)
│   │   └── [orgSlug]/
│   │       ├── projects/page.tsx     # Projects list
│   │       ├── admin/page.tsx        # Organization & RBAC admin
│   │       └── [projectKey]/         # Tenant project workspace
│   │           ├── page.tsx          # Executive QA Dashboard
│   │           ├── repository/       # Test Suites & Cases
│   │           │   ├── page.tsx
│   │           │   └── cases/[id]/page.tsx
│   │           ├── plans/page.tsx    # Test Plans & Milestones
│   │           ├── runs/
│   │           │   ├── page.tsx      # Runs directory
│   │           │   └── [runId]/page.tsx # Live Execution Console
│   │           └── reports/page.tsx  # Analytics & Metrics
│   └── api/                          # Serverless Route Handlers
│       └── ai/generate-cases/route.ts
├── features/                         # Domain-Driven Modules
│   ├── dashboard/                    # Components, services, types
│   ├── repository/                   # Tree, drawer, step builder
│   ├── test-runs/                    # Live runner, stopwatch, defect dialog
│   ├── test-plans/                   # Plan builder, milestone countdown
│   ├── reports/                      # Flakiness leaderboard, analytics
│   └── admin/                        # Members table, RBAC matrix
├── components/                       # Shared Components
│   ├── ui/                           # ShadCN UI primitives
│   └── layout/                       # Navbar, Sidebar, Breadcrumb
└── stores/                           # Zustand Client Stores
    ├── useTestRunnerStore.ts         # Active execution stopwatch & hotkeys
    ├── useRepositoryStore.ts         # Suite selection & case drawer state
    └── useUIStore.ts                 # ⌘K Command palette & sidebar`}
          </pre>
        </div>
      )}

      {/* TAB 3: ZUSTAND */}
      {activeTab === 'zustand' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs shadow-2xs">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Zustand Client State Architecture (Live Runner Store)
            </h2>
            <p className="text-slate-500">
              Zero-latency client state management decoupled from React component lifecycles for
              high-throughput execution.
            </p>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
            {`// src/features/test-runs/stores/useTestRunnerStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StepResultDraft {
  stepId: string;
  status: 'passed' | 'failed' | 'blocked' | 'skipped';
  actualResult?: string;
}

interface TestRunnerState {
  activeRunId: string | null;
  currentCaseIndex: number;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  stepResults: Record<string, StepResultDraft>;
  isDefectModalOpen: boolean;

  // Actions
  startRun: (runId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;
  nextCase: (totalCases: number) => void;
  prevCase: () => void;
  setStepStatus: (stepId: string, status: StepResultDraft['status']) => void;
  openDefectModal: () => void;
  closeDefectModal: () => void;
  resetRunner: () => void;
}

export const useTestRunnerStore = create<TestRunnerState>()(
  devtools((set) => ({
    activeRunId: null,
    currentCaseIndex: 0,
    elapsedSeconds: 0,
    isTimerRunning: false,
    stepResults: {},
    isDefectModalOpen: false,

    startRun: (runId) =>
      set({ activeRunId: runId, currentCaseIndex: 0, elapsedSeconds: 0, isTimerRunning: true }),
    pauseTimer: () => set({ isTimerRunning: false }),
    resumeTimer: () => set({ isTimerRunning: true }),
    tickTimer: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
    nextCase: (total) =>
      set((state) => ({ currentCaseIndex: Math.min(state.currentCaseIndex + 1, total - 1) })),
    prevCase: () =>
      set((state) => ({ currentCaseIndex: Math.max(state.currentCaseIndex - 1, 0) })),
    setStepStatus: (stepId, status) =>
      set((state) => ({
        stepResults: {
          ...state.stepResults,
          [stepId]: { ...state.stepResults[stepId], stepId, status },
        },
      })),
    openDefectModal: () => set({ isDefectModalOpen: true }),
    closeDefectModal: () => set({ isDefectModalOpen: false }),
    resetRunner: () =>
      set({ activeRunId: null, currentCaseIndex: 0, elapsedSeconds: 0, isTimerRunning: false, stepResults: {} }),
  }))
);`}
          </pre>
        </div>
      )}

      {/* TAB 4: API LAYER */}
      {activeTab === 'api-layer' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs shadow-2xs">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              API Layer: Server Actions &amp; Realtime WebSockets
            </h2>
            <p className="text-slate-500">
              Type-safe mutations using Next.js 15 Server Actions with automatic cache tag
              revalidation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                Server Action Mutation Pattern
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Executed client-side in the browser with instant IndexedDB atomic commit, 0ms
                network latency, and complete offline autonomy.
              </p>
              <pre className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded overflow-x-auto">
                {`// Local-First Mutation Pipeline
export async function updateStep(execId, stepId, status) {
  await browserDb.put('testRuns', updatedRun);
  broadcastChannel.postMessage({ type: 'STEP_UPDATED', execId, status });
  // Saved directly to local browser IndexedDB in <1ms
}`}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                Multi-Tab BroadcastChannel Synchronization
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Browser BroadcastChannel API keeps multiple open browser tabs in sync without server
                WebSockets.
              </p>
              <pre className="p-2.5 bg-slate-900 text-blue-300 font-mono text-[10px] rounded overflow-x-auto">
                {`const syncChannel = new BroadcastChannel('qasgard_local_sync');
syncChannel.onmessage = (event) => {
  if (event.data.type === 'SUITE_UPDATED') {
    reloadFromBrowserDb();
  }
};`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FULL SPEC */}
      {activeTab === 'full-spec' && (
        <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-2xs space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400 font-sans font-semibold">
              Complete Next.js 15 Frontend Architecture Specification (.md)
            </span>
            <button
              onClick={handleCopySpec}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-sans font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="overflow-x-auto max-h-[600px] overflow-y-auto leading-relaxed text-slate-300">
            <code>{FRONTEND_ARCHITECTURE_MARKDOWN}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
