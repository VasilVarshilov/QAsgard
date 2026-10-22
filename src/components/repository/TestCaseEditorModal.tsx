import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Bot,
  Layers,
  Folder,
  Tag,
  Paperclip,
  Upload,
  AlertTriangle,
  FileText,
  Clock,
  Shield,
  Zap,
  Code,
  List,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  HelpCircle,
  Eye,
  ExternalLink,
  Save,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';
import {
  TestCase,
  TestStep,
  TestPriority,
  TestSeverity,
  TestLayer,
  TestType,
  AutomationStatus,
  CaseStatus,
  CaseBehavior,
  TestSuite,
  Requirement,
  Project,
  Attachment,
} from '../../types';

// =============================================================================
// SEVERITY CONFIG (Qase-like levels with icons and colors)
// =============================================================================
export const SEVERITY_CONFIG: Record<
  TestSeverity,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  blocker: {
    label: 'Blocker',
    icon: '🚫',
    color: 'text-red-400',
    bg: 'bg-red-950/70',
    border: 'border-red-800/60',
  },
  critical: {
    label: 'Critical',
    icon: '🔺',
    color: 'text-orange-500',
    bg: 'bg-orange-950/70',
    border: 'border-orange-800/60',
  },
  major: {
    label: 'Major',
    icon: '🔺',
    color: 'text-amber-400',
    bg: 'bg-amber-950/70',
    border: 'border-amber-800/60',
  },
  normal: {
    label: 'Normal',
    icon: '⚪',
    color: 'text-slate-300',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
  },
  minor: {
    label: 'Minor',
    icon: '🟢',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-800/60',
  },
  trivial: {
    label: 'Trivial',
    icon: '⚪',
    color: 'text-slate-400',
    bg: 'bg-slate-900',
    border: 'border-slate-800',
  },
};

// =============================================================================
// PRIORITY CONFIG (Highest, High, Medium, Low, Lowest)
// =============================================================================
export const PRIORITY_CONFIG: Record<
  TestPriority,
  { label: string; color: string; bg: string; border: string }
> = {
  highest: {
    label: 'Highest',
    color: 'text-rose-400',
    bg: 'bg-rose-950/80',
    border: 'border-rose-800/70',
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bg: 'bg-orange-950/80',
    border: 'border-orange-800/70',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-400',
    bg: 'bg-blue-950/80',
    border: 'border-blue-800/70',
  },
  low: {
    label: 'Low',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-800/70',
  },
  lowest: {
    label: 'Lowest',
    color: 'text-slate-400',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
  },
};

// =============================================================================
// REUSABLE SHARED STEPS TEMPLATES
// =============================================================================
export const SHARED_STEPS_LIBRARY = [
  {
    id: 'shared-login',
    title: 'Authenticate to OWFW50 Workspace',
    steps: [
      {
        action: 'Launch ERP Client and enter host URL',
        expectedResult: 'Login screen rendered',
        data: 'HOST=erp.internal:8443',
      },
      {
        action: 'Enter credentials for role Administrator',
        expectedResult: 'Authentication token granted, dashboard opens',
        data: 'USER=admin; PASS=••••••••',
      },
    ],
  },
  {
    id: 'shared-open-tx',
    title: 'Open Transaction & E-Invoice Queue',
    steps: [
      {
        action: 'Navigate to Menu -> Electronic Invoicing -> Queue',
        expectedResult: 'Invoice queue grid loads with status Active',
        data: 'QUEUE_ID=ZUGFERD_IN',
      },
    ],
  },
  {
    id: 'shared-logout',
    title: 'Clear Session Cache & Logout',
    steps: [
      {
        action: 'Click user avatar -> Logout',
        expectedResult: 'Session invalidated, redirected to login page',
        data: '',
      },
    ],
  },
];

interface TestCaseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTestCase: (testCase: Partial<TestCase>, createAnother?: boolean) => void;
  initialTestCase?: TestCase | null;
  suites: TestSuite[];
  defaultSuiteId?: string | null;
  project: Project;
  requirements?: Requirement[];
}

export const TestCaseEditorModal: React.FC<TestCaseEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveTestCase,
  initialTestCase,
  suites,
  defaultSuiteId,
  project,
  requirements = [],
}) => {
  const isEditing = Boolean(initialTestCase);

  // Form Fields State
  const [title, setTitle] = useState(initialTestCase?.title || '');
  const [description, setDescription] = useState(initialTestCase?.description || '');
  const [suiteId, setSuiteId] = useState(
    initialTestCase?.suiteId || defaultSuiteId || suites[0]?.id || ''
  );
  const [severity, setSeverity] = useState<TestSeverity>(initialTestCase?.severity || 'normal');
  const [priority, setPriority] = useState<TestPriority>(initialTestCase?.priority || 'medium');
  const [status, setStatus] = useState<CaseStatus>(initialTestCase?.status || 'actual');
  const [type, setType] = useState<TestType>(initialTestCase?.type || 'functional');
  const [layer, setLayer] = useState<TestLayer>(initialTestCase?.layer || 'e2e');
  const [behavior, setBehavior] = useState<CaseBehavior>(initialTestCase?.behavior || 'positive');
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>(
    initialTestCase?.automationStatus || 'manual'
  );
  const [milestone, setMilestone] = useState(initialTestCase?.milestone || 'Release 2.4');

  // Checkbox Toggles
  const [isFlaky, setIsFlaky] = useState(initialTestCase?.isFlaky || false);
  const [toBeAutomated, setToBeAutomated] = useState(initialTestCase?.toBeAutomated || false);
  const [muted, setMuted] = useState(initialTestCase?.muted || false);

  // Preconditions & Postconditions
  const [preconditions, setPreconditions] = useState(initialTestCase?.preconditions || '');
  const [postconditions, setPostconditions] = useState(initialTestCase?.postconditions || '');

  // Tags
  const [tags, setTags] = useState<string[]>(initialTestCase?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Reusable Parameters (Empty by default per user request)
  const [parameters, setParameters] = useState<{ key: string; value: string }[]>(
    initialTestCase?.parameters || []
  );
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamVal, setNewParamVal] = useState('');

  // Test Step Designer State
  const [designerMode, setDesignerMode] = useState<'classic' | 'bdd'>(
    initialTestCase?.bddScenario ? 'bdd' : 'classic'
  );

  const [steps, setSteps] = useState<TestStep[]>(
    initialTestCase?.steps || [
      {
        stepNumber: 1,
        action: 'Open workspace {{Workspace}}',
        expectedResult: 'Workspace opens successfully',
        data: 'OWFW50',
      },
      {
        stepNumber: 2,
        action: 'Enter ERP Version 7.0 and select Company {{Company}}',
        expectedResult: 'Version and enterprise units displayed correctly',
        data: '7.0',
      },
      {
        stepNumber: 3,
        action: 'Install infosystem ISYSCOMPARE',
        expectedResult: 'Infosystem installation verification completes with code 0',
        data: 'ISYSCOMPARE',
      },
    ]
  );

  // BDD Scenario
  const [bddGiven, setBddGiven] = useState(
    initialTestCase?.bddScenario?.given ||
      'ERP system is installed and workspace {{Workspace}} is active'
  );
  const [bddWhen, setBddWhen] = useState(
    initialTestCase?.bddScenario?.when || 'user imports infosystem ISYSCOMPARE via package manager'
  );
  const [bddThen, setBddThen] = useState(
    initialTestCase?.bddScenario?.then ||
      'installation succeeds and compliance validation confirms 0 errors'
  );

  // Linked Requirements
  const [selectedReqKeys, setSelectedReqKeys] = useState<string[]>(
    initialTestCase?.requirementRefs || []
  );

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>(initialTestCase?.attachments || []);

  // Field Configuration
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [fieldVisibility, setFieldVisibility] = useState({
    milestone: true,
    layer: true,
    behavior: true,
    parameters: true,
    preconditions: true,
    postconditions: true,
  });

  // AI Assistant Generation State
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('Just now');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Drag Reordering for Steps
  const [draggedStepIdx, setDraggedStepIdx] = useState<number | null>(null);

  // Quality Indicators Calculation
  const qualityMetrics = useMemo(() => {
    let score = 0;
    const hasReqs = selectedReqKeys.length > 0;
    const hasExpected = steps.every((s) => s.expectedResult && s.expectedResult.trim().length > 0);
    const hasData = steps.some((s) => s.data && s.data.trim().length > 0) || parameters.length > 0;
    const hasAttachments = attachments.length > 0;
    const hasDesc = description.trim().length > 20;

    if (hasReqs) score += 20;
    if (hasExpected) score += 30;
    if (hasData) score += 20;
    if (hasAttachments) score += 15;
    if (hasDesc) score += 15;

    return {
      hasReqs,
      hasExpected,
      hasData,
      hasAttachments,
      hasDesc,
      score: Math.min(100, score),
    };
  }, [selectedReqKeys, steps, parameters, attachments, description]);

  // Synchronize form fields whenever modal opens or initialTestCase/defaultSuiteId changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialTestCase) {
      setTitle(initialTestCase.title || '');
      setDescription(initialTestCase.description || '');
      setSuiteId(initialTestCase.suiteId || defaultSuiteId || suites[0]?.id || '');
      setSeverity(initialTestCase.severity || 'normal');
      setPriority(initialTestCase.priority || 'medium');
      setStatus(initialTestCase.status || 'actual');
      setType(initialTestCase.type || 'functional');
      setLayer(initialTestCase.layer || 'e2e');
      setBehavior(initialTestCase.behavior || 'positive');
      setAutomationStatus(initialTestCase.automationStatus || 'manual');
      setMilestone(initialTestCase.milestone || 'Release 2.4');
      setIsFlaky(initialTestCase.isFlaky || false);
      setToBeAutomated(initialTestCase.toBeAutomated || false);
      setMuted(initialTestCase.muted || false);
      setPreconditions(initialTestCase.preconditions || '');
      setPostconditions(initialTestCase.postconditions || '');
      setTags(initialTestCase.tags || []);
      setParameters(initialTestCase.parameters || []);
      setSteps(
        initialTestCase.steps && initialTestCase.steps.length > 0
          ? initialTestCase.steps
          : [
              {
                stepNumber: 1,
                action: '',
                expectedResult: '',
                data: '',
              },
            ]
      );
      setDesignerMode(initialTestCase.bddScenario ? 'bdd' : 'classic');
      setBddGiven(initialTestCase.bddScenario?.given || '');
      setBddWhen(initialTestCase.bddScenario?.when || '');
      setBddThen(initialTestCase.bddScenario?.then || '');
      setSelectedReqKeys(initialTestCase.requirementRefs || []);
      setAttachments(initialTestCase.attachments || []);
    } else {
      // New Test Case initialization - completely clean defaults
      setTitle('');
      setDescription('');
      setSuiteId(defaultSuiteId || suites[0]?.id || '');
      setSeverity('normal');
      setPriority('medium');
      setStatus('actual');
      setType('functional');
      setLayer('e2e');
      setBehavior('positive');
      setAutomationStatus('manual');
      setMilestone('');
      setIsFlaky(false);
      setToBeAutomated(false);
      setMuted(false);
      setPreconditions('');
      setPostconditions('');
      setTags([]);
      setParameters([]); // Empty by default: user adds parameters only if they choose
      setSteps([
        {
          stepNumber: 1,
          action: '',
          expectedResult: '',
          data: '',
        },
      ]);
      setDesignerMode('classic');
      setBddGiven('');
      setBddWhen('');
      setBddThen('');
      setSelectedReqKeys([]);
      setAttachments([]);
    }
    setValidationError(null);
  }, [isOpen, initialTestCase, defaultSuiteId, suites, requirements]);

  // Keyboard shortcut listener: Esc to close, Ctrl/Cmd + Enter to save
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    onClose,
    title,
    description,
    suiteId,
    priority,
    severity,
    status,
    steps,
    parameters,
    tags,
  ]);

  // Auto-Save Draft to LocalStorage every 20 seconds
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      try {
        const draft = {
          title,
          description,
          suiteId,
          steps,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        localStorage.setItem(`qasgard_case_draft_${project.id}`, JSON.stringify(draft));
        setLastAutoSaveTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } catch {
        // ignore
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [isOpen, title, description, suiteId, steps, project.id]);

  // Add Step
  const handleAddStep = (insertIndex?: number) => {
    const newStepNum = steps.length + 1;
    const newStep: TestStep = {
      stepNumber: newStepNum,
      action: '',
      expectedResult: '',
      data: '',
    };

    if (typeof insertIndex === 'number') {
      const next = [...steps];
      next.splice(insertIndex + 1, 0, newStep);
      const renumbered = next.map((s, i) => ({ ...s, stepNumber: i + 1 }));
      setSteps(renumbered);
    } else {
      setSteps([...steps, newStep]);
    }
  };

  // Case-level attachment file input ref
  const caseFileInputRef = React.useRef<HTMLInputElement>(null);

  const fileToAttachment = (file: File): Promise<Attachment> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const sizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;
        resolve({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: sizeStr,
          type: file.type || 'application/octet-stream',
          url: (reader.result as string) || '#',
          uploadedAt: new Date().toISOString(),
        });
      };
      reader.onerror = () => {
        resolve({
          id: `att-${Date.now()}`,
          name: file.name,
          size: '1 KB',
          type: file.type || 'application/octet-stream',
          url: '#',
          uploadedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCaseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAtts: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const att = await fileToAttachment(files[i]);
      newAtts.push(att);
    }
    setAttachments((prev) => [...prev, ...newAtts]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleStepFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, stepIdx: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAtts: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const att = await fileToAttachment(files[i]);
      newAtts.push(att);
    }
    setSteps((prev) => {
      const next = [...prev];
      const target = next[stepIdx];
      next[stepIdx] = {
        ...target,
        attachments: [...(target.attachments || []), ...newAtts],
      };
      return next;
    });
    e.target.value = '';
  };

  const handleRemoveStepAttachment = (stepIdx: number, attId: string) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = next[stepIdx];
      next[stepIdx] = {
        ...target,
        attachments: (target.attachments || []).filter((a) => a.id !== attId),
      };
      return next;
    });
  };

  const handleAddSubStep = (parentIdx: number) => {
    const parentStep = steps[parentIdx];
    const parentNum = parentStep.parentStepNumber || parentStep.stepNumber;
    const newSubStep: TestStep = {
      stepNumber: steps.length + 1,
      parentStepNumber: parentNum,
      action: '',
      expectedResult: '',
      data: '',
      attachments: [],
    };
    const next = [...steps];
    next.splice(parentIdx + 1, 0, newSubStep);
    setSteps(next);
  };

  const getStepDisplayNumber = (st: TestStep, idx: number) => {
    if (!st.parentStepNumber) {
      const mainNum = steps.slice(0, idx + 1).filter((s) => !s.parentStepNumber).length;
      return `${mainNum}`;
    }
    const parentNum = st.parentStepNumber ?? 1;
    const parentMainNum =
      steps.filter((s) => !s.parentStepNumber && s.stepNumber <= parentNum).length || parentNum;
    const subIdx = steps.slice(0, idx + 1).filter((s) => s.parentStepNumber === parentNum).length;
    return `${parentMainNum}.${subIdx}`;
  };

  // Duplicate Step
  const handleDuplicateStep = (idx: number) => {
    const target = steps[idx];
    const cloned: TestStep = {
      ...target,
      action: `${target.action} (Copy)`,
    };
    const next = [...steps];
    next.splice(idx + 1, 0, cloned);
    const renumbered = next.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(renumbered);
  };

  // Delete Step
  const handleDeleteStep = (idx: number) => {
    if (steps.length === 1) return;
    const filtered = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(filtered);
  };

  // Move Step
  const handleMoveStep = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === steps.length - 1))
      return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const next = [...steps];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setSteps(next.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  // Insert Shared Step
  const handleInsertSharedStep = (sharedId: string) => {
    const item = SHARED_STEPS_LIBRARY.find((s) => s.id === sharedId);
    if (!item) return;

    const newStepsToAdd: TestStep[] = item.steps.map((st, i) => ({
      stepNumber: steps.length + i + 1,
      action: st.action,
      expectedResult: st.expectedResult,
      data: st.data,
      notes: `[Shared Step: ${item.title}]`,
    }));

    setSteps([...steps, ...newStepsToAdd]);
  };

  // AI Step Generator
  const handleAIGenerate = (mode: string) => {
    setAiMenuOpen(false);
    setIsAIGenerating(true);

    setTimeout(() => {
      if (mode === 'steps') {
        const generated: TestStep[] = [
          ...steps,
          {
            stepNumber: steps.length + 1,
            action: 'Validate digital signature and XML checksum compliance for {{Workspace}}',
            expectedResult: 'Validation returns HTTP 200 with checksum signature valid',
            data: 'CHECKSUM_ALGO=SHA-256',
          },
          {
            stepNumber: steps.length + 2,
            action: 'Verify database transactional commit in company {{Company}}',
            expectedResult: 'Record persists with status APPROVED in audit table',
            data: 'DB_COMMIT=TRUE',
          },
        ];
        setSteps(generated);
      } else if (mode === 'expected') {
        setSteps((prev) =>
          prev.map((s) => ({
            ...s,
            expectedResult: `${s.expectedResult} (Validated against ISO 20022 and ZUGFeRD 2.4 rules)`,
          }))
        );
      } else if (mode === 'negative') {
        setSteps((prev) => [
          ...prev,
          {
            stepNumber: prev.length + 1,
            action:
              'Attempt execution with corrupted XML invoice payload and negative currency amount',
            expectedResult:
              'System gracefully catches exception, rolls back transaction and issues ERROR_422',
            data: 'AMOUNT=-500.00; STATUS=CORRUPTED',
          },
        ]);
        setBehavior('negative');
        setTags((prev) => Array.from(new Set([...prev, 'NegativeTest', 'Security'])));
      } else if (mode === 'data') {
        setParameters((prev) => [
          ...prev,
          { key: 'InvoiceID', value: 'INV-2026-9041' },
          { key: 'VatRate', value: '19.00%' },
        ]);
      }
      setIsAIGenerating(false);
    }, 600);
  };

  // Save Handler
  const handleSave = (createAnother = false) => {
    if (!title.trim()) {
      setValidationError('Test Case Title is required.');
      return;
    }

    setValidationError(null);

    const generatedKey =
      initialTestCase?.key || `${project.key}-${Math.floor(100 + Math.random() * 899)}`;
    const selectedSuite = suites.find((s) => s.id === suiteId) || suites[0];

    const payload: Partial<TestCase> = {
      ...(initialTestCase || {}),
      key: generatedKey,
      title: title.trim(),
      description: description.trim(),
      suiteId: selectedSuite ? selectedSuite.id : 'default-suite',
      suiteName: selectedSuite ? selectedSuite.name : 'General',
      projectId: project.id,
      priority,
      severity,
      status,
      type,
      layer,
      behavior,
      automationStatus,
      milestone,
      isFlaky,
      toBeAutomated,
      muted,
      preconditions: preconditions.trim(),
      postconditions: postconditions.trim(),
      tags,
      parameters,
      steps: designerMode === 'classic' ? steps : [],
      bddScenario:
        designerMode === 'bdd' ? { given: bddGiven, when: bddWhen, then: bddThen } : undefined,
      requirementRefs: selectedReqKeys,
      attachments,
      testData:
        parameters.length > 0
          ? parameters.map((p) => `${p.key}=${p.value}`).join('; ')
          : initialTestCase?.testData || '',
      updatedAt: new Date().toISOString(),
      createdAt: initialTestCase?.createdAt || new Date().toISOString(),
    };

    onSaveTestCase(payload, createAnother);

    if (createAnother) {
      setTitle('');
      setDescription('');
      setSteps([
        {
          stepNumber: 1,
          action: 'Initialize verification',
          expectedResult: 'System confirms ready state',
          data: '',
        },
      ]);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#12131f] text-slate-200 flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-150">
      {/* =========================================================================
          TOP STICKY HEADER & ACTION BAR
      ========================================================================= */}
      <header className="px-6 py-3 bg-[#181928] border-b border-[#262838] flex items-center justify-between shrink-0 flex-wrap gap-3 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
            {isEditing ? <FileText className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                {isEditing ? `Edit Test Case: ${initialTestCase?.key}` : 'Create New Test Case'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#202236] text-indigo-300 border border-[#2d3044]">
                Project: {project.key}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span>Auto-save draft: {lastAutoSaveTime}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Quality Score {qualityMetrics.score}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Cancel, Field Settings, Save & Create Another, Save */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure Visible Form Fields"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Fields</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-3.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-indigo-500/40 text-indigo-300 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Save &amp; Create Another
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Test Case</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#25283c] cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Validation Banner */}
      {validationError && (
        <div className="px-6 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* =========================================================================
          MAIN EDITOR BODY (2-COLUMN LAYOUT: Content ~70% | Classification ~30%)
      ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER: PRIMARY CONTENT AREA (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#141524] no-scrollbar">
          {/* 1. BASIC INFORMATION */}
          <div className="bg-[#181928] border border-[#262838] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#262838] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Basic Information
              </span>
              <span className="text-[10px] text-slate-500">* Required fields</span>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. TC-002 Verify ISYSCOMPARE Installation in OWFW50"
                className="w-full bg-[#12131f] border border-[#2d3044] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-semibold"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">Description</label>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Insert:</span>
                  {parameters.slice(0, 3).map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setDescription((prev) => prev + ` {{${p.key}}}`)}
                      className="px-1.5 py-0.5 rounded bg-[#202236] hover:bg-indigo-900/60 text-indigo-300 text-[10px] font-mono cursor-pointer"
                    >
                      &#123;&#123;{p.key}&#125;&#125;
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detailed explanation, test objective, and business requirements..."
                className="w-full bg-[#12131f] border border-[#2d3044] rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          {/* 2. PRE-CONDITIONS & POST-CONDITIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldVisibility.preconditions && (
              <div className="bg-[#181928] border border-[#262838] rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Pre-conditions
                </label>
                <textarea
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                  rows={2}
                  placeholder="e.g. User exists; ERP OWFW50 installed; permissions granted"
                  className="w-full bg-[#12131f] border border-[#2d3044] rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {fieldVisibility.postconditions && (
              <div className="bg-[#181928] border border-[#262838] rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  Post-conditions
                </label>
                <textarea
                  value={postconditions}
                  onChange={(e) => setPostconditions(e.target.value)}
                  rows={2}
                  placeholder="e.g. Configuration saved; transaction committed; session purged"
                  className="w-full bg-[#12131f] border border-[#2d3044] rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* 3. REUSABLE PARAMETERS */}
          {fieldVisibility.parameters && (
            <div className="bg-[#181928] border border-[#262838] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#262838] pb-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Reusable Parameters
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Reference inside steps as:{' '}
                  <span className="text-amber-300 font-mono">&#123;&#123;Key&#125;&#125;</span>
                </span>
              </div>

              {/* Parameter Badges List */}
              <div className="flex flex-wrap gap-2 items-center">
                {parameters.map((param, pIdx) => (
                  <div
                    key={pIdx}
                    className="flex items-center gap-1.5 bg-[#12131f] border border-[#2d3044] px-2.5 py-1 rounded-lg text-xs font-mono"
                  >
                    <span className="text-amber-400 font-bold">
                      &#123;&#123;{param.key}&#125;&#125;
                    </span>
                    <span className="text-slate-500">=</span>
                    <span className="text-slate-300">{param.value}</span>
                    <button
                      type="button"
                      onClick={() => setParameters(parameters.filter((_, i) => i !== pIdx))}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Add Parameter Inline */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newParamKey}
                    onChange={(e) => setNewParamKey(e.target.value)}
                    placeholder="Key"
                    className="w-20 bg-[#12131f] border border-[#2d3044] rounded-lg px-2 py-1 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newParamVal}
                    onChange={(e) => setNewParamVal(e.target.value)}
                    placeholder="Value"
                    className="w-24 bg-[#12131f] border border-[#2d3044] rounded-lg px-2 py-1 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newParamKey.trim() && newParamVal.trim()) {
                        setParameters([
                          ...parameters,
                          { key: newParamKey.trim(), value: newParamVal.trim() },
                        ]);
                        setNewParamKey('');
                        setNewParamVal('');
                      }
                    }}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              4. TEST STEP DESIGNER (Primary Focus: Classic vs BDD)
          =================================================================== */}
          <div className="bg-[#181928] border border-[#262838] rounded-2xl p-5 space-y-4 shadow-lg">
            {/* Header & Modes */}
            <div className="flex items-center justify-between border-b border-[#262838] pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Test Step Designer
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                  {designerMode === 'classic' ? `${steps.length} Steps` : 'BDD Mode'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Classic / BDD Toggle */}
                <div className="flex items-center bg-[#12131f] border border-[#2d3044] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setDesignerMode('classic')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      designerMode === 'classic'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Classic Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesignerMode('bdd')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      designerMode === 'bdd'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    BDD Mode
                  </button>
                </div>

                {/* AI Generate Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAiMenuOpen(!aiMenuOpen)}
                    className="px-3 py-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                    <span>✨ Generate with AI</span>
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>

                  {/* AI Dropdown Menu */}
                  {aiMenuOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-[#1e2034] border border-[#2e3146] rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase text-indigo-400 border-b border-[#2d3044]">
                        Contextual AI Generators
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate('steps')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#282a3e] text-slate-200 hover:text-white cursor-pointer"
                      >
                        ⚡ Generate Execution Steps
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate('expected')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#282a3e] text-slate-200 hover:text-white cursor-pointer"
                      >
                        🎯 Improve Expected Results
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate('negative')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#282a3e] text-slate-200 hover:text-white cursor-pointer"
                      >
                        🚫 Generate Negative &amp; Boundary Cases
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAIGenerate('data')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#282a3e] text-slate-200 hover:text-white cursor-pointer"
                      >
                        📊 Generate Test Data Parameters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CLASSIC TABLE MODE */}
            {designerMode === 'classic' && (
              <div className="space-y-3">
                <div className="border border-[#2d3044] rounded-xl overflow-hidden bg-[#12131f]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#181928] border-b border-[#2d3044] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Step Action</th>
                        <th className="py-2.5 px-3 w-48">Test Data</th>
                        <th className="py-2.5 px-3">Expected Result</th>
                        <th className="py-2.5 px-3 w-28 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24263a]">
                      {steps.map((st, idx) => {
                        const isSubStep = !!st.parentStepNumber;
                        const displayNumber = getStepDisplayNumber(st, idx);
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors group ${
                              isSubStep
                                ? 'bg-[#151627]/60 hover:bg-[#191b2e]'
                                : 'hover:bg-[#161726]'
                            }`}
                          >
                            {/* Step Number with Reorder */}
                            <td className="py-3 px-3 text-center align-top font-mono font-bold text-indigo-400">
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span
                                  className={
                                    isSubStep ? 'text-cyan-400 text-xs' : 'text-indigo-400'
                                  }
                                >
                                  {displayNumber}
                                </span>
                                {isSubStep && (
                                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 uppercase">
                                    Sub
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Step Action */}
                            <td className="py-2.5 px-3 align-top">
                              <div
                                className={isSubStep ? 'pl-3 border-l-2 border-cyan-500/50' : ''}
                              >
                                <textarea
                                  value={st.action}
                                  onChange={(e) => {
                                    const next = [...steps];
                                    next[idx] = { ...next[idx], action: e.target.value };
                                    setSteps(next);
                                  }}
                                  rows={2}
                                  placeholder={
                                    isSubStep
                                      ? 'e.g. Sub-step: Assert prompt message visibility'
                                      : 'e.g. Open workspace {{Workspace}}'
                                  }
                                  className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                                />
                                {st.notes && (
                                  <span className="text-[10px] font-mono text-indigo-400 block mt-1">
                                    {st.notes}
                                  </span>
                                )}

                                {/* Step Attachments List */}
                                {st.attachments && st.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {st.attachments.map((att) => (
                                      <div
                                        key={att.id}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e2032] border border-[#2d3044] text-[10px] text-slate-300"
                                      >
                                        <Paperclip className="w-3 h-3 text-cyan-400 shrink-0" />
                                        <span className="max-w-[120px] truncate" title={att.name}>
                                          {att.name}
                                        </span>
                                        <span className="text-slate-500 font-mono text-[9px]">
                                          {att.size}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveStepAttachment(idx, att.id)}
                                          className="text-slate-400 hover:text-rose-400 cursor-pointer ml-0.5"
                                          title="Remove attachment"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Test Data */}
                            <td className="py-2.5 px-3 align-top">
                              <textarea
                                value={st.data || ''}
                                onChange={(e) => {
                                  const next = [...steps];
                                  next[idx] = { ...next[idx], data: e.target.value };
                                  setSteps(next);
                                }}
                                rows={2}
                                placeholder="e.g. OWFW50"
                                className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                              />
                            </td>

                            {/* Expected Result */}
                            <td className="py-2.5 px-3 align-top">
                              <textarea
                                value={st.expectedResult}
                                onChange={(e) => {
                                  const next = [...steps];
                                  next[idx] = { ...next[idx], expectedResult: e.target.value };
                                  setSteps(next);
                                }}
                                rows={2}
                                placeholder="e.g. Workspace opens successfully"
                                className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </td>

                            {/* Action Controls */}
                            <td className="py-2.5 px-3 align-top text-center">
                              <div className="flex items-center justify-center gap-1">
                                <label
                                  className="p-1 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors"
                                  title="Add file attachment to this step"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleStepFileUpload(e, idx)}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleMoveStep(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                  title="Move Step Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveStep(idx, 'down')}
                                  disabled={idx === steps.length - 1}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                  title="Move Step Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateStep(idx)}
                                  className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer"
                                  title="Duplicate Step"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStep(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                  title="Delete Step"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddSubStep(idx)}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                                  title="Add nested sub-step under this step (Добави под-стъпка)"
                                >
                                  + Sub-step
                                </button>
                                <span className="text-slate-600">•</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddStep(idx)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                                  title="Insert standard step below"
                                >
                                  + Step below
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Steps Footer Toolbar: Add Step, Add Sub-Step, Insert Shared Step */}
                <div className="flex items-start justify-between pt-2">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddStep()}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Step</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSubStep(steps.length - 1)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-emerald-500/40"
                        title="Add sub-step under the current step"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Add Sub-Step</span>
                      </button>
                    </div>

                    {/* Shared Steps Quick Insert */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <span>Shared Steps:</span>
                      {SHARED_STEPS_LIBRARY.map((shared) => (
                        <button
                          key={shared.id}
                          type="button"
                          onClick={() => handleInsertSharedStep(shared.id)}
                          className="px-2 py-1 bg-[#1e2034] hover:bg-[#25283e] border border-[#2e3146] rounded text-[11px] text-slate-300 hover:text-white cursor-pointer font-medium"
                        >
                          + {shared.title.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono mt-1">
                    Total: {steps.length} verification steps
                  </span>
                </div>
              </div>
            )}

            {/* BDD GHERKIN MODE */}
            {designerMode === 'bdd' && (
              <div className="space-y-4 p-4 bg-[#12131f] border border-[#2d3044] rounded-xl">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    GIVEN (Initial Context)
                  </label>
                  <textarea
                    value={bddGiven}
                    onChange={(e) => setBddGiven(e.target.value)}
                    rows={2}
                    className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="Given ERP system is installed..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                    WHEN (Action / Event)
                  </label>
                  <textarea
                    value={bddWhen}
                    onChange={(e) => setBddWhen(e.target.value)}
                    rows={2}
                    className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="When user imports infosystem..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    THEN (Expected Outcome)
                  </label>
                  <textarea
                    value={bddThen}
                    onChange={(e) => setBddThen(e.target.value)}
                    rows={2}
                    className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Then installation succeeds..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. ATTACHMENTS (Drag & Drop zone) */}
          <div className="bg-[#181928] border border-[#262838] rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-400" />
              Attachments ({attachments.length})
            </span>

            <input
              type="file"
              ref={caseFileInputRef}
              multiple
              className="hidden"
              onChange={handleCaseFileUpload}
            />

            <div
              onClick={() => caseFileInputRef.current?.click()}
              className="p-4 border border-dashed border-[#2e3146] rounded-xl text-center space-y-1 bg-[#12131f] hover:border-indigo-500 transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5 text-indigo-400 mx-auto" />
              <span className="text-xs text-slate-300 block font-medium">
                Click or drag &amp; drop files, screenshots or test logs
              </span>
              <span className="text-[10px] text-slate-500 block">
                Supports Images, PDFs, Word, Excel, ZIP, LOG
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 bg-[#12131f] border border-[#2d3044] rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-white truncate" title={att.name}>
                        {att.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-500">{att.size}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: CLASSIFICATION & METADATA SIDEBAR (~32% Width) */}
        <aside className="w-80 md:w-96 shrink-0 bg-[#161726] border-l border-[#262838] p-5 overflow-y-auto space-y-5 no-scrollbar">
          {/* Section: Suite Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>
                Test Suite <span className="text-rose-500">*</span>
              </span>
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
            </label>
            <select
              value={suiteId}
              onChange={(e) => setSuiteId(e.target.value)}
              className="w-full bg-[#12131f] border border-[#2d3044] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
            >
              {suites.map((s) => (
                <option key={s.id} value={s.id}>
                  📁 {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section: Severity (Blocker, Critical, Major, Normal, Minor, Trivial) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Severity <span className="text-rose-500">*</span>
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as TestSeverity)}
              className={`w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none ${
                SEVERITY_CONFIG[severity]?.bg || 'bg-[#12131f]'
              } ${SEVERITY_CONFIG[severity]?.border || 'border-[#2d3044]'} ${
                SEVERITY_CONFIG[severity]?.color || 'text-white'
              }`}
            >
              <option value="blocker">🚫 Blocker</option>
              <option value="critical">🔺 Critical</option>
              <option value="major">🔺 Major</option>
              <option value="normal">⚪ Normal</option>
              <option value="minor">🟢 Minor</option>
              <option value="trivial">⚪ Trivial</option>
            </select>
          </div>

          {/* Section: Priority (Highest, High, Medium, Low, Lowest) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Priority <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TestPriority)}
              className={`w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none ${
                PRIORITY_CONFIG[priority]?.bg || 'bg-[#12131f]'
              } ${PRIORITY_CONFIG[priority]?.border || 'border-[#2d3044]'} ${
                PRIORITY_CONFIG[priority]?.color || 'text-white'
              }`}
            >
              <option value="highest">Highest</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>

          {/* Section: Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CaseStatus)}
              className="w-full bg-[#12131f] border border-[#2d3044] rounded-xl p-2.5 text-xs text-white font-semibold focus:outline-none"
            >
              <option value="actual">Ready / Actual</option>
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>

          {/* Section: Automation Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Automation Status</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </label>
            <select
              value={automationStatus}
              onChange={(e) => setAutomationStatus(e.target.value as AutomationStatus)}
              className="w-full bg-[#12131f] border border-[#2d3044] rounded-xl p-2.5 text-xs text-white font-semibold focus:outline-none"
            >
              <option value="manual">Manual</option>
              <option value="planned">Planned</option>
              <option value="automated">Automated</option>
              <option value="partially_automated">Partially Automated</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>

          {/* Section: Test Type & Test Layer */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestType)}
                className="w-full bg-[#12131f] border border-[#2d3044] rounded-lg p-2 text-xs text-white focus:outline-none capitalize"
              >
                <option value="functional">Functional</option>
                <option value="regression">Regression</option>
                <option value="smoke">Smoke</option>
                <option value="sanity">Sanity</option>
                <option value="security">Security</option>
                <option value="performance">Performance</option>
                <option value="api">API</option>
                <option value="ui">UI</option>
                <option value="uat">UAT</option>
                <option value="database">Database</option>
                <option value="boundary">Boundary</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">Layer</label>
              <select
                value={layer}
                onChange={(e) => setLayer(e.target.value as TestLayer)}
                className="w-full bg-[#12131f] border border-[#2d3044] rounded-lg p-2 text-xs text-white focus:outline-none uppercase"
              >
                <option value="ui">UI</option>
                <option value="backend">Backend</option>
                <option value="database">Database</option>
                <option value="api">API</option>
                <option value="integration">Integration</option>
                <option value="system">System</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="e2e">E2E</option>
              </select>
            </div>
          </div>

          {/* Behavior & Milestone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">Behavior</label>
              <select
                value={behavior}
                onChange={(e) => setBehavior(e.target.value as CaseBehavior)}
                className="w-full bg-[#12131f] border border-[#2d3044] rounded-lg p-2 text-xs text-white focus:outline-none capitalize"
              >
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="boundary">Boundary</option>
                <option value="exploratory">Exploratory</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">Milestone</label>
              <input
                type="text"
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                placeholder="e.g. Release 2.4"
                className="w-full bg-[#12131f] border border-[#2d3044] rounded-lg p-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Special QA Toggles: Is Flaky, To Be Automated, Muted */}
          <div className="p-3 bg-[#12131f] border border-[#2d3044] rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quality Flags
            </span>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFlaky}
                onChange={(e) => setIsFlaky(e.target.checked)}
                className="rounded border-[#3a3d54] bg-[#1a1c2b] text-indigo-600 focus:ring-0"
              />
              <span>Is Flaky Test</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={toBeAutomated}
                onChange={(e) => setToBeAutomated(e.target.checked)}
                className="rounded border-[#3a3d54] bg-[#1a1c2b] text-indigo-600 focus:ring-0"
              />
              <span>To Be Automated</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={muted}
                onChange={(e) => setMuted(e.target.checked)}
                className="rounded border-[#3a3d54] bg-[#1a1c2b] text-indigo-600 focus:ring-0"
              />
              <span>Muted Test Case</span>
            </label>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full bg-[#12131f] border border-[#2d3044] text-[11px] font-mono text-slate-300 flex items-center gap-1"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((item) => item !== t))}
                    className="hover:text-rose-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    if (!tags.includes(tagInput.trim())) {
                      setTags([...tags, tagInput.trim()]);
                    }
                    setTagInput('');
                  }
                }}
                placeholder="+ Add tag..."
                className="flex-1 bg-[#12131f] border border-[#2d3044] rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
          </div>

          {/* Linked Requirements */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Linked Requirements</span>
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {requirements.map((req) => {
                const isSelected = selectedReqKeys.includes(req.key);
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedReqKeys(selectedReqKeys.filter((k) => k !== req.key));
                      } else {
                        setSelectedReqKeys([...selectedReqKeys, req.key]);
                      }
                    }}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-200'
                        : 'bg-[#12131f] border-[#2d3044] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-mono font-bold block">{req.key}</span>
                      <span className="text-[10px] truncate block opacity-80">{req.title}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Quality Indicators Checklist Card */}
          <div className="p-3.5 bg-[#12131f] border border-[#2d3044] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Quality Readiness
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {qualityMetrics.score}%
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>Requirements linked</span>
                <span>{qualityMetrics.hasReqs ? '✓' : '○'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Expected Results defined</span>
                <span>{qualityMetrics.hasExpected ? '✓' : '○'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Test Data available</span>
                <span>{qualityMetrics.hasData ? '✓' : '○'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Attachments attached</span>
                <span>{qualityMetrics.hasAttachments ? '✓' : '○'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Description detailed</span>
                <span>{qualityMetrics.hasDesc ? '✓' : '○'}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
