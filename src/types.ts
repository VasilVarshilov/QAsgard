export type UserRole =
  'admin' | 'test_manager' | 'qa_lead' | 'qa_engineer' | 'product_owner' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  organizationId: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'enterprise' | 'growth' | 'starter';
  membersCount: number;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string;
  suiteCount: number;
  caseCount: number;
  openBugsCount: number;
  updatedAt: string;
}

export type TestPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TestSeverity = 'blocker' | 'critical' | 'major' | 'normal' | 'minor' | 'trivial';
export type TestType =
  | 'functional'
  | 'integration'
  | 'regression'
  | 'smoke'
  | 'sanity'
  | 'security'
  | 'performance'
  | 'api'
  | 'ui'
  | 'uat'
  | 'database'
  | 'compatibility'
  | 'boundary'
  | 'other';
export type TestLayer =
  | 'ui'
  | 'backend'
  | 'database'
  | 'api'
  | 'integration'
  | 'system'
  | 'infrastructure'
  | 'e2e'
  | 'unit';
export type AutomationStatus =
  'manual' | 'planned' | 'automated' | 'partially_automated' | 'to_be_automated' | 'deprecated';
export type CaseStatus = 'actual' | 'draft' | 'reviewed' | 'deprecated';
export type CaseBehavior = 'positive' | 'negative' | 'boundary' | 'exploratory' | 'destructive';

export interface TestStep {
  stepNumber: number;
  stepLabel?: string;
  parentStepNumber?: number;
  action: string;
  expectedResult: string;
  data?: string;
  attachments?: Attachment[];
  notes?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface CommentReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  reactions?: CommentReaction[];
}

export interface TestRepository {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TestCase {
  id: string;
  key: string;
  projectId: string;
  repositoryId?: string;
  suiteId: string;
  suiteName: string;
  title: string;
  description: string;
  preconditions?: string;
  postconditions?: string;
  type: TestType;
  priority: TestPriority;
  severity: TestSeverity;
  layer: TestLayer;
  status: CaseStatus;
  automationStatus: AutomationStatus;
  steps: TestStep[];
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  behavior?: CaseBehavior;
  requirementRefs?: string[];
  linkedDefects?: string[];
  codeSnippet?: { language: string; code: string };
  nestedTable?: { headers: string[]; rows: string[][] };
  estimatedMinutes?: number;
  testData?: string;
  environment?: string;
  author?: string;
  milestone?: string;
  isFlaky?: boolean;
  toBeAutomated?: boolean;
  muted?: boolean;
  parameters?: { key: string; value: string }[];
  bddScenario?: { given: string; when: string; then: string };
  customFields?: { id: string; label: string; value: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface TestSuite {
  id: string;
  projectId: string;
  repositoryId?: string;
  parentId?: string | null;
  order?: number;
  name: string;
  description?: string;
  preconditions?: string;
  caseCount: number;
}

export type ExecutionStatus = 'passed' | 'failed' | 'blocked' | 'skipped' | 'untested';

export interface StepExecutionResult {
  stepNumber: number;
  status: ExecutionStatus;
  actualResult?: string;
  comment?: string;
  attachments?: Attachment[];
  defectKey?: string;
  defectIds?: string[];
}

export interface TestExecution {
  id: string;
  runId: string;
  testCaseId: string;
  testCaseKey: string;
  testCaseTitle: string;
  suiteName: string;
  status: ExecutionStatus;
  durationSeconds: number;
  stepResults: StepExecutionResult[];
  failureReason?: string;
  stackTrace?: string;
  executedBy?: string;
  defectIds: string[];
  executedAt?: string;
  attachments?: Attachment[];
}

export interface TestRun {
  id: string;
  key: string;
  projectId: string;
  planId?: string;
  title: string;
  description?: string;
  environment: 'Production' | 'Staging' | 'QA-Develop' | 'Local';
  status: 'active' | 'completed' | 'aborted';
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
  totalCases: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  skippedCount: number;
  untestedCount: number;
  executions: TestExecution[];
}

export interface TestPlan {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description: string;
  milestone: string;
  targetRelease: string;
  caseCount: number;
  testCaseIds: string[];
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

export type DefectStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Defect {
  id: string;
  key: string;
  projectId: string;
  suiteId?: string;
  suiteName?: string;
  testCaseId?: string;
  testCaseKey?: string;
  testCaseTitle?: string;
  runId?: string;
  runKey?: string;
  title: string;
  description: string;
  severity: TestSeverity;
  priority: TestPriority;
  status: DefectStatus;
  assignee: string;
  reporter: string;
  reproductionSteps: string[];
  comments: Comment[];
  createdAt: string;
  attachments?: Attachment[];
}

export interface DuplicateCaseDetection {
  primaryCaseId: string;
  primaryCaseTitle: string;
  duplicateCaseId: string;
  duplicateCaseTitle: string;
  similarityScore: number;
  reason: string;
  recommendation: string;
}

export interface CoverageRequirementItem {
  req: string;
  status: 'Covered' | 'Partial' | 'Untested';
  testIds: string[];
}

export interface CoverageAnalysisResult {
  coveragePercentage: number;
  coveredRequirements: CoverageRequirementItem[];
  uncoveredGaps: string[];
  riskAssessment: string;
}

export interface FailedTestAnalysisResult {
  rootCause: string;
  category: string;
  confidence: number;
  explanation: string;
  remediationSteps: string[];
  suggestedBugDraft?: {
    title: string;
    severity: TestSeverity;
    priority: TestPriority;
  };
}

export interface Requirement {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description: string;
  status: 'active' | 'draft' | 'deprecated';
  testCaseKeys: string[];
}

export type AuditActionType =
  'CREATE' | 'UPDATE' | 'DELETE' | 'CLONE' | 'MOVE' | 'BULK_UPDATE' | 'SIGN_OFF' | 'INVALIDATE';
export type AuditEntityType = 'test_case' | 'test_plan' | 'test_suite' | 'test_run' | 'project';

export interface AuditFieldDiff {
  fieldName: string;
  previousValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
  };
  action: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  entityKey: string;
  entityTitle: string;
  summary: string;
  diffs?: AuditFieldDiff[];
  complianceReason?: string;
  ipAddress?: string;
  integrityHash: string;
}

export type CopilotDisplayState = 'hidden' | 'minimized' | 'expanded';
export type CopilotAutoCollapse = 'off' | '1m' | '5m' | '15m';

export interface QACopilotPreferences {
  showButton: boolean;
  state: CopilotDisplayState;
  position: { x: number; y: number };
  autoCollapse: CopilotAutoCollapse;
  edgeSnapping: boolean;
  smartDimming: boolean;
}
