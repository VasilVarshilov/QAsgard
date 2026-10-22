# QAsgard — Where Quality Rules

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC.svg)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple.svg)](https://web.dev/progressive-web-apps/)
[![CI/CD](https://img.shields.io/badge/GitHub%20Pages-Automated%20Deploy-success.svg)](https://pages.github.com/)

**QAsgard** is an enterprise-grade, 100% browser-based Quality Assurance and Test Management platform. Built with an offline-first architecture powered by IndexedDB, QAsgard provides test repository management, hierarchical suite organization, live test runs with step-by-step timers, native defect tracking, audit logs, and an AI QA Copilot—without requiring an external backend database or cloud lock-in.

---

## Key Features

- **100% Browser-First & Zero Cloud Dependency**: All test cases, suites, test runs, and defect records are stored locally in IndexedDB with real-time localStorage caching. Works seamlessly completely offline.
- **Multi-Project & Multi-Repository Hierarchy**: Manage multiple projects with independent or merged test repositories, branch testing, and instant switching.
- **Comprehensive Test Case Management**: Rich test step editor, preconditions, expected results, priority/severity badges, test tags, and custom fields.
- **Live Test Runner & Execution**: Interactive runner modal with stopwatch timer, execution logs, defect linking, and instant pass/fail/blocked recording.
- **Universal Import & Export**: One-click export to formatted PDF, CSV, Markdown, and JSON backups. Universal JSON import wizard with auto-mapping.
- **Context-Aware AI Copilot**: Generate comprehensive positive, negative, and edge-case tests tailored to your project requirements.
- **PWA (Progressive Web App)**: Installable on Desktop, iOS, and Android with instant launch and background caching.
- **Enterprise Audit Trail**: Full cryptographic integrity hashes tracking all mutations, additions, and deletions for regulatory compliance.

---

## Project Architecture

```
qasgard/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Pages CI/CD workflow
├── public/                     # Static assets, icons, and PWA manifest items
├── src/
│   ├── components/             # Reusable UI components and modal dialogs
│   │   ├── common/             # Layout navigation, badges, offline indicators
│   │   ├── modals/             # Project, suite, test case, and preferences modals
│   │   ├── pwa/                # PWA install prompt & offline badges
│   │   └── repository/         # Suite tree explorer, preview panels, context menus
│   ├── data/                   # Initial project templates & architecture documentation
│   ├── hooks/                  # Custom React hooks (useHashLocation, usePWAInstall)
│   ├── pages/                  # Modular top-level views & route destinations
│   │   ├── AdminPage.tsx       # Universal import/export, audit log, architecture
│   │   ├── DashboardPage.tsx   # Project KPIs, pass rate metrics, defect summaries
│   │   ├── DefectsPage.tsx     # Bug filing, status boards, priority tracking
│   │   ├── QACopilotPage.tsx   # AI test generator and specification reviewer
│   │   ├── RepositoryPage.tsx  # Central test tree explorer, suites, and cases
│   │   ├── TestRunsPage.tsx    # Test execution cycles and live runner
│   │   └── UserManagementPage.tsx # Team roles, permissions, and audit identities
│   ├── services/
│   │   └── storage/            # IndexedDB persistent browser database (browserDb)
│   ├── store/                  # Application context & shared state helpers
│   ├── utils/                  # Export utilities (PDF, CSV, JSON), copilot preferences
│   ├── types.ts                # TypeScript domain models and interfaces
│   ├── App.tsx                 # Root application coordinator with hash navigation
│   ├── main.tsx                # React 19 application entry point
│   └── index.css               # Tailwind CSS v4 styling rules
├── .gitignore                  # Git ignore rules for node, dist, and OS files
├── .prettierrc                 # Code formatting rules
├── eslint.config.js            # ESLint flat configuration
├── index.html                  # HTML5 entry point with PWA meta tags
├── package.json                # Project dependencies and script commands
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite bundler, PWA plugin, and relative base path
```

---

## Quick Start & Development

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` (version 9.0 or higher)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/qasgard.git
cd qasgard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000` or `http://localhost:5173`.

### 4. Build for production

```bash
npm run build
```

The compiled, minified static assets will be output to the `dist/` folder.

### 5. Preview production build

```bash
npm run preview
```

### 6. Linting & Code Formatting

```bash
# Type check and lint
npm run lint

# Format code with Prettier
npm run format

# Verify formatting without modifying files
npm run format:check
```

---

## GitHub Pages Deployment

QAsgard is pre-configured for automated deployment to **GitHub Pages** using GitHub Actions with a relative base path (`./`). This means it works out-of-the-box on any repository name or custom domain without code changes.

### Step-by-Step Setup:

1. Push your code to your GitHub repository on branch `main` (or `master`):
   ```bash
   git add .
   git commit -m "feat: initial commit of QAsgard"
   git push -u origin main
   ```
2. In your GitHub repository, click on the **Settings** tab.
3. In the left sidebar, click on **Pages** (under the "Code and automation" section).
4. Under **Build and deployment** -> **Source**, select **GitHub Actions** from the dropdown menu.
5. Head over to the **Actions** tab in your repository. The workflow `Deploy QAsgard to GitHub Pages` will automatically run.
6. Once the workflow completes (typically within 1-2 minutes), your live application will be published at:
   ```
   https://<your-github-username>.github.io/<your-repo-name>/
   ```

---
№№ Test on: https://vasilvarshilov.github.io/QAsgard

## License

This project is licensed under the [MIT License](LICENSE).
