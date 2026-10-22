import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Layout,
  Component,
  Route,
  Sparkles,
  Copy,
  Check,
  Download,
  Smartphone,
  Eye,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  MousePointerClick,
  Sliders,
  Maximize2,
  Layers,
} from 'lucide-react';
import {
  DESIGN_SYSTEM_FOUNDATIONS,
  SCREENS_SPECIFICATION,
  ScreenSpec,
} from '../data/uxDesignSystemDoc';

interface UXDesignSystemViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const UXDesignSystemView: React.FC<UXDesignSystemViewProps> = ({
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [selectedScreenId, setSelectedScreenId] = useState<string>(SCREENS_SPECIFICATION[0].id);
  const [viewSubtab, setViewSubtab] = useState<'screens' | 'foundations' | 'shadcn'>('screens');
  const [copied, setCopied] = useState(false);

  const activeScreen =
    SCREENS_SPECIFICATION.find((s) => s.id === selectedScreenId) || SCREENS_SPECIFICATION[0];

  const handleCopyMarkdown = () => {
    const text = `# QAsgard UI/UX Design System Specification
Design Language: ${DESIGN_SYSTEM_FOUNDATIONS.designLanguage}
Tokens: Fluent Acrylic & Mica Elevation, ShadCN UI Mapping

${SCREENS_SPECIFICATION.map(
  (s) => `## ${s.name}
${s.layout}

### ShadCN UI Components
${s.shadcnComponents.map((c) => `- ${c}`).join('\n')}

### User Flow
${s.userFlow.map((f, i) => `${i + 1}. ${f}`).join('\n')}

### UX Notes & Micro-Interactions
${s.uxNotes.map((n) => `- ${n}`).join('\n')}

### Responsive Design Breakpoints
${s.responsiveDesign.map((r) => `- ${r}`).join('\n')}

### Accessibility (WCAG 2.1 AA)
${s.accessibility.map((a) => `- ${a}`).join('\n')}

---`
).join('\n\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full flex items-center gap-1">
                <Palette className="w-3 h-3 text-violet-400" />
                Microsoft Fluent 2 + Modern SaaS
              </span>
              <span className="text-xs text-slate-400">
                • Light &amp; Dark Theme • ShadCN Components • WCAG 2.1 AA
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              UI &amp; UX System Specification
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Complete design system architecture for all 9 core enterprise screens: wireframe
              layouts, ShadCN component mappings, interactive user flows, micro-interactions,
              responsive breakpoints, and accessibility.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title="Toggle application Light / Dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-300" />
              )}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied Specs!' : 'Copy UX Specs'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setViewSubtab('screens')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewSubtab === 'screens'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            9 Enterprise Screen Specifications
          </button>
          <button
            onClick={() => setViewSubtab('foundations')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewSubtab === 'foundations'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Fluent Design Foundations
          </button>
          <button
            onClick={() => setViewSubtab('shadcn')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewSubtab === 'shadcn'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ShadCN Component Catalog
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Active Theme:{' '}
          <strong className="text-indigo-600 dark:text-indigo-400 uppercase">
            {isDarkMode ? 'Dark' : 'Light'}
          </strong>
        </div>
      </div>

      {/* SUBTAB 1: 9 ENTERPRISE SCREENS */}
      {viewSubtab === 'screens' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Screen Selector */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-3 space-y-1 h-[640px] overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Application Screens ({SCREENS_SPECIFICATION.length})
            </div>
            {SCREENS_SPECIFICATION.map((screen) => {
              const isSelected = screen.id === activeScreen.id;
              return (
                <button
                  key={screen.id}
                  onClick={() => setSelectedScreenId(screen.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Layout
                      className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
                    />
                    <span className="truncate">{screen.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {screen.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Screen Specification Detail */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 space-y-6 h-[640px] overflow-y-auto text-xs">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                  {activeScreen.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">QAsgard • Fluent UI System</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeScreen.name}
              </h2>
            </div>

            {/* Layout */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Layout &amp; Grid Architecture
              </h3>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                {activeScreen.layout.replace(/### Layout Architecture\n/, '')}
              </div>
            </div>

            {/* ShadCN Components */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Component className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                ShadCN Component Implementations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeScreen.shadcnComponents.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-indigo-950 dark:text-indigo-200 font-mono text-[11px] flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Flow */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                User Flow &amp; Primary Journey
              </h3>
              <div className="space-y-1.5">
                {activeScreen.userFlow.map((flow, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{flow}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* UX Notes & Micro-Interactions */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                UX Notes, Micro-Interactions &amp; Polish
              </h3>
              <ul className="space-y-1 list-disc list-inside text-slate-700 dark:text-slate-300">
                {activeScreen.uxNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>

            {/* Responsive & Accessibility 2-Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase text-[11px]">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  Responsive Adaptation
                </h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  {activeScreen.responsiveDesign.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase text-[11px]">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  Accessibility (WCAG 2.1 AA)
                </h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  {activeScreen.accessibility.map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: FLUENT DESIGN FOUNDATIONS */}
      {viewSubtab === 'foundations' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 text-xs">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Microsoft Fluent 2 Design Tokens &amp; Elevation
            </h2>
            <p className="text-slate-500">
              System tokens calibrated for light and dark contrast compliance, depth hierarchy, and
              typographic rhythm.
            </p>
          </div>

          {/* Color Tokens Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light Palette */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" /> Light Mode Tokens
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                {Object.entries(DESIGN_SYSTEM_FOUNDATIONS.colorTokens.light).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <span
                      className="w-4 h-4 rounded shadow-2xs border border-black/10 shrink-0"
                      style={{ backgroundColor: val }}
                    />
                    <div className="truncate">
                      <div className="text-[10px] text-slate-400">{key}</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dark Palette */}
            <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-xl space-y-3">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode Tokens (OLED Friendly)
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                {Object.entries(DESIGN_SYSTEM_FOUNDATIONS.colorTokens.dark).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-1.5 bg-slate-800 rounded border border-slate-700"
                  >
                    <span
                      className="w-4 h-4 rounded shadow-2xs border border-white/10 shrink-0"
                      style={{ backgroundColor: val }}
                    />
                    <div className="truncate">
                      <div className="text-[10px] text-slate-400">{key}</div>
                      <div className="font-bold text-slate-100">{val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Elevation & Materials */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              Mica, Acrylic &amp; Shadow Elevation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Card Elevation
                </span>
                <p className="text-[11px] text-slate-500">
                  1px border + soft ambient drop shadow for container grouping.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Dropdown / Popover Elevation
                </span>
                <p className="text-[11px] text-slate-500">
                  8px-16px blur radius for floating commands and menus.
                </p>
              </div>
              <div className="p-4 rounded-xl backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-indigo-200 dark:border-indigo-800 shadow-lg space-y-1">
                <span className="font-bold text-indigo-700 dark:text-indigo-400 block">
                  Acrylic Glass Material
                </span>
                <p className="text-[11px] text-slate-500">
                  Backdrop-filter blur(12px) for sticky headers and runner overlays.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SHADCN COMPONENT CATALOG */}
      {viewSubtab === 'shadcn' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              ShadCN UI Library Component Taxonomy
            </h2>
            <p className="text-slate-500">
              Zero-runtime CSS primitives combined with Tailwind utility tokens for accessible,
              high-density SaaS UX.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                name: 'Sheet',
                role: 'Slide-Over Test Case Drawer',
                desc: 'Context-preserving drawer sliding from the right for instant test inspection.',
              },
              {
                name: 'Command (cmdk)',
                role: 'Universal Command Palette',
                desc: 'Keyboard-first ⌘K search across cases, suites, defects, and runs.',
              },
              {
                name: 'Progress',
                role: 'Multi-Segment Execution Bar',
                desc: 'Custom progress component rendering green, red, amber, and gray segments.',
              },
              {
                name: 'Table',
                role: 'Enterprise Data Grid',
                desc: 'Dense sorting and filterable tables with sticky headers and zebra striping.',
              },
              {
                name: 'Badge',
                role: 'Severity & Automation Flags',
                desc: 'Color-coded accessible badges for Blocker, Critical, E2E, and Automated.',
              },
              {
                name: 'Tooltip',
                role: 'Hotkey Helpers & Traces',
                desc: 'Micro-tooltips explaining hotkeys (P, F, B, S) and diagnostic metrics.',
              },
              {
                name: 'Dialog',
                role: 'Focused Modal Builders',
                desc: 'Trap-focus modals for Plan and Suite creation.',
              },
              {
                name: 'Collapsible',
                role: 'Hierarchical Suite Tree',
                desc: 'Smooth accordion animation for deep multi-level test suite trees.',
              },
              {
                name: 'DropdownMenu',
                role: 'Context & Bulk Menus',
                desc: 'Right-click and action menus for bulk test moves, tags, and runs.',
              },
            ].map((c) => (
              <div
                key={c.name}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono text-sm">
                    {c.name}
                  </span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{c.role}</div>
                <p className="text-slate-500 text-[11px] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
