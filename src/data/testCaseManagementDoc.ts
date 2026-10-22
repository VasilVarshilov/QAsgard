export const TEST_CASE_MANAGEMENT_SPEC = `# Test Case Management Module: Enterprise Technical Specification
**Module**: Core Test Repository & Test Case Authoring  
**Platform**: QAsgard ("Where Quality Rules")  
**Design Standard**: Modern SaaS • Microsoft Fluent 2 • ShadCN UI • PostgreSQL 16 + RLS  
**Author**: Principal Systems Architect & Senior Staff Engineer  
**Status**: Implementation Ready  

---

## 1. Database Structure & DDL Specification

The database model is architected for PostgreSQL 16 with kernel-level Row-Level Security (RLS), multi-tenant isolation, immutable step sequences, and full JSONB telemetry for attachments and custom fields.

\`\`\`sql
-- ============================================================================
-- 1. Test Cases Master Table
-- ============================================================================
CREATE TABLE public.test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    suite_id UUID NOT NULL REFERENCES public.test_suites(id) ON DELETE RESTRICT,
    case_number INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    preconditions TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    severity VARCHAR(50) NOT NULL DEFAULT 'normal' 
        CHECK (severity IN ('blocker', 'critical', 'major', 'normal', 'minor', 'trivial')),
    layer VARCHAR(50) NOT NULL DEFAULT 'e2e' 
        CHECK (layer IN ('e2e', 'api', 'unit')),
    status VARCHAR(50) NOT NULL DEFAULT 'actual' 
        CHECK (status IN ('actual', 'draft', 'deprecated')),
    automation_status VARCHAR(50) NOT NULL DEFAULT 'manual' 
        CHECK (automation_status IN ('manual', 'automated', 'to_be_automated')),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_cloned_from UUID REFERENCES public.test_cases(id) ON DELETE SET NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_test_cases_project_num UNIQUE (project_id, case_number)
);

-- B-Tree and GIN Indexes for high-frequency queries
CREATE INDEX idx_test_cases_org_proj ON public.test_cases (organization_id, project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_test_cases_suite ON public.test_cases (suite_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_test_cases_owner ON public.test_cases (owner_id);
CREATE INDEX idx_test_cases_tags ON public.test_cases USING GIN (tags);

-- ============================================================================
-- 2. Test Steps Table (Ordered Sequential Assertions)
-- ============================================================================
CREATE TABLE public.test_case_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    action TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    test_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_case_step_order UNIQUE (test_case_id, step_number)
);

CREATE INDEX idx_case_steps ON public.test_case_steps (test_case_id, step_number);

-- ============================================================================
-- 3. Attachments Table (Links to Supabase Storage Objects)
-- ============================================================================
CREATE TABLE public.test_case_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_attachments_case ON public.test_case_attachments (test_case_id);

-- ============================================================================
-- 4. Audit History & Auto Increment Case Number Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_assign_test_case_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_number IS NULL THEN
        SELECT COALESCE(MAX(case_number), 0) + 1 INTO NEW.case_number
        FROM public.test_cases
        WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_assign_case_number
BEFORE INSERT ON public.test_cases
FOR EACH ROW EXECUTE FUNCTION public.fn_assign_test_case_number();
\`\`\`

---

## 2. API Endpoints Specification

Next.js 15 Server Actions and REST Route Handlers provide type-safe operations with automated session extraction and RLS verification.

### 2.1 Next.js 15 Server Actions Matrix

| Action | Function Signature | Validation / Authorization | Cache Tag Invalidation |
| :--- | :--- | :--- | :--- |
| **Create Case** | \`createTestCase(input: CreateCaseDTO)\` | QA Engineer, QA Lead, Org Admin | \`revalidateTag('cases-[projectId]')\` |
| **Edit Case** | \`updateTestCase(id: string, patch: UpdateCaseDTO)\`| Case Owner, QA Lead, Org Admin | \`revalidateTag('case-[id]')\` |
| **Delete Case** | \`deleteTestCase(id: string)\` (Soft Delete) | QA Lead, Org Admin | \`revalidateTag('cases-[projectId]')\` |
| **Clone Case** | \`cloneTestCase(id: string, targetSuiteId?: string)\`| QA Engineer, QA Lead, Org Admin | \`revalidateTag('cases-[projectId]')\` |
| **Move Between Suites** | \`moveTestCases(caseIds: string[], suiteId: string)\`| QA Engineer, QA Lead, Org Admin | \`revalidateTag('suites-[projectId]')\` |
| **Bulk Edit** | \`bulkEditCases(caseIds: string[], patch: BulkPatchDTO)\`| QA Engineer, QA Lead, Org Admin | \`revalidateTag('cases-[projectId]')\` |
| **Bulk Import** | \`importCases(suiteId: string, payload: ImportPayload)\`| QA Lead, Org Admin | \`revalidateTag('cases-[projectId]')\` |
| **Bulk Export** | \`exportCases(filter: ExportFilterDTO, format: 'json' \| 'csv')\`| All Authenticated Tenant Members | Streaming Download |

### 2.2 Local-First Browser IndexedDB Implementation

\`\`\`typescript
// src/services/storage/indexedDb.ts
// 100% Client-Side Local-First IndexedDB Operations (Zero Backend / Zero Database)

import { browserDb } from './indexedDb';
import { TestCase, TestStep } from '../../types';

export async function createTestCaseLocal(input: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestCase> {
  const newCase: TestCase = {
    ...input,
    id: \`tc-\${Date.now()}-\${Math.random().toString(36).substr(2, 5)}\`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Persist directly to Browser IndexedDB 'testCases' store
  await browserDb.put('testCases', newCase);

  // 2. Automatically log immutable local audit trail
  await browserDb.put('auditLogs', {
    id: \`audit-\${Date.now()}\`,
    action: 'CREATE',
    entityType: 'testCase',
    entityId: newCase.id,
    entityName: newCase.title,
    projectId: newCase.projectId,
    userId: newCase.ownerId || 'usr-admin',
    userName: 'Active Tester',
    userRole: 'lead',
    timestamp: new Date().toISOString(),
  });

  return newCase;
}

export async function cloneTestCaseLocal(caseId: string, targetSuiteId?: string): Promise<TestCase> {
  // Fetch from IndexedDB
  const original = await browserDb.get<TestCase>('testCases', caseId);
  if (!original) throw new Error('Test case not found in local IndexedDB');

  const clonedCase: TestCase = {
    ...original,
    id: \`tc-\${Date.now()}-\${Math.random().toString(36).substr(2, 5)}\`,
    suiteId: targetSuiteId || original.suiteId,
    title: \`\${original.title} (Clone)\`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await browserDb.put('testCases', clonedCase);
  return clonedCase;
}

export async function bulkEditTestCasesLocal(
  caseIds: string[],
  patch: Partial<TestCase>
): Promise<number> {
  const allCases = await browserDb.getAll<TestCase>('testCases');
  const idSet = new Set(caseIds);

  const updatedCases = allCases.map((tc) => {
    if (idSet.has(tc.id)) {
      return {
        ...tc,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
    }
    return tc;
  });

  await browserDb.putMany('testCases', updatedCases);
  return caseIds.length;
}
\`\`\`

---

## 3. Page Wireframes & Component Architecture

### Wireframe 1: Test Repository with Suite Tree & Floating Bulk Bar
\`\`\`
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Org: FinFlow ▼] [Project: Payments [PAY] ▼]  [Search: ⌘K]                 [Theme ◐] [Avatar] │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Repository > Checkout Flow                                          [+ New Suite] [+ New Case]│
├──────────────────────────────┬────────────────────────────────────────────────────────────────┤
│ TEST SUITES (Search...)      │ [ Search cases...               ] [Filter: All Layers ▼] [Export]│
├──────────────────────────────┼───┬─────────┬──────────────────────┬─────────┬──────────┬─────┤
│ 📁 All Suites (48)           │[x]│ KEY     │ TITLE                │ PRIORITY│ SEVERITY │ STEPS│
│ ├── 📁 Authentication (14)   ├───┼─────────┼──────────────────────┼─────────┼──────────┼─────┤
│ │    ├── 📁 3DS 2.0 (6)      │[x]│ PAY-101 │ 3DS Step-Up Challenge│ [HIGH]  │[CRITICAL]│  3  │
│ │    └── 📁 Biometric (8)    │[x]│ PAY-102 │ ApplePay Token Auth  │ [HIGH]  │[BLOCKER] │  2  │
│ ├── 📁 Checkout & Cart (22)  │[ ]│ PAY-103 │ Expired Card Error   │ [MED]   │[NORMAL]  │  4  │
│ └── 📁 Webhooks & APIs (12)  │[ ]│ PAY-104 │ Refund Stripe Webhook│ [LOW]   │[MAJOR]   │  5  │
│                              └───┴─────────┴──────────────────────┴─────────┴──────────┴─────┤
│                              │ ┌───────────────────────────────────────────────────────────┐  │
│                              │ │ 3 CASES SELECTED  •  [Move] [Bulk Edit] [Clone] [Delete]   │  │
│                              │ └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┴────────────────────────────────────────────────────────────────┘
\`\`\`

### Wireframe 2: Slide-Over Test Case Drawer with Ordered Steps Timeline
\`\`\`
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              SLIDE-OVER DRAWER (w-[540px])                 [X]│
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ PAY-101 • 3DS Step-Up Challenge Authentication Flow                                           │
│ Suite: Authentication > 3DS 2.0  •  Created by: Sarah Chen  •  Owner: Alex Rivera             │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Badge: E2E] [Priority: HIGH] [Severity: CRITICAL] [Status: Automated] [Tags: smoke, 3ds]    │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ PRECONDITIONS (Amber Banner)                                                                  │
│ 🔒 User is authenticated on staging checkout. Test Visa card 4000-0000-0000-0002 is active.   │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ SEQUENTIAL TEST STEPS & ASSERTIONS                                                            │
│ ┌───────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Step 1: Click "Confirm & Pay" with 3DS-enrolled card                                       │ │
│ │ Data: Amount: $149.00, Currency: USD                                                       │ │
│ │ Expected: Visa Secure modal iframe opens with OTP input prompt.                            │ │
│ ├───────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ Step 2: Enter OTP code "123456" and click Submit                                           │ │
│ │ Expected: Iframe dismisses; spinner renders; order confirmation screen displays.           │ │
│ └───────────────────────────────────────────────────────────────────────────────────────────┘ │
│ [+ Add Step]  [✨ AI Suggest Additional Assertions]                                          │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ ATTACHMENTS (2 files)                                                                         │
│ 📎 3ds_success_trace.har (1.2 MB)    🖼️ confirmation_mock.png (420 KB)    [+ Upload]        │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Clone Case]  [Move to Suite...]  [Edit Full Screen]  [Delete]                                │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## 4. End-to-End User Flows

### Flow 1: Create Test Case with AI-Assisted Step Generation
1. Tester navigates to Repository -> clicks **"+ New Test Case"**.
2. Tester inputs Title: *"Verify idempotency key prevents duplicate charge on network timeout"*.
3. Tester selects Priority (*High*), Severity (*Critical*), Layer (*API*), and sets Owner.
4. Tester clicks **"✨ AI Suggest Steps"**:
   - Vercel Serverless Function dispatches prompt to Gemini 3.8 Flash.
   - Structured JSON returns 3 sequential steps:
     1. Dispatched POST \`/v1/charges\` with \`Idempotency-Key: abc-123\`.
     2. Simulate network socket hang up at 450ms.
     3. Retry identical request with identical key -> Assert HTTP 200 returned with cached charge ID.
5. Tester reviews generated steps, uploads sample payload JSON, and clicks **"Save Test Case"**.
6. PostgREST executes insert; the case immediately receives auto-incremented key \`PAY-105\`.

### Flow 2: Clone & Move Between Suites
1. Tester selects \`PAY-101\` in the table.
2. Tester clicks **"Clone"**:
   - System creates a copy titled \`PAY-101: 3DS Step-Up Challenge (Clone)\` with all steps intact.
3. Tester selects the cloned case -> clicks **"Move to Suite"** -> selects target suite \`Payment Workflows > Secondary Gateway\`.
4. Suite ID updates optimistically with immediate visual feedback in the tree.

### Flow 3: Bulk Edit Operations
1. Tester toggles table header checkbox -> selects 15 test cases.
2. Floating glassmorphic toolbar animates into view at the bottom of the viewport:
   - *"15 cases selected"*
3. Tester clicks **"Bulk Edit"** -> a popover opens with editable fields:
   - Sets *Priority* to \`Urgent\`.
   - Sets *Automation Status* to \`Automated\`.
   - Assigns *Owner* to \`Sarah Chen\`.
4. Tester clicks **"Apply Changes"** -> \`bulkEditTestCases()\` executes a single transactional batch query -> all 15 table rows update in < 15ms.

### Flow 4: Bulk Import & Export
1. **Bulk Import**:
   - Tester clicks **"Import"** -> Selects format (TestRail CSV / Qase JSON / Raw JSON).
   - Pastes payload or drops file -> Parser validates schema and displays preview table with row count.
   - Tester confirms -> Test cases batch insert into the current suite.
2. **Bulk Export**:
   - Tester clicks **"Export"** -> Chooses format:
     - **CSV**: Standard columns for spreadsheet audits.
     - **JSON**: Complete schema with steps, test data, and preconditions.
   - Browser initiates instant client-side streaming download without server load.
`;
