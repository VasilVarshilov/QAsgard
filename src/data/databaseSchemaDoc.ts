export interface TableColumn {
  name: string;
  type: string;
  constraints?: string;
  description: string;
}

export interface TableIndex {
  name: string;
  definition: string;
  purpose: string;
}

export interface TableDefinition {
  name: string;
  category:
    | 'Identity & Access'
    | 'Core Quality'
    | 'Execution Engine'
    | 'Defects & Collab'
    | 'Governance & Audit';
  description: string;
  columns: TableColumn[];
  indexes: TableIndex[];
  foreignKeys: string[];
}

export const POSTGRESQL_DDL_FULL = `-- ============================================================================
-- QAsgard Database Schema (PostgreSQL 16+)
-- Architecture: Enterprise Multi-Tenant SaaS, Soft-Delete, RLS, Audit Logging
-- Slogan: "Where Quality Rules"
-- ============================================================================

-- Extensions Required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enums
CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended', 'deactivated');
CREATE TYPE subscription_tier AS ENUM ('starter', 'growth', 'enterprise');
CREATE TYPE test_type AS ENUM ('functional', 'smoke', 'regression', 'security', 'boundary', 'performance', 'integration');
CREATE TYPE test_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE test_severity AS ENUM ('minor', 'normal', 'major', 'critical', 'blocker');
CREATE TYPE test_layer AS ENUM ('unit', 'api', 'e2e');
CREATE TYPE automation_status AS ENUM ('manual', 'automated', 'to_be_automated');
CREATE TYPE case_status AS ENUM ('draft', 'actual', 'deprecated');
CREATE TYPE run_status AS ENUM ('active', 'completed', 'aborted', 'paused');
CREATE TYPE execution_status AS ENUM ('untested', 'passed', 'failed', 'blocked', 'skipped');
CREATE TYPE defect_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'wont_fix');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'RESTORE');

-- ============================================================================
-- 1. Organizations (Tenants)
-- ============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    subscription_plan subscription_tier NOT NULL DEFAULT 'starter',
    max_seats INT NOT NULL DEFAULT 5,
    settings JSONB NOT NULL DEFAULT '{"sso_enabled": false, "enforce_mfa": false, "data_retention_days": 365}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_organizations_slug_active 
    ON organizations (slug) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. Users & Memberships
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    status user_status NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_users_org_email UNIQUE (organization_id, email)
);

CREATE INDEX idx_users_org_active ON users (organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_lower ON users (LOWER(email));

-- ============================================================================
-- 3. Roles & Permissions (RBAC)
-- ============================================================================
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'cases:create', 'runs:execute'
    module VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL, -- e.g. 'admin', 'qa_lead', 'viewer'
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_roles_org_code UNIQUE (organization_id, code)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_org ON user_roles(organization_id);

-- ============================================================================
-- 4. Projects
-- ============================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code_key VARCHAR(10) NOT NULL, -- e.g. 'PAY', 'SHOP', 'AUTH'
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_projects_org_key UNIQUE (organization_id, code_key)
);

CREATE INDEX idx_projects_org ON projects(organization_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 5. Requirements (Traceability)
-- ============================================================================
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    external_ref_id VARCHAR(100), -- Jira ID e.g. 'FIN-1049'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    acceptance_criteria TEXT,
    coverage_status VARCHAR(50) NOT NULL DEFAULT 'untested', -- 'covered', 'partial', 'untested'
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_requirements_project ON requirements(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_requirements_ext_ref ON requirements(project_id, external_ref_id);

-- ============================================================================
-- 6. Test Suites (Hierarchical Self-Referential)
-- ============================================================================
CREATE TABLE test_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    preconditions TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_test_suites_project ON test_suites(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_test_suites_parent ON test_suites(parent_suite_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 7. Test Cases & Tags
-- ============================================================================
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    suite_id UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    case_number INT NOT NULL, -- Sequential within project e.g. 101 -> 'PAY-101'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    preconditions TEXT,
    postconditions TEXT,
    type test_type NOT NULL DEFAULT 'functional',
    priority test_priority NOT NULL DEFAULT 'medium',
    severity test_severity NOT NULL DEFAULT 'normal',
    layer test_layer NOT NULL DEFAULT 'e2e',
    status case_status NOT NULL DEFAULT 'actual',
    automation_status automation_status NOT NULL DEFAULT 'manual',
    estimated_duration_sec INT DEFAULT 180,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_test_cases_proj_number UNIQUE (project_id, case_number)
);

CREATE INDEX idx_test_cases_project_suite ON test_cases(project_id, suite_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_test_cases_status ON test_cases(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_test_cases_search ON test_cases USING gin (to_tsvector('english', title || ' ' || coalesce(description, '')));

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_tags_project_name UNIQUE (project_id, name)
);

CREATE TABLE test_case_tags (
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (test_case_id, tag_id)
);

CREATE TABLE test_case_requirements (
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    PRIMARY KEY (test_case_id, requirement_id)
);

-- ============================================================================
-- 8. Test Steps
-- ============================================================================
CREATE TABLE test_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    action TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    test_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_test_steps_case_order UNIQUE (test_case_id, step_number)
);

CREATE INDEX idx_test_steps_case ON test_steps(test_case_id, step_number);

-- ============================================================================
-- 9. Test Plans & Milestones
-- ============================================================================
CREATE TABLE test_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    milestone VARCHAR(100),
    target_release_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_test_plans_project ON test_plans(project_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 10. Test Runs & Executions
-- ============================================================================
CREATE TABLE test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES test_plans(id) ON DELETE SET NULL,
    run_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    environment VARCHAR(50) NOT NULL DEFAULT 'Staging',
    status run_status NOT NULL DEFAULT 'active',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_test_runs_proj_number UNIQUE (project_id, run_number)
);

CREATE INDEX idx_test_runs_project_status ON test_runs(project_id, status) WHERE deleted_at IS NULL;

CREATE TABLE test_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    status execution_status NOT NULL DEFAULT 'untested',
    duration_seconds INT NOT NULL DEFAULT 0,
    executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    failure_reason TEXT,
    stack_trace TEXT,
    step_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_test_executions_run_case UNIQUE (run_id, test_case_id)
);

CREATE INDEX idx_test_executions_run ON test_executions(run_id, status);
CREATE INDEX idx_test_executions_case ON test_executions(test_case_id, status);

-- ============================================================================
-- 11. Bugs / Defects
-- ============================================================================
CREATE TABLE bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    test_case_id UUID REFERENCES test_cases(id) ON DELETE SET NULL,
    test_execution_id UUID REFERENCES test_executions(id) ON DELETE SET NULL,
    bug_number INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    severity test_severity NOT NULL DEFAULT 'major',
    priority test_priority NOT NULL DEFAULT 'high',
    status defect_status NOT NULL DEFAULT 'open',
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reproduction_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    external_issue_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_bugs_proj_number UNIQUE (project_id, bug_number)
);

CREATE INDEX idx_bugs_project_status ON bugs(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bugs_execution ON bugs(test_execution_id);

-- ============================================================================
-- 12. Attachments (Polymorphic Entity Reference)
-- ============================================================================
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'test_case', 'test_execution', 'bug'
    entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_url TEXT NOT NULL,
    checksum_sha256 VARCHAR(64),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_org ON attachments(organization_id);

-- ============================================================================
-- 13. Comments (Polymorphic Threaded Discussions)
-- ============================================================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'test_case', 'bug', 'test_run'
    entity_id UUID NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id, created_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 14. Audit Logs (Append-Only Event Store)
-- ============================================================================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    action audit_action NOT NULL,
    entity_table VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
) PARTITION BY RANGE (created_at);

-- Initial Quarterly Partitions for Audit Logs
CREATE TABLE audit_logs_2026_q4 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
CREATE TABLE audit_logs_2027_q1 PARTITION OF audit_logs
    FOR VALUES FROM ('2027-01-01') TO ('2027-04-01');

CREATE INDEX idx_audit_logs_org_created ON audit_logs (organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_table, entity_id);

-- ============================================================================
-- 15. Security & Row Level Security (RLS) Setup
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policy for Test Cases
-- Application sets: SET LOCAL app.current_tenant_id = 'uuid-here';
CREATE POLICY test_cases_tenant_isolation ON test_cases
    AS RESTRICTIVE
    USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
`;

export const DATABASE_ENTITIES: TableDefinition[] = [
  {
    name: 'organizations',
    category: 'Identity & Access',
    description:
      'Tenant roots supporting multi-organization isolation, licensing plans, and global security policies.',
    columns: [
      {
        name: 'id',
        type: 'UUID',
        constraints: 'PK, DEFAULT gen_random_uuid()',
        description: 'Unique tenant identifier',
      },
      {
        name: 'name',
        type: 'VARCHAR(255)',
        constraints: 'NOT NULL',
        description: 'Organization legal / company name',
      },
      {
        name: 'slug',
        type: 'VARCHAR(100)',
        constraints: 'NOT NULL, UNIQUE',
        description: 'URL-friendly subdomain / tenant slug',
      },
      {
        name: 'subscription_plan',
        type: 'subscription_tier',
        constraints: 'DEFAULT starter',
        description: 'starter | growth | enterprise',
      },
      {
        name: 'settings',
        type: 'JSONB',
        constraints: 'NOT NULL DEFAULT {}',
        description: 'Tenant configuration, SSO, retention periods',
      },
      {
        name: 'created_at / updated_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL',
        description: 'Row audit timestamps',
      },
      {
        name: 'deleted_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NULL',
        description: 'Soft delete timestamp',
      },
    ],
    indexes: [
      {
        name: 'idx_organizations_slug_active',
        definition: 'CREATE UNIQUE INDEX ON organizations(slug) WHERE deleted_at IS NULL',
        purpose: 'Zero duplicate slug collision for active tenants',
      },
    ],
    foreignKeys: [],
  },
  {
    name: 'users',
    category: 'Identity & Access',
    description:
      'User identity records partitioned logically per organization for compliance and security.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'User unique ID' },
      {
        name: 'organization_id',
        type: 'UUID',
        constraints: 'FK -> organizations(id)',
        description: 'Tenant scoping key',
      },
      {
        name: 'email',
        type: 'VARCHAR(255)',
        constraints: 'NOT NULL',
        description: 'User login email address',
      },
      {
        name: 'full_name',
        type: 'VARCHAR(255)',
        constraints: 'NOT NULL',
        description: 'Display name',
      },
      {
        name: 'status',
        type: 'user_status',
        constraints: 'DEFAULT active',
        description: 'active | invited | suspended | deactivated',
      },
      {
        name: 'deleted_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NULL',
        description: 'Soft delete indicator',
      },
    ],
    indexes: [
      {
        name: 'idx_users_org_active',
        definition: 'ON users(organization_id) WHERE deleted_at IS NULL',
        purpose: 'Rapid listing of active tenant members',
      },
      {
        name: 'uq_users_org_email',
        definition: 'UNIQUE(organization_id, email)',
        purpose: 'Enforces unique email per organization',
      },
    ],
    foreignKeys: ['organization_id -> organizations.id (CASCADE)'],
  },
  {
    name: 'roles & permissions',
    category: 'Identity & Access',
    description:
      'RBAC system with system roles (Admin, Test Manager, QA Lead, QA Engineer, PO, Viewer) and fine-grained permissions.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'Role identifier' },
      {
        name: 'organization_id',
        type: 'UUID',
        constraints: 'FK -> organizations(id)',
        description: 'Tenant role scope',
      },
      {
        name: 'name / code',
        type: 'VARCHAR',
        constraints: 'NOT NULL',
        description: 'Role name and slug code',
      },
      {
        name: 'is_system_role',
        type: 'BOOLEAN',
        constraints: 'DEFAULT false',
        description: 'Prevents deletion of built-in system roles',
      },
    ],
    indexes: [
      {
        name: 'uq_roles_org_code',
        definition: 'UNIQUE(organization_id, code)',
        purpose: 'Prevents duplicate role codes per tenant',
      },
    ],
    foreignKeys: [
      'organization_id -> organizations.id',
      'role_permissions (role_id, permission_id)',
    ],
  },
  {
    name: 'projects',
    category: 'Core Quality',
    description: 'Quality workspaces isolating test repositories, runs, plans, and defect boards.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'Project ID' },
      {
        name: 'organization_id',
        type: 'UUID',
        constraints: 'FK -> organizations(id)',
        description: 'Tenant scope',
      },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Project title' },
      {
        name: 'code_key',
        type: 'VARCHAR(10)',
        constraints: 'NOT NULL',
        description: 'Project prefix e.g. FIN, SHOP, AUTH',
      },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', constraints: 'NULL', description: 'Soft delete' },
    ],
    indexes: [
      {
        name: 'uq_projects_org_key',
        definition: 'UNIQUE(organization_id, code_key)',
        purpose: 'Ensures no key collisions within tenant',
      },
    ],
    foreignKeys: ['organization_id -> organizations.id', 'created_by -> users.id'],
  },
  {
    name: 'test_suites',
    category: 'Core Quality',
    description:
      'Hierarchical self-referential tree structure representing modules, services, and features.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'Suite ID' },
      {
        name: 'project_id',
        type: 'UUID',
        constraints: 'FK -> projects(id)',
        description: 'Project scope',
      },
      {
        name: 'parent_suite_id',
        type: 'UUID',
        constraints: 'FK -> test_suites(id)',
        description: 'Enables n-level recursive tree',
      },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Suite name' },
      {
        name: 'preconditions',
        type: 'TEXT',
        constraints: 'NULL',
        description: 'Global suite preconditions',
      },
    ],
    indexes: [
      {
        name: 'idx_test_suites_project',
        definition: 'ON test_suites(project_id) WHERE deleted_at IS NULL',
        purpose: 'Rapid tree traversal for active project',
      },
    ],
    foreignKeys: ['project_id -> projects.id', 'parent_suite_id -> test_suites.id (CASCADE)'],
  },
  {
    name: 'test_cases',
    category: 'Core Quality',
    description:
      'High-volume test specification storage containing preconditions, priorities, automated status, and full-text vectors.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'Case unique ID' },
      {
        name: 'project_id',
        type: 'UUID',
        constraints: 'FK -> projects(id)',
        description: 'Project key',
      },
      {
        name: 'suite_id',
        type: 'UUID',
        constraints: 'FK -> test_suites(id)',
        description: 'Parent suite',
      },
      {
        name: 'case_number',
        type: 'INT',
        constraints: 'NOT NULL',
        description: 'Sequential integer for key formatting (e.g. PAY-101)',
      },
      {
        name: 'title',
        type: 'VARCHAR(500)',
        constraints: 'NOT NULL',
        description: 'Concise test scenario summary',
      },
      {
        name: 'type / priority / severity',
        type: 'ENUMs',
        constraints: 'NOT NULL',
        description: 'Classification flags',
      },
      {
        name: 'automation_status',
        type: 'automation_status',
        constraints: 'DEFAULT manual',
        description: 'manual | automated | to_be_automated',
      },
    ],
    indexes: [
      {
        name: 'idx_test_cases_search',
        definition: 'GIN (to_tsvector("english", title || description))',
        purpose: 'Sub-10ms full-text keyword search',
      },
      {
        name: 'uq_test_cases_proj_number',
        definition: 'UNIQUE(project_id, case_number)',
        purpose: 'Enforces human-readable key uniqueness',
      },
    ],
    foreignKeys: ['project_id -> projects.id', 'suite_id -> test_suites.id'],
  },
  {
    name: 'test_steps',
    category: 'Core Quality',
    description: 'Ordered test procedure instructions, expected assertions, and input payloads.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'Step ID' },
      {
        name: 'test_case_id',
        type: 'UUID',
        constraints: 'FK -> test_cases(id)',
        description: 'Parent test case',
      },
      {
        name: 'step_number',
        type: 'INT',
        constraints: 'NOT NULL',
        description: 'Step sequence index (1, 2, 3...)',
      },
      { name: 'action', type: 'TEXT', constraints: 'NOT NULL', description: 'Action instruction' },
      {
        name: 'expected_result',
        type: 'TEXT',
        constraints: 'NOT NULL',
        description: 'Deterministic verification criteria',
      },
      {
        name: 'test_data',
        type: 'TEXT',
        constraints: 'NULL',
        description: 'Mock or parameter payload',
      },
    ],
    indexes: [
      {
        name: 'uq_test_steps_case_order',
        definition: 'UNIQUE(test_case_id, step_number)',
        purpose: 'Guarantees strictly ordered sequence',
      },
    ],
    foreignKeys: ['test_case_id -> test_cases.id (CASCADE)'],
  },
  {
    name: 'test_runs',
    category: 'Execution Engine',
    description:
      'Targeted test execution cycle tracking environments, assignees, run timestamps, and overall completion.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'Run ID' },
      {
        name: 'project_id',
        type: 'UUID',
        constraints: 'FK -> projects(id)',
        description: 'Project ID',
      },
      {
        name: 'plan_id',
        type: 'UUID',
        constraints: 'FK -> test_plans(id)',
        description: 'Optional milestone link',
      },
      {
        name: 'run_number',
        type: 'INT',
        constraints: 'NOT NULL',
        description: 'Run key number (e.g. RUN-204)',
      },
      {
        name: 'environment',
        type: 'VARCHAR(50)',
        constraints: 'DEFAULT Staging',
        description: 'Production | Staging | QA | Local',
      },
      {
        name: 'status',
        type: 'run_status',
        constraints: 'DEFAULT active',
        description: 'active | completed | aborted',
      },
    ],
    indexes: [
      {
        name: 'idx_test_runs_project_status',
        definition: 'ON test_runs(project_id, status) WHERE deleted_at IS NULL',
        purpose: 'Filter active test runs',
      },
    ],
    foreignKeys: [
      'project_id -> projects.id',
      'plan_id -> test_plans.id',
      'assigned_to -> users.id',
    ],
  },
  {
    name: 'test_executions',
    category: 'Execution Engine',
    description:
      'High-frequency result records capturing per-case pass/fail/blocked states, duration, and step-level JSON diagnostics.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'Execution ID' },
      {
        name: 'run_id',
        type: 'UUID',
        constraints: 'FK -> test_runs(id)',
        description: 'Parent run',
      },
      {
        name: 'test_case_id',
        type: 'UUID',
        constraints: 'FK -> test_cases(id)',
        description: 'Executed test case',
      },
      {
        name: 'status',
        type: 'execution_status',
        constraints: 'DEFAULT untested',
        description: 'untested | passed | failed | blocked | skipped',
      },
      {
        name: 'duration_seconds',
        type: 'INT',
        constraints: 'DEFAULT 0',
        description: 'Elapsed stopwatch time',
      },
      {
        name: 'step_results',
        type: 'JSONB',
        constraints: 'NOT NULL DEFAULT []',
        description: 'Array of step-level pass/fail/comment states',
      },
      {
        name: 'failure_reason / stack_trace',
        type: 'TEXT',
        constraints: 'NULL',
        description: 'Error diagnostics for AI failure triage',
      },
    ],
    indexes: [
      {
        name: 'uq_test_executions_run_case',
        definition: 'UNIQUE(run_id, test_case_id)',
        purpose: 'One result per case within a run',
      },
      {
        name: 'idx_test_executions_run',
        definition: 'ON test_executions(run_id, status)',
        purpose: 'Fast roll-up calculation of pass rates',
      },
    ],
    foreignKeys: [
      'run_id -> test_runs.id (CASCADE)',
      'test_case_id -> test_cases.id',
      'executed_by -> users.id',
    ],
  },
  {
    name: 'bugs (defects)',
    category: 'Defects & Collab',
    description:
      'Integrated bug reports generated directly from failed test steps with linked reproduction trails.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PK', description: 'Bug ID' },
      {
        name: 'project_id',
        type: 'UUID',
        constraints: 'FK -> projects(id)',
        description: 'Project ID',
      },
      {
        name: 'test_execution_id',
        type: 'UUID',
        constraints: 'FK -> test_executions(id)',
        description: 'Direct link to failed execution',
      },
      { name: 'bug_number', type: 'INT', constraints: 'NOT NULL', description: 'DEF-101 sequence' },
      {
        name: 'status',
        type: 'defect_status',
        constraints: 'DEFAULT open',
        description: 'open | in_progress | resolved | closed',
      },
      {
        name: 'reproduction_steps',
        type: 'JSONB',
        constraints: 'NOT NULL',
        description: 'Structured repro steps auto-populated from case',
      },
    ],
    indexes: [
      {
        name: 'idx_bugs_project_status',
        definition: 'ON bugs(project_id, status) WHERE deleted_at IS NULL',
        purpose: 'Kanban board query optimization',
      },
    ],
    foreignKeys: [
      'project_id -> projects.id',
      'test_execution_id -> test_executions.id',
      'assignee_id -> users.id',
    ],
  },
  {
    name: 'audit_logs',
    category: 'Governance & Audit',
    description:
      'Immutable, range-partitioned ledger recording all entity mutations for SOC 2 Type II compliance.',
    columns: [
      {
        name: 'id',
        type: 'BIGSERIAL',
        constraints: 'PK',
        description: 'High-throughput sequential log ID',
      },
      { name: 'organization_id', type: 'UUID', constraints: 'NOT NULL', description: 'Tenant key' },
      {
        name: 'action',
        type: 'audit_action',
        constraints: 'NOT NULL',
        description: 'INSERT | UPDATE | DELETE | RESTORE',
      },
      {
        name: 'entity_table',
        type: 'VARCHAR(100)',
        constraints: 'NOT NULL',
        description: 'Modified table',
      },
      { name: 'entity_id', type: 'UUID', constraints: 'NOT NULL', description: 'Target entity ID' },
      {
        name: 'old_state / new_state',
        type: 'JSONB',
        constraints: 'NULL',
        description: 'Delta state snapshots',
      },
      {
        name: 'created_at',
        type: 'TIMESTAMPTZ',
        constraints: 'PARTITION KEY',
        description: 'Partitioned by quarterly range',
      },
    ],
    indexes: [
      {
        name: 'idx_audit_logs_org_created',
        definition: 'ON audit_logs(organization_id, created_at DESC)',
        purpose: 'Rapid compliance audit inspection',
      },
    ],
    foreignKeys: ['organization_id -> organizations.id', 'user_id -> users.id'],
  },
];
