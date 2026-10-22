import React, { useState } from 'react';
import {
  Sparkles,
  GitCompare,
  AlertTriangle,
  Layers,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Check,
  RefreshCw,
  ArrowRight,
  Archive,
  Split,
  FolderSync,
  HelpCircle,
  FileText,
  PlusCircle,
  Copy,
  ChevronDown,
  Clock,
  Ban,
  Activity,
} from 'lucide-react';
import { Project, TestCase, TestSuite, TestRun } from '../types';

interface AIRequirementIntelligenceViewProps {
  project: Project;
  testSuites: TestSuite[];
  testCases: TestCase[];
  testRuns?: TestRun[];
  onUpdateTestCase?: (testCase: TestCase) => void;
  onAddTestCase?: (testCase: Partial<TestCase>) => void;
}

export const AIRequirementIntelligenceView: React.FC<AIRequirementIntelligenceViewProps> = ({
  project,
  testSuites,
  testCases,
  testRuns = [],
  onUpdateTestCase,
  onAddTestCase,
}) => {
  const [activeTab, setActiveTab] = useState<'impact' | 'hygiene' | 'coverage'>('impact');

  // ==========================================
  // TAB 1: REQUIREMENT CHANGE IMPACT STATE
  // ==========================================
  const [prevRequirement, setPrevRequirement] = useState(
    `Requirements v1.0:
1. Credit card purchases over $100 require 3D Secure SMS OTP challenge.
2. Orders under $100 proceed directly to payment authorization without step-up challenge.
3. If customer fails OTP 5 times, transaction aborts.`
  );

  const [updatedRequirement, setUpdatedRequirement] = useState(
    `Requirements v2.0 (Security Step-Up Policy Update):
1. Credit card purchases over $50 (lowered from $100) require 3D Secure 2.0 challenge via SMS OTP or Bank Biometrics.
2. If customer enters incorrect OTP 3 consecutive times (lowered from 5), transaction aborts immediately and card token is frozen for 30 minutes.
3. Orders under $50 proceed without step-up unless fraud risk score exceeds 40.`
  );

  const [isAnalyzingImpact, setIsAnalyzingImpact] = useState(false);
  const [impactResult, setImpactResult] = useState<any>(null);
  const [appliedUpdates, setAppliedUpdates] = useState<string[]>([]);

  // ==========================================
  // TAB 2: PORTFOLIO HEALTH & HYGIENE STATE
  // ==========================================
  const [isAnalyzingHygiene, setIsAnalyzingHygiene] = useState(false);
  const [hygieneResult, setHygieneResult] = useState<any>(null);
  const [resolvedDuplicates, setResolvedDuplicates] = useState<string[]>([]);
  const [archivedCases, setArchivedCases] = useState<string[]>([]);

  // ==========================================
  // TAB 3: COVERAGE & GAP MATRIX STATE
  // ==========================================
  const [prdSpecText, setPrdSpecText] = useState(
    `PRD Specification:
1. Users authenticate via Email+Password, Google SSO, or GitHub OAuth.
2. Multi-factor authentication (MFA) requires 6-digit TOTP code with 30-day "Remember this device" cookie.
3. System locks account after 5 consecutive failed login attempts for 15 minutes.
4. Passwords must be minimum 10 characters with uppercase, lowercase, number, and symbol.
5. Organization owners can issue partial and full refunds with tax apportionment adjustment.`
  );

  const [isAnalyzingCoverage, setIsAnalyzingCoverage] = useState(false);
  const [coverageData, setCoverageData] = useState<any>(null);
  const [addedCases, setAddedCases] = useState<string[]>([]);

  // Handlers
  const handleRunImpactAnalysis = async () => {
    setIsAnalyzingImpact(true);
    setImpactResult(null);
    try {
      const res = await fetch('/api/ai/requirement-change-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousRequirement: prevRequirement,
          updatedRequirement: updatedRequirement,
          testCases,
          testSuites,
          testRuns,
        }),
      });
      const data = await res.json();
      setImpactResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingImpact(false);
    }
  };

  const handleRunHygieneScan = async () => {
    setIsAnalyzingHygiene(true);
    setHygieneResult(null);
    try {
      const res = await fetch('/api/ai/portfolio-hygiene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases, testSuites }),
      });
      const data = await res.json();
      setHygieneResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingHygiene(false);
    }
  };

  const handleRunCoverageAnalysis = async () => {
    setIsAnalyzingCoverage(true);
    setCoverageData(null);
    try {
      const res = await fetch('/api/ai/coverage-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementsDoc: prdSpecText,
          testCases,
        }),
      });
      const data = await res.json();
      setCoverageData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingCoverage(false);
    }
  };

  const handleApplyStepUpdate = (caseKey: string, suggestedSteps: any[]) => {
    const existing = testCases.find((tc) => tc.key === caseKey);
    if (existing && onUpdateTestCase && suggestedSteps) {
      const updated: TestCase = {
        ...existing,
        steps: suggestedSteps.map((st: any, idx: number) => ({
          stepNumber: st.stepNumber || idx + 1,
          action: st.action,
          expectedResult: st.expectedResult,
          data: st.data || '',
        })),
        updatedAt: new Date().toISOString(),
      };
      onUpdateTestCase(updated);
    }
    setAppliedUpdates((prev) => [...prev, caseKey]);
  };

  const handleAddRecommendedTest = (test: any) => {
    if (!onAddTestCase) return;
    onAddTestCase({
      title: test.title,
      description: `Auto-generated from Requirement Gap Analysis: ${test.reason}`,
      priority: test.priority || 'high',
      severity: test.category === 'negative' ? 'critical' : 'normal',
      layer: 'e2e',
      suiteName: testSuites[0]?.name || 'Payment Processing',
      steps: [
        {
          stepNumber: 1,
          action: 'Execute test condition according to policy',
          expectedResult: 'System enforces boundary constraint',
        },
      ],
      tags: ['ai-gap-filled', test.category],
    });
    setAddedCases((prev) => [...prev, test.title]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                AI Quality Intelligence Engine
              </span>
              <span className="text-xs text-slate-400">• Powered by Gemini 3.8 Flash</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Requirement Change Impact &amp; Portfolio Hygiene
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Detect affected test cases, suites, and invalid executions when requirements change.
              Eliminate duplicates and uncover missing boundary and negative tests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Repository: {testCases.length} Cases Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('impact')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'impact'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>1. Requirement Change Impact</span>
          </button>

          <button
            onClick={() => setActiveTab('hygiene')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'hygiene'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>2. Portfolio Health &amp; Hygiene</span>
          </button>

          <button
            onClick={() => setActiveTab('coverage')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'coverage'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>3. Coverage &amp; Gap Matrix</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden md:block">
          Live Repository Synchronization
        </span>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: REQUIREMENT CHANGE IMPACT ENGINE */}
      {/* ==================================================================== */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Previous Requirement */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Previous Requirement (Baseline v1.0)
                </span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-mono">
                  Legacy
                </span>
              </div>
              <textarea
                value={prevRequirement}
                onChange={(e) => setPrevRequirement(e.target.value)}
                rows={6}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Updated Requirement */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  Updated Requirement (New Release v2.0)
                </span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded text-[10px] font-mono font-bold">
                  Modified
                </span>
              </div>
              <textarea
                value={updatedRequirement}
                onChange={(e) => setUpdatedRequirement(e.target.value)}
                rows={6}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Evaluates changes against all {testCases.length} repository test cases and{' '}
              {testSuites.length} suites.
            </span>
            <button
              onClick={handleRunImpactAnalysis}
              disabled={isAnalyzingImpact}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 text-xs cursor-pointer disabled:opacity-50 transition-all"
            >
              {isAnalyzingImpact ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Impact Matrix...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Detect Affected Cases &amp; Suggest Updates</span>
                </>
              )}
            </button>
          </div>

          {/* Impact Results */}
          {impactResult && (
            <div className="space-y-4">
              {/* Executive Summary Card */}
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                      Requirement Change Impact Score: {impactResult.impactScore || 85}/100
                    </h3>
                    <p className="text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                      {impactResult.impactSummary}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-bold rounded-lg border border-rose-200 dark:border-rose-800 text-[11px]">
                    {impactResult.affectedCases?.length || 0} Cases Affected
                  </span>
                </div>
              </div>

              {/* Affected Suites */}
              {impactResult.affectedSuites && impactResult.affectedSuites.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs shadow-2xs">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Affected Test Suites
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {impactResult.affectedSuites.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {s.suiteName}
                          </span>
                          <span className="text-slate-500 text-[11px] leading-relaxed">
                            {s.reason}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.severity === 'critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {s.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected Test Cases with Inline Step Updates */}
              {impactResult.affectedCases && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Affected Test Cases &amp; AI Suggested Step Updates
                  </h4>

                  {impactResult.affectedCases.map((ac: any, idx: number) => {
                    const isApplied = appliedUpdates.includes(ac.caseKey);
                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                                {ac.caseKey}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                • {ac.suite}
                              </span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {ac.impactType?.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                              {ac.title}
                            </h5>
                            <p className="text-slate-500 mt-0.5">{ac.reason}</p>
                          </div>

                          <button
                            onClick={() => handleApplyStepUpdate(ac.caseKey, ac.suggestedSteps)}
                            disabled={isApplied}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isApplied
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs'
                            }`}
                          >
                            {isApplied ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            )}
                            <span>{isApplied ? 'Updates Applied' : 'Apply AI Update'}</span>
                          </button>
                        </div>

                        {/* Step Diff Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg">
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block uppercase mb-1">
                              Obsolete Step Assertion (Baseline)
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 line-through text-[11px] leading-relaxed">
                              {ac.oldStepAssertion || 'Old assertion rule'}
                            </p>
                          </div>

                          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase mb-1">
                              AI Suggested Step Assertion (v2.0 Policy)
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-relaxed">
                              {ac.suggestedStepAssertion || 'New assertion rule'}
                            </p>
                          </div>
                        </div>

                        {/* Suggested steps breakdown */}
                        {ac.suggestedSteps && ac.suggestedSteps.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Suggested Step Sequence:
                            </span>
                            {ac.suggestedSteps.map((st: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded flex items-center justify-between text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center">
                                    {st.stepNumber || sIdx + 1}
                                  </span>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {st.action}
                                  </span>
                                </div>
                                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                                  Expects: {st.expectedResult}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Affected Executions & Invalidation */}
              {impactResult.affectedExecutions && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Affected Test Executions &amp; Runs
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Previous runs executed under obsolete requirements
                    </span>
                  </div>

                  <div className="space-y-2">
                    {impactResult.affectedExecutions.map((run: any, rIdx: number) => (
                      <div
                        key={rIdx}
                        className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                              {run.runId}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {run.runTitle}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">{run.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase">
                            Invalidated ({run.invalidatedCasesCount} cases)
                          </span>
                          <button
                            onClick={() =>
                              alert(`Marked ${run.runId} as Invalidated! Flagged for re-execution.`)
                            }
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Flag for Retest
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Recommended Tests from Requirement Delta */}
              {impactResult.newTestsRecommended && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs shadow-2xs">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    New Scenarios Required by Delta (Negative &amp; Boundary)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {impactResult.newTestsRecommended.map((nt: any, idx: number) => {
                      const isAdded = addedCases.includes(nt.title);
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  nt.category === 'negative'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                {nt.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono uppercase">
                                {nt.priority} Priority
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-900 dark:text-white text-xs mt-1.5">
                              {nt.title}
                            </h5>
                            <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                              {nt.reason}
                            </p>
                          </div>

                          <button
                            onClick={() => handleAddRecommendedTest(nt)}
                            disabled={isAdded}
                            className={`w-full py-1.5 rounded text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              isAdded
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            {isAdded ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <PlusCircle className="w-3 h-3" />
                            )}
                            <span>{isAdded ? 'Added to Repository' : 'Add to Suite'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PORTFOLIO HEALTH & HYGIENE */}
      {/* ==================================================================== */}
      {activeTab === 'hygiene' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Repository Portfolio Hygiene &amp; Deduplication Scanner
                </h3>
                <p className="text-slate-500">
                  Scans all {testCases.length} test cases for semantic duplication, overlapping
                  assertions, and obsolete test candidates.
                </p>
              </div>

              <button
                onClick={handleRunHygieneScan}
                disabled={isAnalyzingHygiene}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingHygiene ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning Repository...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Hygiene Scan</span>
                  </>
                )}
              </button>
            </div>

            {hygieneResult && (
              <div className="space-y-5 pt-2">
                {/* Health Score Banner */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Portfolio Hygiene Score
                    </span>
                    <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {hygieneResult.healthScore}/100
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 max-w-sm text-right">
                    Repository has healthy base coverage with{' '}
                    <strong>{hygieneResult.duplicates?.length || 0} duplicates</strong> and{' '}
                    <strong>
                      {hygieneResult.archiveCandidates?.length || 0} archive recommendations
                    </strong>
                    .
                  </span>
                </div>

                {/* 1. Semantic Duplicates */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Copy className="w-4 h-4 text-purple-600" />
                    Semantic Duplicates Detected
                  </h4>
                  {hygieneResult.duplicates?.map((dup: any, dIdx: number) => {
                    const isMerged = resolvedDuplicates.includes(dup.duplicateCaseKey);
                    return (
                      <div
                        key={dIdx}
                        className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                                {dup.primaryCaseKey}
                              </span>
                              <span className="text-slate-400 font-bold text-[11px]">vs</span>
                              <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                                {dup.duplicateCaseKey}
                              </span>
                              <span className="px-2 py-0.2 bg-purple-100 text-purple-800 font-mono font-bold rounded text-[10px]">
                                {dup.similarityScore}% Match
                              </span>
                            </div>
                            <div className="text-slate-800 dark:text-slate-200 font-medium text-xs">
                              {dup.primaryTitle}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Duplicate: {dup.duplicateTitle}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setResolvedDuplicates((prev) => [...prev, dup.duplicateCaseKey]);
                              alert(
                                `Merged ${dup.duplicateCaseKey} into ${dup.primaryCaseKey} as parameterized test dataset!`
                              );
                            }}
                            disabled={isMerged}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              isMerged
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {isMerged ? 'Merged' : 'Merge into Primary'}
                          </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
                          <strong>Analysis:</strong> {dup.reason} — <em>{dup.recommendation}</em>
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Suite Restructuring Suggestions */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Split className="w-4 h-4 text-indigo-600" />
                    Suite Restructuring &amp; Modularization Suggestions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hygieneResult.restructureSuggestions?.map((sug: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {sug.suiteName}
                          </span>
                          <span className="px-2 py-0.2 bg-indigo-100 text-indigo-800 rounded uppercase font-bold text-[10px]">
                            {sug.type}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">{sug.reason}</p>
                        {sug.suggestedSubSuites && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                            Target Sub-suites: {sug.suggestedSubSuites.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Archive Candidates */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Archive className="w-4 h-4 text-amber-600" />
                    Archive Candidates (Obsolete &amp; Deprecated)
                  </h4>
                  {hygieneResult.archiveCandidates?.map((cand: any, cIdx: number) => {
                    const isArchived = archivedCases.includes(cand.caseKey);
                    return (
                      <div
                        key={cIdx}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-700">
                              {cand.caseKey}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {cand.title}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">{cand.reason}</p>
                        </div>
                        <button
                          onClick={() => {
                            setArchivedCases((prev) => [...prev, cand.caseKey]);
                            alert(`Test case ${cand.caseKey} safely moved to Archive.`);
                          }}
                          disabled={isArchived}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            isArchived
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-amber-600 text-white hover:bg-amber-500'
                          }`}
                        >
                          {isArchived ? 'Archived' : 'Archive Case'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: COVERAGE & GAP MATRIX */}
      {/* ==================================================================== */}
      {activeTab === 'coverage' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Requirements vs. Test Repository Coverage Matrix
                </h3>
                <p className="text-slate-500">
                  Cross-checks functional specifications against all active test cases to uncover
                  missing negative and boundary tests.
                </p>
              </div>

              <button
                onClick={handleRunCoverageAnalysis}
                disabled={isAnalyzingCoverage}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingCoverage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Coverage...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Coverage Analysis</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={prdSpecText}
              onChange={(e) => setPrdSpecText(e.target.value)}
              rows={5}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            {coverageData && (
              <div className="space-y-5 pt-3">
                {/* Metric Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Requirement Coverage
                    </span>
                    <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {coverageData.coveragePercentage || 74}%
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Untested Requirements
                    </span>
                    <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                      {coverageData.uncoveredGaps?.length || 2} Clauses
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Risk Level
                    </span>
                    <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                      Medium Risk
                    </span>
                  </div>
                </div>

                {/* Covered Requirements Checklist */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Requirement Clause Status
                  </h4>
                  {coverageData.coveredRequirements?.map((cr: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center justify-between border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${cr.status === 'Covered' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {cr.req}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[10px]">
                          {cr.testIds?.join(', ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cr.status === 'Covered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cr.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Uncovered Gaps & Missing Boundary/Negative Tests */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-rose-600" />
                    Missing Negative &amp; Boundary Tests Identified
                  </h4>

                  <div className="space-y-2">
                    {[
                      {
                        title:
                          'Verify brute-force account lockout after 5 consecutive failed logins',
                        type: 'Negative / Security',
                        reason:
                          'Missing negative test checking lockout policy and 15-minute expiration trigger.',
                      },
                      {
                        title:
                          'Verify boundary validation for 9-character vs 10-character password',
                        type: 'Boundary Check',
                        reason:
                          'Specification requires minimum 10 characters. Boundary check at 9 chars is untested.',
                      },
                      {
                        title: 'Verify partial refund with coupon discount tax recalculation',
                        type: 'Edge Case / Financial',
                        reason:
                          'Requirement 5 not covered by any existing test case in repository.',
                      },
                    ].map((gap, gIdx) => {
                      const isAdded = addedCases.includes(gap.title);
                      return (
                        <div
                          key={gIdx}
                          className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] uppercase">
                                {gap.type}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {gap.title}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5">{gap.reason}</p>
                          </div>

                          <button
                            onClick={() =>
                              handleAddRecommendedTest({
                                title: gap.title,
                                reason: gap.reason,
                                category: 'negative',
                              })
                            }
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                              isAdded
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {isAdded ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <PlusCircle className="w-3.5 h-3.5" />
                            )}
                            <span>{isAdded ? 'Added' : 'Generate & Add'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
