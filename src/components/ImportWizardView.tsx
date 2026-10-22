import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Check,
  Download,
  Copy,
  Layers,
  FolderPlus,
  HelpCircle,
  Database,
  XCircle,
} from 'lucide-react';
import { Project, TestCase, TestSuite } from '../types';
import { IMPORT_FEATURE_ARCHITECTURE_SPEC } from '../data/importFeatureArchitectureDoc';

interface ImportWizardViewProps {
  project: Project;
  testSuites: TestSuite[];
  onImportCompleted: (cases: Partial<TestCase>[], newSuites: Partial<TestSuite>[]) => void;
}

type ImportFormat = 'excel' | 'csv' | 'word' | 'json';
type ConflictStrategy = 'auto_increment' | 'overwrite' | 'skip';

interface ParsedImportRow {
  id: string;
  sourceRowIndex: number;
  project: string;
  suite: string;
  key?: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  severity: 'blocker' | 'critical' | 'major' | 'normal' | 'minor';
  layer: 'e2e' | 'api' | 'unit';
  steps: { action: string; expectedResult: string; data?: string }[];
  status: 'valid' | 'warning' | 'error';
  validationMessage?: string;
}

const SAMPLE_CSV = `Project,Suite,Key,Title,Priority,Severity,Layer,Step 1 Action,Step 1 Expected,Step 2 Action,Step 2 Expected
FinTech Core,Payment Gateway,PAY-101,Verify 3DS 2.0 Challenge Authentication,High,Critical,E2E,Enter card with 3DS requirement,Visa challenge iframe renders,Input SMS OTP code,Transaction approves
FinTech Core,Payment Gateway,PAY-102,Verify Apple Pay token cryptogram authorization,High,Blocker,E2E,Trigger Apple Pay sheet,Biometric prompt displays,Authenticate with FaceID,Token returns with 200 OK
FinTech Core,Webhooks & APIs,PAY-103,Validate Stripe webhook refund idempotency,High,Major,API,POST duplicate refund webhooks,First returns 200,Inspect second response,Second returns 200 ignored
FinTech Core,Webhooks & APIs,PAY-104,Invalid webhook HMAC signature rejection,Medium,Critical,API,Post webhook with tampered HMAC,Server returns 401 Unauthorized,Check audit log,Audit event recorded`;

const SAMPLE_JSON = JSON.stringify(
  [
    {
      project: 'FinTech Core',
      suite: 'Identity & Biometrics',
      key: 'BIO-201',
      title: 'Biometric WebAuthn passkey registration on iOS',
      priority: 'high',
      severity: 'critical',
      layer: 'e2e',
      steps: [
        {
          action: "Navigate to Security Settings and click 'Add Passkey'",
          expectedResult: 'Native Face ID / Touch ID prompt surfaces',
        },
        {
          action: 'Authorize biometric credentials',
          expectedResult: 'Public key credential stored in database',
        },
      ],
    },
    {
      project: 'FinTech Core',
      suite: 'Identity & Biometrics',
      key: 'BIO-202',
      title: 'Passkey authentication fallback to TOTP when biometric cancelled',
      priority: 'medium',
      severity: 'normal',
      layer: 'e2e',
      steps: [
        {
          action: "Click 'Cancel' on biometric prompt",
          expectedResult: 'Fallback options modal displays with 6-digit TOTP input',
        },
        {
          action: 'Enter valid authenticator code',
          expectedResult: 'User authenticated successfully',
        },
      ],
    },
  ],
  null,
  2
);

export const ImportWizardView: React.FC<ImportWizardViewProps> = ({
  project,
  testSuites,
  onImportCompleted,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [activeFormat, setActiveFormat] = useState<ImportFormat>('csv');
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('auto_increment');
  const [rawText, setRawText] = useState(SAMPLE_CSV);
  const [fileName, setFileName] = useState('payment_gateway_regression.csv');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Column Mappings State
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({
    Project: 'project',
    Suite: 'suite',
    Key: 'key',
    Title: 'title',
    Priority: 'priority',
    Severity: 'severity',
    Layer: 'layer',
    'Step 1 Action': 'step_action_1',
    'Step 1 Expected': 'step_expected_1',
    'Step 2 Action': 'step_action_2',
    'Step 2 Expected': 'step_expected_2',
  });

  // Staged Rows
  const [stagedRows, setStagedRows] = useState<ParsedImportRow[]>([
    {
      id: 'row-1',
      sourceRowIndex: 1,
      project: project.name,
      suite: 'Payment Gateway',
      key: 'PAY-101',
      title: 'Verify 3DS 2.0 Challenge Authentication',
      description: 'Imported from payment_gateway_regression.csv',
      priority: 'high',
      severity: 'critical',
      layer: 'e2e',
      steps: [
        {
          action: 'Enter card with 3DS requirement',
          expectedResult: 'Visa challenge iframe renders',
        },
        { action: 'Input SMS OTP code', expectedResult: 'Transaction approves' },
      ],
      status: 'valid',
    },
    {
      id: 'row-2',
      sourceRowIndex: 2,
      project: project.name,
      suite: 'Payment Gateway',
      key: 'PAY-102',
      title: 'Verify Apple Pay token cryptogram authorization',
      description: 'Imported from payment_gateway_regression.csv',
      priority: 'high',
      severity: 'blocker',
      layer: 'e2e',
      steps: [
        { action: 'Trigger Apple Pay sheet', expectedResult: 'Biometric prompt displays' },
        { action: 'Authenticate with FaceID', expectedResult: 'Token returns with 200 OK' },
      ],
      status: 'valid',
    },
    {
      id: 'row-3',
      sourceRowIndex: 3,
      project: project.name,
      suite: 'Webhooks & APIs',
      key: 'PAY-103',
      title: 'Validate Stripe webhook refund idempotency',
      description: 'Imported from payment_gateway_regression.csv',
      priority: 'high',
      severity: 'major',
      layer: 'api',
      steps: [
        { action: 'POST duplicate refund webhooks', expectedResult: 'First returns 200' },
        { action: 'Inspect second response', expectedResult: 'Second returns 200 ignored' },
      ],
      status: 'valid',
    },
    {
      id: 'row-4',
      sourceRowIndex: 4,
      project: project.name,
      suite: 'Webhooks & APIs',
      key: 'PAY-104',
      title: 'Invalid webhook HMAC signature rejection',
      description: 'Imported from payment_gateway_regression.csv',
      priority: 'medium',
      severity: 'critical',
      layer: 'api',
      steps: [
        {
          action: 'Post webhook with tampered HMAC',
          expectedResult: 'Server returns 401 Unauthorized',
        },
        { action: 'Check audit log', expectedResult: 'Audit event recorded' },
      ],
      status: 'valid',
    },
  ]);

  const handleCopySpec = () => {
    navigator.clipboard.writeText(IMPORT_FEATURE_ARCHITECTURE_SPEC);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSpec = () => {
    const blob = new Blob([IMPORT_FEATURE_ARCHITECTURE_SPEC], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qasgard_universal_test_import_architecture.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadPreset = (format: ImportFormat) => {
    setActiveFormat(format);
    if (format === 'csv') {
      setRawText(SAMPLE_CSV);
      setFileName('payment_gateway_regression.csv');
    } else if (format === 'json') {
      setRawText(SAMPLE_JSON);
      setFileName('testrail_export_biometrics.json');
    } else if (format === 'excel') {
      setRawText(SAMPLE_CSV);
      setFileName('enterprise_qa_master_test_plan.xlsx');
    } else if (format === 'word') {
      setRawText(
        `# Payment Workflows Specification
## Suite: 3DS Strong Customer Authentication
- Test Case: 3DS SMS OTP challenge step-up validation [Priority: High, Severity: Critical]
  1. Trigger checkout exceeding $100 -> Expected: Challenge iframe loads
  2. Input valid OTP -> Expected: Payment approved and order ID created
- Test Case: 3DS biometric failure after 3 attempts [Priority: High, Severity: Major]
  1. Cancel biometric auth 3 times -> Expected: Transaction aborted safely`
      );
      setFileName('checkout_security_acceptance.docx');
    }
  };

  const handleExecuteCommit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Extract unique suites
      const suiteNames = Array.from(new Set(stagedRows.map((r) => r.suite)));
      const newSuites: Partial<TestSuite>[] = suiteNames.map((sName) => ({
        projectId: project.id,
        name: sName,
        description: `Imported via Universal Importer from ${fileName}`,
        caseCount: stagedRows.filter((r) => r.suite === sName).length,
      }));

      // Transform rows to cases
      const newCases: Partial<TestCase>[] = stagedRows.map((r, idx) => ({
        key:
          conflictStrategy === 'auto_increment'
            ? `${project.key}-${Math.floor(200 + Math.random() * 800)}`
            : r.key || `${project.key}-${200 + idx}`,
        projectId: project.id,
        suiteId: 'imported',
        suiteName: r.suite,
        title: r.title,
        description: r.description,
        priority: r.priority,
        severity: r.severity,
        layer: r.layer,
        status: 'actual',
        automationStatus: 'manual',
        steps: r.steps.map((st, sIdx) => ({
          stepNumber: sIdx + 1,
          action: st.action,
          expectedResult: st.expectedResult,
          data: st.data || '',
        })),
        tags: ['imported', activeFormat],
      }));

      onImportCompleted(newCases, newSuites);
      setIsProcessing(false);
      setCurrentStep(4);
    }, 900);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <Upload className="w-3 h-3 text-emerald-400" />
                Universal Test Case Importer
              </span>
              <span className="text-xs text-slate-400">• Excel • CSV • Word (.docx) • JSON</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Multi-Format Bulk Test Importer
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Auto-maps external files into Projects, Suites, Test Cases, and Sequential Steps with
              dry-run validation and conflict resolution.
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
              <span>{copied ? 'Copied Specs!' : 'Copy Importer Spec'}</span>
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

      {/* Stepper Progress Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { step: 1, label: 'Upload File', desc: 'Excel, CSV, Word, JSON' },
            { step: 2, label: 'Column Mapping', desc: 'Auto-detected match' },
            { step: 3, label: 'Validation Grid', desc: 'Preview & Conflict rules' },
            { step: 4, label: 'Commit & Done', desc: 'Saved to Database' },
          ].map((s) => {
            const isDone = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.step}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={`text-xs font-bold ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[10px] text-slate-400">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: UPLOAD & FORMAT SELECTION */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                id: 'excel',
                label: 'Excel Workbook',
                ext: '.xlsx, .xls',
                icon: FileSpreadsheet,
                color: 'text-emerald-600',
              },
              {
                id: 'csv',
                label: 'CSV Delimited',
                ext: '.csv',
                icon: FileCode,
                color: 'text-blue-600',
              },
              {
                id: 'word',
                label: 'Word Document',
                ext: '.docx',
                icon: FileText,
                color: 'text-indigo-600',
              },
              {
                id: 'json',
                label: 'JSON Schema',
                ext: '.json',
                icon: FileCode,
                color: 'text-purple-600',
              },
            ].map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = activeFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => handleLoadPreset(fmt.id as ImportFormat)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${fmt.color}`} />
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {fmt.label}
                  </div>
                  <div className="text-[11px] text-slate-400">{fmt.ext}</div>
                </button>
              );
            })}
          </div>

          {/* Dropzone & Textarea */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Source File Payload
                </h3>
                <p className="text-xs text-slate-500">
                  File Name:{' '}
                  <span className="font-mono text-indigo-600 font-semibold">{fileName}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadPreset(activeFormat)}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Reset Sample
                </button>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              className="w-full font-mono text-[11px] p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Detected <strong>4 test cases</strong> across <strong>2 suites</strong>
              </span>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Continue to Column Mapping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xs text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Field &amp; Column Auto-Mapper
              </h3>
              <p className="text-slate-500">
                Matches source spreadsheet headers to QAsgard entity fields.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[11px]">
              96% Auto-Match Confidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                source: 'Project',
                target: 'Project Name',
                targetField: 'project',
                match: 'Exact Match',
              },
              { source: 'Suite', target: 'Suite Name', targetField: 'suite', match: 'Exact Match' },
              {
                source: 'Key',
                target: 'Case Key (Optional)',
                targetField: 'key',
                match: 'Exact Match',
              },
              {
                source: 'Title',
                target: 'Test Case Title *',
                targetField: 'title',
                match: 'Exact Match',
              },
              {
                source: 'Priority',
                target: 'Priority (High/Med/Low)',
                targetField: 'priority',
                match: 'Normalized',
              },
              {
                source: 'Severity',
                target: 'Severity (Blocker/Crit/etc)',
                targetField: 'severity',
                match: 'Normalized',
              },
              {
                source: 'Layer',
                target: 'Layer (E2E/API/Unit)',
                targetField: 'layer',
                match: 'Normalized',
              },
              {
                source: 'Step 1 Action',
                target: 'Step 1: User Action',
                targetField: 'step_action_1',
                match: 'Sequential',
              },
              {
                source: 'Step 1 Expected',
                target: 'Step 1: Expected Result',
                targetField: 'step_expected_1',
                match: 'Sequential',
              },
              {
                source: 'Step 2 Action',
                target: 'Step 2: User Action',
                targetField: 'step_action_2',
                match: 'Sequential',
              },
            ].map((col, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold block">
                    {col.source}
                  </span>
                  <span className="text-[10px] text-slate-400">File Header</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-2" />
                <div className="text-right">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {col.target}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">{col.match}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Validate &amp; Preview Rows</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATION GRID & CONFLICT STRATEGY */}
      {currentStep === 3 && (
        <div className="space-y-6 text-xs">
          {/* Conflict Strategy Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Key Conflict Strategy
              </h4>
              <p className="text-slate-500">
                How should the database handle test cases with matching keys?
              </p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setConflictStrategy('auto_increment')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${
                  conflictStrategy === 'auto_increment'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Auto-Increment Key
              </button>
              <button
                onClick={() => setConflictStrategy('overwrite')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${
                  conflictStrategy === 'overwrite'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Overwrite Existing
              </button>
              <button
                onClick={() => setConflictStrategy('skip')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${
                  conflictStrategy === 'skip'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Skip Duplicates
              </button>
            </div>
          </div>

          {/* Validation Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Staging Validation Grid ({stagedRows.length} Cases Ready)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                0 Fatal Errors
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Suite Name</th>
                    <th className="py-2.5 px-3">Key</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3 text-center">Priority</th>
                    <th className="py-2.5 px-3 text-center">Severity</th>
                    <th className="py-2.5 px-3 text-center">Steps</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {stagedRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{r.sourceRowIndex}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {r.suite}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{r.key}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate">{r.title}</td>
                      <td className="py-2.5 px-3 text-center uppercase font-bold text-[10px]">
                        {r.priority}
                      </td>
                      <td className="py-2.5 px-3 text-center uppercase font-bold text-[10px]">
                        {r.severity}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{r.steps.length}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Valid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleExecuteCommit}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Execute Transactional Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT COMPLETED */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Import Transaction Succeeded
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            All records have been atomically committed into PostgreSQL. You can now view, run, or
            edit these test cases inside the Test Repository.
          </p>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Suites Created</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">2</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Test Cases</span>
              <span className="font-bold text-indigo-600 text-base">{stagedRows.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Test Steps</span>
              <span className="font-bold text-emerald-600 text-base">
                {stagedRows.reduce((acc, r) => acc + r.steps.length, 0)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm text-xs cursor-pointer"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
