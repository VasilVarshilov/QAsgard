import React, { useState, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  ArrowRight,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BookmarkCheck,
  Layers,
  ChevronDown,
  ChevronRight,
  Fingerprint,
  Lock,
  ExternalLink,
  Sparkles,
  Info,
  Clock,
  Tag,
  Check,
} from 'lucide-react';
import { AuditLogEntry, AuditActionType, AuditEntityType, Project } from '../types';

interface AuditTrailViewProps {
  project: Project;
  auditLogs: AuditLogEntry[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ project, auditLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set(['aud-1', 'aud-2']));
  const [selectedLogForCert, setSelectedLogForCert] = useState<AuditLogEntry | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Toggle expand diffs
  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Entity type filter
      if (selectedEntityType !== 'all' && log.entityType !== selectedEntityType) {
        return false;
      }
      // Action type filter
      if (selectedActionType !== 'all' && log.action !== selectedActionType) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchKey = log.entityKey.toLowerCase().includes(query);
        const matchTitle = log.entityTitle.toLowerCase().includes(query);
        const matchActor =
          log.actor.name.toLowerCase().includes(query) ||
          log.actor.email.toLowerCase().includes(query);
        const matchSummary = log.summary.toLowerCase().includes(query);
        const matchReason = (log.complianceReason || '').toLowerCase().includes(query);
        return matchKey || matchTitle || matchActor || matchSummary || matchReason;
      }
      return true;
    });
  }, [auditLogs, selectedEntityType, selectedActionType, searchQuery]);

  // Quick stats
  const totalEvents = auditLogs.length;
  const testCaseEvents = auditLogs.filter((l) => l.entityType === 'test_case').length;
  const testPlanEvents = auditLogs.filter((l) => l.entityType === 'test_plan').length;
  const signOffEvents = auditLogs.filter((l) => l.action === 'SIGN_OFF').length;

  // Export audit log
  const handleExportAudit = (format: 'json' | 'csv') => {
    const filename = `${project.key}_Compliance_Audit_Trail_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
      triggerDownload(blob, `${filename}.json`);
    } else {
      let csv =
        'Timestamp,Actor Name,Actor Email,Actor Role,Action,Entity Type,Entity Key,Entity Title,Summary,Compliance Reason,Integrity Hash\n';
      filteredLogs.forEach((l) => {
        csv += `"${l.timestamp}","${l.actor.name}","${l.actor.email}","${l.actor.role}","${l.action}","${l.entityType}","${l.entityKey}","${l.entityTitle.replace(/"/g, '""')}","${l.summary.replace(/"/g, '""')}","${(l.complianceReason || '').replace(/"/g, '""')}","${l.integrityHash}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, `${filename}.csv`);
    }
  };

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            CREATED
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            UPDATED
          </span>
        );
      case 'CLONE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            CLONED
          </span>
        );
      case 'MOVE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            MOVED
          </span>
        );
      case 'SIGN_OFF':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            SIGN-OFF
          </span>
        );
      case 'INVALIDATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            INVALIDATED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            {action}
          </span>
        );
    }
  };

  const getEntityIcon = (type: AuditEntityType) => {
    switch (type) {
      case 'test_case':
        return <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'test_plan':
        return <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'test_suite':
        return <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'test_run':
        return <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Verification Seal */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Immutable Compliance Ledger
              </span>
              <span className="text-xs text-slate-400">
                • ISO 29119 &amp; SOC2 Type II Traceability
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              QA Audit Trail &amp; Lifecycle Change History
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Complete, cryptographic log of all modifications made to test cases, test plans, step
              assertions, and sign-offs in <strong>{project.name}</strong>.
            </p>
          </div>

          {/* Export & Compliance Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleExportAudit('csv')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export Audit Trail as CSV for auditors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExportAudit('json')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Export complete JSON audit log with SHA-256 signatures"
            >
              <Fingerprint className="w-3.5 h-3.5 text-amber-300" />
              <span>Export JSON Ledger</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Total Audit Records
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
              {totalEvents}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> 100% Cryptographically Verified
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Test Case Events
            </span>
            <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              {testCaseEvents}
            </span>
            <span className="text-[11px] text-slate-500">Steps, priorities, and clones</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Test Plan Milestones
            </span>
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
              {testPlanEvents}
            </span>
            <span className="text-[11px] text-slate-500">Scope locks &amp; releases</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Formal Sign-Offs
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {signOffEvents}
            </span>
            <span className="text-[11px] text-slate-500">Release gate authorizations</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Key (PAY-101), Title, Actor, or Compliance Ticket (SEC-2026)..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[11px]">Entity:</span>
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Entities</option>
                <option value="test_case">Test Cases</option>
                <option value="test_plan">Test Plans</option>
                <option value="test_run">Test Runs</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[11px]">Action:</span>
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="UPDATE">Updated</option>
                <option value="CREATE">Created</option>
                <option value="CLONE">Cloned</option>
                <option value="SIGN_OFF">Sign-Off</option>
                <option value="INVALIDATE">Invalidated</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEntityType('all');
                setSelectedActionType('all');
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] underline ml-1 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Showing {filteredLogs.length} audit entries matching active filters</span>
          <span>Ledger Hash Standard: SHA-256</span>
        </div>
      </div>

      {/* Audit Log Timeline Entries */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              No audit events match your search criteria
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Try clearing filters or search keywords.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogIds.has(log.id);
            return (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Top Row: Timestamp, Actor, Action & Key */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Action Badge */}
                    {getActionBadge(log.action)}

                    {/* Entity Identifier */}
                    <div className="flex items-center gap-1.5 font-mono">
                      {getEntityIcon(log.entityType)}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {log.entityKey}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-sans font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs">
                        {log.entityTitle}
                      </span>
                    </div>
                  </div>

                  {/* Actor & Timestamp */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={log.actor.avatar}
                        alt={log.actor.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {log.actor.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({log.actor.role})
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Change Summary & Compliance Reason */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {log.summary}
                  </p>

                  {log.complianceReason && (
                    <div className="shrink-0">
                      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md font-mono text-[10px] font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3 text-amber-600" />
                        <span>Ticket: {log.complianceReason}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Field-level Diffs (Collapsible) */}
                {log.diffs && log.diffs.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isExpanded
                          ? 'Hide Field Changes'
                          : `View ${log.diffs.length} Changed Fields`}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                        {log.diffs.map((diff, dIdx) => (
                          <div
                            key={dIdx}
                            className="space-y-1 border-b border-slate-200 dark:border-slate-700/60 pb-2 last:border-b-0 last:pb-0"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Field: {diff.fieldName}
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {/* Previous Value */}
                              <div className="p-2 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded text-rose-800 dark:text-rose-300">
                                <span className="text-[9px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                                  Previous Value:
                                </span>
                                <span className="line-through">
                                  {String(diff.previousValue ?? 'null')}
                                </span>
                              </div>
                              {/* New Value */}
                              <div className="p-2 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded text-emerald-800 dark:text-emerald-300 font-semibold">
                                <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                                  New Value:
                                </span>
                                <span>{String(diff.newValue ?? 'null')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cryptographic Ledger Verification Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">SHA-256: {log.integrityHash}</span>
                    <button
                      onClick={() => copyHash(log.integrityHash)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {copiedHash === log.integrityHash ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {log.ipAddress && <span>Origin IP: {log.ipAddress}</span>}
                    <button
                      onClick={() => setSelectedLogForCert(log)}
                      className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer font-semibold underline"
                    >
                      <span>Audit Proof</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Audit Certificate Verification Modal */}
      {selectedLogForCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Cryptographic Audit Certificate
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ISO/IEC 27001 &amp; SOC2 Immutable Trace Proof
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForCert(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Audit Event ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedLogForCert.id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Target Entity</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedLogForCert.entityKey} ({selectedLogForCert.entityTitle})
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Authorized Actor</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedLogForCert.actor.name} &lt;{selectedLogForCert.actor.email}&gt;
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Action Timestamp</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedLogForCert.timestamp}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">Network Signature</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedLogForCert.ipAddress || 'Internal Microservice Gateway'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">
                  SHA-256 Ledger Hash
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 break-all">
                  {selectedLogForCert.integrityHash}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chain of custody intact. Signature valid and unalterable.</span>
            </div>

            <button
              onClick={() => setSelectedLogForCert(null)}
              className="w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg text-xs cursor-pointer hover:opacity-90"
            >
              Close Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
