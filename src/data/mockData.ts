import {
  Organization,
  Project,
  TestSuite,
  TestCase,
  TestRun,
  TestPlan,
  Defect,
  User,
  AuditLogEntry,
  Requirement,
} from '../types';

export const INITIAL_ORGANIZATION: Organization = {
  id: 'org-1',
  name: 'Default Workspace',
  slug: 'workspace',
  plan: 'enterprise',
  membersCount: 0,
};

export const ALL_PROJECTS_ID = 'all';

export const ALL_PROJECTS: Project = {
  id: ALL_PROJECTS_ID,
  organizationId: 'org-1',
  name: 'All Projects',
  key: 'ALL',
  description:
    'Consolidated overview displaying test suites, cases, runs, and defects across all workspace projects.',
  suiteCount: 0,
  caseCount: 0,
  openBugsCount: 0,
  updatedAt: new Date().toISOString(),
};

export const EMPTY_PROJECT: Project = {
  id: '',
  organizationId: 'org-1',
  name: 'No Project',
  key: '',
  description: 'No projects created in workspace yet',
  suiteCount: 0,
  caseCount: 0,
  openBugsCount: 0,
  updatedAt: '',
};

export const DEMO_PROJECT_IDS = new Set([
  'proj-zugferd',
  'proj-finflow',
  'proj-shopsphere',
  'proj-auth0',
  'proj-1',
  'proj-2',
  'proj-3',
  'proj-4',
  'proj-5',
]);

export function isDemoProjectId(id: string | null | undefined): boolean {
  if (!id) return false;
  const lower = id.toLowerCase();
  return (
    DEMO_PROJECT_IDS.has(lower) ||
    lower.includes('zugferd') ||
    lower.includes('finflow') ||
    lower.includes('shopsphere') ||
    lower.includes('auth0') ||
    lower.startsWith('demo-')
  );
}

export function isDemoProject(p: Project | null | undefined): boolean {
  if (!p) return false;
  if (isDemoProjectId(p.id)) return true;
  const name = (p.name || '').toLowerCase();
  const key = (p.key || '').toUpperCase();
  if (
    name.includes('zugferd') ||
    name.includes('finflow') ||
    name.includes('shopsphere') ||
    name.includes('auth0') ||
    name.includes('identity & access') ||
    name.includes('payment gateway') ||
    name.includes('sample') ||
    name.includes('demo')
  ) {
    return true;
  }
  if (['PAY', 'ZUG', 'SHOP', 'AUTH', 'DEMO', 'SMP'].includes(key)) {
    return true;
  }
  return false;
}

export function isDemoUser(u: User | null | undefined): boolean {
  if (!u) return false;
  const id = (u.id || '').toLowerCase();
  const email = (u.email || '').toLowerCase();
  const name = (u.name || '').toLowerCase();
  if (['user-1', 'user-2', 'user-3', 'user-4', 'user-5'].includes(id)) return true;
  if (
    email.includes('finflow') ||
    email.includes('zugferd') ||
    email.includes('shopsphere') ||
    email.includes('example.com')
  ) {
    return true;
  }
  if (
    name.includes('alexander') ||
    name.includes('elena') ||
    name.includes('dimitar') ||
    name.includes('stefan')
  ) {
    return true;
  }
  return false;
}

export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_USERS: User[] = [];
export const INITIAL_SUITES: TestSuite[] = [];
export const INITIAL_TEST_CASES: TestCase[] = [];
export const INITIAL_TEST_RUNS: TestRun[] = [];
export const INITIAL_TEST_PLANS: TestPlan[] = [];
export const INITIAL_DEFECTS: Defect[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
export const INITIAL_REQUIREMENTS: Requirement[] = [];
