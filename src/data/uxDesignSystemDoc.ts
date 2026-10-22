export interface ScreenSpec {
  id: string;
  name: string;
  badge: string;
  layout: string;
  shadcnComponents: string[];
  userFlow: string[];
  uxNotes: string[];
  responsiveDesign: string[];
  accessibility: string[];
}

export const DESIGN_SYSTEM_FOUNDATIONS = {
  themeName: 'Fluent QA Precision System',
  designLanguage: 'Microsoft Fluent 2 + Modern SaaS',
  colorTokens: {
    light: {
      background: '#f8fafc',
      canvas: '#ffffff',
      surfaceSecondary: '#f1f5f9',
      borderSubtle: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      brandPrimary: '#4f46e5', // Iris / Indigo Fluent accent
      brandHover: '#4338ca',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#0284c7',
    },
    dark: {
      background: '#090d16',
      canvas: '#0f172a',
      surfaceSecondary: '#1e293b',
      borderSubtle: '#334155',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      brandPrimary: '#6366f1',
      brandHover: '#818cf8',
      success: '#34d399',
      danger: '#f87171',
      warning: '#fbbf24',
      info: '#38bdf8',
    },
  },
  typography: {
    fontFamily: 'Segoe UI, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    monoFamily: 'Cascadia Code, JetBrains Mono, Consolas, monospace',
    scale: {
      caption: '11px / 1.4 (FontWeight 500)',
      bodySmall: '12px / 1.5 (FontWeight 400)',
      bodyMedium: '13px / 1.5 (FontWeight 400-500)',
      subheading: '14px / 1.4 (FontWeight 600)',
      title: '18px / 1.3 (FontWeight 700)',
      headline: '24px / 1.25 (FontWeight 800)',
    },
  },
  elevation: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    acrylicBackdrop: 'backdrop-blur-md bg-white/80 dark:bg-slate-900/80',
  },
};

export const SCREENS_SPECIFICATION: ScreenSpec[] = [
  {
    id: 'dashboard',
    name: '1. Executive QA Dashboard',
    badge: 'Analytics & Pulse',
    layout: `### Layout Architecture
- **Shell**: Persistent 3-tier layout:
  1. Top App Command Bar (h-14): Org switcher, Project picker, Universal Search (\`⌘K\`), Theme Toggle, Persona avatar.
  2. Sub-Header Acrylic Banner (h-28): Fluid gradient with mica elevation containing Project KPI overview and Quick Action triggers.
  3. Responsive 12-Column Grid:
     - Top Metrics Row: 4 equal cards (Total Tests, Automation %, Latest Run Pass Rate, Open Defects).
     - Mid Row (8 cols left / 4 cols right):
       - Left: Active Test Run Progress Monitor with segmented multi-color status bars and recent execution stream.
       - Right: Gemini AI Copilot Action Card + Test Suite Health distribution list.
     - Bottom Row (6 cols / 6 cols): Flakiness Velocity trend graph and Defect Severity Pareto breakdown.`,
    shadcnComponents: [
      'Card (CardHeader, CardContent, CardTitle, CardDescription)',
      'Progress (Multi-segment customized)',
      'Badge (Solid & Outline variants)',
      'Button (Primary with micro-glow, Ghost for links)',
      'DropdownMenu (Quick filters & time ranges)',
      'Tooltip (For metric explanations and latency traces)',
    ],
    userFlow: [
      'User arrives at Dashboard -> Immediately observes top-level release health (Pass Rate % and Blocker Bug count).',
      'User hovers over Active Run bar -> Tooltip reveals remaining untested cases and elapsed time.',
      "User clicks 'Launch Live Runner' -> Opens focused full-screen runner console directly without page reload.",
      "User clicks 'Launch AI Studio' -> Transitions immediately to requirements-to-test generator.",
    ],
    uxNotes: [
      "Microsoft Fluent 'Acrylic' backdrop blur on sticky navigation creates depth and hierarchy without sensory overload.",
      'Real-time optimistic counter animations when background tests complete via WebSockets.',
      'Zero red/green ambiguity: every status combines high-contrast color with a distinct icon glyph (Check, Cross, Ban, Skip) for color-blind accessibility.',
    ],
    responsiveDesign: [
      'Desktop (≥1440px): 4-column metric cards, 8/4 split main stage.',
      'Laptop (1024px-1439px): 4-column metrics collapse to 2x2 grid; sidebar collapses to icon-only mode.',
      'Tablet (768px-1023px): Single-column stacked widgets; sticky quick-action floating button.',
      'Mobile (<768px): Card metrics swipeable carousel; bottom navigation bar for core tabs.',
    ],
    accessibility: [
      'WCAG 2.1 Level AA compliant contrast ratios (>4.5:1 on text, >3:1 on graphical indicators).',
      "Role='region' with aria-labelledby on metric cards.",
      "Screen reader announcements for live test run completion percentages via aria-live='polite'.",
    ],
  },
  {
    id: 'projects',
    name: '2. Projects Directory',
    badge: 'Portfolio Navigation',
    layout: `### Layout Architecture
- **Header**: Breadcrumbs, Project count badge, Search input with instant debounce, and 'Create Project' button.
- **Body Grid / List Toggle**:
  - Grid View: Card grid (3 columns on desktop, 2 on tablet, 1 on mobile). Each card features:
    - Project Icon & Unique Code Key badge (e.g., \`[PAY]\`, \`[SHOP]\`).
    - Title, markdown description snippet.
    - Mini telemetry bar: Suite count, Test case count, Active run indicator, Open defects.
    - Last updated timestamp and team avatars.
  - List View: Dense enterprise data table with sortable columns (Name, Key, Tests, Open Bugs, Updated At).`,
    shadcnComponents: [
      'Card',
      'Table (TableHeader, TableRow, TableHead, TableCell)',
      'Input (Search with inline icon and clear button)',
      'Dialog (Create Project modal with form validation)',
      'Avatar (AvatarGroup for assigned team)',
      'Tabs (Grid vs List view switcher)',
    ],
    userFlow: [
      "User views active projects -> types 'Pay' in search box -> list filters in < 50ms.",
      "User clicks 'Create Project' -> Dialog opens -> enters Title and Key (auto-uppercases key).",
      'User submits -> Optimistic card appears immediately with 0 tests -> navigated into project repository.',
    ],
    uxNotes: [
      'Key generator automatically proposes 3-4 letter uppercase prefixes based on the project title.',
      'Hover elevation on cards uses Fluent 2 subtle shadow transition with 1px border highlight (\`hover:border-indigo-500\`).',
    ],
    responsiveDesign: [
      'Fluid auto-fit grid (\`grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))\`).',
      'On mobile view, secondary stats collapse into a clean horizontal chip list.',
    ],
    accessibility: [
      'Keyboard arrows navigate between cards when focused.',
      'Dialog traps focus; Esc key closes with zero layout shift.',
    ],
  },
  {
    id: 'test-suites',
    name: '3. Hierarchical Test Suites',
    badge: 'Tree Architecture',
    layout: `### Layout Architecture
- **Split-Pane Workspace**:
  - Left Pane (w-72 to w-80, resizable):
    - Search suites input.
    - 'All Cases' root node with total count badge.
    - Recursive collapsible Tree View with drag handles, folder icons, depth indent lines, and case count badges.
    - Inline '+ New Child Suite' hover triggers.
  - Right Pane (Flexible):
    - Suite Details Header: Name, description, global suite preconditions box.
    - Bulk action toolbar (Move, Delete, Export, Tag).
    - Child test cases table.`,
    shadcnComponents: [
      'Collapsible (CollapsibleTrigger, CollapsibleContent)',
      'ScrollArea (Smooth custom scrollbar with fade edges)',
      'DropdownMenu (Suite context menu: Add child, Rename, Clone, Delete)',
      'AlertDialog (Confirmation for deleting suites with child test cases)',
      'Separator',
    ],
    userFlow: [
      "Tester expands 'Payment Workflows' -> reveals nested '3DS 2.0 Auth' sub-suite.",
      "Tester drags a test case from root suite and drops into '3DS 2.0 Auth' -> visual drop target glows indigo -> database updates via optimistic transition.",
      "Tester right-clicks suite -> selects 'Add Sub-suite' -> inline editable input appears.",
    ],
    uxNotes: [
      'Fluent tree connector guides: Subtle 1px dotted vertical indentation lines assist orientation in deep trees (up to 7 levels).',
      'Preconditions callout uses amber accent with distinct padlock icon to signify required environment state before testing.',
    ],
    responsiveDesign: [
      'Desktop: Fixed or resizable left navigation pane.',
      'Tablet & Mobile: Left pane slides into an off-canvas Sheet overlay toggled via menu button.',
    ],
    accessibility: [
      "WAI-ARIA Tree View pattern: \`role='tree'\`, \`role='treeitem'\`, \`aria-expanded='true/false'\`.",
      'Full keyboard support: Up/Down to navigate, Right to expand, Left to collapse.',
    ],
  },
  {
    id: 'test-cases',
    name: '4. Test Cases Authoring & Details',
    badge: 'Core Specifications',
    layout: `### Layout Architecture
- **Table / Split Screen**:
  - Case Table: Columns for Checkbox, Key (\`PAY-101\`), Title, Layer (Unit/API/E2E), Automation badge (Auto/Manual), Severity, Priority, Actions.
  - Slide-Over Drawer (w-[520px]):
    - Header: Key, Suite breadcrumbs, Edit/Delete buttons, Close.
    - Metadata Bar: Priority, Severity, Layer, Automation status chips.
    - Preconditions box (amber).
    - Sequential Steps Timeline: Step number badge, Action text, Test Data code block, Expected Result green box.
    - Attachments strip (thumbnails with size badges).
    - Threaded Comments feed with author avatars.`,
    shadcnComponents: [
      'Sheet (Slide-over drawer for instantaneous case inspection)',
      'Table',
      'Badge (Color-coded severity & priority)',
      'Textarea (Auto-resizing markdown editor for steps)',
      'Command (Fast tag insertion palette)',
      'Separator',
    ],
    userFlow: [
      'User clicks any row in table -> Slide-over drawer smoothly slides in from right (< 150ms).',
      'User edits step description inline -> auto-saves on blur with green check micro-indicator.',
      "User clicks '+ Add Step' -> new step appends with auto-focus in action field.",
      "User clicks 'AI Suggest Steps' -> Gemini auto-fills granular steps and assertions based on test title.",
    ],
    uxNotes: [
      'Slide-over drawer maintains context: the background table remains visible and selectable without page navigation.',
      'Double-click row opens full-page edit mode; single-click opens fast preview drawer.',
    ],
    responsiveDesign: [
      'On screens < 1024px, the drawer covers full screen as an accessible modal sheet.',
    ],
    accessibility: [
      'Keyboard shortcut \`Esc\` closes drawer and restores focus to selected row in table.',
      'ARIA live region notifies screen readers when comments or steps are added.',
    ],
  },
  {
    id: 'test-plans',
    name: '5. Test Plans & Milestones',
    badge: 'Release Bundling',
    layout: `### Layout Architecture
- **Header**: Active Milestone banner, target release countdown, 'New Test Plan' trigger.
- **Card Matrix & Progress Trackers**:
  - Each Plan Card contains:
    - Milestone title & target version badge (e.g. \`v4.2.0 GA\`).
    - Release Date with calendar countdown chip.
    - Linked test suites & case count breakdown.
    - Execution progress donut chart (Passed, Failed, Untested).
    - Quick 'Create Run from Plan' action button.`,
    shadcnComponents: [
      'Card',
      'Calendar (Date picker for release targets)',
      'Progress',
      'Badge',
      'Dialog (Plan builder: suite picker with multi-select checkboxes)',
      'Button',
    ],
    userFlow: [
      "Lead clicks 'New Test Plan' -> inputs 'Sprint 43 Release Audit' and sets target date.",
      'Selects required suites via multi-select tree -> saves plan.',
      "When sprint commences, clicks 'Start Run from Plan' -> pre-selects all plan test cases into a new Test Run.",
    ],
    uxNotes: [
      'Visual countdown pill turns amber when release is < 3 days away, and red if overdue.',
      'Test Plans bundle test cases across multiple suites without duplicating cases in the database.',
    ],
    responsiveDesign: ['2-column card grid on desktop, single-column stacked view on mobile.'],
    accessibility: ["Clear date formats (ISO 8601 + localized friendly string: 'Oct 15, 2026')."],
  },
  {
    id: 'test-runs',
    name: '6. Test Runs & Live Execution Console',
    badge: 'Execution Engine',
    layout: `### Layout Architecture
- **Two Distinct Modes**:
  1. **Run Directory**: List of Active, Completed, and Aborted runs with multi-segment colored progress bars, environment chips (\`Staging\`, \`Production\`), and assigned tester avatars.
  2. **Live Execution Console (Full-Focus Screen)**:
     - Header: Run title, environment, elapsed Stopwatch timer (Play/Pause/Reset), 'Finish Run' button.
     - Left Sidebar (w-72): Queue of tests with real-time status glyphs (Green check, Red cross, Amber blocked, Gray skip).
     - Center Stage: Active test case, preconditions, and step-by-step interactive cards.
     - Footer / Floating Hotkey Bar: \`P\` (Pass), \`F\` (Fail), \`B\` (Block), \`S\` (Skip), \`N\` (Next).
     - Failure Section: Error message textarea, stack trace editor, and prominent **'File Defect from Failure'** button.`,
    shadcnComponents: [
      'Sheet / Dialog (Full-screen execution console)',
      'Button (Large touch-friendly action toggles)',
      'Textarea (Stacktrace and actual result input)',
      'Badge',
      'Tooltip (Hotkey indicators)',
      'Alert (Failure diagnostic warning)',
    ],
    userFlow: [
      "Tester opens run -> clicks 'Launch Live Runner' -> enters distraction-free execution mode.",
      "Tester presses \`P\` -> Step 1 passes -> presses \`P\` -> Step 2 passes -> entire case marks 'Passed' -> auto-advances to test case 2.",
      'At Step 3, assertion fails -> tester presses \`F\` -> failure box opens -> tester enters error note.',
      "Tester clicks 'File Defect from Failure' -> pre-populated defect ticket generates with reproduction steps in 1 click.",
    ],
    uxNotes: [
      'Zero-latency optimistic UI: status changes render in < 10ms with background Supabase sync.',
      'Stopwatch timer pauses when browser tab loses focus to maintain accurate active testing metrics.',
    ],
    responsiveDesign: [
      'Live runner adapts to tablets with large 48px touch targets for mobile exploratory QA.',
    ],
    accessibility: [
      'Complete hands-free keyboard execution: testers can execute 100 test cases without touching a mouse.',
      'High-contrast focus rings on active test steps.',
    ],
  },
  {
    id: 'reports',
    name: '7. Quality Analytics & Reports',
    badge: 'Executive Insights',
    layout: `### Layout Architecture
- **Analytics Command Center**:
  - Filter Bar: Date Range Picker (presets: Last 7 days, Sprint 42, Last 90 days), Environment filter, Suite filter.
  - Row 1: KPI Summary cards (Overall Pass Rate %, Mean Time to Execute, Test Velocity, Flakiness Index).
  - Row 2:
    - Pass/Fail/Block Trend Area Chart (Recharts-based).
    - Automation Ratio Donut (Automated vs Manual vs To Be Automated).
  - Row 3:
    - Flakiest Tests Leaderboard (tests with highest pass/fail oscillation).
    - Defects by Severity Bar Chart.
  - Action Bar: 'Export Report as PDF', 'Export CSV', 'Share Live Link'.`,
    shadcnComponents: [
      'Card',
      'Select',
      'Popover (DateRangePicker)',
      'Table',
      'Button',
      'DropdownMenu',
    ],
    userFlow: [
      'Test Manager selects date range -> charts re-render smoothly with animated SVG paths.',
      'Manager hovers over flakiness score -> observes which specific step timed out.',
      "Manager clicks 'Export Executive PDF' -> generates clean, branded print-ready summary.",
    ],
    uxNotes: [
      'Recharts styled with Tailwind CSS variables to seamlessly adapt between Light and Dark mode.',
      'Empty states feature illustrative hints rather than blank white boxes.',
    ],
    responsiveDesign: [
      'Charts maintain fixed aspect ratios with horizontal scroll on small viewports.',
    ],
    accessibility: [
      'All chart data is accompanied by screen-reader accessible HTML data tables.',
      'Colors calibrated for protanopia, deuteranopia, and tritanopia.',
    ],
  },
  {
    id: 'settings',
    name: '8. Project & Personal Settings',
    badge: 'Customization',
    layout: `### Layout Architecture
- **Split Settings Layout**:
  - Left Vertical Tabs: General, Environments, Custom Fields, Integrations (Jira/GitHub), API Keys, Notifications.
  - Right Settings Pane:
    - General: Project name, key prefix, description, archive project.
    - Environments: Manage custom environments (\`Production\`, \`Staging\`, \`Dev-US\`, \`Local\`).
    - API Keys: Generate personal access tokens for CI/CD Playwright/Cypress reporters.`,
    shadcnComponents: [
      'Tabs (Vertical tab list)',
      'Input',
      'Switch (Toggle notifications and MFA)',
      'Button (Destructive variant for Danger Zone)',
      'Card',
    ],
    userFlow: [
      'User opens Settings -> generates new API token -> token displays once with Copy button.',
      "User toggles 'Dark Mode' -> application theme transitions with smooth CSS color cross-fade.",
    ],
    uxNotes: [
      'Danger Zone (Delete/Archive project) is separated with red outline and requires typing project name to confirm.',
    ],
    responsiveDesign: ['Vertical tabs convert to horizontal scrollable tabs on viewports < 768px.'],
    accessibility: [
      'Form inputs feature explicit \`<Label>\` elements linked via \`htmlFor\` IDs.',
    ],
  },
  {
    id: 'administration',
    name: '9. Organization Administration & RBAC',
    badge: 'Enterprise Governance',
    layout: `### Layout Architecture
- **Enterprise Management Shell**:
  - Top Bar: Organization name, Subscription plan badge (\`Enterprise Tier\`), Seat usage meter (\`14 / 25 Seats\`).
  - Section 1: Member Management Table:
    - Columns: User (avatar, name, email), Role dropdown, Status badge (\`Active\`, \`Invited\`), Last Active, Actions.
    - 'Invite Member' button launching modal.
  - Section 2: Role-Based Access Control (RBAC) Matrix Table:
    - Grid comparing 6 roles (Admin, Test Manager, QA Lead, QA Engineer, Product Owner, Viewer) across 8 system permissions with checkmark glyphs.
  - Section 3: Audit Trail viewer with quarterly date partitions.`,
    shadcnComponents: [
      'Table',
      'Select (Role assignment dropdown)',
      'Dialog (Invite user with email and role picker)',
      'Badge',
      'Card',
      'Progress (Seat capacity meter)',
    ],
    userFlow: [
      "Admin clicks 'Invite Member' -> enters email and assigns 'QA Engineer' -> invite email dispatches.",
      'Admin reassigns user role in dropdown -> permissions update immediately without page refresh.',
      "Admin reviews Audit Trail -> filters by 'DELETE' actions to verify compliance.",
    ],
    uxNotes: [
      'Admins cannot demote their own account to prevent lockout.',
      'System roles have locked badges to clarify they cannot be deleted.',
    ],
    responsiveDesign: ['RBAC matrix enables horizontal scroll on mobile with frozen first column.'],
    accessibility: [
      "Screen readers announce permission status as 'Allowed' or 'Restricted' rather than just icon visuals.",
    ],
  },
];
