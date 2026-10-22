import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Copy,
  PlusCircle,
  FileCheck2,
  AlertTriangle,
  Cpu,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Zap,
} from 'lucide-react';
import { Project, TestCase, TestSuite } from '../types';

interface AIQualityStudioViewProps {
  project: Project;
  testSuites: TestSuite[];
  testCases: TestCase[];
  onImportGeneratedCases: (cases: Partial<TestCase>[]) => void;
}

export const AIQualityStudioView: React.FC<AIQualityStudioViewProps> = ({
  project,
  testSuites,
  testCases,
  onImportGeneratedCases,
}) => {
  const [activeTab, setActiveTab] = useState<
    'generate' | 'steps' | 'duplicates' | 'coverage' | 'failure'
  >('generate');

  // 1. Generate Test Cases State
  const [requirementText, setRequirementText] = useState(
    `As a customer checking out with high cart value exceeding $100, I must complete 3D Secure 2.0 Strong Customer Authentication via SMS OTP or biometric bank app approval before my credit card is charged. If I enter the wrong OTP 3 times, the transaction must abort safely with a clear user prompt, and no funds should be captured.`
  );
  const [targetSuite, setTargetSuite] = useState(
    testSuites[0]?.name || 'Credit Card & Tokenization'
  );
  const [coverageDepth, setCoverageDepth] = useState('comprehensive');
  const [isGeneratingCases, setIsGeneratingCases] = useState(false);
  const [generatedCases, setGeneratedCases] = useState<any[]>([]);
  const [selectedGenIndices, setSelectedGenIndices] = useState<number[]>([]);

  // 2. Step Generator State
  const [stepTitle, setStepTitle] = useState(
    'Verify automatic refund idempotency when customer double-clicks refund button'
  );
  const [stepPreconditions, setStepPreconditions] = useState(
    'Active settled transaction of $49.00 exists in database'
  );
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [generatedSteps, setGeneratedSteps] = useState<any[]>([]);

  // 3. Duplicate Detection State
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  // 4. Requirement Coverage State
  const [coveragePrdText, setCoveragePrdText] = useState(
    `1. Users can authenticate using Email + Password or Google SSO.
2. If multi-factor authentication (MFA) is enrolled, prompt for 6-digit TOTP code.
3. System must lock account for 15 minutes after 5 consecutive failed login attempts.
4. Session must expire after 30 minutes of client inactivity.
5. QA Engineers cannot access Organization Billing or Stripe ledger records.`
  );
  const [isAnalyzingCoverage, setIsAnalyzingCoverage] = useState(false);
  const [coverageResult, setCoverageResult] = useState<any>(null);

  // 5. Failed Test Analysis State
  const [failTitle, setFailTitle] = useState(
    'Verify 3DS challenge step-up modal triggers for high-risk transactions'
  );
  const [failStep, setFailStep] = useState('Step 2: Bank challenge modal iframe mount');
  const [failError, setFailError] = useState(
    'SecurityError: Blocked a frame with origin "https://bank-auth.com" from accessing a cross-origin frame.'
  );
  const [failStack, setFailStack] = useState(
    `SecurityError: Blocked a frame with origin "https://bank-auth.com" from accessing a cross-origin frame.
    at ChallengeModal.render (checkout.bundle.js:1420)
    at HTMLIFrameElement.onload (checkout.bundle.js:154)
    at evaluateAutomationStep (playwright-worker.js:88)`
  );
  const [isAnalyzingFailure, setIsAnalyzingFailure] = useState(false);
  const [failureDiagnosis, setFailureDiagnosis] = useState<any>(null);

  // Action: Generate Cases
  const handleGenerateCases = async () => {
    setIsGeneratingCases(true);
    setGeneratedCases([]);
    try {
      const res = await fetch('/api/ai/generate-test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementText,
          projectContext: project.name,
          suiteName: targetSuite,
          coverageLevel: coverageDepth,
        }),
      });
      const data = await res.json();
      if (data.testCases && Array.isArray(data.testCases)) {
        setGeneratedCases(data.testCases);
        setSelectedGenIndices(data.testCases.map((_: any, idx: number) => idx));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingCases(false);
    }
  };

  // Action: Import Selected Cases
  const handleImportSelected = () => {
    const toImport = selectedGenIndices.map((idx) => {
      const c = generatedCases[idx];
      const suiteMatch =
        testSuites.find((s) => s.name.toLowerCase() === (c.suiteName || '').toLowerCase()) ||
        testSuites[0];
      return {
        key: `${project.key}-${Math.floor(200 + Math.random() * 800)}`,
        projectId: project.id,
        suiteId: suiteMatch ? suiteMatch.id : 'suite-1',
        suiteName: suiteMatch ? suiteMatch.name : c.suiteName || 'General',
        title: c.title,
        description: c.description || '',
        type: (c.type || 'functional') as any,
        priority: (c.priority || 'high') as any,
        severity: (c.severity || 'critical') as any,
        layer: (c.layer || 'e2e') as any,
        status: 'actual' as const,
        automationStatus: 'to_be_automated' as const,
        preconditions: c.preconditions || '',
        steps: (c.steps || []).map((s: any, sIdx: number) => ({
          stepNumber: sIdx + 1,
          action: s.action,
          expectedResult: s.expectedResult,
          data: s.data || '',
        })),
        tags: c.tags || ['ai-generated', 'prd-verified'],
        attachments: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    onImportGeneratedCases(toImport);
    alert(`Successfully imported ${toImport.length} test cases into ${project.name} repository!`);
    setGeneratedCases([]);
  };

  // Action: Generate Steps
  const handleGenerateSteps = async () => {
    setIsGeneratingSteps(true);
    try {
      const res = await fetch('/api/ai/generate-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: stepTitle,
          preconditions: stepPreconditions,
        }),
      });
      const data = await res.json();
      if (data.steps) {
        setGeneratedSteps(data.steps);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingSteps(false);
    }
  };

  // Action: Duplicate Scan
  const handleScanDuplicates = async () => {
    setIsScanningDuplicates(true);
    try {
      const res = await fetch('/api/ai/find-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCases,
        }),
      });
      const data = await res.json();
      if (data.duplicates) {
        setDuplicates(data.duplicates);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanningDuplicates(false);
    }
  };

  // Action: Requirement Coverage
  const handleAnalyzeCoverage = async () => {
    setIsAnalyzingCoverage(true);
    try {
      const res = await fetch('/api/ai/coverage-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementsDoc: coveragePrdText,
          testCases,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setCoverageResult(data.analysis);
      } else if (data.coveredRequirements) {
        setCoverageResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingCoverage(false);
    }
  };

  // Action: Failure Analysis
  const handleAnalyzeFailure = async () => {
    setIsAnalyzingFailure(true);
    try {
      const res = await fetch('/api/ai/analyze-failed-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testTitle: failTitle,
          stepFailed: failStep,
          errorMessage: failError,
          stackTrace: failStack,
          environment: 'Staging Chrome Headless',
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setFailureDiagnosis(data.analysis);
      } else if (data.rootCause) {
        setFailureDiagnosis(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingFailure(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-amber-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI Quality Studio Powered by Gemini 3.8 Flash
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AI-Powered QA Acceleration Hub
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-3xl leading-relaxed">
            Eliminate repetitive test authoring, detect duplicate assertions, audit PRD acceptance
            criteria coverage, and automatically diagnose flaky test run failures.
          </p>
        </div>
      </div>

      {/* Feature Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('generate')}
          className={`py-2.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeTab === 'generate'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Requirements to Test Cases
        </button>
        <button
          onClick={() => setActiveTab('steps')}
          className={`py-2.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeTab === 'steps'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Step &amp; Assert Generator
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`py-2.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeTab === 'duplicates'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          3. Duplicate Test Detector
        </button>
        <button
          onClick={() => setActiveTab('coverage')}
          className={`py-2.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeTab === 'coverage'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          4. Coverage &amp; Blindspot Matrix
        </button>
        <button
          onClick={() => setActiveTab('failure')}
          className={`py-2.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
            activeTab === 'failure'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          5. Failure &amp; Flakiness Diagnoser
        </button>
      </div>

      {/* TAB 1: GENERATE TEST CASES FROM REQUIREMENTS */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
            <div>
              <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                Raw Requirement / User Story
              </label>
              <textarea
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                rows={6}
                placeholder="Paste Jira user story, PRD acceptance criteria, or product spec..."
                className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200 leading-relaxed font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Target Suite
                </label>
                <select
                  value={targetSuite}
                  onChange={(e) => setTargetSuite(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                >
                  {testSuites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Coverage Scope
                </label>
                <select
                  value={coverageDepth}
                  onChange={(e) => setCoverageDepth(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                >
                  <option value="comprehensive">Comprehensive (Happy + Edge + Boundary)</option>
                  <option value="smoke">Smoke Path Only</option>
                  <option value="security">Security &amp; Abuse Cases</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateCases}
              disabled={isGeneratingCases || !requirementText.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingCases
                ? 'Generating Test Suite with AI...'
                : 'Generate Structured Test Cases'}
            </button>
          </div>

          {/* Generated Cases Preview Panel */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Generated Test Cases ({generatedCases.length})
                </h3>
              </div>
              {generatedCases.length > 0 && (
                <button
                  onClick={handleImportSelected}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Import ({selectedGenIndices.length}) to Repository
                </button>
              )}
            </div>

            {generatedCases.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs space-y-2">
                <Cpu className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No test cases generated yet
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  Paste a requirement on the left and click Generate to see structured positive,
                  negative, and edge test scenarios.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {generatedCases.map((c, idx) => {
                  const isChecked = selectedGenIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                        isChecked
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedGenIndices(selectedGenIndices.filter((i) => i !== idx));
                              } else {
                                setSelectedGenIndices([...selectedGenIndices, idx]);
                              }
                            }}
                            className="mt-0.5 rounded text-indigo-600"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {c.title}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                              {c.description}
                            </div>
                          </div>
                        </label>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {c.layer || 'e2e'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                            {c.severity || 'critical'}
                          </span>
                        </div>
                      </div>

                      {/* Steps breakdown */}
                      {c.steps && c.steps.length > 0 && (
                        <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase tracking-wider">
                            Steps ({c.steps.length})
                          </span>
                          {c.steps.map((st: any, sIdx: number) => (
                            <div key={sIdx} className="flex items-start gap-2">
                              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                {sIdx + 1}.
                              </span>
                              <div className="text-slate-700 dark:text-slate-300">
                                <span>{st.action}</span> &rarr;{' '}
                                <strong className="text-emerald-700 dark:text-emerald-400">
                                  {st.expectedResult}
                                </strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STEP & ASSERT GENERATOR */}
      {activeTab === 'steps' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Generate Granular Steps &amp; Expected Results
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Transform high-level test titles into deterministic, step-by-step verification flows.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Test Title / Objective *
            </label>
            <input
              type="text"
              value={stepTitle}
              onChange={(e) => setStepTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Preconditions
            </label>
            <input
              type="text"
              value={stepPreconditions}
              onChange={(e) => setStepPreconditions(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerateSteps}
            disabled={isGeneratingSteps || !stepTitle.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isGeneratingSteps ? 'Generating Action Steps...' : 'Generate Steps & Assertions'}
          </button>

          {generatedSteps.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Generated Steps Output:
              </h3>
              <div className="space-y-2">
                {generatedSteps.map((st, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {st.action}
                      </span>
                    </div>
                    {st.data && (
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-1 rounded border border-slate-100 dark:border-slate-700">
                        Payload: {st.data}
                      </div>
                    )}
                    <div className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded text-[11px] border border-emerald-100 dark:border-emerald-800">
                      <strong>Expected Result:</strong> {st.expectedResult}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DUPLICATE DETECTION */}
      {activeTab === 'duplicates' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Semantic Duplicate &amp; Redundancy Scanner
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Scans all {testCases.length} test cases in this repository to find overlapping
                validations and bloat.
              </p>
            </div>
            <button
              onClick={handleScanDuplicates}
              disabled={isScanningDuplicates}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {isScanningDuplicates ? 'Analyzing Repository...' : 'Scan Repository for Duplicates'}
            </button>
          </div>

          {duplicates.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
              <FileCheck2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                No duplicate scan performed yet
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Click "Scan Repository" above to evaluate test case semantics.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicates.map((dup, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                      Duplicate Match #{i + 1}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-full">
                      {dup.similarityScore}% Similarity
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Primary Case
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                        {dup.primaryCaseTitle}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Overlapping Case
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                        {dup.duplicateCaseTitle}
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    <strong>Overlap Rationale:</strong> {dup.reason}
                  </p>
                  <p className="text-indigo-800 dark:text-indigo-300 font-medium text-xs">
                    <strong>Recommendation:</strong> {dup.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REQUIREMENT COVERAGE MATRIX */}
      {activeTab === 'coverage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 text-xs">
            <div>
              <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">
                PRD Requirements / Acceptance Criteria
              </label>
              <textarea
                value={coveragePrdText}
                onChange={(e) => setCoveragePrdText(e.target.value)}
                rows={8}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 leading-relaxed font-sans"
              />
            </div>
            <button
              onClick={handleAnalyzeCoverage}
              disabled={isAnalyzingCoverage || !coveragePrdText.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzingCoverage
                ? 'Evaluating Coverage Matrix...'
                : 'Audit Requirements Coverage'}
            </button>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Coverage Analysis &amp; Untested Gaps
            </h3>
            {coverageResult ? (
              <div className="space-y-4 text-xs">
                {/* Score Banner */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {coverageResult.coveragePercentage}%
                    </div>
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-200 font-medium">
                      Requirements Verified by Current Tests
                    </div>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>

                {/* Covered items */}
                {coverageResult.coveredRequirements && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
                      Mapped Requirements
                    </span>
                    {coverageResult.coveredRequirements.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {item.req}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.testIds && (
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {item.testIds.join(', ')}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gaps */}
                {coverageResult.uncoveredGaps && coverageResult.uncoveredGaps.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-bold text-rose-700 dark:text-rose-400 text-[11px] uppercase tracking-wider block">
                      Untested Blindspots &amp; Risk Gaps ({coverageResult.uncoveredGaps.length})
                    </span>
                    <ul className="space-y-1.5">
                      {coverageResult.uncoveredGaps.map((gap: string, i: number) => (
                        <li
                          key={i}
                          className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 rounded-lg flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
                Click "Audit Requirements Coverage" to map user stories against active test cases.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FAILURE & FLAKINESS DIAGNOSER */}
      {activeTab === 'failure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Failed Test Title
              </label>
              <input
                type="text"
                value={failTitle}
                onChange={(e) => setFailTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Failed Step / Assertion
              </label>
              <input
                type="text"
                value={failStep}
                onChange={(e) => setFailStep(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Error Message &amp; Stack Trace
              </label>
              <textarea
                value={failStack}
                onChange={(e) => setFailStack(e.target.value)}
                rows={6}
                className="w-full p-2.5 font-mono text-[11px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>
            <button
              onClick={handleAnalyzeFailure}
              disabled={isAnalyzingFailure}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Terminal className="w-4 h-4" />
              {isAnalyzingFailure ? 'Diagnosing Stack Trace...' : 'Diagnose Root Cause & Flakiness'}
            </button>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Diagnostic Report &amp; Auto-Bug Draft
            </h3>
            {failureDiagnosis ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-purple-900 dark:text-purple-200 uppercase">
                      Category: {failureDiagnosis.category}
                    </span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      Confidence: {failureDiagnosis.confidence}%
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {failureDiagnosis.rootCause}
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {failureDiagnosis.explanation}
                  </p>
                </div>

                {failureDiagnosis.remediationSteps && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
                      Recommended Engineering Remediation
                    </span>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-800 dark:text-slate-200">
                      {failureDiagnosis.remediationSteps.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {failureDiagnosis.suggestedBugDraft && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                      Auto-Generated Bug Draft
                    </span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {failureDiagnosis.suggestedBugDraft.title}
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded uppercase">
                        {failureDiagnosis.suggestedBugDraft.severity}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded uppercase">
                        {failureDiagnosis.suggestedBugDraft.priority}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
                Paste error logs on the left and click Diagnose to receive automated root-cause
                analysis.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
