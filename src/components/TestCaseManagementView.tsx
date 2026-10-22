import React, { useState } from 'react';
import {
  Layers,
  Database,
  Code,
  Layout,
  Route,
  Copy,
  Check,
  Download,
  Plus,
  Copy as CloneIcon,
  FolderInput,
  SlidersHorizontal,
  Upload,
  FileDown,
  CheckCircle2,
  Table,
} from 'lucide-react';
import { TEST_CASE_MANAGEMENT_SPEC } from '../data/testCaseManagementDoc';

export const TestCaseManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'database' | 'api' | 'wireframes' | 'flows'
  >('overview');
  const [copied, setCopied] = useState(false);

  const handleCopySpec = () => {
    navigator.clipboard.writeText(TEST_CASE_MANAGEMENT_SPEC);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSpec = () => {
    const blob = new Blob([TEST_CASE_MANAGEMENT_SPEC], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qasgard_test_case_management_spec.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                Test Case Management Module
              </span>
              <span className="text-xs text-slate-400">
                • CRUD • Clone • Move • Bulk Edit • Import/Export
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Test Case Management Engineering Spec
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Implementation-ready architecture: PostgreSQL DDL with triggers, Next.js 15 Server
              Actions, Microsoft Fluent 2 wireframes, and bulk lifecycle user flows.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySpec}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-indigo-200" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied Specs!' : 'Copy Module Spec'}</span>
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

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Core Capabilities
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'database'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Database DDL &amp; Triggers
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'api'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Server Actions &amp; API
          </button>
          <button
            onClick={() => setActiveTab('wireframes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'wireframes'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Page Wireframes
          </button>
          <button
            onClick={() => setActiveTab('flows')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'flows'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            User Flows (8 Operations)
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden md:block">
          PostgreSQL 16 • Next.js 15 Server Actions
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Create &amp; Edit
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Step-by-step sequential assertions with expected results, test data snippets, and AI
                generation.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <CloneIcon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Clone &amp; Move</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                1-click deep duplication preserving steps, preconditions, and tags; cross-suite
                migration.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Bulk Operations</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Multi-select floating toolbar for mass severity, priority, owner, or suite
                reassignment.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Bulk Import &amp; Export
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Native CSV and JSON ingestion compatible with TestRail and Qase; instant streaming
                export.
              </p>
            </div>
          </div>

          {/* Fields Specification Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Required Test Case Entity Field Contract
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-mono text-[11px]">
                    <th className="py-2 px-3">Field Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Constraints</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">title</td>
                    <td className="py-2 px-3 font-mono">VARCHAR(500)</td>
                    <td className="py-2 px-3 font-mono text-rose-600">NOT NULL</td>
                    <td className="py-2 px-3">Human-readable summary of the test scenario.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">description</td>
                    <td className="py-2 px-3 font-mono">TEXT</td>
                    <td className="py-2 px-3 font-mono text-slate-400">NULLABLE</td>
                    <td className="py-2 px-3">Markdown context, acceptance criteria references.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">preconditions</td>
                    <td className="py-2 px-3 font-mono">TEXT</td>
                    <td className="py-2 px-3 font-mono text-slate-400">NULLABLE</td>
                    <td className="py-2 px-3">
                      Required test environment state (e.g. 3DS enrolled test card).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">priority</td>
                    <td className="py-2 px-3 font-mono">VARCHAR(50)</td>
                    <td className="py-2 px-3 font-mono">urgent, high, medium, low</td>
                    <td className="py-2 px-3">Execution urgency for release milestones.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">severity</td>
                    <td className="py-2 px-3 font-mono">VARCHAR(50)</td>
                    <td className="py-2 px-3 font-mono">blocker, critical, major, normal, minor</td>
                    <td className="py-2 px-3">
                      Potential blast radius if this test fails in production.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">tags</td>
                    <td className="py-2 px-3 font-mono">TEXT[]</td>
                    <td className="py-2 px-3 font-mono">GIN Indexed</td>
                    <td className="py-2 px-3">
                      Categorization tags (e.g. smoke, regression, checkout, pci).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">owner_id</td>
                    <td className="py-2 px-3 font-mono">UUID</td>
                    <td className="py-2 px-3 font-mono">FK to profiles.id</td>
                    <td className="py-2 px-3">
                      Assigned engineer responsible for authoring and maintenance.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">steps</td>
                    <td className="py-2 px-3 font-mono">test_case_steps[]</td>
                    <td className="py-2 px-3 font-mono">1:N Relation</td>
                    <td className="py-2 px-3">
                      Ordered sequence containing Action, Expected Result, and Test Data.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">attachments</td>
                    <td className="py-2 px-3 font-mono">test_case_attachments[]</td>
                    <td className="py-2 px-3 font-mono">1:N Relation</td>
                    <td className="py-2 px-3">
                      Mockups, HAR network captures, and test payloads up to 25MB.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATABASE */}
      {activeTab === 'database' && (
        <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-2xs space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 font-bold">
                PostgreSQL 16 Production DDL &amp; Auto-Increment Trigger
              </span>
            </div>
            <button
              onClick={handleCopySpec}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-sans font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy SQL'}
            </button>
          </div>
          <pre className="overflow-x-auto max-h-[550px] overflow-y-auto leading-relaxed text-slate-300">
            {`-- Test Cases Master Table
CREATE TABLE public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    suite_id UUID NOT NULL REFERENCES public.test_suites(id) ON DELETE RESTRICT,
    case_number INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    preconditions TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    severity VARCHAR(50) NOT NULL DEFAULT 'normal',
    layer VARCHAR(50) NOT NULL DEFAULT 'e2e',
    status VARCHAR(50) NOT NULL DEFAULT 'actual',
    automation_status VARCHAR(50) NOT NULL DEFAULT 'manual',
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_cloned_from UUID REFERENCES public.test_cases(id) ON DELETE SET NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_test_cases_project_num UNIQUE (project_id, case_number)
);

-- Test Steps Table
CREATE TABLE public.test_case_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    action TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    test_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_case_step_order UNIQUE (test_case_id, step_number)
);`}
          </pre>
        </div>
      )}

      {/* TAB 3: API */}
      {activeTab === 'api' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs shadow-2xs">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Next.js 15 Server Actions: Type-Safe CRUD &amp; Bulk Operations
            </h2>
            <p className="text-slate-500">
              Client-side atomic transactions performing zero-latency cloning, step duplication, and
              suite reassignment in IndexedDB.
            </p>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
            {`// cloneTestCase Client-Side IndexedDB Engine Action
export async function cloneTestCase(caseId: string, targetSuiteId?: string): Promise<TestCase> {
  const original = await browserDb.get<TestCase>('testCases', caseId);
  if (!original) throw new Error('Original test case not found');

  const clonedId = \`case-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`;
  const clonedKey = \`\${original.key}-CLONE\`;

  const cloned: TestCase = {
    ...original,
    id: clonedId,
    key: clonedKey,
    suiteId: targetSuiteId || original.suiteId,
    title: \`\${original.title} (Clone)\`,
    steps: original.steps ? original.steps.map((s) => ({ ...s })) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Immediate ACID commit to browser IndexedDB
  await browserDb.put('testCases', cloned);
  return cloned;
}`}
          </pre>
        </div>
      )}

      {/* TAB 4: WIREFRAMES */}
      {activeTab === 'wireframes' && (
        <div className="bg-slate-900 text-emerald-400 rounded-xl p-5 shadow-2xs space-y-4 font-mono text-xs">
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layout className="w-4 h-4 text-emerald-400" />
              Repository Wireframe &amp; Bulk Action Floating Bar
            </h2>
          </div>

          <pre className="overflow-x-auto leading-relaxed text-slate-300">
            {`┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ Repository > Checkout Flow                                          [+ New Suite] [+ New Case]│
├──────────────────────────────┬────────────────────────────────────────────────────────────────┤
│ TEST SUITES (Search...)      │ [ Search cases...               ] [Filter: All Layers ▼] [Export]│
├──────────────────────────────┼───┬─────────┬──────────────────────┬─────────┬──────────┬─────┤
│ 📁 All Suites (48)           │[x]│ KEY     │ TITLE                │ PRIORITY│ SEVERITY │ STEPS│
│ ├── 📁 Authentication (14)   ├───┼─────────┼──────────────────────┼─────────┼──────────┼─────┤
│ │    ├── 📁 3DS 2.0 (6)      │[x]│ PAY-101 │ 3DS Step-Up Challenge│ [HIGH]  │[CRITICAL]│  3  │
│ │    └── 📁 Biometric (8)    │[x]│ PAY-102 │ ApplePay Token Auth  │ [HIGH]  │[BLOCKER] │  2  │
│ ├── 📁 Checkout & Cart (22)  │[ ]│ PAY-103 │ Expired Card Error   │ [MED]   │[NORMAL]  │  4  │
│ └── 📁 Webhooks & APIs (12)  │[ ]│ PAY-104 │ Refund Stripe Webhook│ [LOW]   │[MAJOR]   │  5  │
│                              └───┴─────────┴──────────────────────┴─────────┴──────────┴─────┤
│                              │ ┌───────────────────────────────────────────────────────────┐  │
│                              │ │ 3 CASES SELECTED  •  [Move] [Bulk Edit] [Clone] [Delete]   │  │
│                              │ └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┴────────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>
      )}

      {/* TAB 5: FLOWS */}
      {activeTab === 'flows' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs shadow-2xs">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Route className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              End-to-End User Interaction Journeys (All 8 Operations)
            </h2>
            <p className="text-slate-500">
              Deterministic flows covering single-item mutations and bulk lifecycle transitions.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: '1. Create Test Case with AI Assertions',
                steps:
                  "User clicks '+ New Test Case' -> inputs title -> clicks '✨ AI Suggest Steps' -> Gemini auto-fills 3 granular steps with expected results -> saves case with auto-assigned key.",
              },
              {
                title: '2. Edit & Auto-Save',
                steps:
                  'User clicks table row -> slide-over drawer enters -> edits steps inline -> blur triggers auto-save micro-indicator without page reload.',
              },
              {
                title: '3. Delete with Safety Check',
                steps:
                  'User clicks Delete on case -> modal verifies if case is linked to active test runs -> soft-deletes record with instant table removal.',
              },
              {
                title: '4. Clone Case',
                steps:
                  "User clicks 'Clone' in drawer -> creates duplicate with '(Clone)' title, matching priority, severity, preconditions, and sequential steps.",
              },
              {
                title: '5. Move Between Suites',
                steps:
                  "User drags case to target suite node in the tree (or uses 'Move to Suite' dropdown) -> suite ID updates optimistically.",
              },
              {
                title: '6. Bulk Edit',
                steps:
                  "User checks 15 rows -> floating action bar surfaces -> clicks 'Bulk Edit' -> sets Priority to 'Urgent' and Owner to 'Alex Rivera' -> batch executes in < 15ms.",
              },
              {
                title: '7. Bulk Import',
                steps:
                  "User clicks 'Import' -> pastes CSV or JSON -> preview parses row count and step counts -> confirms -> batch inserts into active suite.",
              },
              {
                title: '8. Bulk Export',
                steps:
                  "User clicks 'Export' -> selects JSON or CSV -> browser initiates instant streaming download without server load.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
              >
                <span className="font-bold text-slate-900 dark:text-white text-xs">{f.title}</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {f.steps}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
