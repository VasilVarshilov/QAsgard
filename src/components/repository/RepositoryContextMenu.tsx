import React from 'react';
import {
  Plus,
  FolderPlus,
  Edit2,
  Copy,
  Trash2,
  Star,
  Bot,
  Download,
  Share2,
  ExternalLink,
  Link as LinkIcon,
  Archive,
  ArrowRightLeft,
  ChevronRight,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Play,
  PlayCircle,
} from 'lucide-react';
import { TestSuite, TestCase, TestRepository } from '../../types';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: 'suite' | 'case' | 'repo';
  targetSuite?: TestSuite;
  targetCase?: TestCase;
  targetRepo?: TestRepository;
}

interface RepositoryContextMenuProps {
  contextMenu: ContextMenuState;
  onClose: () => void;
  onCreateTestRun?: (target: {
    type: 'suite' | 'case' | 'repo';
    repoId?: string;
    suite?: TestSuite;
    testCase?: TestCase;
  }) => void;
  onNewTestCase: (suiteId?: string) => void;
  onNewSuite: (parentId?: string) => void;
  onRenameSuite: (suite: TestSuite) => void;
  onDuplicateSuite: (suite: TestSuite) => void;
  onToggleFavoriteSuite: (suiteId: string) => void;
  isFavoriteSuite: boolean;
  onDeleteSuite: (suiteId: string) => void;
  onExportSuite: (suite: TestSuite) => void;
  onAICopilotForSuite: (suite: TestSuite) => void;
  onOpenTestCase: (testCase: TestCase) => void;
  onDuplicateTestCase: (testCase: TestCase) => void;
  onDeleteTestCase: (caseId: string) => void;
  onExportTestCase: (testCase: TestCase) => void;
  onAICopilotForCase: (testCase: TestCase) => void;
  isSuiteExpanded?: boolean;
  onToggleExpandSuite?: (suiteId: string) => void;
  onFoldAllChildSuites?: (suiteId: string) => void;
  onUnfoldAllChildSuites?: (suiteId: string) => void;
}

export const RepositoryContextMenu: React.FC<RepositoryContextMenuProps> = ({
  contextMenu,
  onClose,
  onCreateTestRun,
  onNewTestCase,
  onNewSuite,
  onRenameSuite,
  onDuplicateSuite,
  onToggleFavoriteSuite,
  isFavoriteSuite,
  onDeleteSuite,
  onExportSuite,
  onAICopilotForSuite,
  onOpenTestCase,
  onDuplicateTestCase,
  onDeleteTestCase,
  onExportTestCase,
  onAICopilotForCase,
  isSuiteExpanded,
  onToggleExpandSuite,
  onFoldAllChildSuites,
  onUnfoldAllChildSuites,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ x: number; y: number; maxHeight: number }>(
    () => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const menuWidth = 260;
      const estimatedMenuHeight = 440;
      const PADDING = 12;

      let x = contextMenu.x;
      let y = contextMenu.y;

      if (x + menuWidth + PADDING > vw) {
        x = Math.max(PADDING, x - menuWidth);
      }
      if (y + estimatedMenuHeight + PADDING > vh) {
        if (contextMenu.y - estimatedMenuHeight >= PADDING) {
          y = contextMenu.y - estimatedMenuHeight;
        } else {
          y = Math.max(PADDING, vh - estimatedMenuHeight - PADDING);
        }
      }
      const maxH = Math.max(160, Math.min(estimatedMenuHeight, vh - y - PADDING));
      return { x, y, maxHeight: maxH };
    }
  );

  // Calculate pixel-perfect viewport clamped positioning, auto-flip, and dynamic maxHeight
  React.useLayoutEffect(() => {
    if (!contextMenu.isOpen) return;

    const calculatePosition = () => {
      const el = menuRef.current;
      const menuWidth = el?.offsetWidth || 260;
      const menuHeight = el?.scrollHeight || 440;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const PADDING = 12;

      let nextX = contextMenu.x;
      let nextY = contextMenu.y;

      // Horizontal flipping & clamping
      if (nextX + menuWidth + PADDING > vw) {
        if (contextMenu.x - menuWidth >= PADDING) {
          nextX = contextMenu.x - menuWidth;
        } else {
          nextX = Math.max(PADDING, vw - menuWidth - PADDING);
        }
      } else {
        nextX = Math.max(PADDING, nextX);
      }

      // Vertical flipping & clamping (Prevent bottom and top clipping)
      if (nextY + menuHeight + PADDING > vh) {
        // Try opening upwards above the click position
        if (contextMenu.y - menuHeight >= PADDING) {
          nextY = contextMenu.y - menuHeight;
        } else {
          // Doesn't fit cleanly above: align to bottom padding or top padding
          nextY = Math.max(PADDING, vh - menuHeight - PADDING);
        }
      } else {
        nextY = Math.max(PADDING, nextY);
      }

      // Safe max height strictly within viewport
      const safeMaxHeight = Math.max(180, Math.min(menuHeight, vh - nextY - PADDING));

      setPosition({ x: nextX, y: nextY, maxHeight: safeMaxHeight });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [
    contextMenu.isOpen,
    contextMenu.x,
    contextMenu.y,
    contextMenu.type,
    contextMenu.targetSuite,
    contextMenu.targetCase,
    isFavoriteSuite,
    isSuiteExpanded,
  ]);

  // Close context menu on Escape key
  React.useEffect(() => {
    if (!contextMenu.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu.isOpen, onClose]);

  if (!contextMenu.isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to dismiss menu on outside click or right click */}
      <div
        className="fixed inset-0 z-40 bg-black/15 transition-opacity"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      <div
        ref={menuRef}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxHeight: `min(${position.maxHeight}px, calc(100vh - 24px))`,
        }}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-50 w-64 max-w-[calc(100vw-24px)] bg-[#1b1c2b] border border-[#2e3146] rounded-xl shadow-2xl py-1 text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#262838] overflow-y-auto overscroll-contain"
      >
        {/* SUITE CONTEXT MENU */}
        {contextMenu.type === 'suite' && contextMenu.targetSuite && (
          <>
            <div className="py-1">
              <button
                onClick={() => {
                  onCreateTestRun?.({
                    type: 'suite',
                    suite: contextMenu.targetSuite,
                    repoId: contextMenu.targetSuite?.repositoryId,
                  });
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                <span>Create Test Run / Създай Test Run</span>
              </button>
            </div>

            <div className="py-1">
              {onToggleExpandSuite && (
                <button
                  onClick={() => {
                    onToggleExpandSuite(contextMenu.targetSuite!.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  {isSuiteExpanded ? (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>Fold Suite (Прибери суита)</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Unfold Suite (Разпъни суита)</span>
                    </>
                  )}
                </button>
              )}
              {onFoldAllChildSuites && (
                <button
                  onClick={() => {
                    onFoldAllChildSuites(contextMenu.targetSuite!.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-indigo-300 flex items-center gap-2 cursor-pointer"
                >
                  <ChevronsDownUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Fold All Child Suites (Прибери деца)</span>
                </button>
              )}
              {onUnfoldAllChildSuites && (
                <button
                  onClick={() => {
                    onUnfoldAllChildSuites(contextMenu.targetSuite!.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-indigo-300 flex items-center gap-2 cursor-pointer"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Unfold All Child Suites (Разпъни деца)</span>
                </button>
              )}
              <button
                onClick={() => {
                  onNewTestCase(contextMenu.targetSuite?.id);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>New Test Case</span>
              </button>
              <button
                onClick={() => {
                  onNewSuite(contextMenu.targetSuite?.id);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
                <span>New Child Suite</span>
              </button>
              <button
                onClick={() => {
                  onAICopilotForSuite(contextMenu.targetSuite!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] text-indigo-400 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Generate Cases with AI</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onRenameSuite(contextMenu.targetSuite!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer font-medium text-cyan-300"
              >
                <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rename Suite / Преименувай</span>
              </button>
              <button
                onClick={() => {
                  onRenameSuite(contextMenu.targetSuite!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer text-slate-300"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Edit Suite Details &amp; Parent</span>
              </button>
              <button
                onClick={() => {
                  onDuplicateSuite(contextMenu.targetSuite!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicate Suite (Ctrl+D)</span>
              </button>
              <button
                onClick={() => {
                  onToggleFavoriteSuite(contextMenu.targetSuite!.id);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isFavoriteSuite ? 'text-amber-400 fill-amber-400' : 'text-amber-400'
                  }`}
                />
                <span>{isFavoriteSuite ? 'Remove from Favorites' : 'Add to Favorites ⭐'}</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onExportSuite(contextMenu.targetSuite!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Suite</span>
              </button>
              <button
                onClick={() => {
                  onDeleteSuite(contextMenu.targetSuite!.id);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Suite / Изтрий суита</span>
              </button>
            </div>
          </>
        )}

        {/* TEST CASE CONTEXT MENU */}
        {contextMenu.type === 'case' && contextMenu.targetCase && (
          <>
            <div className="py-1">
              <button
                onClick={() => {
                  onCreateTestRun?.({
                    type: 'case',
                    testCase: contextMenu.targetCase,
                    repoId: contextMenu.targetCase?.repositoryId,
                  });
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                <span>Create Test Run / Създай Test Run</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onOpenTestCase(contextMenu.targetCase!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open in Preview</span>
              </button>
              <button
                onClick={() => {
                  onAICopilotForCase(contextMenu.targetCase!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] text-indigo-400 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Generate Steps using AI</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onDuplicateTestCase(contextMenu.targetCase!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicate Case (Ctrl+D)</span>
              </button>
              <button
                onClick={() => {
                  onExportTestCase(contextMenu.targetCase!);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Test Case</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onDeleteTestCase(contextMenu.targetCase!.id);
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Test Case / Изтрий кейса</span>
              </button>
            </div>
          </>
        )}

        {/* REPOSITORY CONTEXT MENU */}
        {contextMenu.type === 'repo' && (
          <div className="py-1">
            <button
              onClick={() => {
                onCreateTestRun?.({
                  type: 'repo',
                  repoId: contextMenu.targetRepo?.id,
                });
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#25283c] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
              <span>Create Test Run / Създай Test Run</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
