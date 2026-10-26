import React, { useState } from 'react';
import { BookmarkCheck, Plus, Calendar, Layers, CheckCircle2, X, Target } from 'lucide-react';
import { Project, TestPlan, TestCase } from '../types';

interface TestPlansViewProps {
  project: Project;
  testPlans: TestPlan[];
  testCases: TestCase[];
  onCreatePlan: (plan: Partial<TestPlan>) => void;
}

export const TestPlansView: React.FC<TestPlansViewProps> = ({
  project,
  testPlans,
  testCases,
  onCreatePlan,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMilestone, setNewMilestone] = useState('v4.3.0 Release');
  const [newTargetDate, setNewTargetDate] = useState('2026-11-01');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const plan: Partial<TestPlan> = {
      key: `PLAN-${Math.floor(10 + Math.random() * 90)}`,
      projectId: project.id,
      title: newTitle,
      description: newDesc,
      milestone: newMilestone,
      targetRelease: newTargetDate,
      caseCount: testCases.length,
      testCaseIds: testCases.map((tc) => tc.id),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    onCreatePlan(plan);
    setShowModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Test Plans &amp; Milestones
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bundle test suites into release milestones, regression cycles, and compliance audits.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Test Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      {testPlans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <BookmarkCheck className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No test plans found
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
            Create milestone-driven test plans to scope test cases for release gating and sign-offs.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create your first test plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testPlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {plan.key}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                  {plan.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Target: {plan.targetRelease}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{plan.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Milestone: {plan.milestone}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>{plan.caseCount} test cases linked</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* New Test Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Create Test Plan</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Plan Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Q1 Mobile App Release Audit"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Milestone Tag
                </label>
                <input
                  type="text"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Description
              </label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                placeholder="Scope and compliance targets..."
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
