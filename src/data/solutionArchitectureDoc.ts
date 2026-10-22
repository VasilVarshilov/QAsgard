export const SOLUTION_ARCHITECTURE_MARKDOWN = `# Solution Architecture Document (SAD)
## QAsgard: Cloud SaaS QA Test Management Platform
**Target Blueprint**: Fully Free-Tier Stack ($0/month OpEx)  
**Author**: Principal Solution Architect  
**Version**: 1.0.0-PROD-SPEC  

---

### 1. Executive Summary & Cost Boundary ($0 / month)

This document specifies a cloud-native SaaS architecture that runs **entirely within the permanent free tiers** of industry-leading infrastructure providers while supporting up to 10,000 monthly active users and 500,000 test executions per month.

| Layer | Provider | Free Tier Allocation | Cost |
| :--- | :--- | :--- | :---: |
| **Frontend & SSR/Edge API** | **Vercel** (Hobby) | 100 GB bandwidth, unlimited deployments, automatic SSL, Edge CDN | **$0.00** |
| **Backend & Database** | **Supabase** (Free Tier) | 500 MB Postgres DB, 50,000 Monthly Active Users (MAU), 500MB storage, 200 concurrent real-time connections | **$0.00** |
| **Authentication** | **Supabase Auth** | Up to 50,000 MAU, OAuth2 (GitHub/Google), Email/Password, Magic Link | **$0.00** |
| **AI Intelligence** | **Google Gemini API** | 15 RPM (Requests per minute), 1M TPM (Tokens per minute), 1,500 RPD (Requests per day) on \`gemini-2.5-flash\` / \`gemini-3.8-flash\` | **$0.00** |
| **Asset Storage** | **Supabase Storage** | 1 GB file uploads (screenshots, HAR logs, video traces) | **$0.00** |
| **DNS & Edge Security** | **Cloudflare** (Free) | Global Anycast DNS, DDoS mitigation, WAF | **$0.00** |
| **Total Monthly Infrastructure Cost** | — | — | **$0.00/mo** |

---

### 2. High-Level Architecture Diagram

\`\`\`
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / BROWSER TIER                           │
│  Next.js 15 Client Components • ShadCN UI • Tailwind CSS • Lucide-React│
└────────────────────────────────────────────────────────────────────────┘
                   │                                │
    HTTPS / REST   │ (Fast Data Queries             │ WebSocket (Live Runs)
    Next.js Actions│  via PostgREST + RLS)          │ Supabase Realtime
                   ▼                                ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│          VERCEL EDGE            │   │      SUPABASE REALTIME ENGINE    │
│  • Edge Middleware (Auth check) │   │  • Broadcast execution events    │
│  • Next.js App Router (SSR/RSC) │   │  • Live stopwatch sync           │
│  • Serverless Route Handlers    │   │  • Multi-user runner presence    │
└─────────────────────────────────┘   └──────────────────────────────────┘
                   │
                   ├────────────────────────────────┐
                   │ (Private Server-Side Calls)    │
                   ▼                                ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│      GOOGLE GEMINI API          │   │         SUPABASE BACKEND         │
│  • gemini-3.8-flash model       │   │  • GoTrue Auth (JWT Claims)      │
│  • Test Case Gen from PRD       │   │  • PostgREST Auto-generated API  │
│  • Duplicate Semantic Detector  │   │  • PostgreSQL 16 (RLS Protected) │
│  • Root Cause Failure Analysis  │   │  • Supabase Storage (S3 API)     │
└─────────────────────────────────┘   └──────────────────────────────────┘
\`\`\`

---

### 3. Component Architecture

1. **Presentation Layer (Next.js 15 App Router)**:
   - **React Server Components (RSC)**: Initial page loads render static markup on the server, fetching initial project trees directly from Supabase with zero client-side JavaScript overhead.
   - **Client Components (\`use client\`)**: Interactive live execution runner, stopwatch timers, drag-and-drop test suite hierarchies, and AI streaming dialogues.
   - **ShadCN UI & Tailwind CSS**: Accessible, zero-runtime CSS components based on Radix UI primitives.
2. **Edge Proxy & Middleware**:
   - Vercel Edge Middleware extracts user JWTs, verifies organization memberships, injects tenant headers, and routes subpaths.
3. **Backend-as-a-Service (Supabase)**:
   - **PostgREST**: Automatically exposes strongly typed CRUD APIs over PostgreSQL tables with zero custom backend boilerplate.
   - **Supabase Realtime**: Elixir-based Phoenix channels broadcasting PostgreSQL Write-Ahead Logs (WAL) for live test execution collaboration.
   - **Storage Buckets**: Pre-signed URLs for uploading test run failure screenshots and logs.
4. **AI Processing Layer**:
   - Next.js Serverless Route Handlers (\`/api/ai/*\`) proxy requests to the Gemini API, maintaining API key secrecy on the server side.

---

### 4. Folder Structure (Next.js App Router + TypeScript + ShadCN)

\`\`\`
qasgard/
├── .env.local.example          # Environment variables template
├── .eslintrc.json
├── components.json             # ShadCN UI configuration
├── next.config.mjs             # Next.js configuration
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── src/
│   ├── services/
│   │   └── storage/
│   │       └── indexedDb.ts    # 100% Browser IndexedDB Engine v3 (Single Source of Truth)
├── src/
│   ├── app/                    # Next.js App Router directory
│   │   ├── layout.tsx          # Root layout with ThemeProvider & Providers
│   │   ├── page.tsx            # Landing page / marketing hero
│   │   ├── (auth)/             # Auth route group (isolated clean layout)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── callback/route.ts # Supabase OAuth exchange
│   │   ├── (dashboard)/        # Main app workspace route group
│   │   │   ├── layout.tsx      # App navigation bar, sidebar & tenant provider
│   │   │   └── [orgSlug]/
│   │   │       └── [projectKey]/
│   │   │           ├── page.tsx          # Project overview & dashboard
│   │   │           ├── repository/       # Test repository & suite tree
│   │   │           ├── runs/             # Active and completed test runs
│   │   │           │   ├── page.tsx
│   │   │           │   └── [runId]/      # Live test execution console
│   │   │           ├── plans/            # Test plans & milestones
│   │   │           ├── defects/          # Bug tracking board
│   │   │           ├── ai-studio/        # AI Quality Studio
│   │   │           └── settings/         # Members & RBAC
│   │   └── api/                # Secure server-side Route Handlers
│   │       ├── ai/
│   │       │   ├── generate-cases/route.ts
│   │       │   ├── generate-steps/route.ts
│   │       │   ├── find-duplicates/route.ts
│   │       │   ├── coverage/route.ts
│   │       │   └── failure-triage/route.ts
│   │       └── webhooks/
│   │           └── ci-reporter/route.ts  # Ingestion from GitHub Actions
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # ShadCN UI primitives (button, dialog, etc.)
│   │   ├── execution/          # Live test runner, timer, step toggles
│   │   ├── repository/         # Suite tree, case drawer, step builder
│   │   └── ai/                 # AI prompt consoles and comparison diffs
│   ├── lib/
│   │   ├── gemini/
│   │   │   └── client.ts       # Server-only @google/genai SDK instance
│   │   └── utils.ts            # Tailwind clsx/twMerge helper
│   ├── hooks/                  # Custom React hooks (useTestRunner, useRealtime)
│   └── types/                  # Database and domain TypeScript contracts
\`\`\`

---

### 5. Routing Structure

| Route Pattern | Rendering Strategy | Description |
| :--- | :--- | :--- |
| \`/\` | Static (SSG) | Product marketing landing page |
| \`/login\`, \`/register\` | Static + Client | Authentication forms (Supabase Auth) |
| \`/auth/callback\` | Route Handler | Exchanges OAuth code for session cookie |
| \`/[orgSlug]/[projectKey]\` | Server Component (SSR) | Project dashboard, pass rates, activity feed |
| \`/[orgSlug]/[projectKey]/repository\` | Hybrid (SSR + Client) | Test suite hierarchy & case management drawer |
| \`/[orgSlug]/[projectKey]/runs\` | SSR | List of active, completed, and scheduled runs |
| \`/[orgSlug]/[projectKey]/runs/[runId]\` | Client Component | **Live Test Execution Console** with stopwatch and hotkeys |
| \`/[orgSlug]/[projectKey]/defects\` | SSR + Client | Defect Kanban board & triage drawer |
| \`/[orgSlug]/[projectKey]/ai-studio\` | Client Component | 5 AI Quality Copilot tools |
| \`/api/ai/*\` | Serverless Function | Server-side Gemini API endpoints |

---

### 6. Security & Multi-Tenant Design

#### 6.1 Database Row-Level Security (RLS)
Security is enforced at the database kernel level rather than relying on application code:
1. Supabase Auth generates a signed JWT containing \`sub\` (User UUID).
2. A custom PostgreSQL function retrieves the active organization membership:
   \`\`\`sql
   CREATE OR REPLACE FUNCTION get_user_organizations()
   RETURNS SETOF UUID AS $$
     SELECT organization_id FROM user_roles WHERE user_id = auth.uid();
   $$ LANGUAGE sql SECURITY DEFINER STABLE;
   \`\`\`
3. RLS policy on \`test_cases\`:
   \`\`\`sql
   CREATE POLICY "Tenant isolation for test cases" ON test_cases
     FOR ALL
     USING (organization_id IN (SELECT get_user_organizations()))
     WITH CHECK (organization_id IN (SELECT get_user_organizations()));
   \`\`\`

#### 6.2 Key & Secret Management
- **Client**: Only possesses \`NEXT_PUBLIC_SUPABASE_URL\` and \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`.
- **Server**: Stores \`SUPABASE_SERVICE_ROLE_KEY\` and \`GEMINI_API_KEY\` strictly in Vercel Encrypted Environment Variables. The Gemini API key is never exposed to the browser bundle.

---

### 7. End-to-End Data Flow Diagrams

#### Flow A: Live Test Execution with Realtime Synchronization
\`\`\`
[QA Tester] 
    │  Presses "P" (Pass Step 2)
    ▼
[Live Runner Component] ── (Optimistic UI update < 10ms)
    │
    ▼ (HTTP PATCH /rest/v1/test_executions)
[Supabase PostgREST] ── (Evaluates RLS Policy via JWT)
    │
    ▼
[PostgreSQL Database] ── (Writes row change to WAL)
    │
    ▼
[Supabase Realtime] ── (Broadcasts 'EXECUTION_UPDATED' event)
    │
    ▼ (WebSocket)
[Other Team Members' Browsers] ── (Progress bars update instantly)
\`\`\`

#### Flow B: AI Test Case Generation
\`\`\`
[Product Owner / QA Lead]
    │  Pastes PRD User Story
    ▼
[AI Studio Client]
    │  POST /api/ai/generate-cases (JSON payload)
    ▼
[Vercel Serverless Function]
    │  Validates User Session with Supabase Auth
    │  Constructs structured system prompt with JSON schema
    ▼
[Google Gemini API (gemini-3.8-flash)]
    │  Generates structured test cases with positive/negative/edge cases
    ▼
[Vercel Serverless Function]
    │  Validates output schema against TypeScript interfaces
    ▼
[AI Studio Client]
    │  Renders preview with cherry-pick selection
    ▼
[Batch Insert via Supabase Client]
    │  Test cases saved directly to PostgreSQL with RLS check
\`\`\`

---

### 8. Deployment Strategy (Zero-Cost CI/CD)

1. **Source Control**: GitHub Repository with protected \`main\` and \`staging\` branches.
2. **Continuous Deployment via Vercel**:
   - Push to \`main\` triggers automated production deployment with instant Edge CDN propagation.
   - Pull Requests generate dynamic preview environments (e.g. \`pr-42-qasgard.vercel.app\`).
3. **Browser-Only Architecture & Client Migrations**:
   - Schema updates and migrations execute locally inside IndexedDB version upgrade hooks (\`onupgradeneeded\`).
4. **Zero-Cost Browser Storage & Resource Monitoring**:
   - Zero cloud database costs. All suites, test cases, and runs live in the user's browser.
   - Built-in Browser Storage Dashboard monitors IndexedDB quota, usage, and snapshot backups.
`;
