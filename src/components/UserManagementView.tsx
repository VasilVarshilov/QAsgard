import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Check,
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Bot,
  Sliders,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Organization, User, UserRole, QACopilotPreferences } from '../types';
import { getUserEmoji, TEAM_EMOJIS } from '../utils/userUtils';

interface UserManagementViewProps {
  organization: Organization;
  users: User[];
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onInviteUser: (user: Partial<User>) => void;
  onDeleteUser?: (userId: string) => void;
  onResetUsers?: () => void;
  copilotPrefs?: QACopilotPreferences;
  onUpdateCopilotPrefs?: (updated: Partial<QACopilotPreferences>) => void;
  onOpenPreferencesModal?: () => void;
  onBackToDashboard?: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  organization,
  users,
  onUpdateRole,
  onInviteUser,
  onDeleteUser,
  onResetUsers,
  copilotPrefs,
  onUpdateCopilotPrefs,
  onOpenPreferencesModal,
  onBackToDashboard,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('qa_engineer');
  const [inviteAvatar, setInviteAvatar] = useState('👩‍💻');

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    onInviteUser({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      avatar: inviteAvatar,
      organizationId: organization.id,
      status: 'active',
    });
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    setInviteAvatar('👩‍💻');
  };

  const permissionsMatrix = [
    {
      action: 'Create & Edit Test Cases & Suites',
      admin: true,
      tm: true,
      ql: true,
      qe: true,
      po: true,
      vi: false,
    },
    {
      action: 'Delete Test Cases & Suites',
      admin: true,
      tm: true,
      ql: true,
      qe: false,
      po: false,
      vi: false,
    },
    {
      action: 'Create & Execute Test Runs',
      admin: true,
      tm: true,
      ql: true,
      qe: true,
      po: false,
      vi: false,
    },
    {
      action: 'Log & Transition Defects',
      admin: true,
      tm: true,
      ql: true,
      qe: true,
      po: true,
      vi: false,
    },
    {
      action: 'Invoke AI Quality Studio Tools',
      admin: true,
      tm: true,
      ql: true,
      qe: true,
      po: true,
      vi: false,
    },
    {
      action: 'Export Reports & PRD Specifications',
      admin: true,
      tm: true,
      ql: true,
      qe: true,
      po: true,
      vi: true,
    },
    {
      action: 'Manage Team Members & Assign Roles',
      admin: true,
      tm: true,
      ql: false,
      qe: false,
      po: false,
      vi: false,
    },
    {
      action: 'Manage Organization Billing & SSO',
      admin: true,
      tm: false,
      ql: false,
      qe: false,
      po: false,
      vi: false,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Team Members &amp; RBAC Permissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage organization members, role assignments, and access control policies.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Върни се към таблото"
            >
              <span>← Изход към таблото / Back to Dashboard</span>
            </button>
          )}

          {onResetUsers && (
            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset team to 6 standard QAsgard roles"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Reset to Standard 6 Roles</span>
            </button>
          )}

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Active Members ({users.length})
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-400">
            Organization: {organization.name}
          </span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {users.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No team members added yet
              </p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4 max-w-xs mx-auto">
                Invite QA engineers, test managers, and leads to collaborate in this workspace.
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Team Member</span>
              </button>
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-lg shrink-0 select-none shadow-xs">
                    {getUserEmoji(u.avatar, u.role)}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-slate-400 dark:text-slate-400 text-[11px] font-mono">
                      {u.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <select
                    value={u.role}
                    onChange={(e) => onUpdateRole(u.id, e.target.value as UserRole)}
                    className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="test_manager">Test Mgr</option>
                    <option value="qa_lead">Test QA lead</option>
                    <option value="qa_engineer">Test QA Eng</option>
                    <option value="product_owner">Test Prod Owner</option>
                    <option value="viewer">Test Viewer</option>
                  </select>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {u.status}
                  </span>

                  {onDeleteUser && (
                    <button
                      type="button"
                      onClick={() => setUserToDelete(u)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title={`Remove member "${u.name}" / Премахни потребител`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden space-y-3 p-5">
        <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Role-Based Access Control (RBAC) Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enforced across Web UI, REST API, and CI/CD automated ingestion endpoints.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">System Permission</th>
                <th className="py-2.5 px-2 text-center">Admin</th>
                <th className="py-2.5 px-2 text-center">Test Mgr</th>
                <th className="py-2.5 px-2 text-center">Test QA lead</th>
                <th className="py-2.5 px-2 text-center">Test QA Eng</th>
                <th className="py-2.5 px-2 text-center">Test Prod Owner</th>
                <th className="py-2.5 px-2 text-center">Test Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissionsMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {row.action}
                  </td>
                  <td className="py-2.5 px-2 text-center">{renderCheck(row.admin)}</td>
                  <td className="py-2.5 px-2 text-center">{renderCheck(row.tm)}</td>
                  <td className="py-2.5 px-2 text-center">{renderCheck(row.ql)}</td>
                  <td className="py-2.5 px-2 text-center">{renderCheck(row.qe)}</td>
                  <td className="py-2.5 px-2 text-center">{renderCheck(row.po)}</td>
                  <td className="py-2.5 px-2 text-center">{renderCheck(row.vi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings → Personal Preferences → QA Copilot */}
      {copilotPrefs && onUpdateCopilotPrefs && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                <span>Settings</span>
                <span>→</span>
                <span>Personal Preferences</span>
                <span>→</span>
                <span className="text-slate-900 dark:text-white font-extrabold">QA Copilot</span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                QA Copilot Floating Widget Preferences
              </h2>
            </div>
            {onOpenPreferencesModal && (
              <button
                onClick={onOpenPreferencesModal}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Open Full Preferences</span>
              </button>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                Show QA Copilot Button
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                When disabled: floating button disappears and the widget is fully hidden from
                viewport.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={copilotPrefs.showButton}
                onChange={(e) => onUpdateCopilotPrefs({ showButton: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Invite New Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jordan.lee@company.com"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Assigned Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              >
                <option value="admin">Admin</option>
                <option value="test_manager">Test Mgr</option>
                <option value="qa_lead">Test QA lead</option>
                <option value="qa_engineer">Test QA Eng</option>
                <option value="product_owner">Test Prod Owner</option>
                <option value="viewer">Test Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span>Avatar Emoji *</span>
                <span className="text-base">{inviteAvatar}</span>
              </label>
              <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                {TEAM_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInviteAvatar(emoji)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform cursor-pointer hover:scale-115 ${
                      inviteAvatar === emoji
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 scale-105'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvite}
                className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Remove Member</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Are you sure you want to remove this user from the organization?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm shrink-0 select-none">
                {getUserEmoji(userToDelete.avatar, userToDelete.role)}
              </div>
              <div className="truncate">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {userToDelete.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                  {userToDelete.email}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteUser) onDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset to 6 Roles Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reset Team Roster
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Restore the designated 6 team members with @qasgard.io email addresses:
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
              <div>• Admin (admin@qasgard.io)</div>
              <div>• Test Mgr (testmgr@qasgard.io)</div>
              <div>• Test QA lead (testqalead@qasgard.io)</div>
              <div>• Test QA Eng (testqaeng@qasgard.io)</div>
              <div>• Test Prod Owner (testprodowner@qasgard.io)</div>
              <div>• Test Viewer (testviewer@qasgard.io)</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetUsers) onResetUsers();
                  setShowResetConfirmModal(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Reset to Standard Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function renderCheck(val: boolean) {
  return val ? (
    <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
  ) : (
    <span className="text-slate-300 font-mono">-</span>
  );
}
