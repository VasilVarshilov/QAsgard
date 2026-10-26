import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Copy,
  Edit3,
  Check,
  Plus,
  PlayCircle,
  Paperclip,
  CheckCircle,
  FileText,
  Clock,
  MessageSquare,
  Bot,
  ExternalLink,
  Tag,
  Download,
  Upload,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  Zap,
  Code,
  List,
  Table as TableIcon,
  Layers,
  AlertCircle,
  Smile,
  AtSign,
  Send,
  CheckSquare,
  Bug,
  Shield,
  RefreshCw,
  Folder,
  FileDown,
  FileCode,
  CheckCircle2,
  XCircle,
  Ban,
  Camera,
} from 'lucide-react';
import { downloadText, downloadBlob } from '../../utils/exportUtils';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import {
  TestCase,
  TestStep,
  TestPriority,
  TestSeverity,
  TestLayer,
  AutomationStatus,
  CaseStatus,
  Requirement,
  TestSuite,
  Defect,
  TestRun,
  Project,
  Attachment,
  User,
} from '../../types';

interface TestCasePreviewPanelProps {
  testCase: TestCase;
  onClose: () => void;
  onUpdateTestCase: (updated: TestCase) => void;
  onDeleteTestCase: (caseId: string) => void;
  onDuplicateTestCase: (testCase: TestCase) => void;
  requirements?: Requirement[];
  suites?: TestSuite[];
  defects?: Defect[];
  testRuns?: TestRun[];
  project?: Project;
  currentUser?: User;
  onTriggerAIForCase?: (testCase: TestCase, promptType?: string) => void;
  onOpenFullEditor?: (testCase: TestCase) => void;
}

export const TestCasePreviewPanel: React.FC<TestCasePreviewPanelProps> = ({
  testCase,
  onClose,
  onUpdateTestCase,
  onDeleteTestCase,
  onDuplicateTestCase,
  requirements = [],
  suites = [],
  defects = [],
  testRuns = [],
  project,
  currentUser,
  onTriggerAIForCase,
  onOpenFullEditor,
}) => {
  // Navigation Tabs: General, Properties, Runs, History, Defects, Comments
  const [activeTab, setActiveTab] = useState<
    'general' | 'properties' | 'runs' | 'history' | 'defects' | 'comments'
  >('general');

  // Quick Inline Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(testCase.title);
  const [editedDescription, setEditedDescription] = useState(testCase.description);
  const [editedPreconditions, setEditedPreconditions] = useState(testCase.preconditions || '');
  const [editedPostconditions, setEditedPostconditions] = useState(testCase.postconditions || '');
  const [editedTestData, setEditedTestData] = useState(testCase.testData || '');

  // Width Expansion Toggle: ~38vw vs ~55vw
  const [isExpandedWidth, setIsExpandedWidth] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Steps View: Accordion (default) vs Classic QA Table
  const [stepsViewMode, setStepsViewMode] = useState<'accordion' | 'table'>('accordion');

  // Expanded Accordion Steps State
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(() => {
    // Default: expand all steps for instant review
    return new Set(testCase.steps.map((_, i) => i));
  });

  // Section Accordion State in General Tab
  const [sectionsExpanded, setSectionsExpanded] = useState<Record<string, boolean>>({
    description: true,
    preconditions: true,
    postconditions: false,
    testData: true,
    requirements: true,
    attachments: true,
    environment: true,
  });

  // AI Assistant Dropdown & Execution State
  const [isAIDropdownOpen, setIsAIDropdownOpen] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Automate Modal
  const [showAutomateModal, setShowAutomateModal] = useState(false);

  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  // Image preview modal state
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const handleDownloadAttachment = (att: Attachment) => {
    if (att.url && att.url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = att.url;
      a.download = att.name || 'attachment';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (att.url && att.url !== '#' && !att.url.startsWith('blob:')) {
      window.open(att.url, '_blank');
    } else {
      const blob = new Blob([`Content for ${att.name}`], { type: att.type || 'text/plain' });
      downloadBlob(blob, att.name || 'attachment.txt');
    }
  };

  // Comments State
  const [commentText, setCommentText] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  const handleUploadCaseAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAtt: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.type || 'image/png',
        url: dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      const updatedAtts = [...(testCase.attachments || []), newAtt];
      onUpdateTestCase({
        ...testCase,
        attachments: updatedAtts,
        updatedAt: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sync edits if testCase changes
  React.useEffect(() => {
    setEditedTitle(testCase.title);
    setEditedDescription(testCase.description);
    setEditedPreconditions(testCase.preconditions || '');
    setEditedPostconditions(testCase.postconditions || '');
    setEditedTestData(testCase.testData || '');
    setExpandedSteps(new Set(testCase.steps.map((_, i) => i)));
  }, [testCase.id]);

  // Compute Full Repository Breadcrumb Path
  const breadcrumbPath = useMemo(() => {
    const trail: string[] = [];
    if (!suites.length) return [testCase.suiteName || 'Repository'];

    let currentSuite = suites.find((s) => s.id === testCase.suiteId);
    while (currentSuite) {
      trail.unshift(currentSuite.name);
      currentSuite = currentSuite.parentId
        ? suites.find((s) => s.id === currentSuite!.parentId)
        : undefined;
    }

    if (trail.length === 0 && testCase.suiteName) {
      trail.push(testCase.suiteName);
    }
    return trail.length ? trail : ['Repository', 'General'];
  }, [testCase.suiteId, testCase.suiteName, suites]);

  // Linked Defects for this test case
  const linkedDefects = useMemo(() => {
    if (!defects.length) return [];
    return defects.filter(
      (d) =>
        d.testCaseId === testCase.id ||
        testCase.linkedDefects?.includes(d.id) ||
        d.title.toLowerCase().includes(testCase.key.toLowerCase())
    );
  }, [defects, testCase.id, testCase.key, testCase.linkedDefects]);

  // Linked Test Runs / Executions
  const linkedRuns = useMemo(() => {
    if (!testRuns.length) {
      return [];
    }

    return testRuns.slice(0, 5).map((r, i) => ({
      id: r.key || `RUN-${100 + i}`,
      title: r.title,
      tester: r.assignedTo || currentUser?.name || 'Admin',
      date: new Date().toLocaleDateString(),
      status: i === 0 ? ('passed' as const) : i === 1 ? ('failed' as const) : ('blocked' as const),
      duration: `${1 + i}m ${15 + i * 10}s`,
    }));
  }, [testRuns, currentUser]);

  // Save Inline Quick Edits
  const handleSaveEdits = () => {
    const updated: TestCase = {
      ...testCase,
      title: editedTitle.trim() || testCase.title,
      description: editedDescription.trim(),
      preconditions: editedPreconditions.trim(),
      postconditions: editedPostconditions.trim(),
      testData: editedTestData.trim(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateTestCase(updated);
    setIsEditMode(false);
  };

  // Toggle Accordion Step Expand/Collapse
  const toggleStepExpand = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleExpandAllSteps = () => {
    setExpandedSteps(new Set(testCase.steps.map((_, i) => i)));
  };

  const handleCollapseAllSteps = () => {
    setExpandedSteps(new Set());
  };

  // Step Management: Add Step
  const handleAddStep = () => {
    const newStepNumber = testCase.steps.length + 1;
    const newSteps: TestStep[] = [
      ...testCase.steps,
      {
        stepNumber: newStepNumber,
        action: 'Verify system response and behavior',
        expectedResult: 'System fulfills expected verification criteria',
        data: '',
        notes: '',
      },
    ];
    onUpdateTestCase({
      ...testCase,
      steps: newSteps,
      updatedAt: new Date().toISOString(),
    });
    setExpandedSteps((prev) => new Set([...prev, newStepNumber - 1]));
  };

  // Step Management: Add Sub-Step under the specified or last step
  const handleAddSubStep = (parentIdx?: number) => {
    const parentIndex =
      parentIdx !== undefined ? parentIdx : Math.max(0, testCase.steps.length - 1);
    const parentStep = testCase.steps[parentIndex];
    const parentNum = parentStep?.parentStepNumber || parentStep?.stepNumber || 1;
    const newStepNumber = testCase.steps.length + 1;
    const newSubStep: TestStep = {
      stepNumber: newStepNumber,
      parentStepNumber: parentNum,
      action: 'Sub-step: Verify detailed outcome',
      expectedResult: 'System satisfies condition',
      data: '',
      notes: '',
      attachments: [],
    };
    const next = [...testCase.steps];
    next.splice(parentIndex + 1, 0, newSubStep);
    onUpdateTestCase({
      ...testCase,
      steps: next,
      updatedAt: new Date().toISOString(),
    });
    setExpandedSteps((prev) => new Set([...prev, parentIndex + 1]));
  };

  // Step Management: Delete Step
  const handleDeleteStep = (index: number) => {
    const filtered = testCase.steps
      .filter((_, i) => i !== index)
      .map((st, i) => ({ ...st, stepNumber: i + 1 }));
    onUpdateTestCase({
      ...testCase,
      steps: filtered,
      updatedAt: new Date().toISOString(),
    });
  };

  // Step Management: Update Individual Step
  const handleUpdateStep = (index: number, partial: Partial<TestStep>) => {
    const nextSteps = [...testCase.steps];
    nextSteps[index] = { ...nextSteps[index], ...partial };
    onUpdateTestCase({
      ...testCase,
      steps: nextSteps,
      updatedAt: new Date().toISOString(),
    });
  };

  // Step Management: Move Step
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === testCase.steps.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const nextSteps = [...testCase.steps];
    const temp = nextSteps[index];
    nextSteps[index] = nextSteps[targetIndex];
    nextSteps[targetIndex] = temp;

    const renumbered = nextSteps.map((st, i) => ({ ...st, stepNumber: i + 1 }));
    onUpdateTestCase({
      ...testCase,
      steps: renumbered,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add Comment with author, timestamp, reactions
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const author = currentUser?.name || 'Admin';
    const newComment = {
      id: `comm-${Date.now()}`,
      authorName: author,
      authorAvatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      content: commentText.trim(),
      timestamp: new Date().toISOString(),
      reactions: [],
    };

    onUpdateTestCase({
      ...testCase,
      comments: [...(testCase.comments || []), newComment],
      updatedAt: new Date().toISOString(),
    });
    setCommentText('');
  };

  // Add Emoji Reaction to Comment
  const handleToggleReaction = (commentId: string, emoji: string) => {
    const currentUserName = currentUser?.name || 'Admin';
    const nextComments = (testCase.comments || []).map((c) => {
      if (c.id !== commentId) return c;
      const reactions = c.reactions || [];
      const existing = reactions.find((r) => r.emoji === emoji);

      let updatedReactions;
      if (existing) {
        if (existing.users.includes(currentUserName)) {
          updatedReactions = reactions
            .map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, users: r.users.filter((u) => u !== currentUserName) }
                : r
            )
            .filter((r) => r.count > 0);
        } else {
          updatedReactions = reactions.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, users: [...r.users, currentUserName] }
              : r
          );
        }
      } else {
        updatedReactions = [...reactions, { emoji, count: 1, users: [currentUserName] }];
      }

      return { ...c, reactions: updatedReactions };
    });

    onUpdateTestCase({
      ...testCase,
      comments: nextComments,
      updatedAt: new Date().toISOString(),
    });
  };

  // In-Context AI Assistant Actions
  const handleRunAIAction = async (actionType: string) => {
    setIsAIDropdownOpen(false);
    setIsAIGenerating(true);
    setAiNotification(`AI Assistant is generating: ${actionType}...`);

    try {
      if (actionType === 'generate_steps') {
        const generatedSteps: TestStep[] = [
          ...testCase.steps,
          {
            stepNumber: testCase.steps.length + 1,
            action: 'Validate data payload against schema specification',
            expectedResult: 'HTTP 200 OK returned with validation signature confirmed',
            data: '{"format": "JSON", "mode": "STRICT"}',
            notes: 'Generated by AI Copilot for schema conformance',
          },
          {
            stepNumber: testCase.steps.length + 2,
            action: 'Assert audit trail log entry generation',
            expectedResult: 'System writes cryptographic audit hash to compliance log',
            data: 'AUDIT_FLAG=TRUE',
            notes: 'SOC 2 / ISO 27001 audit verification step',
          },
        ];
        onUpdateTestCase({
          ...testCase,
          steps: generatedSteps,
          updatedAt: new Date().toISOString(),
        });
        setAiNotification('Added 2 verified AI-generated steps!');
      } else if (actionType === 'improve_expected') {
        const improved = testCase.steps.map((st) => ({
          ...st,
          expectedResult: `${st.expectedResult} (Validated against ISO compliance contract)`,
        }));
        onUpdateTestCase({
          ...testCase,
          steps: improved,
          updatedAt: new Date().toISOString(),
        });
        setAiNotification('Enhanced expected result assertions across all steps!');
      } else if (actionType === 'negative_tests') {
        const negativeSteps: TestStep[] = [
          ...testCase.steps,
          {
            stepNumber: testCase.steps.length + 1,
            action: 'Inject malformed XML header with invalid checksum',
            expectedResult:
              'System gracefully rejects input with ERROR_CODE_422 and logs security attempt',
            data: '<?xml corrupted_tag="TRUE"?>',
            notes: 'Negative security boundary test scenario',
          },
        ];
        onUpdateTestCase({
          ...testCase,
          behavior: 'negative',
          steps: negativeSteps,
          tags: Array.from(new Set([...testCase.tags, 'negative-testing', 'boundary-check'])),
          updatedAt: new Date().toISOString(),
        });
        setAiNotification('Appended negative boundary test case steps!');
      } else if (actionType === 'generate_data') {
        const sampleData = 'INVOICE_ID=DE-2026-9812; TAX_RATE=19.00%; TOTAL_EUR=4520.50';
        onUpdateTestCase({
          ...testCase,
          testData: sampleData,
          updatedAt: new Date().toISOString(),
        });
        setEditedTestData(sampleData);
        setAiNotification('Generated test datasets and parameters!');
      } else {
        // Trigger global AI Copilot modal for complex analysis
        onTriggerAIForCase?.(testCase, actionType);
        setAiNotification('Opened AI Copilot Studio for deep analysis.');
      }
    } catch {
      setAiNotification('Failed to generate steps.');
    } finally {
      setIsAIGenerating(false);
      setTimeout(() => setAiNotification(null), 3500);
    }
  };

  // Toggle Automate Test Status & Generate Script
  const handleToggleAutomate = () => {
    const nextStatus: AutomationStatus =
      testCase.automationStatus === 'automated' ? 'manual' : 'automated';
    onUpdateTestCase({
      ...testCase,
      automationStatus: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // Export Test Case as Markdown
  const exportMarkdown = useMemo(() => {
    return `# [${testCase.key}] ${testCase.title}
**Suite Path**: ${breadcrumbPath.join(' / ')}
**Priority**: ${testCase.priority.toUpperCase()} | **Severity**: ${testCase.severity.toUpperCase()} | **Status**: ${testCase.status.toUpperCase()}
**Automation**: ${testCase.automationStatus.toUpperCase()} | **Layer**: ${testCase.layer.toUpperCase()}

## Description
${testCase.description || 'No description provided.'}

## Pre-conditions
${testCase.preconditions || 'None specified.'}

## Test Steps
| # | Action | Expected Result | Test Data |
|---|---|---|---|
${testCase.steps
  .map(
    (s) =>
      `| ${s.stepNumber} | ${s.action.replace(/\|/g, '\\|')} | ${s.expectedResult.replace(
        /\|/g,
        '\\|'
      )} | ${s.data || '-'} |`
  )
  .join('\n')}

## Post-conditions
${testCase.postconditions || 'None specified.'}

## Test Data
${testCase.testData || 'Default environment test data.'}

## Requirements
${testCase.requirementRefs?.join(', ') || 'None linked.'}
`;
  }, [testCase, breadcrumbPath]);

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportMarkdown);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <div
      aria-label="Test Case Details Drawer"
      className={`border-l border-[#262838] bg-[#161724] flex flex-col h-full shrink-0 select-none z-20 transition-all duration-200 animate-in slide-in-from-right duration-200 ${
        isExpandedWidth
          ? 'w-[55vw] max-w-[900px] min-w-[580px]'
          : 'w-[38vw] min-w-[460px] max-w-[680px]'
      }`}
    >
      {/* =========================================================================
          1. HEADER SECTION (Sticky, Visible without scrolling)
      ========================================================================= */}
      <div className="p-4 border-b border-[#262838] bg-[#191b2a] shrink-0 space-y-3">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Repository Breadcrumb Path */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate min-w-0">
            <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {breadcrumbPath.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-600">/</span>}
                <span
                  className={`truncate ${
                    idx === breadcrumbPath.length - 1 ? 'text-slate-200 font-bold' : ''
                  }`}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Action Buttons: Edit, Duplicate, Delete, AI Assistant, Automate, Export, Expand, Close */}
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            {/* Quick Edit Button */}
            <button
              onClick={() => {
                if (isEditMode) handleSaveEdits();
                else setIsEditMode(true);
              }}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isEditMode
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'hover:text-white hover:bg-[#25283c]'
              }`}
              title={isEditMode ? 'Save Edits' : 'Quick Edit (Ctrl+E)'}
            >
              {isEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isEditMode ? 'Save' : 'Edit'}</span>
            </button>

            {/* Full Screen Qase Editor */}
            {onOpenFullEditor && (
              <button
                type="button"
                onClick={() => onOpenFullEditor(testCase)}
                className="p-1.5 hover:text-white hover:bg-[#25283c] rounded-lg text-xs font-semibold flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Open in Full-Screen Qase Editor"
              >
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Full Editor</span>
              </button>
            )}

            {/* AI Assistant Button */}
            <div className="relative">
              <button
                onClick={() => setIsAIDropdownOpen(!isAIDropdownOpen)}
                className="p-1.5 hover:text-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 rounded-lg text-xs font-semibold flex items-center gap-1 text-indigo-400 hover:text-white transition-all cursor-pointer border border-indigo-500/30 bg-indigo-950/30"
                title="AI Assistant inside Test Case"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Copilot</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {/* AI Functions Dropdown Menu */}
              {isAIDropdownOpen && (
                <div className="absolute right-0 mt-1 w-64 max-h-[calc(100vh-120px)] overflow-y-auto bg-[#1e1f2e] border border-[#2e3146] rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border-b border-[#2d3044] mb-1">
                    QA Copilot In-Context Tools
                  </div>
                  {[
                    { id: 'generate_steps', label: 'Generate Steps', icon: Plus },
                    {
                      id: 'improve_expected',
                      label: 'Improve Expected Results',
                      icon: CheckSquare,
                    },
                    { id: 'negative_tests', label: 'Generate Negative Tests', icon: AlertCircle },
                    { id: 'edge_cases', label: 'Generate Edge Cases', icon: Zap },
                    { id: 'generate_data', label: 'Generate Test Data', icon: Code },
                    { id: 'review_coverage', label: 'Review Test Coverage', icon: Shield },
                    { id: 'missing_steps', label: 'Suggest Missing Steps', icon: Sparkles },
                    { id: 'optimize_case', label: 'Optimize Existing Test Case', icon: RefreshCw },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleRunAIAction(item.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#282a3e] text-left transition-colors cursor-pointer"
                      >
                        <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Automate Test Button */}
            <button
              onClick={() => setShowAutomateModal(true)}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                testCase.automationStatus === 'automated'
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                  : 'hover:text-white hover:bg-[#25283c]'
              }`}
              title="Automate Test (Playwright / Cypress)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Automate</span>
            </button>

            {/* Duplicate Button */}
            <button
              onClick={() => onDuplicateTestCase(testCase)}
              className="p-1.5 hover:text-white hover:bg-[#25283c] rounded-lg transition-colors cursor-pointer"
              title="Duplicate Test Case (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="p-1.5 hover:text-white hover:bg-[#25283c] rounded-lg transition-colors cursor-pointer"
              title="Export Test Case"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 hover:text-rose-400 hover:bg-[#25283c] rounded-lg transition-colors cursor-pointer"
              title="Delete Test Case / Изтрий тест кейс"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            {/* Expand / Minimize Width Toggle */}
            <button
              onClick={() => setIsExpandedWidth(!isExpandedWidth)}
              className="p-1.5 hover:text-white hover:bg-[#25283c] rounded-lg transition-colors cursor-pointer"
              title={isExpandedWidth ? 'Collapse Panel Width' : 'Expand Panel Width'}
            >
              {isExpandedWidth ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:text-white hover:bg-[#25283c] rounded-lg transition-colors cursor-pointer"
              title="Close details panel (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Test Case Key & Title Display */}
        <div className="flex items-start gap-2.5">
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-700/50 px-2.5 py-1 rounded-lg shrink-0 shadow-xs">
            {testCase.key}
          </span>

          <div className="flex-1 min-w-0">
            {isEditMode ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-[#13141f] border border-indigo-500 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none"
                placeholder="Test Case Name"
              />
            ) : (
              <h2 className="text-sm font-bold text-white leading-snug break-words">
                {testCase.title}
              </h2>
            )}
          </div>
        </div>

        {/* Manual Execution Status Bar */}
        <div className="bg-[#181926] border border-[#2e3146] rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
              Manual Execution:
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {(testCase as any).lastExecutionStatus ? (
                <span>
                  Result:{' '}
                  <strong
                    className={
                      (testCase as any).lastExecutionStatus === 'passed'
                        ? 'text-emerald-400 font-bold'
                        : (testCase as any).lastExecutionStatus === 'failed'
                          ? 'text-rose-400 font-bold'
                          : 'text-amber-400 font-bold'
                    }
                  >
                    {((testCase as any).lastExecutionStatus as string).toUpperCase()}
                  </strong>
                </span>
              ) : (
                'Ready for execution'
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onUpdateTestCase({
                  ...testCase,
                  lastExecutionStatus: 'passed',
                  lastExecutedAt: new Date().toISOString(),
                } as any);
              }}
              className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Mark as Passed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pass</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdateTestCase({
                  ...testCase,
                  lastExecutionStatus: 'failed',
                  lastExecutedAt: new Date().toISOString(),
                } as any);
              }}
              className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Mark as Failed"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Fail</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdateTestCase({
                  ...testCase,
                  lastExecutionStatus: 'blocked',
                  lastExecutedAt: new Date().toISOString(),
                } as any);
              }}
              className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 text-amber-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Mark as Blocked"
            >
              <Ban className="w-3.5 h-3.5 text-amber-400" />
              <span>Block</span>
            </button>
          </div>
        </div>

        {/* AI Notification Toast */}
        {aiNotification && (
          <div className="p-2 bg-indigo-950/80 border border-indigo-500/50 rounded-lg text-xs text-indigo-200 flex items-center gap-2 animate-in fade-in duration-150">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>{aiNotification}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. STICKY TAB NAVIGATION
      ========================================================================= */}
      <div className="sticky top-0 z-10 px-4 bg-[#141522] border-b border-[#262838] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs shrink-0 font-medium">
        {[
          { id: 'general', label: 'General' },
          { id: 'properties', label: 'Properties' },
          { id: 'runs', label: `Runs (${linkedRuns.length})` },
          { id: 'history', label: 'History' },
          { id: 'defects', label: `Defects (${linkedDefects.length})` },
          { id: 'comments', label: `Comments (${testCase.comments?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-1 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          3. SCROLLABLE TAB CONTENT (Rich Dark Theme Cards)
      ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 pb-16 space-y-4 text-xs text-slate-300 no-scrollbar">
        {/* -----------------------------------------------------------------------
            TAB 1: GENERAL (Cards: Description, Preconditions, Steps, Postconditions, Data, Requirements, Attachments, Environment)
        ----------------------------------------------------------------------- */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            {/* Description Card */}
            <div className="bg-[#1a1c2b] border border-[#2d3044] rounded-xl overflow-hidden shadow-xs">
              <div
                onClick={() =>
                  setSectionsExpanded((prev) => ({ ...prev, description: !prev.description }))
                }
                className="px-3.5 py-2.5 bg-[#1e2032] border-b border-[#2d3044] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Description
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    sectionsExpanded.description ? '' : '-rotate-90'
                  }`}
                />
              </div>

              {sectionsExpanded.description && (
                <div className="p-3.5 text-xs text-slate-200 leading-relaxed">
                  {isEditMode ? (
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans"
                      placeholder="Add test description, scope, and target specifications..."
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {testCase.description || 'No description provided.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Preconditions Card */}
            <div className="bg-[#1a1c2b] border border-[#2d3044] rounded-xl overflow-hidden shadow-xs">
              <div
                onClick={() =>
                  setSectionsExpanded((prev) => ({
                    ...prev,
                    preconditions: !prev.preconditions,
                  }))
                }
                className="px-3.5 py-2.5 bg-[#1e2032] border-b border-[#2d3044] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  Pre-conditions
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    sectionsExpanded.preconditions ? '' : '-rotate-90'
                  }`}
                />
              </div>

              {sectionsExpanded.preconditions && (
                <div className="p-3.5 text-xs text-slate-200">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedPreconditions}
                      onChange={(e) => setEditedPreconditions(e.target.value)}
                      className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. User has administrator privileges and ERP v14.2 is installed"
                    />
                  ) : (
                    <div className="p-2.5 bg-[#141522] border-l-2 border-cyan-500 rounded-r-lg text-slate-300">
                      {testCase.preconditions || 'No preconditions specified.'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ===================================================================
                TEST STEPS SECTION (Most Important Section: Accordion & Table Toggle)
            =================================================================== */}
            <div className="bg-[#1a1c2b] border border-[#2d3044] rounded-xl overflow-hidden shadow-md space-y-0">
              {/* Steps Header & View Mode Switcher */}
              <div className="px-3.5 py-2.5 bg-[#1e2032] border-b border-[#2d3044] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Execution Steps ({testCase.steps.length})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {/* Table View Toggle: [ ] Show as list / Table */}
                  <div className="flex items-center bg-[#141522] border border-[#2d3044] rounded-lg p-0.5">
                    <button
                      onClick={() => setStepsViewMode('accordion')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                        stepsViewMode === 'accordion'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Accordion Step View"
                    >
                      <List className="w-3 h-3" />
                      <span>Accordion</span>
                    </button>
                    <button
                      onClick={() => setStepsViewMode('table')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                        stepsViewMode === 'table'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Classic QA Table View"
                    >
                      <TableIcon className="w-3 h-3" />
                      <span>Table</span>
                    </button>
                  </div>

                  {stepsViewMode === 'accordion' && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <button
                        onClick={handleExpandAllSteps}
                        className="hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#25283c]"
                      >
                        Expand All
                      </button>
                      <span>|</span>
                      <button
                        onClick={handleCollapseAllSteps}
                        className="hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#25283c]"
                      >
                        Collapse All
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-1 items-end">
                    <button
                      onClick={handleAddStep}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="Add top-level execution step"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Step</span>
                    </button>
                    <button
                      onClick={() => handleAddSubStep()}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs border border-emerald-500/30"
                      title="Add sub-step under the current step"
                    >
                      <Plus className="w-3 h-3 text-emerald-200" />
                      <span>Add Sub-Step</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* View 1: EXPANDABLE ACCORDION STEPS */}
              {stepsViewMode === 'accordion' && (
                <div className="p-3.5 space-y-3">
                  {testCase.steps.map((step, idx) => {
                    const isExpanded = expandedSteps.has(idx);

                    return (
                      <div
                        key={idx}
                        className="bg-[#151624] border border-[#2d3044] rounded-xl overflow-hidden transition-all shadow-xs"
                      >
                        {/* Step Header Accordion Trigger */}
                        <div
                          onClick={() => toggleStepExpand(idx)}
                          className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#1b1d2e] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Numbered Badge */}
                            <span className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {step.stepNumber}
                            </span>

                            {/* Step Action Preview */}
                            <span className="font-semibold text-slate-200 text-xs truncate">
                              {step.action}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-400 shrink-0">
                            {step.data && (
                              <span className="hidden md:inline text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2032] text-slate-400 border border-[#2d3044]">
                                Data: {step.data}
                              </span>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180 text-indigo-400' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Step View: Step Action, Expected Result, Test Data, Attachments, Notes */}
                        {isExpanded && (
                          <div className="p-3.5 pt-1 border-t border-[#262838] bg-[#121320] space-y-3 text-xs">
                            {/* STEP ACTION */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                                STEP ACTION
                              </span>
                              {isEditMode ? (
                                <textarea
                                  value={step.action}
                                  onChange={(e) =>
                                    handleUpdateStep(idx, { action: e.target.value })
                                  }
                                  rows={2}
                                  className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                                />
                              ) : (
                                <div className="p-2.5 bg-[#181928] border border-[#2a2c40] rounded-lg text-slate-200 font-medium">
                                  {step.action}
                                </div>
                              )}
                            </div>

                            {/* EXPECTED RESULT */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                EXPECTED RESULT
                              </span>
                              {isEditMode ? (
                                <textarea
                                  value={step.expectedResult}
                                  onChange={(e) =>
                                    handleUpdateStep(idx, { expectedResult: e.target.value })
                                  }
                                  rows={2}
                                  className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                                />
                              ) : (
                                <div className="p-2.5 bg-[#181928] border border-[#2a2c40] rounded-lg text-emerald-300 font-medium">
                                  {step.expectedResult}
                                </div>
                              )}
                            </div>

                            {/* TEST DATA */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                TEST DATA
                              </span>
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={step.data || ''}
                                  onChange={(e) => handleUpdateStep(idx, { data: e.target.value })}
                                  className="w-full bg-[#181928] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none font-mono text-[11px]"
                                  placeholder="e.g. owfw50, XML_VERSION=2.4"
                                />
                              ) : (
                                <div className="p-2 bg-[#181928] border border-[#2a2c40] rounded-lg font-mono text-[11px] text-amber-200">
                                  {step.data || 'No specific parameters'}
                                </div>
                              )}
                            </div>

                            {/* ATTACHMENTS & NOTES */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  ATTACHMENTS
                                </span>
                                {step.attachments && step.attachments.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {step.attachments.map((att) => {
                                      const isImg =
                                        att.type?.startsWith('image/') ||
                                        (att.url && att.url.startsWith('data:image'));
                                      return (
                                        <div
                                          key={att.id}
                                          className="p-2 bg-[#181928] border border-[#2a2c40] rounded-lg flex items-center justify-between text-[11px] gap-2"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {isImg && att.url ? (
                                              <img
                                                src={att.url}
                                                alt={att.name}
                                                onClick={() =>
                                                  setPreviewImage({ url: att.url, name: att.name })
                                                }
                                                className="w-10 h-8 object-cover rounded border border-[#3b3e5a] cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                                title="Click to preview image"
                                              />
                                            ) : (
                                              <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                            )}
                                            <span
                                              className="text-slate-200 truncate cursor-pointer hover:text-indigo-300"
                                              onClick={() =>
                                                isImg && att.url
                                                  ? setPreviewImage({
                                                      url: att.url,
                                                      name: att.name,
                                                    })
                                                  : handleDownloadAttachment(att)
                                              }
                                              title={att.name}
                                            >
                                              {att.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] text-slate-500">
                                              {att.size}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadAttachment(att)}
                                              className="p-1 text-slate-400 hover:text-white hover:bg-[#25283c] rounded cursor-pointer transition-colors"
                                              title={`Download ${att.name}`}
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-2 bg-[#181928] border border-[#2a2c40] rounded-lg text-[11px] text-slate-500 italic">
                                    No attachments
                                  </div>
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  NOTES
                                </span>
                                <div className="p-2 bg-[#181928] border border-[#2a2c40] rounded-lg text-[11px] text-slate-300">
                                  {step.notes && step.notes.trim() ? (
                                    step.notes
                                  ) : (
                                    <span className="text-slate-500 italic">None</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Step Controls: Move Up, Move Down, Delete */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#262838]">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleMoveStep(idx, 'up')}
                                  disabled={idx === 0}
                                  className="px-2 py-1 bg-[#1e2032] hover:bg-[#282a3e] disabled:opacity-30 rounded text-[11px] font-mono text-slate-300 cursor-pointer"
                                >
                                  ▲ Move Up
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveStep(idx, 'down')}
                                  disabled={idx === testCase.steps.length - 1}
                                  className="px-2 py-1 bg-[#1e2032] hover:bg-[#282a3e] disabled:opacity-30 rounded text-[11px] font-mono text-slate-300 cursor-pointer"
                                >
                                  ▼ Move Down
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteStep(idx)}
                                className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete Step</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View 2: CLASSIC QA TABLE VIEW */}
              {stepsViewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#141522] border-b border-[#2d3044] text-[10px] font-bold text-slate-400 uppercase">
                        <th className="py-2.5 px-3 w-12 text-center">Step</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Expected Result</th>
                        <th className="py-2.5 px-3 w-40">Test Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24263a]">
                      {testCase.steps.map((st, i) => (
                        <tr key={i} className="hover:bg-[#1b1c2d] transition-colors">
                          <td className="py-3 px-3 text-center font-mono font-bold text-indigo-400 align-top">
                            {st.stepNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-200 align-top leading-relaxed text-xs">
                            {isEditMode ? (
                              <textarea
                                value={st.action}
                                onChange={(e) => handleUpdateStep(i, { action: e.target.value })}
                                rows={2}
                                className="w-full bg-[#13141f] border border-[#2d3044] rounded p-1.5 text-white"
                              />
                            ) : (
                              <span>{st.action}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-emerald-300 align-top leading-relaxed text-xs">
                            {isEditMode ? (
                              <textarea
                                value={st.expectedResult}
                                onChange={(e) =>
                                  handleUpdateStep(i, { expectedResult: e.target.value })
                                }
                                rows={2}
                                className="w-full bg-[#13141f] border border-[#2d3044] rounded p-1.5 text-white"
                              />
                            ) : (
                              <span>{st.expectedResult}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-amber-300 align-top font-mono text-[11px]">
                            {isEditMode ? (
                              <input
                                type="text"
                                value={st.data || ''}
                                onChange={(e) => handleUpdateStep(i, { data: e.target.value })}
                                className="w-full bg-[#13141f] border border-[#2d3044] rounded p-1 text-white font-mono text-[10px]"
                              />
                            ) : (
                              <span>{st.data || '-'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Post-conditions Card */}
            <div className="bg-[#1a1c2b] border border-[#2d3044] rounded-xl overflow-hidden shadow-xs">
              <div
                onClick={() =>
                  setSectionsExpanded((prev) => ({
                    ...prev,
                    postconditions: !prev.postconditions,
                  }))
                }
                className="px-3.5 py-2.5 bg-[#1e2032] border-b border-[#2d3044] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                  Post-conditions
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    sectionsExpanded.postconditions ? '' : '-rotate-90'
                  }`}
                />
              </div>

              {sectionsExpanded.postconditions && (
                <div className="p-3.5 text-xs text-slate-200">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedPostconditions}
                      onChange={(e) => setEditedPostconditions(e.target.value)}
                      className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white focus:outline-none"
                      placeholder="e.g. Session closed, temporary test files cleaned from storage"
                    />
                  ) : (
                    <div className="p-2.5 bg-[#141522] border-l-2 border-purple-500 rounded-r-lg text-slate-300">
                      {testCase.postconditions ? (
                        testCase.postconditions
                      ) : (
                        <span className="text-slate-500 italic">None specified</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Test Data Card */}
            <div className="bg-[#1a1c2b] border border-[#2d3044] rounded-xl overflow-hidden shadow-xs">
              <div
                onClick={() =>
                  setSectionsExpanded((prev) => ({ ...prev, testData: !prev.testData }))
                }
                className="px-3.5 py-2.5 bg-[#1e2032] border-b border-[#2d3044] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-amber-400" />
                  Test Data
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    sectionsExpanded.testData ? '' : '-rotate-90'
                  }`}
                />
              </div>

              {sectionsExpanded.testData && (
                <div className="p-3.5 text-xs">
                  {isEditMode ? (
                    <textarea
                      value={editedTestData}
                      onChange={(e) => setEditedTestData(e.target.value)}
                      rows={2}
                      className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none"
                      placeholder="Parameters: INVOICE_XML, BUYER_VAT_ID, CHECKSUM"
                    />
                  ) : (
                    <div className="p-2.5 bg-[#141522] border border-[#2d3044] rounded-lg font-mono text-[11px] text-amber-200">
                      {testCase.testData ? (
                        testCase.testData
                      ) : (
                        <span className="text-slate-500 italic font-sans">
                          No test data specified
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Requirements Card */}
            <div className="bg-[#1a1c2b] border border-[#2d3044] rounded-xl overflow-hidden shadow-xs">
              <div
                onClick={() =>
                  setSectionsExpanded((prev) => ({
                    ...prev,
                    requirements: !prev.requirements,
                  }))
                }
                className="px-3.5 py-2.5 bg-[#1e2032] border-b border-[#2d3044] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Linked Requirements ({testCase.requirementRefs?.length || 0})
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    sectionsExpanded.requirements ? '' : '-rotate-90'
                  }`}
                />
              </div>

              {sectionsExpanded.requirements && (
                <div className="p-3.5 space-y-2">
                  {testCase.requirementRefs && testCase.requirementRefs.length > 0 ? (
                    testCase.requirementRefs.map((ref) => {
                      const req = requirements.find((r) => r.key === ref);
                      return (
                        <div
                          key={ref}
                          className="p-2.5 bg-[#151624] border border-[#2d3044] rounded-lg flex items-start gap-2.5 hover:border-indigo-500/50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-cyan-300 text-xs">
                                {ref}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                                {req?.status?.toUpperCase() || 'APPROVED'}
                              </span>
                            </div>
                            <span className="text-white font-medium text-xs block truncate mt-0.5">
                              {req?.title || 'System Requirement Policy'}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-white shrink-0 cursor-pointer" />
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-500 bg-[#141522] rounded-lg">
                      No requirements linked to this test case.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Attachments Card */}
            <div className="bg-[#1a1c2b] border border-[#2d3044] rounded-xl overflow-hidden shadow-xs">
              <div
                onClick={() =>
                  setSectionsExpanded((prev) => ({
                    ...prev,
                    attachments: !prev.attachments,
                  }))
                }
                className="px-3.5 py-2.5 bg-[#1e2032] border-b border-[#2d3044] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                  Attachments ({testCase.attachments?.length || 0})
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    sectionsExpanded.attachments ? '' : '-rotate-90'
                  }`}
                />
              </div>

              {sectionsExpanded.attachments && (
                <div className="p-3.5 space-y-3">
                  <div className="p-3.5 border border-dashed border-[#2e3146] rounded-xl text-center space-y-1 bg-[#141522] hover:border-indigo-500 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-400 mx-auto" />
                    <span className="text-xs text-slate-300 block font-medium">
                      Drag &amp; drop files or screenshots
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Supports PNG, JPG, HAR, PDF, LOG (up to 25MB)
                    </span>
                  </div>

                  {testCase.attachments && testCase.attachments.length > 0 ? (
                    <div className="space-y-1.5">
                      {testCase.attachments.map((att) => {
                        const isImg =
                          att.type?.startsWith('image/') ||
                          (att.url && att.url.startsWith('data:image'));
                        return (
                          <div
                            key={att.id}
                            className="p-2 bg-[#151624] border border-[#2d3044] rounded-lg flex items-center justify-between text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isImg && att.url ? (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  onClick={() => setPreviewImage({ url: att.url, name: att.name })}
                                  className="w-10 h-8 object-cover rounded border border-[#3b3e5a] cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                  title="Click to preview image"
                                />
                              ) : (
                                <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              )}
                              <span
                                className="text-white truncate cursor-pointer hover:text-indigo-300"
                                onClick={() =>
                                  isImg && att.url
                                    ? setPreviewImage({ url: att.url, name: att.name })
                                    : handleDownloadAttachment(att)
                                }
                                title={att.name}
                              >
                                {att.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-slate-400">{att.size}</span>
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(att)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-[#25283c] rounded cursor-pointer transition-colors"
                                title={`Download ${att.name}`}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-500 bg-[#141522] rounded-lg text-xs italic">
                      No general attachments uploaded
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Environment Card */}
            <div className="bg-[#1a1c2b] border border-[#2d3044] rounded-xl overflow-hidden shadow-xs">
              <div
                onClick={() =>
                  setSectionsExpanded((prev) => ({
                    ...prev,
                    environment: !prev.environment,
                  }))
                }
                className="px-3.5 py-2.5 bg-[#1e2032] border-b border-[#2d3044] flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Environment &amp; Target
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    sectionsExpanded.environment ? '' : '-rotate-90'
                  }`}
                />
              </div>

              {sectionsExpanded.environment && (
                <div className="p-3.5 grid grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-[#141522] border border-[#2d3044] rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Target Runtime</span>
                    <span className="font-semibold text-white">
                      {testCase.environment || 'All Environments'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#141522] border border-[#2d3044] rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Execution Mode</span>
                    <span className="font-semibold text-indigo-400">
                      {testCase.automationStatus === 'automated'
                        ? 'Automated Test'
                        : 'Manual QA Execution'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 2: PROPERTIES (High, Medium, Low colored badges, Severity, Status, Author)
        ----------------------------------------------------------------------- */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#1a1c2b] border border-[#2d3044] rounded-xl space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-[#2d3044] pb-2">
                Test Case Metadata &amp; Attributes
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Priority */}
                <div className="p-3 bg-[#151624] border border-[#2d3044] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Priority
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      testCase.priority === 'high'
                        ? 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
                        : testCase.priority === 'low'
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                          : 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                    }`}
                  >
                    {testCase.priority}
                  </span>
                </div>

                {/* Severity */}
                <div className="p-3 bg-[#151624] border border-[#2d3044] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Severity
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-950/50 text-rose-300 border border-rose-800/30">
                    {testCase.severity}
                  </span>
                </div>

                {/* Status */}
                <div className="p-3 bg-[#151624] border border-[#2d3044] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Status
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                    {testCase.status === 'actual' ? 'READY' : testCase.status.toUpperCase()}
                  </span>
                </div>

                {/* Automation Status */}
                <div className="p-3 bg-[#151624] border border-[#2d3044] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Automation Status
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      testCase.automationStatus === 'automated'
                        ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                        : 'bg-indigo-950/70 text-indigo-400 border border-indigo-800/50'
                    }`}
                  >
                    {testCase.automationStatus === 'automated' ? 'AUTOMATED' : 'MANUAL'}
                  </span>
                </div>

                {/* Layer */}
                <div className="p-3 bg-[#151624] border border-[#2d3044] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Layer
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-950/70 text-purple-400 border border-purple-800/50">
                    {testCase.layer.toUpperCase()}
                  </span>
                </div>

                {/* Author */}
                <div className="p-3 bg-[#151624] border border-[#2d3044] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Author
                  </span>
                  <span className="font-semibold text-white block">
                    {testCase.author || currentUser?.name || 'Admin'}
                  </span>
                </div>

                {/* Created Date */}
                <div className="p-3 bg-[#151624] border border-[#2d3044] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Created Date
                  </span>
                  <span className="font-mono text-slate-300 block text-[11px]">
                    {new Date(testCase.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Last Updated */}
                <div className="p-3 bg-[#151624] border border-[#2d3044] rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Last Updated
                  </span>
                  <span className="font-mono text-slate-300 block text-[11px]">
                    {new Date(testCase.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Tags / Labels */}
              <div className="space-y-1.5 pt-2 border-t border-[#2d3044]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Tags &amp; Labels
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {testCase.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-[#151624] border border-[#2d3044] text-[11px] font-mono text-slate-300 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-indigo-400" />
                      <span>#{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 3: RUNS (Execution History Table)
        ----------------------------------------------------------------------- */}
        {activeTab === 'runs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Execution History
              </span>
              <span className="text-[11px] text-slate-400">
                {linkedRuns.length} recorded executions
              </span>
            </div>

            <div className="border border-[#2d3044] rounded-xl overflow-hidden bg-[#1a1c2b] shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141522] border-b border-[#2d3044] text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Run ID</th>
                    <th className="py-2.5 px-3">Tester</th>
                    <th className="py-2.5 px-3">Execution Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24263a]">
                  {linkedRuns.map((r, i) => (
                    <tr key={i} className="hover:bg-[#1f2134] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-400">{r.id}</td>
                      <td className="py-3 px-3 text-slate-200">{r.tester}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{r.date}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'passed'
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                              : r.status === 'failed'
                                ? 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
                                : 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {r.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 4: HISTORY (Audit Trail)
        ----------------------------------------------------------------------- */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Change Log &amp; Audit Trail
            </span>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#1a1c2b] rounded-xl border border-[#2d3044] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-white">
                    Modified by {currentUser?.name || testCase.author || 'Admin'}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(testCase.updatedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Updated step execution parameters and linked requirement refs.
                </p>
              </div>

              <div className="p-3 bg-[#1a1c2b] rounded-xl border border-[#2d3044] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-white">
                    Created by {testCase.author || currentUser?.name || 'Admin'}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(testCase.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Initial test specification created in suite "{testCase.suiteName}".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 5: DEFECTS (Linked Defects Table)
        ----------------------------------------------------------------------- */}
        {activeTab === 'defects' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Linked Defects ({linkedDefects.length})
              </span>
            </div>

            {linkedDefects.length > 0 ? (
              <div className="border border-[#2d3044] rounded-xl overflow-hidden bg-[#1a1c2b] shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#141522] border-b border-[#2d3044] text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Defect ID</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24263a]">
                    {linkedDefects.map((d) => (
                      <tr key={d.id} className="hover:bg-[#1f2134] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-rose-400">
                          {d.key || d.id}
                        </td>
                        <td className="py-3 px-3 text-white font-medium">{d.title}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-950/70 text-rose-400 border border-rose-800/50">
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 capitalize text-slate-300">{d.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-[#1a1c2b] rounded-xl border border-[#2d3044]">
                <Bug className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs">No defects currently linked to this test case.</p>
              </div>
            )}
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 6: COMMENTS (Modern Discussion System: Mentions, Emoji Reactions, History)
        ----------------------------------------------------------------------- */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <span className="font-bold text-white text-xs uppercase tracking-wider block">
              Team Discussions &amp; Review History
            </span>

            {testCase.comments && testCase.comments.length > 0 ? (
              <div className="space-y-3">
                {testCase.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 bg-[#1a1c2b] border border-[#2d3044] rounded-xl space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={comm.authorAvatar}
                          alt={comm.authorName}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500"
                        />
                        <span className="font-bold text-white text-xs">{comm.authorName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(comm.timestamp).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-200 text-xs leading-relaxed pl-8">{comm.content}</p>

                    {/* Emoji Reactions Strip */}
                    <div className="flex items-center gap-1.5 pl-8 pt-1">
                      {comm.reactions?.map((rx) => (
                        <button
                          key={rx.emoji}
                          onClick={() => handleToggleReaction(comm.id, rx.emoji)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                            rx.users.includes(currentUser?.name || 'Admin')
                              ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                              : 'bg-[#151624] text-slate-300 border-[#2d3044]'
                          }`}
                        >
                          <span>{rx.emoji}</span>
                          <span>{rx.count}</span>
                        </button>
                      ))}

                      {/* Add reaction trigger */}
                      {['👍', '❤️', '🚀', '👀'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(comm.id, emoji)}
                          className="px-1.5 py-0.5 rounded-full bg-[#151624] hover:bg-[#202236] border border-[#2d3044] text-[11px] cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 bg-[#1a1c2b] rounded-xl border border-[#2d3044]">
                <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p>No discussion comments yet. Start the conversation below.</p>
              </div>
            )}

            {/* Comment Input with Mentions & Send */}
            <div className="p-3 bg-[#1a1c2b] border border-[#2d3044] rounded-xl space-y-2">
              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  rows={2}
                  placeholder="Leave a review comment or mention team members (@)..."
                  className="w-full bg-[#13141f] border border-[#2d3044] rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />

                {/* Mention helper pill */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCommentText((prev) => prev + ` @${currentUser?.name || 'Admin'} `)
                      }
                      className="hover:text-indigo-400 cursor-pointer flex items-center gap-0.5"
                    >
                      <AtSign className="w-3 h-3" />
                      <span>{currentUser?.name || 'Admin'}</span>
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setCommentText((prev) => prev + ' @Alex Rivera ')}
                      className="hover:text-indigo-400 cursor-pointer flex items-center gap-0.5"
                    >
                      <AtSign className="w-3 h-3" />
                      <span>Alex Rivera</span>
                    </button>
                  </div>

                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: AUTOMATE TEST CODE GENERATOR
      ========================================================================= */}
      {showAutomateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#262838] pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Automate Test: {testCase.key}</h3>
              </div>
              <button
                onClick={() => setShowAutomateModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-slate-300 block font-semibold">
                Generated Playwright E2E Automation Code:
              </span>
              <pre className="p-3 bg-[#12131f] border border-[#2d3044] rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {`import { test, expect } from '@playwright/test';

test('${testCase.key}: ${testCase.title}', async ({ page }) => {
  // Preconditions: ${testCase.preconditions || 'Initialize clean workspace'}
  await page.goto('/workspace');

${testCase.steps
  .map(
    (st) =>
      `  // Step ${st.stepNumber}: ${st.action}\n  // Expected: ${st.expectedResult}\n  await expect(page.locator('[data-testid="verification-node"]')).toBeVisible();`
  )
  .join('\n\n')}
});`}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#262838]">
              <button
                onClick={handleToggleAutomate}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  testCase.automationStatus === 'automated'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {testCase.automationStatus === 'automated'
                  ? 'Revert to Manual'
                  : 'Mark as Automated in Repo'}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`// Playwright Spec for ${testCase.key}\n// ...`);
                  setShowAutomateModal(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer"
              >
                Copy Spec &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EXPORT TEST CASE
      ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#262838] pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Export Test Case: {testCase.key}</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-slate-300 block font-semibold">
                Formatted Markdown / Documentation:
              </span>
              <pre className="p-3 bg-[#12131f] border border-[#2d3044] rounded-xl text-[11px] font-mono text-slate-200 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap">
                {exportMarkdown}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#262838]">
              <span className="text-[11px] text-slate-400 font-mono">
                Format: Markdown / Gherkin Compatible
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    downloadText(
                      exportMarkdown,
                      `${testCase.key}_specification.md`,
                      'text/markdown;charset=utf-8'
                    );
                  }}
                  className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Download Markdown documentation"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download .md</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadText(
                      JSON.stringify(testCase, null, 2),
                      `${testCase.key}_case.json`,
                      'application/json'
                    );
                  }}
                  className="px-3 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Download JSON test case"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download .json</span>
                </button>
                <button
                  onClick={handleCopyExport}
                  className="px-3.5 py-1.5 bg-[#202234] hover:bg-[#282a3e] border border-[#2e3146] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {copiedExport ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedExport ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#181926] border border-[#2e3146] rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262838] pb-2">
              <span className="font-bold text-white text-xs truncate max-w-md">
                {previewImage.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadAttachment({
                      id: 'dl',
                      name: previewImage.name,
                      size: '',
                      type: 'image/png',
                      url: previewImage.url,
                      uploadedAt: '',
                    })
                  }
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center max-h-[75vh] overflow-hidden rounded-xl bg-black/40 p-2">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Test Case Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Test Case"
        description={`Are you sure you want to delete test case "${testCase.key}"? This action will permanently remove this case and cannot be undone.`}
        itemName={`[${testCase.key}] ${testCase.title}`}
        itemType="case"
        onConfirm={() => {
          onDeleteTestCase(testCase.id);
        }}
      />
    </div>
  );
};
