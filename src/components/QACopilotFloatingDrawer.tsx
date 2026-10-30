import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  Layers,
  Zap,
  GripVertical,
  EyeOff,
  Sliders,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react';
import {
  Project,
  TestCase,
  TestSuite,
  Defect,
  User,
  QACopilotPreferences,
  CopilotDisplayState,
} from '../types';
import { clampAndSnapPosition } from '../utils/copilotPreferences';
import { MarkdownRenderer } from './common/MarkdownRenderer';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface QACopilotFloatingDrawerProps {
  project: Project;
  testSuites: TestSuite[];
  testCases: TestCase[];
  defects?: Defect[];
  currentUser?: User;
  selectedSuiteId?: string | null;
  selectedTestCase?: TestCase | null;
  preferences: QACopilotPreferences;
  onUpdatePreferences: (updated: Partial<QACopilotPreferences>) => void;
  onOpenPreferencesModal?: () => void;
}

export const QACopilotFloatingDrawer: React.FC<QACopilotFloatingDrawerProps> = ({
  project,
  testSuites,
  testCases,
  defects = [],
  currentUser,
  selectedSuiteId,
  selectedTestCase,
  preferences,
  onUpdatePreferences,
  onOpenPreferencesModal,
}) => {
  // Current display state: 'hidden' | 'minimized' | 'expanded'
  const displayState = preferences.state;

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -1, y: -1 });
  const hasMovedRef = useRef<boolean>(false);
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inactivity auto-collapse timer ref
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'drawer-welcome',
      role: 'model',
      text: `Hello! I am **QA Copilot**, your embedded AI quality architect. I am synchronized with **${project.name}** (${testCases.length} cases). Ask me to audit coverage, generate negative test cases, or review step assertions.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Initialize or restore position
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (preferences.position && preferences.position.x >= 0 && preferences.position.y >= 0) {
      // Clamped to viewport
      const clamped = clampAndSnapPosition(preferences.position, 150, 44, preferences.edgeSnapping);
      setPosition(clamped);
    } else {
      // Default to bottom-right: 24px from right, 32px from bottom
      const defaultX = Math.max(16, window.innerWidth - 170);
      const defaultY = Math.max(60, window.innerHeight - 80);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [preferences.position, preferences.edgeSnapping]);

  // Handle window resize to keep button inside viewport
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (prev.x < 0 || prev.y < 0) return prev;
        return clampAndSnapPosition(prev, 150, 44, preferences.edgeSnapping);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [preferences.edgeSnapping]);

  // Keyboard Shortcuts: Ctrl+Shift+A (toggle) and ESC (minimize)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + A or Cmd + Shift + A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (displayState === 'expanded') {
          onUpdatePreferences({ state: 'minimized' });
        } else {
          onUpdatePreferences({ state: 'expanded', showButton: true });
        }
      }

      // ESC minimizes expanded window
      if (e.key === 'Escape' && displayState === 'expanded') {
        onUpdatePreferences({ state: 'minimized' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayState, onUpdatePreferences]);

  // Auto-collapse idle timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (preferences.autoCollapse === 'off' || displayState !== 'expanded') {
      return;
    }

    const minutes =
      preferences.autoCollapse === '1m' ? 1 : preferences.autoCollapse === '5m' ? 5 : 15;
    const ms = minutes * 60 * 1000;

    inactivityTimerRef.current = setTimeout(() => {
      onUpdatePreferences({ state: 'minimized' });
    }, ms);
  }, [preferences.autoCollapse, displayState, onUpdatePreferences]);

  // Reset timer on message or input interaction
  useEffect(() => {
    if (displayState === 'expanded') {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [displayState, resetInactivityTimer, messages, inputPrompt]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (displayState === 'expanded') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, displayState, isLoading]);

  // Smart Positioning & Dimming: detect if modal, context menu, or details panel is open
  const [hasActiveOverlay, setHasActiveOverlay] = useState(false);

  useEffect(() => {
    if (!preferences.smartDimming) {
      setHasActiveOverlay(false);
      return;
    }

    const checkOverlays = () => {
      if (typeof document === 'undefined') return;
      const hasModal =
        document.querySelector('[role="dialog"]:not([aria-label="QA Copilot Chat Studio"])') !==
        null;
      const hasBackdrop =
        document.querySelector('.backdrop-blur-xs, .fixed.inset-0:not(.pointer-events-none)') !==
        null;
      const hasContextMenu = document.querySelector('[role="menu"]') !== null;
      // also check if right details panel is open in RepositoryView (preventing overlap with comment box)
      const hasRightPanel = document.querySelector('.w-\\[450px\\], .w-\\[620px\\]') !== null;
      setHasActiveOverlay(hasModal || hasBackdrop || hasContextMenu || hasRightPanel);
    };

    checkOverlays();
    const interval = setInterval(checkOverlays, 600);
    return () => clearInterval(interval);
  }, [preferences.smartDimming]);

  // Pointer dragging handlers with touch & desktop support
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    setIsDragging(true);
    hasMovedRef.current = false;
    startPointerRef.current = { x: e.clientX, y: e.clientY };

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = Math.abs(e.clientX - startPointerRef.current.x);
    const deltaY = Math.abs(e.clientY - startPointerRef.current.y);

    if (deltaX > 4 || deltaY > 4) {
      hasMovedRef.current = true;
    }

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const clamped = clampAndSnapPosition(
      { x: newX, y: newY },
      160,
      44,
      false // don't snap while dragging, only on release
    );

    setPosition(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (hasMovedRef.current) {
      // Snapping on drag completion
      const snapped = clampAndSnapPosition(position, 160, 44, preferences.edgeSnapping);
      setPosition(snapped);
      onUpdatePreferences({ position: snapped });
    } else {
      // Clean click toggles mode
      if (displayState === 'expanded') {
        onUpdatePreferences({ state: 'minimized' });
      } else {
        onUpdatePreferences({ state: 'expanded' });
      }
    }
  };

  // Quick flip / dock to opposite side (e.g. if covering bottom-right comments)
  const handleDockOppositeEdge = (e: React.MouseEvent) => {
    e.stopPropagation();
    const screenW = window.innerWidth;
    const isCurrentlyRight = position.x > screenW / 2;
    const targetX = isCurrentlyRight ? 16 : screenW - 176;
    const newPos = { x: targetX, y: position.y };
    setPosition(newPos);
    onUpdatePreferences({ position: newPos });
  };

  // Quick hide directly from floating pill
  const handleQuickHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdatePreferences({ state: 'hidden' });
  };

  // Active suite lookup
  const activeSuite = selectedSuiteId ? testSuites.find((s) => s.id === selectedSuiteId) : null;

  const handleSendMessage = async (promptText?: string) => {
    const text = promptText || inputPrompt;
    if (!text.trim() || isLoading) return;

    resetInactivityTimer();

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const contextPayload = {
        organization: { name: project.name || 'Workspace' },
        project: { name: project.name, key: project.key, id: project.id },
        activeSuite: activeSuite
          ? { id: activeSuite.id, name: activeSuite.name, description: activeSuite.description }
          : null,
        activeCase: selectedTestCase
          ? {
              key: selectedTestCase.key,
              title: selectedTestCase.title,
              stepsCount: selectedTestCase.steps?.length,
            }
          : null,
        totalCases: testCases.length,
        suitesCount: testSuites.length,
        defectsCount: defects.length,
      };

      const res = await fetch('/api/ai/qa-copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          model: selectedModel,
          context: contextPayload,
        }),
      });

      const data = await res.json();
      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.reply || 'Analysis completed for current test scope.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (e) {
      console.error('QA Copilot drawer error:', e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Unable to reach QA Copilot. Please check your network connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // If user disabled showButton completely in settings
  if (!preferences.showButton) {
    return null;
  }

  // 1. HIDDEN STATE: Small tab on screen edge: "Open QA Copilot"
  if (displayState === 'hidden') {
    const isLeft =
      position.x >= 0 && typeof window !== 'undefined' && position.x < window.innerWidth / 2;

    return (
      <div
        className={`fixed ${isLeft ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 z-40 print:hidden`}
      >
        <button
          onClick={() => onUpdatePreferences({ state: 'minimized' })}
          className={`flex items-center gap-1.5 py-3 px-2 bg-gradient-to-b from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white ${
            isLeft ? 'rounded-r-xl pr-3 hover:pr-4' : 'rounded-l-xl pl-2 hover:pl-3'
          } shadow-2xl text-[10px] font-extrabold tracking-wider transition-all cursor-pointer group [writing-mode:vertical-rl] ${
            isLeft ? '' : 'rotate-180'
          }`}
          title="Open QA Copilot (Ctrl+Shift+A)"
          aria-label="Open QA Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>OPEN QA COPILOT</span>
        </button>
      </div>
    );
  }

  // Calculate drawer position based on button coordinates to avoid covering
  const drawerLeft = Math.min(Math.max(16, position.x - 280), window.innerWidth - 480);
  const drawerTop = Math.min(Math.max(60, position.y - 560), window.innerHeight - 580);

  return (
    <>
      {/* 2. MINIMIZED STATE: Draggable floating button with edge-snap, smart dimming & quick actions */}
      {displayState === 'minimized' && (
        <div
          ref={buttonRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onUpdatePreferences({ state: 'expanded' });
            }
          }}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            touchAction: 'none',
            userSelect: 'none',
            transition: isDragging
              ? 'none'
              : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          }}
          className={`z-40 print:hidden cursor-grab active:cursor-grabbing select-none group ${
            isDragging
              ? 'scale-105 shadow-2xl opacity-95 ring-2 ring-indigo-400'
              : 'hover:scale-105 shadow-xl'
          } ${
            hasActiveOverlay && preferences.smartDimming
              ? 'opacity-25 hover:opacity-100 hover:scale-105'
              : preferences.smartDimming
                ? 'opacity-90 hover:opacity-100'
                : 'opacity-100'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Draggable QA Copilot Assistant. Press Enter or Space to open. Press Ctrl+Shift+A anywhere."
        >
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-full shadow-lg border border-white/20 text-xs font-bold transition-transform">
            <GripVertical className="w-3.5 h-3.5 text-white/60 -ml-1 shrink-0" />
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-amber-200 animate-pulse" />
            </div>
            <span className="tracking-tight">QA Copilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 group-hover:animate-ping" />

            {/* Quick action buttons on hover: Dock opposite side & Quick Hide */}
            <div className="hidden group-hover:flex items-center gap-1 ml-1 pl-1 border-l border-white/20">
              <button
                type="button"
                onClick={handleDockOppositeEdge}
                className="p-1 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Dock to opposite screen edge"
                aria-label="Dock to opposite edge"
              >
                <ArrowLeftRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleQuickHide}
                className="p-1 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Hide to edge tab"
                aria-label="Hide QA Copilot"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXPANDED STATE: Full AI Chat Window with Draggable Anchor & Controls */}
      {displayState === 'expanded' && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.max(16, drawerLeft)}px`,
            top: `${Math.max(50, drawerTop)}px`,
          }}
          className="z-50 print:hidden w-[92vw] sm:w-[450px] md:w-[480px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-label="QA Copilot Chat Studio"
        >
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <span className="font-bold text-xs block leading-tight">QA Copilot</span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {selectedTestCase
                    ? `Context: ${selectedTestCase.key}`
                    : activeSuite
                      ? `Context: ${activeSuite.name}`
                      : `Project: ${project.key}`}
                </span>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-1 text-slate-400">
              {/* Settings / Preferences Button */}
              {onOpenPreferencesModal && (
                <button
                  onClick={onOpenPreferencesModal}
                  className="hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                  title="QA Copilot Settings &amp; Preferences"
                  aria-label="Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Minimize to icon */}
              <button
                onClick={() => onUpdatePreferences({ state: 'minimized' })}
                className="hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize Copilot to draggable button (ESC)"
                aria-label="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              {/* Hide completely to slim edge tab */}
              <button
                onClick={() => onUpdatePreferences({ state: 'hidden' })}
                className="hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Hide Copilot widget (Edge tab appears)"
                aria-label="Hide"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                onClick={() => onUpdatePreferences({ state: 'minimized' })}
                className="hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Close to floating button (ESC)"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Model & Scope Indicator */}
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-[10px] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-500 font-mono">
            <span>Scope: {testCases.length} Cases</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">
                gemini-3.1-pro-preview (Deep Reasoning)
              </option>
            </select>
          </div>

          {/* Chat Message Scrollable Thread */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-slate-50/50 dark:bg-slate-900/50">
            {messages.map((m) => {
              const isModel = m.role === 'model';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isModel ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${
                      isModel ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    {isModel ? <Bot className="w-3.5 h-3.5" /> : 'U'}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-xl p-3 space-y-1 leading-relaxed ${
                      isModel
                        ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[9px] opacity-75">
                      <span>{isModel ? 'QA Copilot' : 'You'}</span>
                      <div className="flex items-center gap-1.5">
                        <span>{m.timestamp}</span>
                        {isModel && (
                          <button
                            onClick={() => copyText(m.text, m.id)}
                            className="cursor-pointer hover:opacity-100"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {isModel ? (
                      <MarkdownRenderer content={m.text} className="text-xs" />
                    ) : (
                      <div className="whitespace-pre-wrap font-sans text-xs">{m.text}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>QA Copilot is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Strip */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              'Generate negative tests',
              'Review active test suite',
              'What should be automated first?',
              'Coverage blind spots',
            ].map((txt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(txt)}
                className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-[10px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap cursor-pointer shrink-0"
              >
                {txt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask QA Copilot..."
                className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isLoading}
                className="p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-40 cursor-pointer hover:bg-indigo-500 shadow-2xs"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
