export const FRONTEND_ARCHITECTURE_MARKDOWN = `# Next.js 15 Enterprise Frontend Architecture
## QAsgard: Cloud QA Test Management Platform
**Target Stack**: Next.js 15 (App Router) + TypeScript 5+ + Tailwind CSS + ShadCN UI + Zustand + Supabase  
**Author**: Principal Frontend Engineer  
**Core Architectural Pillars**: Server-First React Server Components (RSC), Feature-Sliced Domain Modularity, Zero-Latency Client State (Zustand), Resilient Type-Safe Data Layer.

---

### 1. Enterprise Folder Structure (Feature-Sliced + Next.js App Router)

\`\`\`
qasgard/
├── .env.local.example
├── components.json                  # ShadCN UI configuration
├── next.config.mjs                  # Next.js 15 configuration (Turbopack, headers)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── app/                         # App Router Root
│   │   ├── layout.tsx               # Root layout (Theme, Fonts, QueryClient, Toaster)
│   │   ├── not-found.tsx            # Global 404 handler
│   │   ├── error.tsx                # Global error boundary
│   │   ├── (auth)/                  # Isolated Auth Route Group
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── callback/route.ts    # Supabase OAuth PKCE exchange
│   │   ├── (dashboard)/             # Main SaaS Workspace Route Group
│   │   │   ├── layout.tsx           # Shell Layout (Navbar, Sidebar, Org Context)
│   │   │   ├── [orgSlug]/
│   │   │   │   ├── projects/page.tsx         # Projects Directory
│   │   │   │   ├── admin/page.tsx            # Organization Administration & RBAC
│   │   │   │   └── [projectKey]/             # Scoped Project Workspace
│   │   │   │       ├── layout.tsx            # Project Context & Sub-navigation
│   │   │   │       ├── page.tsx              # Executive QA Dashboard
│   │   │   │       ├── repository/           # Test Suites & Cases Module
│   │   │   │       │   ├── page.tsx          # Suite Tree + Case Grid
│   │   │   │       │   ├── loading.tsx       # Skeleton loader
│   │   │   │       │   └── cases/[id]/page.tsx # Full-page case details
│   │   │   │       ├── plans/page.tsx        # Test Plans & Milestones
│   │   │   │       ├── runs/                 # Test Runs Module
│   │   │   │       │   ├── page.tsx          # Runs Directory
│   │   │   │       │   └── [runId]/page.tsx  # Live Execution Console
│   │   │   │       ├── reports/page.tsx      # Quality Analytics & Metrics
│   │   │   │       └── settings/page.tsx     # Project Settings & Integrations
│   │   └── api/                     # Serverless Route Handlers
│   │       ├── ai/
│   │       │   ├── generate-cases/route.ts
│   │       │   ├── generate-steps/route.ts
│   │       │   ├── find-duplicates/route.ts
│   │       │   └── failure-triage/route.ts
│   │       └── webhooks/
│   │           └── ci-reporter/route.ts
│   ├── features/                    # Domain-Driven Modules (Feature-Sliced)
│   │   ├── dashboard/
│   │   │   ├── components/          # MetricsGrid, ActiveRunCard, SuiteHealthChart
│   │   │   ├── services/            # getDashboardMetrics.ts (RSC Fetcher)
│   │   │   └── types.ts
│   │   ├── repository/
│   │   │   ├── components/          # SuiteTree, TestCaseTable, TestCaseDrawer, StepEditor
│   │   │   ├── hooks/               # useTreeDragDrop, useFilterCases
│   │   │   ├── stores/              # useRepositoryStore.ts
│   │   │   └── services/            # testCaseActions.ts (Server Actions)
│   │   ├── test-runs/
│   │   │   ├── components/          # LiveRunnerModal, Stopwatch, StepResultToggle, DefectDialog
│   │   │   ├── hooks/               # useRunnerHotkeys, useRealtimeRunSync
│   │   │   ├── stores/              # useTestRunnerStore.ts
│   │   │   └── services/            # runActions.ts
│   │   ├── test-plans/
│   │   │   ├── components/          # PlanCard, PlanBuilderModal
│   │   │   └── services/            # planActions.ts
│   │   ├── reports/
│   │   │   ├── components/          # FlakinessLeaderboard, VelocityChart, AutomationDonut
│   │   │   └── services/            # getReportAnalytics.ts
│   │   └── admin/
│   │       ├── components/          # MembersTable, InviteModal, RBACMatrix, AuditLogFeed
│   │       └── services/            # memberActions.ts
│   ├── components/                  # Shared Components
│   │   ├── ui/                      # ShadCN Primitives (Button, Dialog, Sheet, Table, etc.)
│   │   ├── layout/                  # Navbar, Sidebar, Breadcrumb, TenantSwitcher
│   │   └── common/                  # StatusBadge, MultiSegmentProgress, HotkeyLegend
│   ├── stores/                      # Global UI State (Zustand)
│   │   ├── useUIStore.ts            # Command palette, sidebar collapsed state, active theme
│   │   └── useTenantStore.ts        # Active organization & project metadata
│   ├── services/
│   │   └── storage/
│   │       └── indexedDb.ts         # 100% Browser IndexedDB Engine v3 (Single Source of Truth)
│   ├── lib/
│   │   ├── gemini/                  # Server-side GenAI SDK wrapper
│   │   └── utils.ts                 # Tailwind cn() merge helper
│   └── types/                       # Shared Domain Contracts & Local-First Types
\`\`\`

---

### 2. Page & Routing Hierarchy

| Route Path | Type | Streaming / Shell | Primary Responsibilities |
| :--- | :---: | :---: | :--- |
| \`/[orgSlug]/projects\` | RSC | Instant shell | Lists accessible projects within the tenant organization. |
| \`/[orgSlug]/[projectKey]\` | RSC | Suspense-streamed | Executive QA Dashboard (Pass rates, active runs, suite health). |
| \`/[orgSlug]/[projectKey]/repository\` | Hybrid | Suspense Tree | Hierarchical test suites, test cases grid, slide-over drawer. |
| \`/[orgSlug]/[projectKey]/plans\` | RSC | Cached SSR | Milestones, target release dates, and bundled test cases. |
| \`/[orgSlug]/[projectKey]/runs\` | RSC | Server Actions | Active and historic test runs with multi-segment progress bars. |
| \`/[orgSlug]/[projectKey]/runs/[runId]\` | Client | Full-Focus Shell | **Live Execution Console**: Stopwatch, hotkeys (\`P\`/\`F\`/\`B\`/\`S\`), step triage. |
| \`/[orgSlug]/[projectKey]/reports\` | RSC + Client | Dynamic | Flakiness analytics, defect breakdown, export to PDF/CSV. |
| \`/[orgSlug]/admin\` | RSC | Revalidated | Member management, role assignments, seat metering, audit logs. |

---

### 3. Server vs. Client Component Hierarchy

\`\`\`
[RootLayout (RSC)]
   ├── [Providers (Client: ThemeProvider, QueryClient, Toaster)]
   └── [DashboardLayout (RSC: Auth verification, Tenant check)]
         ├── [Navbar (Client: Search ⌘K, User switcher, Theme toggle)]
         ├── [ProjectSidebar (Client: Collapsible navigation)]
         └── [Page (RSC)]
               │
               ├─► <Suspense fallback={<MetricsSkeleton />}>
               │      └── [MetricsGrid (RSC: Fetches KPIs via Supabase)]
               │
               ├─► <Suspense fallback={<ActiveRunsSkeleton />}>
               │      └── [ActiveRunsWidget (RSC)]
               │             └── [LiveRunnerTrigger (Client)]
               │
               └─► [LiveTestRunnerModal (Client - Zustand Powered)]
                      ├── [StopwatchTimer (Client: Web Worker precision)]
                      ├── [HotkeyListener (Client: Window 'keydown' events)]
                      ├── [StepResultsList (Client: Optimistic updates)]
                      └── [DefectCreatorDrawer (Client)]
\`\`\`

---

### 4. Reusable UI Component Taxonomy (ShadCN + Enterprise Extensions)

1. **\`StatusBadge\`**:
   - Renders high-contrast, accessible status chips.
   - Pairs color with unique SVG icon glyphs to guarantee color-blind accessibility (Check for Passed, Cross for Failed, Ban for Blocked, SkipForward for Skipped).
2. **\`MultiSegmentProgress\`**:
   - Custom SVG/CSS flex progress bar rendering proportional segments:
     - Passed (\`bg-emerald-500\`)
     - Failed (\`bg-rose-500\`)
     - Blocked (\`bg-amber-500\`)
     - Untested (\`bg-slate-200 dark:bg-slate-700\`)
3. **\`TestCaseDrawer\` (Built on ShadCN \`Sheet\`)**:
   - Slide-over inspection drawer maintaining background list context.
   - Smooth slide animation (< 150ms), keyboard \`Esc\` dismissal, auto-saving step assertions.
4. **\`LiveStopwatch\`**:
   - Sub-second execution timer with pause-on-tab-blur detection, maintaining compliance with active QA time tracking.

---

### 5. Client State Management Architecture (Zustand)

#### 5.1 Principle: Server State vs. Client State
- **Server State**: Managed via **React Server Components** and **Server Actions** (or TanStack Query for dynamic client-side refetching).
- **Client State (Zustand)**: Strictly reserved for ephemeral, high-frequency, or cross-component UI state:
  1. *Live Execution Console* (stopwatch ticks, active step index, draft bug notes).
  2. *Repository Workspace State* (selected suite node, expanded tree IDs, search queries).
  3. *Global UI Modals* (⌘K search palette, create case drawer).

#### 5.2 Live Runner Store (\`useTestRunnerStore.ts\`)
\`\`\`typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StepResultDraft {
  stepId: string;
  status: 'passed' | 'failed' | 'blocked' | 'skipped';
  actualResult?: string;
  screenshotUrl?: string;
}

interface TestRunnerState {
  // State
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
    nextCase: (totalCases) =>
      set((state) => ({
        currentCaseIndex: Math.min(state.currentCaseIndex + 1, totalCases - 1),
      })),
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
      set({
        activeRunId: null,
        currentCaseIndex: 0,
        elapsedSeconds: 0,
        isTimerRunning: false,
        stepResults: {},
      }),
  }))
);
\`\`\`

---

### 6. Local-First Storage & Data Synchronization Strategy

1. **IndexedDB Single Source of Truth**:
   - Centralized \`browserDb\` engine providing zero-latency ACID transactions directly on the user's device.
2. **Instant Auto-Save Mutation Pipeline**:
   \`\`\`typescript
   import { browserDb } from '@/services/storage/indexedDb';

   export async function updateStepExecution(
     executionId: string,
     stepId: string,
     status: 'passed' | 'failed' | 'blocked'
   ) {
     const run = await browserDb.get<TestRun>('testRuns', executionId);
     if (run) {
       run.executions = run.executions.map((e) => e.id === stepId ? { ...e, status } : e);
       await browserDb.put('testRuns', run);
     }
     return { success: true };
   }
   \`\`\`
3. **Multi-Tab BroadcastChannel Synchronization**:
   \`\`\`typescript
   import { useEffect } from 'react';

   export function useBroadcastSync(onSync: () => void) {
     useEffect(() => {
       const channel = new BroadcastChannel('qasgard_browser_sync');
       channel.onmessage = () => onSync();
       return () => channel.close();
     }, [onSync]);
   }
   \`\`\`
`;

export const FRONTEND_MODULES_SPECIFICATION = [
  {
    module: '1. Executive Dashboard',
    route: '/[orgSlug]/[projectKey]',
    rendering: 'Server Component (RSC) + Streaming',
    components: ['MetricsGrid', 'ActiveRunCard', 'SuiteHealthChart', 'FlakinessVelocity'],
    state: 'Server State (cached SSR) with fast background revalidation',
    description:
      'High-density quality telemetry providing instant visibility into release readiness, pass rates, and blocker bugs.',
  },
  {
    module: '2. Projects Directory',
    route: '/[orgSlug]/projects',
    rendering: 'Server Component (RSC)',
    components: ['ProjectGrid', 'ProjectCard', 'CreateProjectModal', 'ProjectSearch'],
    state: 'Zustand useUIStore for grid/list view toggle',
    description:
      'Tenant project portfolio browser with instant search, key validation, and team member badges.',
  },
  {
    module: '3. Test Suites & Hierarchy',
    route: '/[orgSlug]/[projectKey]/repository',
    rendering: 'Hybrid (RSC Tree + Client Drag/Drop)',
    components: ['SuiteTree', 'SuiteNode', 'SuiteContextMenu', 'AddSuiteDialog'],
    state: 'Zustand useRepositoryStore (expandedNodeIds, activeSuiteId)',
    description:
      'Recursive N-level suite tree supporting drag-and-drop reorganization and keyboard arrow navigation.',
  },
  {
    module: '4. Test Cases Authoring',
    route: '/[orgSlug]/[projectKey]/repository/cases/[id]',
    rendering: 'Client Sheet + Server Action Mutations',
    components: ['TestCaseTable', 'TestCaseDrawer', 'StepEditorTimeline', 'TagPicker'],
    state: 'Zustand useRepositoryStore (selectedCaseId, draftSteps)',
    description:
      'Slide-over test inspector with sequential step timeline, code blocks for test data, and AI auto-step generation.',
  },
  {
    module: '5. Test Plans & Milestones',
    route: '/[orgSlug]/[projectKey]/plans',
    rendering: 'Server Component (RSC)',
    components: ['PlanCard', 'MilestoneCountdown', 'PlanBuilderModal', 'SuiteMultiPicker'],
    state: 'Server Actions for plan creation and suite linking',
    description:
      'Release sign-off bundling allowing teams to group tests across suites for targeted sprint testing.',
  },
  {
    module: '6. Test Runs & Live Runner',
    route: '/[orgSlug]/[projectKey]/runs/[runId]',
    rendering: 'Client Component (Full-Focus Shell)',
    components: ['LiveRunnerConsole', 'StopwatchTimer', 'StepResultToggle', 'DefectCreatorDrawer'],
    state: 'Zustand useTestRunnerStore (stopwatch, hotkeys, stepResults)',
    description:
      'High-throughput execution console with hands-free hotkeys (P/F/B/S), stopwatch, and 1-click defect generation.',
  },
  {
    module: '7. Quality Reports & Analytics',
    route: '/[orgSlug]/[projectKey]/reports',
    rendering: 'Server Component (RSC) + Recharts',
    components: [
      'AnalyticsFilterBar',
      'TrendAreaChart',
      'AutomationRatioDonut',
      'FlakiestTestsTable',
    ],
    state: 'URL Query Params for persistent shareable date range filters',
    description:
      'Executive reporting suite with automated flakiness scoring, defect Pareto distribution, and PDF export.',
  },
  {
    module: '8. Organization Administration',
    route: '/[orgSlug]/admin',
    rendering: 'Server Component (RSC) + Client Modals',
    components: ['MembersTable', 'InviteMemberDialog', 'RoleSelectDropdown', 'AuditLogStream'],
    state: 'Server Actions with optimistic member role updates',
    description:
      'Enterprise governance portal for 5-tier RBAC role configuration, seat metering, and compliance audit trail inspection.',
  },
];
