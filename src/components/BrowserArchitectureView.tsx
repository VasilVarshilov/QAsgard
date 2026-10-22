import React, { useState } from 'react';
import {
  HardDrive,
  ShieldCheck,
  Zap,
  CloudOff,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Database,
  Layers,
  ArrowRight,
  Code,
  FileCode,
  RefreshCw,
  FolderTree,
  Lock,
  Share2,
} from 'lucide-react';

export const BrowserArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'principles' | 'indexeddb-schema' | 'cloud-adapter' | 'auto-save' | 'migration'
  >('principles');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const cloudAdapterCode = `// ============================================================================
// QAsgard Pluggable Cloud Sync Adapter Interface
// Local IndexedDB remains the absolute Single Source of Truth (SSOT).
// Cloud providers (Google Drive, OneDrive, Dropbox, S3, GitHub) can be plugged in
// without altering the internal browser data models.
// ============================================================================

export interface CloudSyncAdapter {
  id: string;
  name: 'Google Drive' | 'Microsoft OneDrive' | 'Dropbox' | 'GitHub' | 'AWS S3' | 'Custom Webhook';
  version: string;
  enabled: boolean;
  lastSyncTimestamp?: string;

  // Push local IndexedDB snapshot bundle to remote cloud storage
  pushWorkspace(bundle: WorkspaceExportBundle): Promise<{
    success: boolean;
    remoteRevisionId: string;
    syncedAt: string;
  }>;

  // Pull remote cloud bundle and compare against local IndexedDB
  pullWorkspace(): Promise<{
    bundle: WorkspaceExportBundle | null;
    hasRemoteChanges: boolean;
    remoteRevisionId?: string;
  }>;

  // Conflict resolution strategy (default: local-wins / manual merge)
  resolveConflict(local: WorkspaceExportBundle, remote: WorkspaceExportBundle): WorkspaceExportBundle;
}

// Example: Google Drive AppData Folder Adapter Implementation
export class GoogleDriveSyncAdapter implements CloudSyncAdapter {
  id = 'gdrive-appdata';
  name = 'Google Drive' as const;
  version = '1.0.0';
  enabled = false;

  async pushWorkspace(bundle: WorkspaceExportBundle) {
    const fileContent = JSON.stringify(bundle, null, 2);
    // Write directly to user's private Google Drive appDataFolder
    // Zero external database or server involved - direct browser-to-cloud OAuth
    return { success: true, remoteRevisionId: 'rev-' + Date.now(), syncedAt: new Date().toISOString() };
  }

  async pullWorkspace() {
    return { bundle: null, hasRemoteChanges: false };
  }

  resolveConflict(local: WorkspaceExportBundle) {
    return local; // Local browser IndexedDB is authoritative
  }
}`;

  const indexedDbSchemaSpec = `// QAsgard IndexedDB Schema Architecture (Database: 'qasgard_browser_db', Version: 3)
// 100% Client-Side • ACID Transactions • Zero Network Overhead

ObjectStore: 'projects'       (KeyPath: 'id')
ObjectStore: 'suites'         (KeyPath: 'id', Indexes: ['projectId', 'parentId'])
ObjectStore: 'testCases'      (KeyPath: 'id', Indexes: ['suiteId', 'projectId'])
ObjectStore: 'testRuns'       (KeyPath: 'id', Indexes: ['projectId', 'status'])
ObjectStore: 'testPlans'      (KeyPath: 'id', Indexes: ['projectId'])
ObjectStore: 'defects'        (KeyPath: 'id', Indexes: ['projectId', 'status'])
ObjectStore: 'users'          (KeyPath: 'id', Indexes: ['organizationId', 'role'])
ObjectStore: 'organization'   (KeyPath: 'id')
ObjectStore: 'auditLogs'      (KeyPath: 'id', Indexes: ['projectId', 'timestamp'])
ObjectStore: 'attachments'    (KeyPath: 'id', Indexes: ['testCaseId'])
ObjectStore: 'snapshots'      (KeyPath: 'id', Indexes: ['createdAt'])
ObjectStore: 'requirements'   (KeyPath: 'id', Indexes: ['projectId'])
ObjectStore: 'workspaceMeta'  (KeyPath: 'key') -> Stores session state, last viewed suite, favorites, settings`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                100% Browser-Only Architecture
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                <CloudOff className="w-3.5 h-3.5 text-indigo-400" />
                No Database / Zero Backend Storage
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Browser-First Local Architecture Specification
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Complete architectural blueprint: All user data is stored locally inside the browser's
              IndexedDB engine. Instant auto-saving, offline PWA execution, zero hosting costs for
              storage, and pluggable cloud sync adapters.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopyCode(cloudAdapterCode)}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-indigo-200" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied Adapter Spec!' : 'Copy Sync Adapter Spec'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'principles', label: 'Core Principles ($0 DB)' },
            { id: 'indexeddb-schema', label: 'IndexedDB Data Model' },
            { id: 'cloud-adapter', label: 'Pluggable Cloud Sync Adapter' },
            { id: 'auto-save', label: 'Auto-Save & Session Recovery' },
            { id: 'migration', label: 'Legacy DB Migration' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Core Principles */}
      {activeTab === 'principles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <CloudOff className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Zero External Databases
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No Firebase, Firestore, Supabase, MySQL, PostgreSQL, MongoDB, or SQLite cloud
                dependencies. The application requires zero servers to store data and incurs $0
                recurring storage hosting costs.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                <HardDrive className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Local-First IndexedDB
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                IndexedDB is the primary source of truth. Read/write latency is &lt;1ms. High
                storage quotas (up to gigabytes) allocated by the browser enable managing thousands
                of test cases smoothly.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Total Data Sovereignty
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No telemetry, no tracking, and no third-party data analytics. All company test
                specifications, credentials, and bug reports remain strictly on the user's machine.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Comparison: Legacy Cloud Database vs. QAsgard Browser-Only Architecture
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Metric / Aspect</th>
                    <th className="py-2.5 px-3 text-rose-500">
                      Legacy Cloud Database (Supabase/Postgres)
                    </th>
                    <th className="py-2.5 px-3 text-emerald-600 font-bold">
                      QAsgard Browser-Only Architecture
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      Hosting Costs
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400">
                      $25–$250+/month per project
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                      $0.00 forever (Client storage)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      Offline Capability
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400">
                      Blocked when network drops
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                      100% functional offline (PWA)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      Read/Write Latency
                    </td>
                    <td className="py-2.5 px-3">50ms – 300ms network round-trip</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      &lt;1ms local memory / disk
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      Data Privacy / Compliance
                    </td>
                    <td className="py-2.5 px-3">Stored on 3rd-party cloud servers</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      Never leaves user's browser
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      Backup Portability
                    </td>
                    <td className="py-2.5 px-3">Vendor locked-in SQL dumps</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      1-click JSON, ZIP, Excel, Word, PDF
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IndexedDB Data Model */}
      {activeTab === 'indexeddb-schema' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            <pre>{indexedDbSchemaSpec}</pre>
          </div>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
            <strong>Key Benefit:</strong> Because all entities (suites, test cases, steps, runs,
            defects, requirements, attachments) use IndexedDB object stores with typed indexes,
            queries such as filtering test cases by suite ID or project ID execute synchronously
            with zero DOM blocking.
          </div>
        </div>
      )}

      {/* TAB 3: Pluggable Cloud Sync Adapter */}
      {activeTab === 'cloud-adapter' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-600" />
              Future Cloud Sync Extensibility Design
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The internal data model is strictly decoupled from cloud providers. In the future, any
              cloud sync provider (Google Drive, OneDrive, Dropbox, GitHub, AWS S3, or Supabase) can
              be plugged in as an optional sync target without changing the internal database
              structure. Local IndexedDB remains the authoritative single source of truth.
            </p>
          </div>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
            <pre>{cloudAdapterCode}</pre>
          </div>
        </div>
      )}

      {/* TAB 4: Auto-Save & Session Recovery */}
      {activeTab === 'auto-save' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Zero-Click Auto-Save
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                There is no "Save" button required. When a test case is drafted, priority changed,
                or step reordered, an asynchronous IndexedDB transaction commits immediately. The
                browser automatically flushes writes to disk.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                <li>Changes survive sudden page reloads (F5)</li>
                <li>Changes survive complete browser termination and restart</li>
                <li>Data persists even when offline without WiFi</li>
              </ul>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Startup Session Restoration
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                When QAsgard boots, it automatically restores:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
                <li>
                  <strong>Previous Project:</strong> Reopens the last active workspace project
                </li>
                <li>
                  <strong>Last Viewed Suite:</strong> Expands and highlights the exact test suite
                </li>
                <li>
                  <strong>Favorite Suites:</strong> Restores pinned suites to the explorer sidebar
                </li>
                <li>
                  <strong>Navigation State:</strong> Restores selected tab and admin sub-view
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Migration */}
      {activeTab === 'migration' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Migrating from Legacy Databases to Browser-Only Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Existing projects running on PostgreSQL, Supabase, MySQL, TestRail, or Jira can be
            migrated directly into your browser with zero downtime using QAsgard's integrated
            Database Migration Engine.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <strong className="block font-semibold text-slate-900 dark:text-white mb-1">
                1. Export Dump
              </strong>
              Export SQL or JSON from your legacy database (e.g. pg_dump or REST export).
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <strong className="block font-semibold text-slate-900 dark:text-white mb-1">
                2. Schema Translation
              </strong>
              QAsgard normalizes snake_case attributes, extracts steps, and builds parent-child
              suite trees.
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <strong className="block font-semibold text-slate-900 dark:text-white mb-1">
                3. Direct IndexedDB Store
              </strong>
              Entities write directly into browser storage, cutting cloud ties immediately.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
