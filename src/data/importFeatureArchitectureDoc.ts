export const IMPORT_FEATURE_ARCHITECTURE_SPEC = `# Universal Test Case Import System: Architectural Specification
**Module**: Universal Test Importer (Excel • CSV • Word • JSON)  
**Platform**: QAsgard ("Where Quality Rules")  
**Target Entities**: Projects, Suites, Test Cases, and Sequential Steps  
**Status**: Production Ready & Interactive in Live App  

---

## 1. Import Workflow & State Machine

The import pipeline is architected as a **4-stage decoupled asynchronous workflow** with human-in-the-loop schema mapping and atomic rollback guarantees.

\`\`\`
[1. Upload & Format Sniffing]
       │
       ├── Excel (.xlsx, .xls)  ──► SheetJS Parser (Extract workbooks & sheets)
       ├── CSV (.csv)           ──► PapaParse (Delimiter auto-detection, UTF-8/UTF-16)
       ├── Word (.docx)         ──► Mammoth.js + Gemini Flash (Table & Heading hierarchy)
       └── JSON (.json)         ──► JSONStream (TestRail, Qase, Zephyr native schemas)
       │
       ▼
[2. AI & Heuristic Column Mapping]
       │
       ├── Auto-matches columns using normalized similarity:
       │   - "Summary", "Test Name", "Case Title" ──► title
       │   - "Folder", "Section", "Module"        ──► suite_name
       │   - "Action", "Step Description"         ──► step_action
       │   - "Expected", "Result"                 ──► expected_result
       │   - "Severity", "Impact"                 ──► severity
       │
       ▼
[3. Validation & Conflict Resolution (Dry Run)]
       │
       ├── Schema validation (enums, required lengths, uniqueness)
       ├── Conflict handling strategy:
       │   - Overwrite existing keys
       │   - Auto-increment new keys (e.g. PAY-101 -> PAY-102)
       │   - Skip duplicate records
       │
       ▼
[4. Transactional Atomic Commit]
       │
       ├── Batch insert into:
       │   1. public.projects (if new)
       │   2. public.test_suites (upsert by name)
       │   3. public.test_cases (bulk unnest insert)
       │   4. public.test_case_steps (bulk unnest insert)
       └── Real-time WebSocket / SSE progress events (0% ──► 100%)
\`\`\`

---

## 2. Validation Rules Matrix

| Entity | Field | Rule | Error Behavior | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **Project** | \`name\` | Required, VARCHAR(100) | Warning: falls back to active project | Auto-fallback |
| **Suite** | \`name\` | Required, VARCHAR(200) | Warning: defaults to "Imported General" | Auto-create suite |
| **Test Case** | \`title\` | Required, 3 - 500 chars | Fatal: row rejected | Inline edit in review UI |
| **Test Case** | \`priority\` | Enum: \`urgent\`, \`high\`, \`medium\`, \`low\` | Coerced to \`medium\` if unknown | Normalization |
| **Test Case** | \`severity\` | Enum: \`blocker\`, \`critical\`, \`major\`, \`normal\`, \`minor\` | Coerced to \`normal\` if unknown | Normalization |
| **Test Case** | \`layer\` | Enum: \`e2e\`, \`api\`, \`unit\` | Default: \`e2e\` | Default fallback |
| **Test Steps** | \`action\` | Required per step row | Fatal for step; case kept if 1+ valid steps | Trim / inline fix |
| **Test Steps** | \`expected_result\`| Required per step | Warning: defaults to "Verify success" | Auto-fill placeholder |

---

## 3. Database Impact & DDL Schema

\`\`\`sql
-- ============================================================================
-- 1. Import Jobs Master Table
-- ============================================================================
CREATE TABLE public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_format VARCHAR(20) NOT NULL CHECK (file_format IN ('excel', 'csv', 'word', 'json')),
    total_rows INT NOT NULL DEFAULT 0,
    valid_rows INT NOT NULL DEFAULT 0,
    error_rows INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded' 
        CHECK (status IN ('uploaded', 'mapping', 'validating', 'importing', 'completed', 'failed')),
    column_mapping JSONB NOT NULL DEFAULT '{}',
    error_log JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_import_jobs_proj ON public.import_jobs (project_id, created_at DESC);

-- ============================================================================
-- 2. Staging Rows Table (For massive multi-thousand row files)
-- ============================================================================
CREATE TABLE public.import_job_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    row_index INT NOT NULL,
    raw_data JSONB NOT NULL,
    parsed_case JSONB,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (validation_status IN ('pending', 'valid', 'error', 'imported')),
    validation_errors TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_job_rows_status ON public.import_job_rows (job_id, validation_status);
\`\`\`

---

## 4. API Design (Next.js 15 / REST Endpoints)

| Endpoint | Method | Payload / Params | Response |
| :--- | :--- | :--- | :--- |
| \`/api/import/upload\` | \`POST\` (Multipart) | \`file: File, projectId: string\` | \`{ jobId, format, detectedColumns, previewRows, sampleCount }\` |
| \`/api/import/map\` | \`POST\` (JSON) | \`jobId: string, mappings: Record<string, string>\` | \`{ jobId, mappedCount, unmappedColumns }\` |
| \`/api/import/validate\` | \`POST\` (JSON) | \`jobId: string, conflictStrategy: string\` | \`{ totalRows, validCount, errorCount, errors: [...] }\` |
| \`/api/import/commit\` | \`POST\` (JSON) | \`jobId: string\` | Streaming SSE progress + \`{ importedCases, createdSuites }\` |
| \`/api/import/:jobId/errors.csv\`| \`GET\` | \`jobId: string\` | Downloadable CSV with original row data + exact error reason |

---

## 5. Word (.docx) & Unstructured AI Parser Pipeline

When a QA Engineer uploads an unstructured Microsoft Word (\`.docx\`) document containing test matrices, checklists, and acceptance bullets:
1. \`mammoth.js\` extracts structured HTML tables and nested \`<h1> - <h3>\` headers.
2. The extracted payload is passed through **Gemini Flash (\`gemini-3.8-flash\`)** using this decompilation prompt:
\`\`\`
Decompile the following Word document into structured QA test cases.
Identify:
- Document headings as Suite names
- Bullet points and table rows as Test Case Titles
- Numbered sequences as Test Steps (Action, Expected Result, Test Data)
- Priority markers ([High], [Critical], [P0])

Output strictly JSON matching the QAsgard TestCaseArraySchema.
\`\`\`
3. Output seamlessly feeds into the standard dry-run validation grid!
`;
