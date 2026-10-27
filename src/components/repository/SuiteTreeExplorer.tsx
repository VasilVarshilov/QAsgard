import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Star,
  Clock,
  MoreVertical,
  Layers,
  Edit2,
  Trash2,
  Copy,
  Bot,
  FileText,
  ChevronsDownUp,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { TestSuite, TestCase } from '../../types';
import { getTestCasesForSuite } from '../../utils/exportUtils';

interface SuiteTreeExplorerProps {
  suites: TestSuite[];
  cases: TestCase[];
  selectedSuiteId: string | null;
  onSelectSuite: (suiteId: string | null) => void;
  expandedSuiteIds: Set<string>;
  onToggleExpand: (suiteId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onCollapseChildren?: (suiteId: string) => void;
  onExpandChildren?: (suiteId: string) => void;
  favoriteSuiteIds: Set<string>;
  onToggleFavorite: (suiteId: string) => void;
  recentCases: TestCase[];
  onSelectRecentCase: (testCase: TestCase) => void;
  onContextMenu: (e: React.MouseEvent, type: 'suite', suite: TestSuite) => void;
  onAddSuite: (parentId?: string) => void;
  onRenameSuite?: (suite: TestSuite) => void;
  onDeleteSuite?: (suiteId: string) => void;
  onMoveSuite: (sourceId: string, targetParentId: string | null) => void;
  onMoveCasesToSuite: (caseIds: string[], targetSuiteId: string) => void;
  onReorderSuite?: (suiteId: string, direction: 'up' | 'down') => void;
}

export const SuiteTreeExplorer: React.FC<SuiteTreeExplorerProps> = ({
  suites,
  cases,
  selectedSuiteId,
  onSelectSuite,
  expandedSuiteIds,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onCollapseChildren,
  onExpandChildren,
  favoriteSuiteIds,
  onToggleFavorite,
  recentCases,
  onSelectRecentCase,
  onContextMenu,
  onAddSuite,
  onRenameSuite,
  onDeleteSuite,
  onMoveSuite,
  onMoveCasesToSuite,
  onReorderSuite,
}) => {
  const [dragOverSuiteId, setDragOverSuiteId] = useState<string | null>(null);
  const [showRecentSection, setShowRecentSection] = useState(true);
  const [showFavoritesSection, setShowFavoritesSection] = useState(true);

  // Build recursive parent -> children tree with order sorting
  const { rootSuites, childMap, countMap } = useMemo(() => {
    const roots: TestSuite[] = [];
    const children: Record<string, TestSuite[]> = {};
    const counts: Record<string, number> = {};

    // Compute recursive case counts (including direct cases and child suites)
    suites.forEach((s) => {
      counts[s.id] = getTestCasesForSuite(s.id, suites, cases).length;
    });

    suites.forEach((s) => {
      if (!s.parentId) {
        roots.push(s);
      } else {
        if (!children[s.parentId]) children[s.parentId] = [];
        children[s.parentId].push(s);
      }
    });

    const sortSuitesList = (list: TestSuite[]) => {
      return [...list].sort((a, b) => {
        if (typeof a.order === 'number' && typeof b.order === 'number') {
          return a.order - b.order;
        }
        if (typeof a.order === 'number') return -1;
        if (typeof b.order === 'number') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
    };

    const sortedRoots = sortSuitesList(roots);
    const sortedChildren: Record<string, TestSuite[]> = {};
    Object.keys(children).forEach((k) => {
      sortedChildren[k] = sortSuitesList(children[k]);
    });

    return { rootSuites: sortedRoots, childMap: sortedChildren, countMap: counts };
  }, [suites, cases]);

  // Favorite Suites List
  const favoriteSuites = useMemo(() => {
    return suites.filter((s) => favoriteSuiteIds.has(s.id));
  }, [suites, favoriteSuiteIds]);

  // Arrow Key Navigation
  const flatVisibleSuiteIds = useMemo(() => {
    const ids: (string | null)[] = [null]; // null = All Suites
    const traverse = (list: TestSuite[]) => {
      for (const s of list) {
        ids.push(s.id);
        if (expandedSuiteIds.has(s.id) && childMap[s.id]) {
          traverse(childMap[s.id]);
        }
      }
    };
    traverse(rootSuites);
    return ids;
  }, [rootSuites, childMap, expandedSuiteIds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = flatVisibleSuiteIds.indexOf(selectedSuiteId);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(flatVisibleSuiteIds.length - 1, currentIndex + 1);
      onSelectSuite(flatVisibleSuiteIds[nextIndex]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(0, currentIndex - 1);
      onSelectSuite(flatVisibleSuiteIds[prevIndex]);
    } else if (e.key === 'ArrowRight' && selectedSuiteId) {
      e.preventDefault();
      if (!expandedSuiteIds.has(selectedSuiteId)) {
        onToggleExpand(selectedSuiteId);
      }
    } else if (e.key === 'ArrowLeft' && selectedSuiteId) {
      e.preventDefault();
      if (expandedSuiteIds.has(selectedSuiteId)) {
        onToggleExpand(selectedSuiteId);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, suiteId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'suite', suiteId }));
  };

  const handleDragOver = (e: React.DragEvent, suiteId: string) => {
    e.preventDefault();
    setDragOverSuiteId(suiteId);
  };

  const handleDragLeave = () => {
    setDragOverSuiteId(null);
  };

  const handleDrop = (e: React.DragEvent, targetSuiteId: string) => {
    e.preventDefault();
    setDragOverSuiteId(null);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.type === 'suite' && data.suiteId !== targetSuiteId) {
        onMoveSuite(data.suiteId, targetSuiteId);
      } else if (data.type === 'cases' && Array.isArray(data.caseIds)) {
        onMoveCasesToSuite(data.caseIds, targetSuiteId);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="flex flex-col h-full bg-[#161724] text-slate-200 select-none overflow-hidden focus:outline-none"
    >
      {/* Explorer Toolbar: Expand All, Collapse All, New Suite */}
      <div className="p-2.5 border-b border-[#262838] flex items-center justify-between text-xs shrink-0 bg-[#191b2a]">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white tracking-wide">Suites Explorer</span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => onAddSuite()}
            className="p-1 hover:text-white hover:bg-[#25283c] rounded cursor-pointer"
            title="Create Root Suite (Ctrl+Shift+N)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onExpandAll}
            className="px-1.5 py-0.5 hover:text-white hover:bg-[#25283c] rounded cursor-pointer text-[10px] font-mono flex items-center gap-0.5 text-slate-300 transition-colors"
            title="Expand / Unfold All Suites (Разпъни всички)"
          >
            <ChevronDown className="w-3 h-3 text-indigo-400" />
            <span>Expand</span>
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={onCollapseAll}
            className="px-1.5 py-0.5 hover:text-white hover:bg-[#25283c] rounded cursor-pointer text-[10px] font-mono flex items-center gap-0.5 text-slate-300 transition-colors"
            title="Collapse / Fold All Suites (Прибери всички)"
          >
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span>Collapse</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs no-scrollbar">
        {/* FAVORITES SECTION ⭐ */}
        {favoriteSuites.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setShowFavoritesSection(!showFavoritesSection)}
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider hover:text-amber-300"
            >
              <span className="flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Favorite Suites ({favoriteSuites.length})
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showFavoritesSection ? '' : '-rotate-90'}`}
              />
            </button>

            {showFavoritesSection && (
              <div className="space-y-0.5">
                {favoriteSuites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => onSelectSuite(fav.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      selectedSuiteId === fav.id
                        ? 'bg-[#25283c] text-white font-semibold border-l-2 border-amber-400'
                        : 'text-slate-300 hover:bg-[#1d1f30] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="truncate">{fav.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-[#1f2134]">
                      {countMap[fav.id] || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECENT ACTIVITY SECTION 🕒 */}
        {recentCases.length > 0 && (
          <div className="space-y-1 border-b border-[#262838] pb-2">
            <button
              onClick={() => setShowRecentSection(!showRecentSection)}
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                Recent Activity ({recentCases.length})
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showRecentSection ? '' : '-rotate-90'}`}
              />
            </button>

            {showRecentSection && (
              <div className="space-y-0.5">
                {recentCases.slice(0, 4).map((rc) => (
                  <div
                    key={rc.id}
                    onClick={() => onSelectRecentCase(rc)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-[#1d1f30] hover:text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate text-[11px]">{rc.title}</span>
                    </div>
                    <span className="font-mono text-[9px] text-indigo-400 shrink-0 ml-1">
                      {rc.key}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALL SUITES ROOT SELECTOR */}
        <div
          onClick={() => onSelectSuite(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e, 'suite', {
              id: '__repo_root__',
              projectId: '',
              name: 'Repository (All Cases)',
              description: 'All repository test cases',
              caseCount: cases.length,
              order: 0,
              createdAt: '',
              updatedAt: '',
            } as TestSuite);
          }}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
            selectedSuiteId === null
              ? 'bg-[#25283c] text-white font-semibold border-l-2 border-indigo-500 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1d1f30]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>All Repository Cases</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-[#1f2134]">
            {cases.length}
          </span>
        </div>

        {/* HIERARCHICAL SUITE TREE NODES */}
        <div className="space-y-0.5">
          {rootSuites.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <Folder className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-slate-300 font-semibold">No test suites found</p>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                Organize tests into modular suites and directories
              </p>
              <button
                type="button"
                onClick={() => onAddSuite()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create your first suite</span>
              </button>
            </div>
          ) : (
            rootSuites.map((root) => (
              <TreeNode
                key={root.id}
                suite={root}
                childMap={childMap}
                countMap={countMap}
                selectedSuiteId={selectedSuiteId}
                expandedSuiteIds={expandedSuiteIds}
                onSelectSuite={onSelectSuite}
                onToggleExpand={onToggleExpand}
                onCollapseChildren={onCollapseChildren}
                onExpandChildren={onExpandChildren}
                favoriteSuiteIds={favoriteSuiteIds}
                onToggleFavorite={onToggleFavorite}
                onContextMenu={onContextMenu}
                onAddSuite={onAddSuite}
                onRenameSuite={onRenameSuite}
                onDeleteSuite={onDeleteSuite}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                dragOverSuiteId={dragOverSuiteId}
                onReorderSuite={onReorderSuite}
                level={0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// RECURSIVE TREE NODE WITH DRAG & DROP & OPEN/CLOSED ICONS
// =============================================================================
interface TreeNodeProps {
  suite: TestSuite;
  childMap: Record<string, TestSuite[]>;
  countMap: Record<string, number>;
  selectedSuiteId: string | null;
  expandedSuiteIds: Set<string>;
  onSelectSuite: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onCollapseChildren?: (id: string) => void;
  onExpandChildren?: (id: string) => void;
  favoriteSuiteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, type: 'suite', suite: TestSuite) => void;
  onAddSuite?: (parentId?: string) => void;
  onRenameSuite?: (suite: TestSuite) => void;
  onDeleteSuite?: (suiteId: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  dragOverSuiteId: string | null;
  onReorderSuite?: (suiteId: string, direction: 'up' | 'down') => void;
  level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  suite,
  childMap,
  countMap,
  selectedSuiteId,
  expandedSuiteIds,
  onSelectSuite,
  onToggleExpand,
  onCollapseChildren,
  onExpandChildren,
  favoriteSuiteIds,
  onToggleFavorite,
  onContextMenu,
  onAddSuite,
  onRenameSuite,
  onDeleteSuite,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverSuiteId,
  onReorderSuite,
  level,
}) => {
  const isSelected = selectedSuiteId === suite.id;
  const isExpanded = expandedSuiteIds.has(suite.id);
  const children = childMap[suite.id] || [];
  const hasChildren = children.length > 0;
  const isFavorite = favoriteSuiteIds.has(suite.id);
  const isDragTarget = dragOverSuiteId === suite.id;

  return (
    <div className="space-y-0.5">
      <div
        draggable
        onDragStart={(e) => onDragStart(e, suite.id)}
        onDragOver={(e) => onDragOver(e, suite.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, suite.id)}
        onClick={() => onSelectSuite(suite.id)}
        onDoubleClick={(e) => {
          if (hasChildren) {
            e.stopPropagation();
            onToggleExpand(suite.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, 'suite', suite);
        }}
        style={{ paddingLeft: level === 0 ? '6px' : '4px' }}
        className={`group flex items-center justify-between pr-2 py-1.5 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-[#25283c] text-white font-semibold border-l-2 border-indigo-500 shadow-xs'
            : 'text-slate-300 hover:text-white hover:bg-[#1d1f30]'
        } ${isDragTarget ? 'ring-2 ring-indigo-500 bg-indigo-950/60 shadow-lg text-white' : ''}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
          {/* Fold / Unfold Arrow button (Стрелкичка за прибиране / разпъване) */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(suite.id);
              }}
              title={
                isExpanded
                  ? `Fold "${suite.name}" — прибери ${children.length} child suites`
                  : `Unfold "${suite.name}" — разпъни ${children.length} child suites`
              }
              className={`w-4.5 h-4.5 flex items-center justify-center rounded transition-all cursor-pointer shrink-0 ${
                isExpanded
                  ? 'bg-indigo-950/70 text-indigo-400 hover:bg-indigo-900 hover:text-white border border-indigo-800/50'
                  : 'bg-[#1b1c2b] text-slate-300 hover:bg-[#25283c] hover:text-white border border-slate-700/60'
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-300" />
              )}
            </button>
          ) : (
            <span className="w-4.5 shrink-0" />
          )}

          {/* Folder open/closed state icon (clicking also toggles fold/unfold) */}
          <div
            onClick={(e) => {
              if (hasChildren) {
                e.stopPropagation();
                onToggleExpand(suite.id);
              }
            }}
            title={
              hasChildren
                ? isExpanded
                  ? 'Click folder to fold child suites'
                  : 'Click folder to unfold child suites'
                : suite.name
            }
            className={`shrink-0 ${hasChildren ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          >
            {isExpanded && hasChildren ? (
              <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            ) : (
              <Folder
                className={`w-4 h-4 ${hasChildren ? 'text-indigo-300' : 'text-slate-400'} group-hover:text-indigo-400 shrink-0`}
              />
            )}
          </div>

          {/* Suite Name - full width and never crushed by badges */}
          <span
            className="truncate text-xs min-w-0 flex-1 font-medium select-none text-slate-200 group-hover:text-white"
            title={suite.name || 'Suite'}
          >
            {suite.name || 'Untitled Suite'}
          </span>

          {/* Sub-suites status badge */}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(suite.id);
              }}
              title={
                isExpanded
                  ? `Click to fold ${children.length} child suites into "${suite.name}"`
                  : `Click to unfold ${children.length} child suites into "${suite.name}"`
              }
              className={`text-[9px] font-mono px-1 py-0.2 rounded shrink-0 cursor-pointer transition-colors flex items-center gap-0.5 ${
                isExpanded
                  ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/40 hover:bg-indigo-900/80'
                  : 'bg-[#1e2030] text-slate-400 border border-slate-700/60 hover:bg-[#25283c] hover:text-slate-200'
              }`}
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <span>{children.length}</span>
            </button>
          )}
        </div>

        {/* Right side: Quick Actions and Count */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            {hasChildren && onCollapseChildren && isExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCollapseChildren(suite.id);
                }}
                className="p-0.5 hover:bg-[#25283c] hover:text-indigo-300 text-slate-400 rounded transition-colors cursor-pointer"
                title={`Fold all child suites into "${suite.name}"`}
              >
                <ChevronsDownUp className="w-3 h-3" />
              </button>
            )}

            {hasChildren && onExpandChildren && !isExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpandChildren(suite.id);
                }}
                className="p-0.5 hover:bg-[#25283c] hover:text-indigo-300 text-slate-400 rounded transition-colors cursor-pointer"
                title={`Unfold all child suites under "${suite.name}"`}
              >
                <ChevronsUpDown className="w-3 h-3" />
              </button>
            )}

            {onAddSuite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSuite(suite.id);
                }}
                className="p-0.5 hover:bg-[#25283c] hover:text-white text-slate-400 rounded transition-colors cursor-pointer"
                title={`Create child suite inside "${suite.name}"`}
              >
                <Plus className="w-3 h-3 text-indigo-400" />
              </button>
            )}

            {onRenameSuite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameSuite(suite);
                }}
                className="p-0.5 hover:bg-[#25283c] hover:text-cyan-300 text-slate-400 rounded transition-colors cursor-pointer"
                title={`Rename suite "${suite.name}"`}
              >
                <Edit2 className="w-3 h-3 text-cyan-400" />
              </button>
            )}

            {onDeleteSuite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSuite(suite.id);
                }}
                className="p-0.5 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 rounded transition-colors cursor-pointer"
                title={`Delete suite "${suite.name}"`}
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu(e, 'suite', suite);
              }}
              className="p-0.5 hover:bg-[#25283c] hover:text-white text-slate-400 rounded transition-colors cursor-pointer"
              title={`More suite options & actions...`}
            >
              <MoreVertical className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
          <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-[#1f2134]">
            {countMap[suite.id] || 0}
          </span>
        </div>
      </div>

      {/* Children (Nested child suites) */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5 border-l border-[#262838] ml-2 pl-1">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              suite={child}
              childMap={childMap}
              countMap={countMap}
              selectedSuiteId={selectedSuiteId}
              expandedSuiteIds={expandedSuiteIds}
              onSelectSuite={onSelectSuite}
              onToggleExpand={onToggleExpand}
              onCollapseChildren={onCollapseChildren}
              onExpandChildren={onExpandChildren}
              favoriteSuiteIds={favoriteSuiteIds}
              onToggleFavorite={onToggleFavorite}
              onContextMenu={onContextMenu}
              onAddSuite={onAddSuite}
              onRenameSuite={onRenameSuite}
              onDeleteSuite={onDeleteSuite}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              dragOverSuiteId={dragOverSuiteId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
