import React, { useEffect } from 'react';
import {
  Settings,
  Bot,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Keyboard,
  Clock,
  Layout,
  X,
  LogOut,
} from 'lucide-react';
import { QACopilotPreferences, CopilotAutoCollapse } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: QACopilotPreferences;
  onUpdatePreferences: (updated: Partial<QACopilotPreferences>) => void;
  onResetPosition: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onResetPosition,
}) => {
  // Always allow closing via Escape key and lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        // Close when clicking the backdrop overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-[100] animate-in fade-in duration-150"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 text-xs overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pref-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with breadcrumb and prominent Exit / Close button */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              {/* Breadcrumb path: Settings -> Personal Preferences -> QA Copilot */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                <span>Settings</span>
                <span>→</span>
                <span>Personal Preferences</span>
                <span>→</span>
                <span className="text-slate-900 dark:text-white font-extrabold">QA Copilot</span>
              </div>
              <h2 id="pref-title" className="text-base font-bold text-slate-900 dark:text-white">
                QA Copilot &amp; Platform Settings
              </h2>
            </div>
          </div>

          {/* Unmistakable Close / Exit Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 transition-all cursor-pointer font-semibold"
            aria-label="Close settings"
            title="Затвори настройките (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="text-xs">Затвори / Изход</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section: QA Copilot Floating Widget */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                <Bot className="w-4 h-4" />
                <span>Floating Chat Widget Configuration</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                State:{' '}
                {preferences.showButton
                  ? preferences.state === 'expanded'
                    ? 'Expanded'
                    : preferences.state === 'minimized'
                      ? 'Minimized'
                      : 'Hidden'
                  : 'Disabled'}
              </span>
            </div>

            {/* Toggle: Show / Hide QA Copilot Button */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                  Show QA Copilot Floating Button
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  When enabled, the draggable Copilot assistant button floats above your workspace.
                  When disabled, the widget is completely hidden from the viewport.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={preferences.showButton}
                  onChange={(e) => onUpdatePreferences({ showButton: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Setting: Auto-Collapse Inactivity Timer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Auto-Collapse Idle Inactivity Timer</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Active:{' '}
                  {preferences.autoCollapse === 'off' ? 'Disabled' : preferences.autoCollapse}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Automatically minimize the expanded chat drawer to a small draggable icon when
                inactive.
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                {(['off', '1m', '5m', '15m'] as CopilotAutoCollapse[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdatePreferences({ autoCollapse: mode })}
                    className={`py-1.5 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                      preferences.autoCollapse === mode
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {mode === 'off'
                      ? 'Off'
                      : mode === '1m'
                        ? '1 min'
                        : mode === '5m'
                          ? '5 min'
                          : '15 min'}
                  </button>
                ))}
              </div>
            </div>

            {/* Setting: Smart Edge Snapping & Dimming */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.edgeSnapping}
                  onChange={(e) => onUpdatePreferences({ edgeSnapping: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                    Snap to Screen Edges
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Snaps smoothly to left or right margin when dropped near the screen boundary.
                  </span>
                </div>
              </label>

              <label className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.smartDimming}
                  onChange={(e) => onUpdatePreferences({ smartDimming: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                    Smart Positioning &amp; Dimming
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                    Reduces widget opacity when forms, dialogs, or editors are active to prevent UI
                    overlap.
                  </span>
                </div>
              </label>
            </div>

            {/* Reset Position Button */}
            <div className="flex items-center justify-between p-3 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Reset Floating Position
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Restore the Copilot button to the default bottom-right screen anchor.
                </span>
              </div>
              <button
                onClick={onResetPosition}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Position</span>
              </button>
            </div>
          </div>

          {/* Section: Keyboard Shortcuts */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
              <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Productivity Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Open / Close Copilot</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 rounded text-[10px]">
                  Ctrl + Shift + A
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Minimize Copilot</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 rounded text-[10px]">
                  ESC
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer: Always visible on any screen size */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            Натиснете{' '}
            <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px]">
              Esc
            </kbd>{' '}
            или кликнете за изход
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Отказ / Затвори
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Запази и излез</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
