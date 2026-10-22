import React, { useState } from 'react';
import {
  Database,
  Table,
  Key,
  Shield,
  Copy,
  Check,
  Search,
  Layers,
  ArrowRight,
  Cpu,
  FileCode,
  Download,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DATABASE_ENTITIES, POSTGRESQL_DDL_FULL, TableDefinition } from '../data/databaseSchemaDoc';

export const DatabaseSchemaView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<TableDefinition>(DATABASE_ENTITIES[0]);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tables' | 'ddl' | 'erd'>('tables');

  const categories = [
    'all',
    'Identity & Access',
    'Core Quality',
    'Execution Engine',
    'Defects & Collab',
    'Governance & Audit',
  ];

  const filteredTables = DATABASE_ENTITIES.filter((tbl) => {
    if (selectedCategory !== 'all' && tbl.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tbl.name.toLowerCase().includes(q) ||
        tbl.description.toLowerCase().includes(q) ||
        tbl.columns.some((c) => c.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopyDDL = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL_FULL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([POSTGRESQL_DDL_FULL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qasgard_postgresql_schema.sql';
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
                <Database className="w-3 h-3 text-emerald-400" />
                PostgreSQL 16+ Enterprise Architecture
              </span>
              <span className="text-xs text-slate-400">
                • Multi-Tenant • Soft-Delete • RLS • Audit Log
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Database Schema &amp; Data Model
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Production-grade relational schema optimized for high concurrency, zero cross-tenant
              data leakage, sub-10ms indexed queries, and immutable audit compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyDDL}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied Full DDL!' : 'Copy SQL Script'}</span>
            </button>
            <button
              onClick={handleDownloadSQL}
              className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation View Modes */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('tables')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'tables'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Interactive Entity Explorer
          </button>
          <button
            onClick={() => setViewMode('erd')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'erd'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ER Diagram (Relationships)
          </button>
          <button
            onClick={() => setViewMode('ddl')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'ddl'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Raw SQL DDL Code
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          17 Normalized Tables • Composite Indexing
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE ENTITY EXPLORER */}
      {viewMode === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Table Selector */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col h-[600px] overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tables &amp; columns..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredTables.map((tbl) => {
                const isSelected = selectedTable.name === tbl.name;
                return (
                  <button
                    key={tbl.name}
                    onClick={() => setSelectedTable(tbl)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Table
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
                      />
                      <span className="font-mono text-xs">{tbl.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {tbl.columns.length} cols
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Table Specification Detail */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 space-y-6 h-[600px] overflow-y-auto">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  {selectedTable.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  public.{selectedTable.name}
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {selectedTable.name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedTable.description}
              </p>
            </div>

            {/* Column Schema Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Columns &amp; Constraints ({selectedTable.columns.length})
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3 w-40">Column Name</th>
                      <th className="py-2 px-3 w-32">PostgreSQL Type</th>
                      <th className="py-2 px-3 w-44">Constraints</th>
                      <th className="py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedTable.columns.map((col) => (
                      <tr
                        key={col.name}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {col.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-indigo-700 dark:text-indigo-400 text-[11px]">
                          {col.type}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                          {col.constraints || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                          {col.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Indexes */}
            {selectedTable.indexes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Indexes &amp; Performance Tuning ({selectedTable.indexes.length})
                </h3>
                <div className="space-y-2">
                  {selectedTable.indexes.map((idx) => (
                    <div
                      key={idx.name}
                      className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 dark:text-white text-[11px]">
                          {idx.name}
                        </span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {idx.purpose}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto">
                        {idx.definition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Foreign Keys */}
            {selectedTable.foreignKeys.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Foreign Key Constraints
                </h3>
                <ul className="space-y-1">
                  {selectedTable.foreignKeys.map((fk, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5"
                    >
                      <Key className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{fk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ER DIAGRAM */}
      {viewMode === 'erd' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 space-y-6">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Entity Relationship Diagram (ERD)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cardinality map illustrating strict tenant isolation and cascading references across
              quality entities.
            </p>
          </div>

          {/* ASCII & Graphical ERD */}
          <pre className="p-5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
            {`┌────────────────────────────────────────────────────────────────────────┐
│                        TENANT ROOT & RBAC LAYER                        │
└────────────────────────────────────────────────────────────────────────┘
 [organizations] (Tenant Root)
   │ 1
   ├─────────── N [users] ──── 1:N ──── [user_roles] ──── N:1 ──── [roles]
   │                │                      │                         │
   │ 1              │ 1                    │                         │ N:M
   │                ▼                      │                         ▼
   │          [audit_logs]                 │                  [permissions]
   │          (Partitioned)                │
   │                                       │
   │ 1                                     │
   ▼                                       │
 [projects] ◄──────────────────────────────┘
   │
   ├─────── 1:N ──────► [requirements] ◄──── N:M ──── [test_case_requirements]
   │                                                         ▲
   ├─────── 1:N ──────► [test_suites] (Self-referencing tree) │
   │                         │                               │
   │                         │ 1                             │
   │                         ▼                               │
   ├─────── 1:N ──────► [test_cases] ────────────────────────┘
   │                         │
   │                         ├────── 1:N ──────► [test_steps]
   │                         ├────── N:M ──────► [tags]
   │                         ├────── 1:N ──────► [attachments] (Polymorphic)
   │                         └────── 1:N ──────► [comments]    (Polymorphic)
   │
   ├─────── 1:N ──────► [test_plans] (Milestones)
   │                         │ 1
   │                         ▼ N
   └─────── 1:N ──────► [test_runs]
                             │ 1
                             ▼ N
                        [test_executions]
                             │ 1
                             ▼ N
                          [bugs] (Defects linked with repro traces)`}
          </pre>

          {/* Architecture Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Multi-Tenant Row Level Security
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Every table enforces an{' '}
                <code className="text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  organization_id
                </code>{' '}
                column governed by PostgreSQL RLS policies to guarantee zero cross-tenant leakage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Soft-Delete with Partial Indexes
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                All business entities include{' '}
                <code className="text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  deleted_at TIMESTAMPTZ
                </code>{' '}
                with matching partial indexes (
                <code className="text-[10px]">WHERE deleted_at IS NULL</code>) ensuring peak query
                performance.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Partitioned Audit Ledger
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                <code className="text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  audit_logs
                </code>{' '}
                is partitioned by quarterly calendar ranges to retain compliance records without
                bloating the active relational dataset.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: RAW DDL CODE */}
      {viewMode === 'ddl' && (
        <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-2xs space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400">PostgreSQL 16+ DDL Script (All 17 Entities)</span>
            <button
              onClick={handleCopyDDL}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-sans font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="overflow-x-auto max-h-[550px] overflow-y-auto leading-relaxed text-slate-300">
            <code>{POSTGRESQL_DDL_FULL}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
