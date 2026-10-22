# GitHub-Ready Architecture & Deployment Plan

Refactor QAsgard into a production-grade, GitHub-ready open-source application with automated CI/CD deployment to GitHub Pages, standardized linting and formatting, a modular directory architecture, and hash-based deep linking.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices from Clarification**:
> - **Vite Base Path**: Configured with a relative base path (`./`), ensuring seamless deployment on any GitHub repository name (e.g., `https://<username>.github.io/<repo-name>/`), organization pages, or custom domains without hardcoded URLs.
> - **CI/CD Deployment**: Automated zero-configuration GitHub Pages deployment using the modern `actions/deploy-pages@v4` workflow.
> - **Routing Architecture**: Hash-based deep linking (`#dashboard`, `#repository`, `#runs`, `#defects`, `#copilot`, `#users`, `#admin`) combined with modular page components in `src/pages/`, guaranteeing 100% 404-free navigation on static hosting.

- **Confirmed Decision 1**: Keep 100% client-side offline execution intact using browser IndexedDB (`browserDb`), allowing the GitHub Pages build to run fully static with zero backend server dependencies required.
- **Confirmed Decision 2**: Preserve existing Vite dev server (`server.ts` with local Express proxy) for AI Studio dev runtime while enabling pure static Vite production build (`vite build`) for GitHub distribution.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the existing QAsgard codebase into an enterprise-quality, modular, and open-source ready GitHub repository. It adds comprehensive documentation (`README.md`), version control safeguards (`.gitignore`), code quality standards (`eslint.config.js`, `.prettierrc`), GitHub Actions automation (`.github/workflows/deploy.yml`), and reorganizes code into clear structural domains (`pages`, `components`, `hooks`, `services`, `store`, `utils`, `types`).
- **Target Audience**: Software Engineers, QA Leads, and Open-Source Contributors evaluating, installing, or deploying QAsgard on their own GitHub accounts.
- **Key Value**: Provides a turn-key repository that can be published to GitHub with one click, automatically built and hosted on GitHub Pages, and easily maintained by multiple developers.

---

## 2. User Experience & Visual Design

- **Deep Link Navigation Flow**:
  - Users can now bookmark, share, and refresh direct URLs such as `/#/repository`, `/#/runs`, `/#/defects`, and `/#/admin`.
  - Browser back and forward buttons navigate naturally through views without losing in-memory state or causing GitHub Pages 404s.
- **Project Structure & Ergonomics**:
  - Top-level views are isolated into dedicated page components under `src/pages/`.
  - Common modal dialogs are grouped under `src/components/modals/`.
  - Layout components (Navbar, Sidebar shell) remain clean and lightweight.
- **PWA & Offline Continuity**:
  - Service worker manifest and caching strategies adapt seamlessly to the relative base path, ensuring instant offline loads whether on GitHub Pages or custom subpaths.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Relative Base Path (`./`) vs Hardcoded Repo Name**
  - *Chosen Approach*: `base: './'` in `vite.config.ts`.
  - *Why*: Eliminates the need to manually update `vite.config.ts` if the repository is renamed, forked, or deployed to a custom domain.
  - *Alternatives Considered*: Hardcoding `/qasgard/` breaks forks or alternative repository names.
- **Decision 2: Hash-Based Location vs HTML5 PushState**
  - *Chosen Approach*: Hash routing hook (`useHashLocation`) syncing with `#<tab>`.
  - *Why*: GitHub Pages is a static file server that lacks SPA fallback rewrite rules by default. HTML5 `pushState` results in HTTP 404 when refreshing non-root paths unless complex 404 redirect hacks are used. Hash routing guarantees 100% reliability across all static hosts.
- **Decision 3: Code Structure Organization**
  - *Chosen Approach*: Segregate into `src/pages/`, `src/components/`, `src/hooks/`, `src/services/`, `src/store/`, `src/utils/`, and `src/types/`.
  - *Why*: Decouples route-level layout concerns from reusable atomics and modals, drastically reducing component file size and complexity.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          GitHub Repository Root                        │
│  ├── .github/workflows/deploy.yml (GitHub Pages CI/CD)                 │
│  ├── .gitignore (Comprehensive ignore rules)                           │
│  ├── eslint.config.js & .prettierrc (Code style & linting)             │
│  ├── README.md (Badges, Architecture, Quickstart, Deploy Guide)        │
│  ├── vite.config.ts (Relative base './', PWA auto-update, build opt)   │
│  └── package.json (Scripts: dev, build, preview, lint, format)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              src/                                      │
│  ├── pages/                                                            │
│  │     ├── DashboardPage.tsx       ├── RepositoryPage.tsx              │
│  │     ├── TestRunsPage.tsx        ├── DefectsPage.tsx                 │
│  │     ├── QACopilotPage.tsx       ├── UserManagementPage.tsx          │
│  │     └── AdminPage.tsx                                               │
│  │                                                                     │
│  ├── components/                                                       │
│  │     ├── common/ (Navbar.tsx, OfflineIndicator, PWAInstallButton)    │
│  │     ├── modals/ (Project, Suite, Case, Preferences Modals)          │
│  │     └── repository/ (Tree explorer, Preview panel, Context menus)   │
│  │                                                                     │
│  ├── hooks/                                                            │
│  │     ├── useHashLocation.ts (Syncs URL hash with active view tab)    │
│  │     └── usePWAInstall.ts (PWA install prompt handling)              │
│  │                                                                     │
│  ├── services/                                                         │
│  │     └── storage/ (indexedDb.ts - Browser-only persistence)          │
│  │                                                                     │
│  ├── store/                                                            │
│  │     └── AppContext.tsx (Shared workspace context & state providers) │
│  │                                                                     │
│  ├── utils/ (exportUtils.ts, copilotPreferences.ts)                    │
│  ├── data/ (mockData.ts, architecture specs, sample fixtures)          │
│  └── types/ (index.ts - Central domain TypeScript interfaces)          │
└────────────────────────────────────────────────────────────────────────┘
```

### Planned File Structure & Changes

1. **Configuration & Automation**:
   - `.github/workflows/deploy.yml`: GitHub Actions pipeline building the static bundle and deploying to GitHub Pages via `actions/deploy-pages@v4`.
   - `.gitignore`: Enterprise-grade ignore rules for dependencies, build targets, environments, logs, and OS caches.
   - `eslint.config.js`: Modern ESLint flat config supporting TypeScript and React hooks.
   - `.prettierrc` & `.prettierignore`: Standardized code formatting configuration.
   - `vite.config.ts`: Updated with `base: './'` for universal relative asset resolution.
   - `package.json`: Updated with scripts `"lint"`, `"format"`, `"format:check"`, and clean dependencies.
   - `README.md`: Comprehensive, beautifully formatted documentation with installation, architecture, and deployment steps.

2. **Source Code Refactoring**:
   - `src/pages/`: Move top-level tab views out of `src/components/` into structured pages.
   - `src/components/modals/`: Centralize project, suite, and test case modals.
   - `src/hooks/useHashLocation.ts`: Hook for 404-safe hash navigation (`window.location.hash`).
   - `src/App.tsx`: Refactored to act as an orchestrator utilizing the new page components and hash routing hook.
