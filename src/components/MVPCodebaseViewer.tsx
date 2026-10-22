import React, { useState } from 'react';
import {
  FolderTree,
  Database,
  HardDrive,
  Lock,
  Copy,
  Check,
  Download,
  FileCode,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Code,
  CheckCircle2,
  Terminal,
  Cloud,
  Layers,
  Zap,
} from 'lucide-react';

export const MVPCodebaseViewer: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'structure' | 'indexeddb' | 'pwa' | 'sync'>(
    'structure'
  );
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const handleCopy = (filename: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const projectTree = `qasgard-browser/
├── index.html                       # HTML5 entry with PWA manifest & mobile meta
├── vite.config.ts                   # Vite 8 + VitePWA (Workbox offline service worker)
├── package.json                     # React 19, Tailwind CSS v4, Lucide, JSZip, jsPDF
├── tsconfig.json                    # Strict TypeScript configuration
├── public/
│   ├── icon.svg                     # Vector app icon
│   ├── pwa-192x192.png              # PWA Home Screen Icon
│   └── pwa-512x512.png              # PWA Splash Screen Icon
│
├── src/
│   ├── main.tsx                     # React root bootstrap & PWA registration
│   ├── App.tsx                      # Local-First state manager & startup recovery
│   ├── types.ts                     # Strict TypeScript domain interfaces
│   │
│   ├── services/
│   │   └── storage/
│   │       └── indexedDb.ts         # 100% Browser IndexedDB Engine v3 (Single Source of Truth)
│   │
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
│   │
│   └── utils/
│       ├── exportUtils.ts           # PDF, Excel, Word document generators
│       └── copilotPreferences.ts    # User settings persistence
`;

  const indexedDbCode = `// src/services/storage/indexedDb.ts
// 100% Browser-Only Database Engine - Single Source of Truth

import JSZip from 'jszip';
import { Project, TestSuite, TestCase, TestRun, TestPlan, Defect, User, Requirement } from '../../types';

export const DB_NAME = 'qasgard_browser_db';
export const DB_VERSION = 3;

class BrowserDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const stores = [
          'projects', 'suites', 'testCases', 'testRuns',
          'testPlans', 'defects', 'users', 'organization',
          'auditLogs', 'attachments', 'snapshots', 'requirements',
          'workspaceMeta'
        ];

        stores.forEach((name) => {
          if (!db.objectStoreNames.contains(name)) {
            const keyPath = name === 'workspaceMeta' ? 'key' : 'id';
            const store = db.createObjectStore(name, { keyPath });
            if (name === 'testCases') {
              store.createIndex('suiteId', 'suiteId', { unique: false });
              store.createIndex('projectId', 'projectId', { unique: false });
            }
            if (name === 'suites') {
              store.createIndex('projectId', 'projectId', { unique: false });
              store.createIndex('parentId', 'parentId', { unique: false });
            }
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // Generic Zero-Latency ACID Transaction Runners
  public async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  public async putMany<T>(storeName: string, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const browserDb = new BrowserDatabase();`;

  const pwaConfigCode = `// vite.config.ts - Progressive Web App Configuration (Offline-First)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        id: '/',
        name: 'QAsgard - Where Quality Rules',
        short_name: 'QAsgard',
        description: '100% Browser-only QA test management platform with local IndexedDB storage and offline-first capabilities.',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
    }),
  ],
});`;

  const syncAdapterCode = `// Pluggable Cloud Sync Adapter Interface (Extensible Architecture)
// Local browser IndexedDB is authoritative; cloud providers plug in optionally.

export interface CloudSyncAdapter {
  id: string;
  name: 'Google Drive' | 'Microsoft OneDrive' | 'Dropbox' | 'GitHub' | 'AWS S3';
  enabled: boolean;
  pushWorkspace(bundle: WorkspaceExportBundle): Promise<{ success: boolean; syncedAt: string }>;
  pullWorkspace(): Promise<{ bundle: WorkspaceExportBundle | null }>;
}

export class GoogleDriveAdapter implements CloudSyncAdapter {
  id = 'google-drive';
  name = 'Google Drive' as const;
  enabled = false;

  async pushWorkspace(bundle: WorkspaceExportBundle) {
    const json = JSON.stringify(bundle, null, 2);
    // Write directly to user's Google Drive appDataFolder via client OAuth
    // Zero backend servers required
    return { success: true, syncedAt: new Date().toISOString() };
  }

  async pullWorkspace() {
    return { bundle: null };
  }
}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Browser-Only Production Codebase
              </span>
              <span className="text-xs text-slate-400">
                • Zero Database • Local-First • Offline PWA
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              QAsgard Architecture &amp; Codebase Viewer
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore the clean, modern local-first implementation of QAsgard. 100% browser-based
              architecture with IndexedDB, Workbox offline caching, auto-save pipeline, and zero
              database dependencies.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSection('structure')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeSection === 'structure'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>1. Project Structure</span>
        </button>

        <button
          onClick={() => setActiveSection('indexeddb')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeSection === 'indexeddb'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>2. IndexedDB Engine (Single Source of Truth)</span>
        </button>

        <button
          onClick={() => setActiveSection('pwa')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeSection === 'pwa'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>3. Offline PWA (Vite + Workbox)</span>
        </button>

        <button
          onClick={() => setActiveSection('sync')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeSection === 'sync'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>4. Pluggable Cloud Sync Adapter</span>
        </button>
      </div>

      {/* SECTION 1: PROJECT STRUCTURE */}
      {activeSection === 'structure' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Client-Side Architecture Directory Tree
              </h2>
              <p className="text-slate-500">
                100% browser-based architecture: React 19, IndexedDB storage engine, and zero
                database dependencies.
              </p>
            </div>
            <button
              onClick={() => handleCopy('structure', projectTree)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              {copiedFile === 'structure' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedFile === 'structure' ? 'Copied Tree' : 'Copy Tree'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] overflow-y-auto">
            {projectTree}
          </pre>
        </div>
      )}

      {/* SECTION 2: INDEXEDDB ENGINE */}
      {activeSection === 'indexeddb' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                IndexedDB Engine (src/services/storage/indexedDb.ts)
              </h2>
              <p className="text-slate-500">
                ACID client-side database with object stores for suites, test cases, steps, runs,
                defects, and attachments.
              </p>
            </div>
            <button
              onClick={() => handleCopy('indexeddb', indexedDbCode)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
            >
              {copiedFile === 'indexeddb' ? (
                <Check className="w-3.5 h-3.5 text-indigo-200" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedFile === 'indexeddb' ? 'Copied Code' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] overflow-y-auto">
            {indexedDbCode}
          </pre>
        </div>
      )}

      {/* SECTION 3: PWA & WORKBOX */}
      {activeSection === 'pwa' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Progressive Web App Configuration (vite.config.ts)
              </h2>
              <p className="text-slate-500">
                Service Worker offline asset caching, standalone desktop/mobile installation, and
                instant startup.
              </p>
            </div>
            <button
              onClick={() => handleCopy('pwa', pwaConfigCode)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
            >
              {copiedFile === 'pwa' ? (
                <Check className="w-3.5 h-3.5 text-indigo-200" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedFile === 'pwa' ? 'Copied Config' : 'Copy Config'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] overflow-y-auto">
            {pwaConfigCode}
          </pre>
        </div>
      )}

      {/* SECTION 4: PLUGGABLE CLOUD SYNC ADAPTER */}
      {activeSection === 'sync' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Pluggable Cloud Sync Adapter Interface
              </h2>
              <p className="text-slate-500">
                Extensible architecture allowing optional future sync to Google Drive, OneDrive,
                GitHub, or S3 while keeping IndexedDB as the single source of truth.
              </p>
            </div>
            <button
              onClick={() => handleCopy('sync', syncAdapterCode)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
            >
              {copiedFile === 'sync' ? (
                <Check className="w-3.5 h-3.5 text-indigo-200" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedFile === 'sync' ? 'Copied Adapter' : 'Copy Adapter'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] overflow-y-auto">
            {syncAdapterCode}
          </pre>
        </div>
      )}
    </div>
  );
};
