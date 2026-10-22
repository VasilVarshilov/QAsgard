import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Server,
  Cloud,
  Copy,
  Check,
  Download,
  ShieldCheck,
  FolderTree,
  GitBranch,
  Terminal,
  Zap,
} from 'lucide-react';
import { SOLUTION_ARCHITECTURE_MARKDOWN } from '../data/solutionArchitectureDoc';

export const SolutionArchitectureView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagram' | 'folders' | 'full-doc'>(
    'overview'
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(SOLUTION_ARCHITECTURE_MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([SOLUTION_ARCHITECTURE_MARKDOWN], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qasgard_free_solution_architecture.md';
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
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                $0/mo Fully Free Tier SaaS Architecture
              </span>
              <span className="text-xs text-slate-400">
                • Vercel + Supabase + Next.js + Gemini API
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Principal Solution Architecture Blueprint
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Modern full-stack cloud architecture engineered with Next.js 15 App Router,
              TypeScript, Tailwind, ShadCN, Supabase PostgreSQL with RLS, and Google Gemini API.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied Architecture!' : 'Copy Architecture Spec'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Stack &amp; Free Tier Bounds
          </button>
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'diagram'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Component &amp; Data Flow
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'folders'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Next.js Folder Structure
          </button>
          <button
            onClick={() => setActiveTab('full-doc')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'full-doc'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Complete Specification Document
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">Zero-Cost Infrastructure Plan</div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
                ▲
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Vercel (Hobby Free)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hosts Next.js App Router, SSR, Server Components, and secure API Route Handlers.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                100 GB Bandwidth • Automatic SSL
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Supabase (Free Tier)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Managed PostgreSQL 16 with Row-Level Security, GoTrue Auth, and PostgREST.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                50,000 MAU • 500 MB DB • Realtime
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                ✦
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Google Gemini API
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powers AI test case drafting, duplicate detection, and failed test triage.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                15 RPM • 1,500 RPD • Free Quota
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                UI
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Next.js + ShadCN</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zero-bundle CSS overhead, Radix UI primitives, TypeScript strict typing.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                React 19 • App Router • Fast HMR
              </div>
            </div>
          </div>

          {/* Architecture Principles Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Key Architectural Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1.5 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                  1. Kernel-Level RLS Multi-Tenancy
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every query is constrained at the PostgreSQL engine level via Supabase JWT claims,
                  ensuring zero cross-tenant contamination even if application code contains logic
                  oversights.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1.5 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                  2. Real-Time Execution Sync
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Supabase Realtime listens to PostgreSQL WAL logs and streams live execution
                  statuses and stopwatch sync directly to distributed tester browsers via WebSockets
                  without costly polling.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1.5 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                  3. Serverless Gemini Proxy
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  AI operations are proxied through Vercel Serverless Route Handlers (
                  <code className="text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    /api/ai/*
                  </code>
                  ) ensuring the Gemini API key is never exposed to browser bundles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGRAM */}
      {activeTab === 'diagram' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              End-to-End System Component &amp; Data Flow
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interaction flow between Next.js Edge, Supabase PostgREST, and Google Gemini API.
            </p>
          </div>

          <pre className="p-5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
            {`┌─────────────────────────────────────────────────────────────────────────┐
│                      CLIENT TIER (Next.js 15 Client)                    │
│   • ShadCN Radix Primitives • Tailwind CSS • Live Test Runner & Stopwatch │
└─────────────────────────────────────────────────────────────────────────┘
        │                                             ▲
        │ HTTPS REST / Server Actions                 │ WebSocket Event Stream
        ▼                                             │ (Execution Updates)
┌───────────────────────────────────────┐             │
│      VERCEL EDGE / SERVERLESS         │             │
│   • Edge Middleware (Auth & Tenant)   │             │
│   • Next.js App Router (RSC & SSR)    │             │
│   • Serverless Route Handlers (/api)  │             │
└───────────────────────────────────────┘             │
        │                               │             │
        │ (Server-Side Secure Call)     │             │
        ▼                               │             │
┌───────────────────────────────┐       ▼             │
│       GOOGLE GEMINI API       │ ┌───────────────────────────────┐
│   • gemini-3.8-flash          │ │       SUPABASE BACKEND        │
│   • Test Case Generator       │ │   • GoTrue Auth (JWT)         │
│   • Deduplication Scanner     │ │   • PostgREST Auto API        │
│   • Failure Root-Cause Engine │ │   • PostgreSQL 16 (RLS)       │
└───────────────────────────────┘ │   • Supabase Realtime Engine ─┼─────┘
                                  │   • Storage Buckets (S3 API)  │
                                  └───────────────────────────────┘`}
          </pre>
        </div>
      )}

      {/* TAB 3: FOLDER STRUCTURE */}
      {activeTab === 'folders' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Next.js 15 App Router Folder Structure
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clean modular structure separating auth, multi-tenant dashboard, ShadCN components,
              and serverless AI routes.
            </p>
          </div>

          <pre className="p-5 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
            {`qasgard/
├── .env.local.example          # Environment variables template
├── components.json             # ShadCN UI configuration
├── next.config.mjs             # Next.js configuration
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── services/
│   │   └── storage/
│   │       └── indexedDb.ts         # 100% Browser IndexedDB Engine v3 (Single Source of Truth)
│   ├── components/
│   │   ├── Navbar.tsx               # Primary navigation & project switcher
│   │   ├── WorkspaceManagerView.tsx # Storage monitor, snapshot rollback, ZIP/JSON export
│   │   ├── BrowserArchitectureView.tsx # 100% Browser Local-First architecture specs
│   │   ├── RepositoryView.tsx       # 3-column test case explorer & tree manager
│   │   ├── TestRunsView.tsx         # Test execution runner & pass/fail tracker
│   │   ├── LiveTestRunnerModal.tsx  # Step-by-step interactive test runner
│   │   ├── DefectsView.tsx          # Bug reporting & traceability matrix
│   │   ├── QACopilotView.tsx        # Embedded AI QA assistant & generator
│   │   └── pwa/
│   │       ├── PWAInstallButton.tsx # Desktop & mobile PWA install trigger
│   │       └── OfflineIndicator.tsx # Visual offline network status badge
│   ├── lib/
│   │   ├── gemini/
│   │   │   └── client.ts            # Local/proxy generative AI assistant
│   │   └── utils.ts                 # Tailwind clsx/twMerge helper
│   ├── hooks/                       # Custom React hooks (usePWAInstall, useStorage)
│   └── types.ts                     # Full domain TypeScript contracts`}
          </pre>
        </div>
      )}

      {/* TAB 4: COMPLETE SPECIFICATION DOCUMENT */}
      {activeTab === 'full-doc' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed">
          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto border border-slate-800">
            <code>{SOLUTION_ARCHITECTURE_MARKDOWN}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
