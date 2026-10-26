import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Ban,
  FastForward,
  Clock,
  Bug,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  FileDown,
  MessageSquare,
  Check,
  Camera,
  Trash2,
  Edit2,
  Eye,
  Download,
  Plus,
} from 'lucide-react';
import {
  TestRun,
  TestCase,
  TestExecution,
  ExecutionStatus,
  Defect,
  Project,
  Attachment,
  User,
  TestSeverity,
} from '../types';
import { exportTestRunAsPdf } from '../utils/exportUtils';

interface LiveTestRunnerModalProps {
  run: TestRun;
  testCases: TestCase[];
  onClose: () => void;
  onUpdateExecution: (runId: string, execution: TestExecution) => void;
  onFileDefect: (defect: Partial<Defect>) => void;
  onCompleteRun: (runId: string) => void;
  project?: Project;
  currentUser?: User;
  defects?: Defect[];
}

export const LiveTestRunnerModal: React.FC<LiveTestRunnerModalProps> = ({
  run,
  testCases,
  onClose,
  onUpdateExecution,
  onFileDefect,
  onCompleteRun,
  project,
  currentUser,
  defects,
}) => {
  // Sort executions in true repository tree order (from first case to last case)
  const sortedExecutions = useMemo(() => {
    return [...run.executions].sort((a, b) => {
      const idxA = testCases.findIndex((tc) => tc.id === a.testCaseId);
      const idxB = testCases.findIndex((tc) => tc.id === b.testCaseId);
      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB;
      }
      const matchA =
        a.testCaseTitle?.match(/(?:TC|tc)[-_#\s]*(\d+)/i) || a.testCaseKey?.match(/\d+$/);
      const matchB =
        b.testCaseTitle?.match(/(?:TC|tc)[-_#\s]*(\d+)/i) || b.testCaseKey?.match(/\d+$/);
      if (matchA && matchB) {
        const numA = parseInt(matchA[0].match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(matchB[0].match(/\d+/)?.[0] || '0', 10);
        if (numA !== numB) return numA - numB;
      }
      return a.testCaseKey.localeCompare(b.testCaseKey, undefined, { numeric: true });
    });
  }, [run.executions, testCases]);

  // Find current execution index or default to first
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeExecution = sortedExecutions[selectedIndex] || sortedExecutions[0];
  const activeCase = testCases.find((tc) => tc.id === activeExecution?.testCaseId);

  const passedCount = useMemo(
    () => sortedExecutions.filter((e) => e.status === 'passed').length,
    [sortedExecutions]
  );
  const failedCount = useMemo(
    () => sortedExecutions.filter((e) => e.status === 'failed').length,
    [sortedExecutions]
  );

  // Active step comments state (stepNumber -> boolean open, stepNumber -> draft text)
  const [stepCommentsOpen, setStepCommentsOpen] = useState<Record<number, boolean>>({});
  const [stepCommentDraft, setStepCommentDraft] = useState<Record<number, string>>({});
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  // Active Timer Persistence Key
  const getTimerKey = (testCaseId?: string) => {
    return `qasgard_run_timer_${run.id}_${testCaseId || activeExecution?.testCaseId || 'default'}`;
  };

  // Active Timer (persisted across modal closes until Pass/Fail/Block or Complete Run)
  const [seconds, setSeconds] = useState<number>(() => {
    if (!activeExecution) return 0;
    if (['passed', 'failed', 'blocked'].includes(activeExecution.status)) {
      return activeExecution.durationSeconds || 0;
    }
    try {
      const saved = localStorage.getItem(`qasgard_run_timer_${run.id}_${activeExecution.testCaseId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.seconds === 'number') {
          return parsed.seconds;
        }
      }
    } catch {}
    return activeExecution.durationSeconds || 0;
  });

  const [timerRunning, setTimerRunning] = useState<boolean>(() => {
    if (!activeExecution) return true;
    if (['passed', 'failed', 'blocked'].includes(activeExecution.status)) {
      return false;
    }
    try {
      const saved = localStorage.getItem(`qasgard_run_timer_${run.id}_${activeExecution.testCaseId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isRunning === 'boolean') {
          return parsed.isRunning;
        }
      }
    } catch {}
    return true;
  });

  // Execution notes & failure reasons
  const [failureReason, setFailureReason] = useState(activeExecution?.failureReason || '');
  const [stackTrace, setStackTrace] = useState(activeExecution?.stackTrace || '');
  const [showFileDefectModal, setShowFileDefectModal] = useState(false);
  const [failedStepIndex, setFailedStepIndex] = useState<number | null>(null);
  const [filedDefectsByCaseId, setFiledDefectsByCaseId] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Dedicated Defect Filing Modal State
  const [defectTargetStep, setDefectTargetStep] = useState<number>(1);
  const [defectKeyDraft, setDefectKeyDraft] = useState('');
  const [defectTitle, setDefectTitle] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [defectSeverity, setDefectSeverity] = useState<TestSeverity>('critical');
  const [defectAssignee, setDefectAssignee] = useState(currentUser?.name || 'Current User');
  const [defectReproSteps, setDefectReproSteps] = useState('');
  const [defectAttachments, setDefectAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (currentUser?.name) {
      setDefectAssignee(currentUser.name);
    }
  }, [currentUser]);

  // AI Failure Diagnosis State
  const [aiDiagnosing, setAiDiagnosing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds((prev: number) => {
          const next = prev + 1;
          if (activeExecution && !['passed', 'failed', 'blocked'].includes(activeExecution.status)) {
            try {
              localStorage.setItem(
                getTimerKey(activeExecution.testCaseId),
                JSON.stringify({ seconds: next, isRunning: true, updatedAt: Date.now() })
              );
            } catch {}
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeExecution?.testCaseId, run.id]);

  // Sync state when switching cases (restore persisted timer or case duration)
  useEffect(() => {
    if (activeExecution) {
      setFailureReason(activeExecution.failureReason || '');
      setStackTrace(activeExecution.stackTrace || '');
      setAiDiagnosis(null);

      if (['passed', 'failed', 'blocked'].includes(activeExecution.status)) {
        setSeconds(activeExecution.durationSeconds || 0);
        setTimerRunning(false);
        try {
          localStorage.removeItem(getTimerKey(activeExecution.testCaseId));
        } catch {}
      } else {
        try {
          const saved = localStorage.getItem(getTimerKey(activeExecution.testCaseId));
          if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed.seconds === 'number') {
              setSeconds(parsed.seconds);
              setTimerRunning(typeof parsed.isRunning === 'boolean' ? parsed.isRunning : false);
              return;
            }
          }
        } catch {}
        setSeconds(activeExecution.durationSeconds || 0);
        setTimerRunning(true);
      }
    }
  }, [selectedIndex, activeExecution?.testCaseId]);

  const handleToggleTimer = () => {
    const nextRunning = !timerRunning;
    setTimerRunning(nextRunning);
    if (activeExecution && !['passed', 'failed', 'blocked'].includes(activeExecution.status)) {
      try {
        localStorage.setItem(
          getTimerKey(activeExecution.testCaseId),
          JSON.stringify({ seconds, isRunning: nextRunning, updatedAt: Date.now() })
        );
      } catch {}
    }
  };

  const handleResetTimer = () => {
    setSeconds(0);
    if (activeExecution) {
      try {
        localStorage.removeItem(getTimerKey(activeExecution.testCaseId));
      } catch {}
    }
  };

  const handleSafeClose = () => {
    if (activeExecution && !['passed', 'failed', 'blocked'].includes(activeExecution.status)) {
      try {
        localStorage.setItem(
          getTimerKey(activeExecution.testCaseId),
          JSON.stringify({ seconds, isRunning: timerRunning, updatedAt: Date.now() })
        );
      } catch {}
    }
    onClose();
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStepStatus = (stepNumber: number, status: ExecutionStatus) => {
    if (!activeExecution) return;
    const existingStepResults = activeExecution.stepResults || [];
    const updatedStepResults = [...existingStepResults];
    const index = updatedStepResults.findIndex((s) => s.stepNumber === stepNumber);

    if (index >= 0) {
      updatedStepResults[index] = { ...updatedStepResults[index], status };
    } else {
      updatedStepResults.push({ stepNumber, status });
    }

    // Auto calculate case status
    let newCaseStatus: ExecutionStatus = 'passed';
    if (updatedStepResults.some((s) => s.status === 'failed')) {
      newCaseStatus = 'failed';
    } else if (updatedStepResults.some((s) => s.status === 'blocked')) {
      newCaseStatus = 'blocked';
    } else if (updatedStepResults.some((s) => s.status === 'untested')) {
      newCaseStatus = 'untested';
    }

    const updatedExecution: TestExecution = {
      ...activeExecution,
      status: newCaseStatus,
      stepResults: updatedStepResults,
      durationSeconds: activeExecution.durationSeconds + seconds,
    };

    onUpdateExecution(run.id, updatedExecution);

    // Auto clear saved timer if case finalized by steps
    if (['passed', 'failed', 'blocked'].includes(newCaseStatus)) {
      try {
        localStorage.removeItem(getTimerKey(activeExecution.testCaseId));
      } catch {}
    }

    if (status === 'failed') {
      setFailedStepIndex(stepNumber);
    }
  };

  const handleCaseStatus = (status: ExecutionStatus) => {
    if (!activeExecution) return;
    const finalSeconds = seconds;
    const updatedExecution: TestExecution = {
      ...activeExecution,
      status,
      durationSeconds: activeExecution.durationSeconds + finalSeconds,
      failureReason: status === 'failed' ? failureReason : '',
      stackTrace: status === 'failed' ? stackTrace : '',
    };
    onUpdateExecution(run.id, updatedExecution);

    // Persisted timer is cleared once status is Pass/Fail/Block
    if (['passed', 'failed', 'blocked'].includes(status)) {
      try {
        localStorage.removeItem(getTimerKey(activeExecution.testCaseId));
      } catch {}
    }

    // If passed or skipped, advance to next test case automatically
    if (status === 'passed' || status === 'skipped') {
      if (selectedIndex < sortedExecutions.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    }
  };

  const handleAIDiagnoseFailure = async () => {
    setAiDiagnosing(true);
    try {
      const res = await fetch('/api/ai/analyze-failed-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testTitle: activeCase?.title,
          stepFailed: failedStepIndex ? `Step ${failedStepIndex}` : 'Step 2: DOM Assertion',
          errorMessage: failureReason || 'AssertionError: Expected element to be visible',
          stackTrace: stackTrace || 'Error: Target closed during network challenge handshake',
          environment: run.environment,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiDiagnosis(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiDiagnosing(false);
    }
  };

  const handleStepComment = (stepNumber: number, comment: string) => {
    if (!activeExecution) return;
    const existingStepResults = activeExecution.stepResults || [];
    const updatedStepResults = [...existingStepResults];
    const index = updatedStepResults.findIndex((s) => s.stepNumber === stepNumber);

    if (index >= 0) {
      updatedStepResults[index] = { ...updatedStepResults[index], comment };
    } else {
      updatedStepResults.push({ stepNumber, status: 'untested', comment });
    }

    const updatedExecution: TestExecution = {
      ...activeExecution,
      stepResults: updatedStepResults,
    };
    onUpdateExecution(run.id, updatedExecution);
  };

  const handleDeleteStepComment = (stepNumber: number) => {
    if (!activeExecution) return;
    const existingStepResults = activeExecution.stepResults || [];
    const updatedStepResults = existingStepResults.map((s) => {
      if (s.stepNumber === stepNumber) {
        const { comment, ...rest } = s;
        return rest;
      }
      return s;
    });

    const updatedExecution: TestExecution = {
      ...activeExecution,
      stepResults: updatedStepResults,
    };
    onUpdateExecution(run.id, updatedExecution);
    setStepCommentDraft((prev) => {
      const copy = { ...prev };
      delete copy[stepNumber];
      return copy;
    });
    setStepCommentsOpen((prev) => ({ ...prev, [stepNumber]: false }));
    setToastMessage(`Step ${stepNumber} comment deleted.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddStepScreenshot = (stepNumber: number, file: File) => {
    if (!activeExecution) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAtt: Attachment = {
        id: `scr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.type || 'image/png',
        url: dataUrl,
        uploadedAt: new Date().toISOString(),
      };

      const existingStepResults = activeExecution.stepResults || [];
      const updatedStepResults = [...existingStepResults];
      const index = updatedStepResults.findIndex((s) => s.stepNumber === stepNumber);

      if (index >= 0) {
        const currentAtts = updatedStepResults[index].attachments || [];
        updatedStepResults[index] = {
          ...updatedStepResults[index],
          attachments: [...currentAtts, newAtt],
        };
      } else {
        updatedStepResults.push({
          stepNumber,
          status: 'untested',
          attachments: [newAtt],
        });
      }

      const updatedExecution: TestExecution = {
        ...activeExecution,
        stepResults: updatedStepResults,
      };
      onUpdateExecution(run.id, updatedExecution);
      setToastMessage(`Screenshot attached to Step ${stepNumber}!`);
      setTimeout(() => setToastMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteStepScreenshot = (stepNumber: number, attId: string) => {
    if (!activeExecution) return;
    const existingStepResults = activeExecution.stepResults || [];
    const updatedStepResults = existingStepResults.map((s) => {
      if (s.stepNumber === stepNumber && s.attachments) {
        return {
          ...s,
          attachments: s.attachments.filter((a) => a.id !== attId),
        };
      }
      return s;
    });

    const updatedExecution: TestExecution = {
      ...activeExecution,
      stepResults: updatedStepResults,
    };
    onUpdateExecution(run.id, updatedExecution);
    setToastMessage(`Screenshot removed.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddDefectAttachment = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const att: Attachment = {
        id: `att-def-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || 'image/png',
        url: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setDefectAttachments((prev) => [...prev, att]);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenDefectModal = (stepNum?: number) => {
    if (!activeCase || !activeExecution) return;
    const targetStep = stepNum ?? failedStepIndex ?? 1;
    const stepObj = activeCase.steps.find((s) => s.stepNumber === targetStep);
    const stepRes = activeExecution.stepResults?.find((s) => s.stepNumber === targetStep);
    const defectNum = Math.floor(100 + Math.random() * 900);
    const key = `DEF-${Date.now().toString().slice(-3)}${defectNum}`;

    setDefectKeyDraft(key);
    setDefectTargetStep(targetStep);
    setDefectTitle(`[Run Failure: ${run.key}] ${activeCase.title} - Step ${targetStep}`);
    setDefectSeverity(activeCase.severity || 'critical');
    setDefectAssignee(currentUser?.name || 'Current User');
    setDefectDescription(
      failureReason ||
        stepRes?.comment ||
        `Step ${targetStep} execution failure: ${stepObj?.action || 'Observed failure'}`
    );
    setDefectReproSteps(
      activeCase.steps
        .map((s) => `${s.stepNumber}. ${s.action} -> Expected: ${s.expectedResult}`)
        .join('\n')
    );
    // Pre-populate with existing step screenshot if available
    setDefectAttachments(stepRes?.attachments ? [...stepRes.attachments] : []);
    setShowFileDefectModal(true);
  };

  const handleSaveDefectModal = () => {
    if (!activeCase || !activeExecution) return;
    const key =
      defectKeyDraft ||
      `DEF-${Date.now().toString().slice(-3)}${Math.floor(100 + Math.random() * 900)}`;
    const targetStep = defectTargetStep ?? 1;

    const fullDefect: Partial<Defect> = {
      key,
      projectId: run.projectId,
      testCaseId: activeCase.id,
      testCaseKey: activeCase.key,
      testCaseTitle: activeCase.title,
      runId: run.id,
      runKey: run.key,
      title: defectTitle || `[Run Failure: ${run.key}] ${activeCase.title} - Step ${targetStep}`,
      description: defectDescription,
      severity: defectSeverity,
      priority: activeCase.priority || 'high',
      status: 'open',
      reporter: currentUser?.name || run.assignedTo || 'Admin',
      assignee: defectAssignee || currentUser?.name || 'Current User',
      reproductionSteps: defectReproSteps.split('\n').filter(Boolean),
      comments: [],
      attachments: defectAttachments,
      createdAt: new Date().toISOString(),
    };
    onFileDefect(fullDefect);

    // Atomically update stepResults with defectKey, attachments, and failed status
    const existingStepResults = activeExecution.stepResults || [];
    const updatedStepResults = [...existingStepResults];
    const index = updatedStepResults.findIndex((s) => s.stepNumber === targetStep);

    // Merge attachments into step
    const existingStepAtts = index >= 0 ? updatedStepResults[index].attachments || [] : [];
    const mergedStepAtts = [...existingStepAtts];
    defectAttachments.forEach((da) => {
      if (!mergedStepAtts.some((ea) => ea.id === da.id || (ea.url && ea.url === da.url))) {
        mergedStepAtts.push(da);
      }
    });

    if (index >= 0) {
      const prevIds =
        updatedStepResults[index].defectIds ||
        (updatedStepResults[index].defectKey ? [updatedStepResults[index].defectKey!] : []);
      updatedStepResults[index] = {
        ...updatedStepResults[index],
        status: 'failed',
        defectKey: key,
        defectIds: Array.from(new Set([...prevIds, key])),
        attachments: mergedStepAtts,
      };
    } else {
      updatedStepResults.push({
        stepNumber: targetStep,
        status: 'failed',
        defectKey: key,
        defectIds: [key],
        attachments: mergedStepAtts,
      });
    }

    const updatedDefectIds = Array.from(new Set([...(activeExecution.defectIds || []), key]));
    const updatedExecution: TestExecution = {
      ...activeExecution,
      status: 'failed',
      failureReason: defectDescription || failureReason || `Execution failed at step ${targetStep}`,
      defectIds: updatedDefectIds,
      stepResults: updatedStepResults,
    };
    onUpdateExecution(run.id, updatedExecution);

    setFiledDefectsByCaseId((prev) => ({
      ...prev,
      [activeCase.id]: updatedDefectIds.join(', '),
    }));
    setFailedStepIndex(targetStep);
    setShowFileDefectModal(false);
    setToastMessage(`Defect ${key} logged & linked to Step ${targetStep}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compatibility aliases
  const handleFileDefectForStep = (stepNumber: number) => handleOpenDefectModal(stepNumber);
  const handleQuickFileDefect = (stepNum?: number) => handleOpenDefectModal(stepNum);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in textarea or input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'p' || e.key === 'P') handleCaseStatus('passed');
      if (e.key === 'f' || e.key === 'F') handleCaseStatus('failed');
      if (e.key === 'b' || e.key === 'B') handleCaseStatus('blocked');
      if (e.key === 's' || e.key === 'S') handleCaseStatus('skipped');
      if (e.key === 'ArrowRight' && selectedIndex < run.executions.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, activeExecution, run]);

  const handleExportPdf = () => {
    const proj: Project = project || {
      id: run.projectId,
      name: run.title,
      key: run.key.split('-')[0] || 'RUN',
      description: '',
      organizationId: '',
      caseCount: sortedExecutions.length,
      suiteCount: 1,
      openBugsCount: 0,
      updatedAt: new Date().toISOString(),
    };
    exportTestRunAsPdf(proj, run, testCases, defects);
    setToastMessage('PDF report generated and downloaded!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleComplete = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`qasgard_run_timer_${run.id}`)) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
    onCompleteRun(run.id);
    setIsCompletedModalOpen(true);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSafeClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 relative"
    >
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60 bg-slate-900/95 dark:bg-slate-950 text-white border border-emerald-500/60 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Runner Header */}
        <header className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
              {run.key}
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                {run.title}
                <span className="text-[11px] font-normal text-slate-400">({run.environment})</span>
              </h2>
            </div>
          </div>

          {/* Center: Stopwatch Timer */}
          <div className="flex items-center space-x-2 bg-slate-800/80 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-xs font-bold text-white tracking-widest">
              {formatTimer(seconds)}
            </span>
            <button
              type="button"
              onClick={handleToggleTimer}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              title={timerRunning ? 'Паузирай таймера / Pause timer' : 'Пусни отново / Resume timer'}
            >
              {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={handleResetTimer}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              title="Нулирай таймера / Reset stopwatch"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-500/30 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              title="Export Test Run as PDF Report (Свали PDF отчет)"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Complete Run
            </button>
            <button
              type="button"
              onClick={handleSafeClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Затвори (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Runner Body: Split layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Case Navigator - strictly chronological from first to last */}
          <aside className="w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>Test Queue ({sortedExecutions.length})</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {passedCount}/{sortedExecutions.length} Passed
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sortedExecutions.map((exec, idx) => {
                const isSelected = idx === selectedIndex;
                const hasDefect =
                  filedDefectsByCaseId[exec.testCaseId] ||
                  (exec.defectIds && exec.defectIds.length > 0);
                const defectKey = filedDefectsByCaseId[exec.testCaseId] || exec.defectIds?.[0];
                return (
                  <button
                    key={exec.id}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setSeconds(0);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 shadow-2xs font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2 flex-1 min-w-0">
                      {exec.status === 'passed' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {exec.status === 'failed' && (
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      {exec.status === 'blocked' && (
                        <Ban className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      )}
                      {exec.status === 'skipped' && (
                        <FastForward className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      {exec.status === 'untested' && (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                      )}
                      <div className="truncate flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            {exec.testCaseKey}
                          </span>
                          {hasDefect && (
                            <span className="text-[9px] font-mono font-bold text-rose-500 flex items-center gap-0.5 shrink-0">
                              <Bug className="w-2.5 h-2.5" />
                              {defectKey}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-slate-800 dark:text-slate-200">
                          {exec.testCaseTitle}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
              <div className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Hotkeys
              </div>
              <div className="flex justify-between">
                <span>
                  Pass:{' '}
                  <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                    P
                  </kbd>
                </span>
                <span>
                  Fail:{' '}
                  <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                    F
                  </kbd>
                </span>
                <span>
                  Block:{' '}
                  <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                    B
                  </kbd>
                </span>
                <span>
                  Skip:{' '}
                  <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                    S
                  </kbd>
                </span>
              </div>
            </div>
          </aside>

          {/* Right Execution Main Stage */}
          <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
            {activeCase ? (
              <>
                {/* Case Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {activeCase.key}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {activeCase.suiteName}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 rounded-full">
                        {activeCase.layer}
                      </span>
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeCase.title}
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {activeCase.description}
                    </p>
                  </div>

                  {/* Primary Case Status Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCaseStatus('passed')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeExecution.status === 'passed'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Pass (P)
                    </button>
                    <button
                      onClick={() => handleCaseStatus('failed')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        activeExecution.status === 'failed'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                      }`}
                    >
                      <XCircle className="w-4 h-4" /> Fail (F)
                    </button>
                    <button
                      onClick={() => handleCaseStatus('blocked')}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        activeExecution.status === 'blocked'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" /> Block (B)
                    </button>
                    <button
                      onClick={() => handleCaseStatus('skipped')}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        activeExecution.status === 'skipped'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FastForward className="w-3.5 h-3.5" /> Skip (S)
                    </button>
                  </div>
                </div>

                {/* Preconditions */}
                {activeCase.preconditions && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 p-3 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                    <strong className="block uppercase text-[10px] text-amber-800 dark:text-amber-300 tracking-wider mb-0.5">
                      Preconditions:
                    </strong>
                    {activeCase.preconditions}
                  </div>
                )}

                {/* Steps Interactive Execution */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Execution Steps ({activeCase.steps.length})
                  </h3>

                  <div className="space-y-3">
                    {activeCase.steps.map((step) => {
                      const stepResult = (activeExecution.stepResults || []).find(
                        (s) => s.stepNumber === step.stepNumber
                      );
                      const currentStatus = stepResult?.status || 'untested';

                      return (
                        <div
                          key={step.stepNumber}
                          className={`p-3.5 rounded-xl border transition-all text-xs ${
                            currentStatus === 'passed'
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                              : currentStatus === 'failed'
                                ? 'bg-rose-50/40 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                                : currentStatus === 'blocked'
                                  ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1">
                              <span
                                className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                  currentStatus === 'passed'
                                    ? 'bg-emerald-600 text-white'
                                    : currentStatus === 'failed'
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {step.stepNumber}
                              </span>
                              <div className="space-y-1.5 flex-1">
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>{step.action}</span>
                                  {step.parentStepNumber && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                                      Sub-step of #{step.parentStepNumber}
                                    </span>
                                  )}
                                </div>
                                {step.data && (
                                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                                    Test Data: {step.data}
                                  </div>
                                )}
                                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/50 p-2 rounded border border-emerald-100 dark:border-emerald-900/60">
                                  <strong>Expected:</strong> {step.expectedResult}
                                </div>

                                {/* Saved Step Comment with Edit & Delete */}
                                {stepResult?.comment && (
                                  <div className="text-[11px] bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-2 rounded-lg text-indigo-900 dark:text-indigo-200 flex items-start gap-1.5 mt-1">
                                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="font-bold">Step Note: </span>
                                      <span className="break-words">{stepResult.comment}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setStepCommentDraft((prev) => ({
                                            ...prev,
                                            [step.stepNumber]: stepResult.comment || '',
                                          }));
                                          setStepCommentsOpen((prev) => ({
                                            ...prev,
                                            [step.stepNumber]: true,
                                          }));
                                        }}
                                        className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded cursor-pointer transition-colors"
                                        title="Edit comment"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteStepComment(step.stepNumber)}
                                        className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded cursor-pointer transition-colors"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Step Screenshots & Visual Evidence */}
                                {stepResult?.attachments && stepResult.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Step Evidence ({stepResult.attachments.length}):
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      {stepResult.attachments.map((att) => (
                                        <div
                                          key={att.id}
                                          className="relative group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-2xs"
                                        >
                                          <img
                                            src={att.url}
                                            alt={att.name}
                                            onClick={() => setSelectedPreviewImage(att.url)}
                                            className="h-16 w-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            title="Click to view full screenshot"
                                          />
                                          <div className="absolute inset-x-0 bottom-0 bg-black/75 text-[9px] text-white px-1.5 py-0.5 truncate flex items-center justify-between">
                                            <span className="truncate max-w-[55px]">
                                              {att.name}
                                            </span>
                                            <div className="flex items-center gap-1 ml-1">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const a = document.createElement('a');
                                                  a.href = att.url;
                                                  a.download = att.name;
                                                  document.body.appendChild(a);
                                                  a.click();
                                                  document.body.removeChild(a);
                                                }}
                                                className="text-slate-300 hover:text-white cursor-pointer"
                                                title="Download screenshot"
                                              >
                                                <Download className="w-2.5 h-2.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteStepScreenshot(
                                                    step.stepNumber,
                                                    att.id
                                                  );
                                                }}
                                                className="text-rose-300 hover:text-rose-100 cursor-pointer"
                                                title="Remove screenshot"
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Step Defects Badges */}
                                {stepResult?.defectIds && stepResult.defectIds.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                                      <Bug className="w-3 h-3" /> Step Bugs:
                                    </span>
                                    {stepResult.defectIds.map((dKey) => (
                                      <span
                                        key={dKey}
                                        className="font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] border border-rose-300 dark:border-rose-800 flex items-center gap-1"
                                      >
                                        {dKey}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Step Comment Input Box */}
                                {stepCommentsOpen[step.stepNumber] && (
                                  <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-800/60 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                                      <span>Add / Edit Step Comment (Бележка към стъпка)</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setStepCommentsOpen((prev) => ({
                                            ...prev,
                                            [step.stepNumber]: false,
                                          }))
                                        }
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <textarea
                                      value={
                                        stepCommentDraft[step.stepNumber] !== undefined
                                          ? stepCommentDraft[step.stepNumber]
                                          : stepResult?.comment || ''
                                      }
                                      onChange={(e) =>
                                        setStepCommentDraft((prev) => ({
                                          ...prev,
                                          [step.stepNumber]: e.target.value,
                                        }))
                                      }
                                      rows={2}
                                      placeholder="Enter step observations, actual result, or test notes..."
                                      className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const text =
                                            stepCommentDraft[step.stepNumber] ??
                                            stepResult?.comment ??
                                            '';
                                          handleStepComment(step.stepNumber, text);
                                          setStepCommentsOpen((prev) => ({
                                            ...prev,
                                            [step.stepNumber]: false,
                                          }));
                                          setToastMessage(`Step ${step.stepNumber} comment saved!`);
                                          setTimeout(() => setToastMessage(null), 2500);
                                        }}
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                                      >
                                        Save Comment
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Step Status & Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Attach Screenshot to Step */}
                              <label
                                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Attach screenshot to this step"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleAddStepScreenshot(step.stepNumber, f);
                                    e.target.value = '';
                                  }}
                                />
                              </label>

                              {/* File Defect for this specific step (Repeatable anytime) */}
                              <button
                                type="button"
                                onClick={() => handleFileDefectForStep(step.stepNumber)}
                                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title={`Log defect for Step ${step.stepNumber} (File Defect)`}
                              >
                                <Bug className="w-3.5 h-3.5" />
                              </button>

                              {/* Step Note toggle button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setStepCommentsOpen((prev) => ({
                                    ...prev,
                                    [step.stepNumber]: !prev[step.stepNumber],
                                  }))
                                }
                                className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                                  stepResult?.comment
                                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title={
                                  stepResult?.comment
                                    ? `Edit comment: "${stepResult.comment}"`
                                    : 'Add comment to this step'
                                }
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleStepStatus(step.stepNumber, 'passed')}
                                className={`p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer ${
                                  currentStatus === 'passed'
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-600 dark:hover:bg-emerald-600'
                                    : ''
                                }`}
                                title="Pass step"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStepStatus(step.stepNumber, 'failed')}
                                className={`p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/60 text-slate-400 dark:text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer ${
                                  currentStatus === 'failed'
                                    ? 'bg-rose-600 text-white hover:bg-rose-600 dark:hover:bg-rose-600'
                                    : ''
                                }`}
                                title="Fail step"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStepStatus(step.stepNumber, 'blocked')}
                                className={`p-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/60 text-slate-400 dark:text-slate-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer ${
                                  currentStatus === 'blocked'
                                    ? 'bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-600'
                                    : ''
                                }`}
                                title="Block step"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Failure Section if failed */}
                {activeExecution.status === 'failed' && (
                  <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-3 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Execution Failure Diagnostic &amp; Bug
                        Filing
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAIDiagnoseFailure}
                          disabled={aiDiagnosing}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md flex items-center gap-1 text-[11px] shadow-2xs cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          {aiDiagnosing ? 'Analyzing with AI...' : 'AI Root Cause Analysis'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDefectModal(failedStepIndex || 1)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md flex items-center gap-1.5 text-[11px] shadow-2xs cursor-pointer"
                          title="File defect from this failure"
                        >
                          <Bug className="w-3.5 h-3.5" />
                          <span>File Defect</span>
                        </button>
                      </div>
                    </div>

                    {/* Display already filed defect banner with all defect badges */}
                    {activeExecution.defectIds && activeExecution.defectIds.length > 0 && (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 rounded-lg flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                        <div className="flex items-center gap-2 font-medium flex-wrap">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Logged Defects ({activeExecution.defectIds.length}):</span>
                          {activeExecution.defectIds.map((dKey) => (
                            <span
                              key={dKey}
                              className="font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[11px] border border-emerald-400/50"
                            >
                              {dKey}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Failure Reason
                      </label>
                      <input
                        type="text"
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                        placeholder="e.g. Bank challenge iframe rejected by cross-origin cookie policy"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-rose-200 dark:border-rose-900/60 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Stack Trace / Console Output
                      </label>
                      <textarea
                        value={stackTrace}
                        onChange={(e) => setStackTrace(e.target.value)}
                        rows={3}
                        placeholder="Paste stacktrace or error log..."
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px] border border-rose-200 dark:border-rose-900/60 rounded-lg focus:outline-none"
                      />
                    </div>

                    {/* AI Diagnosis Result */}
                    {aiDiagnosis && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            Diagnosis: {aiDiagnosis.category}
                          </span>
                          <span className="text-purple-700 dark:text-purple-300 font-semibold">
                            Confidence: {aiDiagnosis.confidence}%
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          {aiDiagnosis.rootCause}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                          {aiDiagnosis.explanation}
                        </p>
                        {aiDiagnosis.remediationSteps && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                              Recommended Fixes:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                              {aiDiagnosis.remediationSteps.map((st: string, i: number) => (
                                <li key={i}>{st}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                Select a test case from the queue
              </div>
            )}
          </main>
        </div>

        {/* Run Completed Summary Dialog */}
        {isCompletedModalOpen && (
          <div className="fixed inset-0 z-70 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                🎉
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Test Run Completed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All test execution results have been logged and saved to your project.
                </p>
              </div>

              {/* KPI Badges */}
              <div className="grid grid-cols-3 gap-2 py-2">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {passedCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                    Passed
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800">
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    {failedCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300">
                    Failed
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    {sortedExecutions.length - passedCount - failedCount}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    Other
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCompletedModalOpen(false);
                    onClose();
                  }}
                  className="py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close Runner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated File Defect Modal with Screenshot Attachment and Large Description */}
        {showFileDefectModal && activeCase && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Bug className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      File Defect (Добавяне на дефект)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Step {defectTargetStep}:{' '}
                      {activeCase.steps
                        .find((s) => s.stepNumber === defectTargetStep)
                        ?.action?.slice(0, 45) || 'Execution Failure'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFileDefectModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Traceability Context */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Run &amp; Case:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    [{run.key}] {activeCase.key}: {activeCase.title.slice(0, 35)}...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Defect Key:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {defectKeyDraft}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Defect Title *
                </label>
                <input
                  type="text"
                  value={defectTitle}
                  onChange={(e) => setDefectTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Severity
                  </label>
                  <select
                    value={defectSeverity}
                    onChange={(e) => setDefectSeverity(e.target.value as TestSeverity)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg cursor-pointer"
                  >
                    <option value="blocker">Blocker</option>
                    <option value="critical">Critical</option>
                    <option value="major">Major</option>
                    <option value="normal">Normal</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Assignee (Потребител)
                  </label>
                  <input
                    type="text"
                    value={defectAssignee}
                    onChange={(e) => setDefectAssignee(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              {/* Requirement #5: Large description field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    Description (Подробно описание на дефекта)
                  </label>
                  <span className="text-[10px] text-slate-400">Large description field</span>
                </div>
                <textarea
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  rows={5}
                  placeholder="Thoroughly describe the observed defect, stacktrace, actual vs expected behavior, network logs..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg min-h-[110px] leading-relaxed"
                />
              </div>

              {/* Requirement #4: Screenshot Upload & Gallery */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-500" />
                    Attach Screenshot / Скрийншот към дефекта
                  </label>
                  <label className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAddDefectAttachment(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {defectAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                    {defectAttachments.map((att, i) => (
                      <div
                        key={att.id || i}
                        className="relative group border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-900 shadow-2xs"
                      >
                        <img
                          src={att.url}
                          alt={att.name}
                          onClick={() => setSelectedPreviewImage(att.url)}
                          className="h-14 w-20 object-cover cursor-pointer hover:opacity-90"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/75 text-[9px] text-white px-1 py-0.5 truncate flex items-center justify-between">
                          <span className="truncate max-w-[45px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDefectAttachments((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="text-rose-300 hover:text-rose-100 cursor-pointer ml-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Reproduction Steps
                </label>
                <textarea
                  value={defectReproSteps}
                  onChange={(e) => setDefectReproSteps(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFileDefectModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDefectModal}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Save &amp; File Defect</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Enlarged Preview Modal */}
        {selectedPreviewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedPreviewImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 p-3 rounded-2xl border border-slate-700 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>Screenshot Evidence Preview</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewImage(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center">
                <img
                  src={selectedPreviewImage}
                  alt="Enlarged screenshot"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
