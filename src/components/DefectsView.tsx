import React, { useState, useEffect } from 'react';
import {
  Bug,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  User as UserIcon,
  Filter,
  Layers,
  Trash2,
  Camera,
  Download,
  Paperclip,
  FolderGit2,
  FileCheck2,
  PlayCircle,
  Eye,
  Edit2,
  Upload,
} from 'lucide-react';
import {
  Defect,
  DefectStatus,
  Project,
  TestCase,
  TestSeverity,
  TestPriority,
  User,
  Attachment,
} from '../types';

interface DefectsViewProps {
  project: Project;
  defects: Defect[];
  testCases: TestCase[];
  onUpdateDefectStatus: (defectId: string, status: DefectStatus) => void;
  onCreateDefect: (defect: Partial<Defect>) => void;
  onUpdateDefect?: (defect: Defect) => void;
  onDeleteDefect?: (defectId: string) => void;
  allProjects?: Project[];
  allTestCases?: TestCase[];
  currentUser?: User;
}

export const DefectsView: React.FC<DefectsViewProps> = ({
  project,
  defects,
  testCases,
  onUpdateDefectStatus,
  onCreateDefect,
  onUpdateDefect,
  onDeleteDefect,
  allProjects,
  allTestCases,
  currentUser,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeDefect, setActiveDefect] = useState<Defect | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [defectToDelete, setDefectToDelete] = useState<Defect | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Edit Defect state
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSeverity, setEditSeverity] = useState<TestSeverity>('critical');
  const [editPriority, setEditPriority] = useState<TestPriority>('high');
  const [editStatus, setEditStatus] = useState<DefectStatus>('open');
  const [editAssignee, setEditAssignee] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editTestCaseId, setEditTestCaseId] = useState('');
  const [editReproSteps, setEditReproSteps] = useState('');
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);

  // New Defect state with Repository & Case Traceability
  const defaultProjId =
    project.id !== 'all' ? project.id : allProjects?.find((p) => p.id !== 'all')?.id || project.id;
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjId);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<TestSeverity>('critical');
  const [newAssignee, setNewAssignee] = useState(currentUser?.name || 'Current User');
  const [newReproSteps, setNewReproSteps] = useState('');
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);

  // Keep default assignee synced with currentUser
  useEffect(() => {
    if (currentUser?.name) {
      setNewAssignee(currentUser.name);
    }
  }, [currentUser]);

  const handleStartEdit = (def: Defect) => {
    setEditingDefect(def);
    setEditTitle(def.title);
    setEditDesc(def.description || '');
    setEditSeverity(def.severity);
    setEditPriority(def.priority || 'high');
    setEditStatus(def.status);
    setEditAssignee(def.assignee);
    setEditProjectId(def.projectId);
    setEditTestCaseId(def.testCaseId || '');
    setEditReproSteps((def.reproductionSteps || []).join('\n'));
    setEditAttachments(def.attachments ? [...def.attachments] : []);
  };

  const handleAddEditAttachment = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const att: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || 'image/png',
        url: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setEditAttachments((prev) => [...prev, att]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditAttachment = (attId: string) => {
    setEditAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSaveEdit = () => {
    if (!editingDefect || !editTitle.trim()) return;
    const casePool = allTestCases || testCases;
    const targetCase = casePool.find((tc) => tc.id === editTestCaseId);

    const updated: Defect = {
      ...editingDefect,
      title: editTitle.trim(),
      description: editDesc,
      severity: editSeverity,
      priority: editPriority,
      status: editStatus,
      assignee: editAssignee || currentUser?.name || 'Current User',
      projectId: editProjectId || editingDefect.projectId,
      testCaseId: targetCase?.id || (editTestCaseId ? editTestCaseId : undefined),
      testCaseKey: targetCase?.key || editingDefect.testCaseKey,
      testCaseTitle: targetCase?.title || editingDefect.testCaseTitle,
      reproductionSteps: editReproSteps.split('\n').filter(Boolean),
      attachments: editAttachments,
    };

    if (onUpdateDefect) {
      onUpdateDefect(updated);
    }
    if (activeDefect?.id === updated.id) {
      setActiveDefect(updated);
    }
    setEditingDefect(null);
  };

  const filteredDefects = defects.filter((d) => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  const handleAddAttachment = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const att: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || 'image/png',
        url: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setNewAttachments((prev) => [...prev, att]);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const casePool = allTestCases || testCases;
    const targetCase = casePool.find((tc) => tc.id === selectedTestCaseId);
    const defectNum = Math.floor(100 + Math.random() * 900);
    const def: Partial<Defect> = {
      key: `DEF-${Date.now().toString().slice(-3)}${defectNum}`,
      projectId: selectedProjectId || project.id,
      testCaseId: targetCase?.id,
      testCaseKey: targetCase?.key,
      testCaseTitle: targetCase?.title,
      title: newTitle,
      description: newDesc,
      severity: newSeverity,
      priority: 'high',
      status: 'open',
      assignee: newAssignee || currentUser?.name || 'Current User',
      reporter: currentUser?.name || 'Admin',
      reproductionSteps: newReproSteps.split('\n').filter(Boolean),
      comments: [],
      attachments: newAttachments,
      createdAt: new Date().toISOString(),
    };
    onCreateDefect(def);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewAttachments([]);
    setSelectedTestCaseId('');
  };

  const getSeverityBadge = (s: TestSeverity) => {
    switch (s) {
      case 'blocker':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-rose-600 text-white rounded">
            Blocker
          </span>
        );
      case 'critical':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded">
            Critical
          </span>
        );
      case 'major':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded">
            Major
          </span>
        );
      case 'normal':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded">
            Normal
          </span>
        );
      case 'minor':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded">
            Minor
          </span>
        );
    }
  };

  const getStatusBadge = (st: DefectStatus) => {
    switch (st) {
      case 'open':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-800">
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-full">
            Closed
          </span>
        );
    }
  };

  // Helper to find project and test case info for full traceability
  const getTraceabilityInfo = (def: Defect) => {
    const proj =
      allProjects?.find((p) => p.id === def.projectId) ||
      (project.id === def.projectId ? project : undefined);
    const tc = (allTestCases || testCases).find(
      (c) => c.id === def.testCaseId || c.key === def.testCaseKey
    );
    return { proj, tc };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-600 dark:text-rose-500" />
            Defect &amp; Bug Tracking (Управление на Дефекти)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {project.id === 'all'
              ? 'Showing all defects across all workspace repositories with full execution traceability.'
              : `Showing defects for ${project.name} [${project.key}] with linked test cases & evidence.`}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({defects.length})
            </button>
            <button
              onClick={() => setFilterStatus('open')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'open'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Open ({defects.filter((d) => d.status === 'open').length})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'resolved'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Resolved ({defects.filter((d) => d.status === 'resolved').length})
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Defect</span>
          </button>
        </div>
      </div>

      {/* Defects Table with Full Traceability */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-4 w-32">Key</th>
              <th className="py-2.5 px-3">Title &amp; Traceability</th>
              <th className="py-2.5 px-3 w-40">Repository / Case</th>
              <th className="py-2.5 px-3 w-24 text-center">Severity</th>
              <th className="py-2.5 px-3 w-24 text-center">Status</th>
              <th className="py-2.5 px-3 w-32">Assignee</th>
              <th className="py-2.5 px-3 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredDefects.map((def) => {
              const { proj, tc } = getTraceabilityInfo(def);
              return (
                <tr
                  key={def.id}
                  onClick={() => setActiveDefect(def)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-rose-700 dark:text-rose-400">
                    <div className="flex items-center gap-1.5">
                      <span>{def.key}</span>
                      {def.attachments && def.attachments.length > 0 && (
                        <span
                          className="flex items-center gap-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1 py-0.2 rounded border border-indigo-200 dark:border-indigo-800"
                          title={`${def.attachments.length} screenshot(s) attached`}
                        >
                          <Camera className="w-2.5 h-2.5" />
                          <span>{def.attachments.length}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{def.title}</div>
                    {def.description && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {def.description}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2">
                      <span>Reported by {def.reporter}</span>
                      <span>•</span>
                      <span>{new Date(def.createdAt).toLocaleDateString()}</span>
                      {def.runKey && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">
                            Run: {def.runKey}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        <FolderGit2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">
                          {proj ? `${proj.name} [${proj.key}]` : def.projectId}
                        </span>
                      </div>
                      {(def.testCaseKey || tc?.key) && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                          <FileCheck2 className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {def.testCaseKey || tc?.key}{' '}
                            {tc?.title ? `(${tc.title.slice(0, 18)}...)` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">{getSeverityBadge(def.severity)}</td>
                  <td className="py-3 px-3 text-center">{getStatusBadge(def.status)}</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {def.assignee.charAt(0)}
                      </div>
                      <span className="truncate max-w-[90px]">{def.assignee}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={def.status}
                        onChange={(e) =>
                          onUpdateDefectStatus(def.id, e.target.value as DefectStatus)
                        }
                        className="text-[11px] px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded font-medium focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(def)}
                        className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                        title={`Edit Defect ${def.key} / Редактирай дефект`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteDefect && (
                        <button
                          type="button"
                          onClick={() => setDefectToDelete(def)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title={`Delete Defect ${def.key} / Изтрий бъг`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Defect Detail Slide-Over / Modal with Full Traceability & Evidence */}
      {activeDefect &&
        (() => {
          const { proj, tc } = getTraceabilityInfo(activeDefect);
          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex justify-end">
              <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl p-6 overflow-y-auto space-y-5 text-xs animate-in slide-in-from-right duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-sm">
                      {activeDefect.key}
                    </span>
                    {getStatusBadge(activeDefect.status)}
                    {getSeverityBadge(activeDefect.severity)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(activeDefect)}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Edit Defect / Редактирай дефект"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit / Редактирай</span>
                    </button>
                    <button
                      onClick={() => setActiveDefect(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {activeDefect.title}
                  </h2>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Logged on {new Date(activeDefect.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>
                      Reporter: <strong>{activeDefect.reporter}</strong>
                    </span>
                  </div>
                </div>

                {/* Requirement #8: Full Traceability Section */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Origin &amp; Execution Traceability (Проследяемост на дефекта)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <FolderGit2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 font-medium uppercase">
                          Repository / Project
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {proj ? `${proj.name} [${proj.key}]` : activeDefect.projectId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <FileCheck2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 font-medium uppercase">
                          Linked Test Case
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {activeDefect.testCaseKey || tc?.key
                            ? `[${activeDefect.testCaseKey || tc?.key}] ${activeDefect.testCaseTitle || tc?.title || ''}`
                            : 'General Defect (No case)'}
                        </div>
                      </div>
                    </div>

                    {activeDefect.runKey && (
                      <div className="flex items-start gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60 sm:col-span-2">
                        <PlayCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400 font-medium uppercase">
                            Originating Test Run
                          </div>
                          <div className="font-semibold text-purple-700 dark:text-purple-300 font-mono">
                            {activeDefect.runKey}{' '}
                            {activeDefect.runId ? `(${activeDefect.runId})` : ''}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirement #6: Large Detailed Description */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">
                    Defect Description &amp; Detailed Observations
                  </span>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[90px]">
                    {activeDefect.description || 'No detailed description provided.'}
                  </div>
                </div>

                {/* Requirement #4 & #6: Visual Screenshots & Attachments */}
                {activeDefect.attachments && activeDefect.attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-500" />
                        Execution Evidence &amp; Screenshots ({activeDefect.attachments.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {activeDefect.attachments.map((att) => {
                        const isImg =
                          att.type?.startsWith('image/') ||
                          (att.url && att.url.startsWith('data:image'));
                        return (
                          <div
                            key={att.id}
                            className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-2xs group relative"
                          >
                            {isImg && att.url ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                onClick={() => setSelectedPreviewImage(att.url)}
                                className="h-28 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                title="Click to view full screenshot"
                              />
                            ) : (
                              <div className="h-28 w-full flex items-center justify-center p-3 text-slate-400">
                                <Paperclip className="w-6 h-6" />
                              </div>
                            )}
                            <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                              <span className="truncate max-w-[120px] font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                                {att.name}
                              </span>
                              <div className="flex items-center gap-1">
                                {isImg && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPreviewImage(att.url)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                    title="Full screen view"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = att.url;
                                    a.download = att.name;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                  title="Download image"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reproduction steps */}
                {activeDefect.reproductionSteps && activeDefect.reproductionSteps.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">
                      Steps to Reproduce
                    </span>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[11px]">
                      {activeDefect.reproductionSteps.map((st, i) => (
                        <div key={i} className="text-slate-700 dark:text-slate-300">
                          {st}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignment & Status Controls */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                    <select
                      value={activeDefect.status}
                      onChange={(e) => {
                        const newSt = e.target.value as DefectStatus;
                        onUpdateDefectStatus(activeDefect.id, newSt);
                        setActiveDefect({ ...activeDefect, status: newSt });
                      }}
                      className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-semibold cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Assignee:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {activeDefect.assignee}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Reported By:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {activeDefect.reporter}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(activeDefect)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Defect / Редактирай дефект</span>
                    </button>
                    {onDeleteDefect && (
                      <button
                        type="button"
                        onClick={() => setDefectToDelete(activeDefect)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Defect / Изтрий бъг</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Edit Defect Modal */}
      {editingDefect && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-xs">
                  {editingDefect.key}
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Edit Defect / Редактиране на дефект
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingDefect(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Defect Title *
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Brief summary of the issue..."
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Repository & Test Case Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Repository / Project
                </label>
                <select
                  value={editProjectId}
                  onChange={(e) => {
                    setEditProjectId(e.target.value);
                    setEditTestCaseId('');
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                >
                  {(allProjects || [project])
                    .filter((p) => p.id !== 'all')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.key}]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Linked Test Case
                </label>
                <select
                  value={editTestCaseId}
                  onChange={(e) => setEditTestCaseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                >
                  <option value="">-- No linked test case --</option>
                  {(allTestCases || testCases)
                    .filter((tc) => !editProjectId || tc.projectId === editProjectId)
                    .map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        [{tc.key}] {tc.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Severity, Priority, Status, Assignee */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Severity
                </label>
                <select
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value as TestSeverity)}
                  className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                >
                  <option value="blocker">Blocker</option>
                  <option value="critical">Critical</option>
                  <option value="major">Major</option>
                  <option value="normal">Normal</option>
                  <option value="minor">Minor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TestPriority)}
                  className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as DefectStatus)}
                  className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Assignee
                </label>
                <input
                  type="text"
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Description (Generous textarea) */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Detailed Defect Description &amp; Observations
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={5}
                placeholder="Full defect explanation, actual vs expected behaviors, error codes..."
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-y"
              />
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Steps to Reproduce (one per line)
              </label>
              <textarea
                value={editReproSteps}
                onChange={(e) => setEditReproSteps(e.target.value)}
                rows={3}
                placeholder="1. Navigate to...\n2. Enter invalid card...\n3. Observe error..."
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-mono resize-y"
              />
            </div>

            {/* Visual Screenshots & Evidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                  Evidence &amp; Screenshots ({editAttachments.length})
                </label>
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg cursor-pointer transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ Attach Screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAddEditAttachment(f);
                    }}
                  />
                </label>
              </div>

              {editAttachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {editAttachments.map((att) => {
                    const isImg =
                      att.type?.startsWith('image/') ||
                      (att.url && att.url.startsWith('data:image'));
                    return (
                      <div
                        key={att.id}
                        className="relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 p-1.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isImg && att.url ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-10 h-10 object-cover rounded shrink-0 cursor-pointer"
                              onClick={() => setSelectedPreviewImage(att.url)}
                            />
                          ) : (
                            <Paperclip className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
                          )}
                          <span className="truncate text-[11px] text-slate-700 dark:text-slate-300">
                            {att.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditAttachment(att.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingDefect(null)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer font-medium"
              >
                Cancel / Отказ
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Changes / Запази промените</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Defect Modal with Screenshot Upload and Large Description Field */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-600 dark:text-rose-500" /> Log Defect (Добавяне на
                дефект)
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Repository & Test Case Selectors for Traceability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Repository / Project *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const newProjId = e.target.value;
                    setSelectedProjectId(newProjId);
                    setSelectedTestCaseId('');
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                >
                  {(allProjects || [project])
                    .filter((p) => p.id !== 'all')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.key}]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Trace to Test Case (Свързан тест кейс)
                </label>
                <select
                  value={selectedTestCaseId}
                  onChange={(e) => {
                    const tcId = e.target.value;
                    setSelectedTestCaseId(tcId);
                    if (tcId) {
                      const matched = (allTestCases || testCases).find((c) => c.id === tcId);
                      if (matched) {
                        if (!newTitle.trim() || newTitle.startsWith('[')) {
                          setNewTitle(`[${matched.key}] Issue in ${matched.title}`);
                        }
                        if (matched.steps && matched.steps.length > 0) {
                          setNewReproSteps(
                            matched.steps
                              .map(
                                (s) =>
                                  `${s.stepNumber}. ${s.action} -> Expected: ${s.expectedResult}`
                              )
                              .join('\n')
                          );
                        }
                        setNewSeverity(matched.severity || 'major');
                      }
                    }
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs"
                >
                  <option value="">-- No linked case (General Bug) --</option>
                  {(allTestCases || testCases)
                    .filter((tc) => !selectedProjectId || tc.projectId === selectedProjectId)
                    .map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        [{tc.key}] {tc.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Bug Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 3DS modal fails to load on Safari"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Severity
                </label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as TestSeverity)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                >
                  <option value="blocker">Blocker</option>
                  <option value="critical">Critical</option>
                  <option value="major">Major</option>
                  <option value="normal">Normal</option>
                  <option value="minor">Minor</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Assignee (Отговорник - по подразбиране текущ потребител)
                </label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>
            </div>

            {/* Requirement #5: Large description field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Description (Подробно описание на дефекта)
                </label>
                <span className="text-[10px] text-slate-400">Generous description field</span>
              </div>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={5}
                placeholder="Describe the defect thoroughly: actual outcome, expected behavior, logs, error responses, environmental details..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg min-h-[110px] leading-relaxed"
              />
            </div>

            {/* Requirement #4: Screenshot Attachment Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                  Attach Screenshot / Скрийншот към бъг
                </label>
                <label className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  <span>Choose Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAddAttachment(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {newAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                  {newAttachments.map((att, i) => (
                    <div
                      key={att.id || i}
                      className="relative group border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-900 shadow-2xs"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        onClick={() => setSelectedPreviewImage(att.url)}
                        className="h-14 w-20 object-cover cursor-pointer hover:opacity-90"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 text-[9px] text-white px-1 py-0.5 truncate flex items-center justify-between">
                        <span className="truncate max-w-[45px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setNewAttachments((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="text-rose-300 hover:text-rose-100 cursor-pointer ml-1"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Reproduction Steps
              </label>
              <textarea
                value={newReproSteps}
                onChange={(e) => setNewReproSteps(e.target.value)}
                rows={3}
                placeholder="1. Navigate to...\n2. Enter invalid card...\n3. Observe error"
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono text-[11px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                File Defect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Defect Confirmation Modal */}
      {defectToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Defect</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Are you sure you want to delete{' '}
                  <strong className="text-rose-600">{defectToDelete.key}</strong>?
                </p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              "{defectToDelete.title}" will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDefectToDelete(null)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer font-medium"
              >
                Cancel / Отказ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteDefect) {
                    onDeleteDefect(defectToDelete.id);
                  }
                  if (activeDefect?.id === defectToDelete.id) {
                    setActiveDefect(null);
                  }
                  setDefectToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                Delete / Изтрий
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Zoom Modal */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl p-2 border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 text-white border-b border-slate-800">
              <span className="font-semibold text-xs flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                Defect Screenshot Evidence
              </span>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center">
              <img
                src={selectedPreviewImage}
                alt="Defect screenshot"
                className="max-h-[75vh] w-auto max-w-full rounded object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
