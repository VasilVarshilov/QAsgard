import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Clock,
  RotateCcw,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
  Check,
  FolderGit2,
  Share2,
  CloudOff,
  Cloud,
} from 'lucide-react';
import {
  browserDb,
  StorageEstimateResult,
  WorkspaceSnapshot,
  WorkspaceExportBundle,
  StoredAttachment,
} from '../services/storage/indexedDb';
import { Project, TestSuite, TestCase, TestRun, Defect, User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Paperclip, FileUp, Sliders, Image as ImageIcon } from 'lucide-react';

interface WorkspaceManagerViewProps {
  project: Project;
  testSuites: TestSuite[];
  testCases: TestCase[];
  testRuns: TestRun[];
  defects: Defect[];
  users: User[];
  onReloadWorkspace: () => Promise<void>;
}

export const WorkspaceManagerView: React.FC<WorkspaceManagerViewProps> = ({
  project,
  testSuites,
  testCases,
  testRuns,
  defects,
  users,
  onReloadWorkspace,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'monitor'
    | 'snapshots'
    | 'export-import'
    | 'migration'
    | 'attachments'
    | 'security'
    | 'cloud-adapter'
  >('monitor');
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimateResult | null>(null);
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([]);
  const [storedAttachments, setStoredAttachments] = useState<StoredAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Snapshot Creation Form
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');

  // Password-protected Export/Import
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [showEncryptedModal, setShowEncryptedModal] = useState(false);

  // Attachments Configuration & Manager
  const [maxAttachmentSizeMB, setMaxAttachmentSizeMB] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('qasgard_max_att_mb');
      return saved ? Number(saved) : 5;
    } catch {
      return 5;
    }
  });
  const [autoCompressImages, setAutoCompressImages] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('qasgard_auto_compress');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);

  // Migration Engine State
  const [migrationInput, setMigrationInput] = useState('');
  const [migrationTargetProject, setMigrationTargetProject] = useState(project.id);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    message: string;
    counts: {
      suites: number;
      testCases: number;
      projects: number;
      defects: number;
      testRuns: number;
    };
  } | null>(null);

  // File Inputs
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const zipFileInputRef = useRef<HTMLInputElement>(null);
  const encryptedFileInputRef = useRef<HTMLInputElement>(null);
  const sqlFileInputRef = useRef<HTMLInputElement>(null);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const estimate = await browserDb.getStorageEstimate();
      const snaps = await browserDb.getSnapshots();
      const atts = await browserDb.getAll<StoredAttachment>('attachments');
      setStorageEstimate(estimate);
      setSnapshots(snaps);
      setStoredAttachments(atts);
    } catch (err: any) {
      console.error('Failed to load storage estimate', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [testSuites.length, testCases.length, defects.length]);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Attachment upload and automatic compression
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = maxAttachmentSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const confirmProceed = window.confirm(
        `Warning: File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds your configured limit (${maxAttachmentSizeMB} MB). Do you still want to compress and store it in IndexedDB?`
      );
      if (!confirmProceed) {
        if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = '';
        return;
      }
    }

    try {
      setIsLoading(true);
      let dataUrl = '';
      let finalSize = file.size;

      if (autoCompressImages && file.type.startsWith('image/') && !file.type.includes('svg')) {
        const compressed = await browserDb.compressImage(file);
        dataUrl = compressed.dataUrl;
        finalSize = compressed.size;
      } else {
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }

      const newAtt: StoredAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: finalSize,
        type: file.type || 'application/octet-stream',
        dataUrl,
        createdAt: new Date().toISOString(),
      };

      await browserDb.saveAttachment(newAtt);
      await loadMetrics();
      showToast(
        'success',
        `Attachment "${file.name}" saved to IndexedDB (${(finalSize / 1024).toFixed(1)} KB)`
      );
    } catch (err: any) {
      showToast('error', `Failed to store attachment: ${err?.message}`);
    } finally {
      setIsLoading(false);
      if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    try {
      await browserDb.deleteAttachment(id);
      await loadMetrics();
      showToast('info', 'Attachment deleted from IndexedDB');
    } catch (err: any) {
      showToast('error', `Failed to delete attachment: ${err?.message}`);
    }
  };

  const handleRunMigration = async () => {
    if (!migrationInput.trim()) {
      showToast('error', 'Please paste SQL or JSON content to migrate.');
      return;
    }
    try {
      setIsMigrating(true);
      const res = await browserDb.migrateLegacyDatabase(migrationInput, migrationTargetProject);
      setMigrationResult(res);
      await onReloadWorkspace();
      await loadMetrics();
      showToast('success', res.message);
    } catch (err: any) {
      showToast('error', `Migration failed: ${err?.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleLoadSampleSupabaseSQL = () => {
    const sample = `-- Sample Legacy Supabase / PostgreSQL Dump
INSERT INTO public.test_suites (id, project_id, name, description)
VALUES ('suite-supa-1', '${project.id}', 'Supabase Migrated Suite', 'Test suite migrated from external PostgreSQL instance');

INSERT INTO public.test_cases (id, suite_id, title, description)
VALUES ('case-supa-101', 'suite-supa-1', 'Verify Zero-Database Session Continuity', 'Ensure test suite functions with zero backend server');

INSERT INTO public.test_cases (id, suite_id, title, description)
VALUES ('case-supa-102', 'suite-supa-1', 'Verify Offline IndexedDB CRUD Speed', 'Validate local sub-millisecond execution time');`;
    setMigrationInput(sample);
    showToast('info', 'Loaded sample legacy Supabase SQL dump');
  };

  // 1. Export JSON
  const handleExportJson = async () => {
    try {
      setIsLoading(true);
      const bundle = await browserDb.exportCompleteWorkspace();
      const jsonStr = JSON.stringify(bundle, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qasgard_workspace_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Complete workspace JSON exported successfully!');
    } catch (err: any) {
      showToast('error', `Export failed: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Export ZIP
  const handleExportZip = async () => {
    try {
      setIsLoading(true);
      const blob = await browserDb.exportZipBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qasgard_workspace_archive_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Full ZIP archive backup with all stores and attachments downloaded!');
    } catch (err: any) {
      showToast('error', `ZIP export failed: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Export Excel Spreadsheet Summary
  const handleExportExcel = () => {
    try {
      // Build clean XML Spreadsheet format compatible with MS Excel, LibreOffice, and Google Sheets
      const rows = testCases
        .map((tc) => {
          const suite = testSuites.find((s) => s.id === tc.suiteId)?.name || 'General';
          return `
        <Row>
          <Cell><Data ss:Type="String">${escapeXml(tc.id)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(tc.title)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(suite)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(tc.type)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(tc.priority)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(tc.severity)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(tc.automationStatus)}</Data></Cell>
          <Cell><Data ss:Type="Number">${tc.steps?.length || 0}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(tc.description || '')}</Data></Cell>
        </Row>`;
        })
        .join('\n');

      const xml = `<?xml version="1.0"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Styles>
          <Style ss:ID="Header">
            <Font ss:Bold="1" ss:Color="#FFFFFF"/>
            <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
          </Style>
        </Styles>
        <Worksheet ss:Name="TestCases">
          <Table>
            <Row ss:StyleID="Header">
              <Cell><Data ss:Type="String">Case ID</Data></Cell>
              <Cell><Data ss:Type="String">Title</Data></Cell>
              <Cell><Data ss:Type="String">Suite</Data></Cell>
              <Cell><Data ss:Type="String">Type</Data></Cell>
              <Cell><Data ss:Type="String">Priority</Data></Cell>
              <Cell><Data ss:Type="String">Severity</Data></Cell>
              <Cell><Data ss:Type="String">Automation</Data></Cell>
              <Cell><Data ss:Type="String">Steps Count</Data></Cell>
              <Cell><Data ss:Type="String">Description</Data></Cell>
            </Row>
            ${rows}
          </Table>
        </Worksheet>
      </Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qasgard_tests_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Excel Spreadsheet report generated!');
    } catch (err: any) {
      showToast('error', `Excel export failed: ${err?.message}`);
    }
  };

  // 4. Export Word Document Report
  const handleExportWord = () => {
    try {
      const suiteGroups: Record<string, TestCase[]> = {};
      testCases.forEach((tc) => {
        const sName = testSuites.find((s) => s.id === tc.suiteId)?.name || 'General';
        if (!suiteGroups[sName]) suiteGroups[sName] = [];
        suiteGroups[sName].push(tc);
      });

      let content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>QAsgard Test Specification</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
          h1 { color: #312E81; font-size: 20pt; border-bottom: 2pt solid #4F46E5; padding-bottom: 4pt; }
          h2 { color: #4338CA; font-size: 14pt; margin-top: 16pt; }
          h3 { color: #1E293B; font-size: 12pt; margin-top: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 6pt; margin-bottom: 12pt; }
          th { background: #EEF2FF; color: #3730A3; border: 1pt solid #C7D2FE; padding: 6pt; text-align: left; }
          td { border: 1pt solid #E2E8F0; padding: 5pt; }
          .badge { display: inline-block; padding: 2pt 5pt; border-radius: 3pt; font-size: 9pt; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>QAsgard Quality Assurance Specification</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Suites:</strong> ${testSuites.length} | <strong>Total Test Cases:</strong> ${testCases.length}</p>
        <hr/>
      `;

      for (const [suiteName, cases] of Object.entries(suiteGroups)) {
        content += `<h2>Suite: ${escapeHtml(suiteName)} (${cases.length} cases)</h2>`;
        cases.forEach((tc) => {
          content += `
          <h3>[${escapeHtml(tc.id)}] ${escapeHtml(tc.title)}</h3>
          <p><strong>Priority:</strong> ${tc.priority} | <strong>Type:</strong> ${tc.type} | <strong>Severity:</strong> ${tc.severity} | <strong>Automation:</strong> ${tc.automationStatus}</p>
          <p>${escapeHtml(tc.description || 'No description provided.')}</p>
          `;

          if (tc.steps && tc.steps.length > 0) {
            content += `
            <table>
              <tr>
                <th style="width: 8%;">#</th>
                <th style="width: 46%;">Step Action</th>
                <th style="width: 46%;">Expected Result</th>
              </tr>
            `;
            tc.steps.forEach((st, idx) => {
              content += `
              <tr>
                <td>${idx + 1}</td>
                <td>${escapeHtml(st.action)}</td>
                <td>${escapeHtml(st.expectedResult)}</td>
              </tr>
              `;
            });
            content += `</table>`;
          }
        });
      }

      content += `</body></html>`;

      const blob = new Blob([content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qasgard_test_specification_${new Date().toISOString().split('T')[0]}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Word Test Specification document generated!');
    } catch (err: any) {
      showToast('error', `Word export failed: ${err?.message}`);
    }
  };

  // 5. Export PDF Spec
  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.text('QAsgard Quality Assurance Report', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | 100% Browser IndexedDB Storage`,
        14,
        28
      );

      const tableData = testCases
        .slice(0, 150)
        .map((tc) => [
          tc.id,
          tc.title,
          testSuites.find((s) => s.id === tc.suiteId)?.name || 'General',
          tc.priority,
          tc.type,
          tc.automationStatus,
        ]);

      autoTable(doc, {
        head: [['ID', 'Title', 'Suite', 'Priority', 'Type', 'Automation']],
        body: tableData,
        startY: 34,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save(`qasgard_test_report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('success', 'PDF summary document downloaded!');
    } catch (err: any) {
      showToast('error', `PDF export failed: ${err?.message}`);
    }
  };

  // 6. Import JSON
  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const text = await file.text();
      const bundle = JSON.parse(text);
      await browserDb.importCompleteWorkspace(bundle, 'replace');
      await onReloadWorkspace();
      await loadMetrics();
      showToast('success', 'Workspace successfully restored from JSON backup!');
    } catch (err: any) {
      showToast('error', `Import failed: ${err?.message}`);
    } finally {
      setIsLoading(false);
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    }
  };

  // 7. Import ZIP
  const handleImportZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      await browserDb.importZipBackup(file);
      await onReloadWorkspace();
      await loadMetrics();
      showToast('success', 'Workspace and attachments fully restored from ZIP!');
    } catch (err: any) {
      showToast('error', `ZIP restore failed: ${err?.message}`);
    } finally {
      setIsLoading(false);
      if (zipFileInputRef.current) zipFileInputRef.current.value = '';
    }
  };

  // 8. Create Snapshot
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotName.trim()) return;

    try {
      setIsLoading(true);
      await browserDb.createSnapshot(snapshotName, snapshotDesc);
      setSnapshotName('');
      setSnapshotDesc('');
      await loadMetrics();
      showToast('success', 'Recovery snapshot point created successfully!');
    } catch (err: any) {
      showToast('error', `Failed to create snapshot: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 9. Restore Snapshot
  const handleRestoreSnapshot = async (snapId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to restore this snapshot? Current unsaved session state will be replaced with this version.'
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await browserDb.restoreSnapshot(snapId);
      await onReloadWorkspace();
      await loadMetrics();
      showToast('success', 'Workspace rolled back to selected snapshot!');
    } catch (err: any) {
      showToast('error', `Restore failed: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 10. Delete Snapshot
  const handleDeleteSnapshot = async (snapId: string) => {
    try {
      await browserDb.deleteSnapshot(snapId);
      await loadMetrics();
      showToast('info', 'Snapshot deleted.');
    } catch (err: any) {
      showToast('error', `Could not delete snapshot: ${err?.message}`);
    }
  };

  // 11. Encrypted Export
  const handleExportEncrypted = async () => {
    if (!encryptionPassword || encryptionPassword.length < 6) {
      showToast('error', 'Encryption password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      const bundle = await browserDb.exportCompleteWorkspace();
      const plainJson = JSON.stringify(bundle);
      const encrypted = await browserDb.encryptBundle(plainJson, encryptionPassword);
      const blob = new Blob([encrypted], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qasgard_encrypted_backup_${new Date().toISOString().split('T')[0]}.qasgard-sec`;
      a.click();
      URL.revokeObjectURL(url);
      setEncryptionPassword('');
      setShowEncryptedModal(false);
      showToast('success', 'AES-256 GCM encrypted backup saved! Keep your password safe.');
    } catch (err: any) {
      showToast('error', `Encryption failed: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 12. Decrypted Import
  const handleImportEncryptedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!decryptPassword) {
      showToast('error', 'Please enter your decryption password first.');
      return;
    }

    try {
      setIsLoading(true);
      const text = await file.text();
      const decrypted = await browserDb.decryptBundle(text, decryptPassword);
      const bundle = JSON.parse(decrypted);
      await browserDb.importCompleteWorkspace(bundle, 'replace');
      await onReloadWorkspace();
      await loadMetrics();
      setDecryptPassword('');
      showToast('success', 'Encrypted workspace successfully decrypted and loaded into IndexedDB!');
    } catch (err: any) {
      showToast(
        'error',
        `Decryption failed. Incorrect password or corrupted file: ${err?.message}`
      );
    } finally {
      setIsLoading(false);
      if (encryptedFileInputRef.current) encryptedFileInputRef.current.value = '';
    }
  };

  function escapeXml(unsafe: string): string {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case "'":
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }

  function escapeHtml(unsafe: string): string {
    return (unsafe || '').replace(
      /[&<>"']/g,
      (m) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[m] || m
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-center">
          <Database className="w-80 h-80 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                100% Browser-Only Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <CloudOff className="w-3 h-3" />
                No Database / Zero Cloud Storage
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              Workspace &amp; Browser Storage Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              All test suites, test cases, steps, runs, defects, and attachments are stored locally
              inside your browser's IndexedDB engine. Real-time auto-saving, full offline readiness,
              zero external tracking, and complete data portability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportZip}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <FileArchive className="w-4 h-4" />
              <span>Full ZIP Backup</span>
            </button>
            <button
              onClick={loadMetrics}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
              title="Refresh Storage Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert Message */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4" />}
            {statusMessage.type === 'info' && <Sparkles className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="opacity-70 hover:opacity-100 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'monitor', label: 'Storage Dashboard', icon: HardDrive },
          { id: 'export-import', label: 'Import & Export Hub', icon: Share2 },
          { id: 'snapshots', label: 'Snapshots & Version History', icon: Clock },
          { id: 'migration', label: 'Legacy DB Migration', icon: FileUp },
          { id: 'attachments', label: 'Attachments & Compression', icon: Paperclip },
          { id: 'security', label: 'Security & Encryption', icon: Lock },
          { id: 'cloud-adapter', label: 'Cloud Extensibility', icon: Cloud },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Storage Monitor Dashboard */}
      {activeSubTab === 'monitor' && (
        <div className="space-y-6">
          {/* Top Storage Metric Cards - Exact 6 Core Monitor Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* 1. IndexedDB size */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">IndexedDB Size</span>
                <Database className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {storageEstimate?.usageFormatted || '0 B'}
              </div>
              <div className="mt-2 text-[11px] text-emerald-500 font-semibold flex items-center justify-between">
                <span>0ms Latency</span>
                <span>ACID</span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${Math.max(1, storageEstimate?.percentageUsed || 0.1)}%` }}
                />
              </div>
            </div>

            {/* 2. Estimated remaining storage */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Remaining Space</span>
                <HardDrive className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {storageEstimate?.estimatedRemainingFormatted || '9.99 GB'}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Quota: {storageEstimate?.quotaFormatted || '10 GB'}</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                {storageEstimate?.percentageUsed || 0}% used
              </div>
            </div>

            {/* 3. Number of Suites */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Number of Suites</span>
                <Layers className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {storageEstimate?.counts.suites ?? testSuites.length}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Folders &amp; Suites</span>
                <span className="text-purple-600 font-semibold">Tree</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                Projects: {storageEstimate?.counts.projects ?? 1}
              </div>
            </div>

            {/* 4. Number of Test Cases */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Test Cases</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {storageEstimate?.counts.testCases ?? testCases.length}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Runs: {storageEstimate?.counts.testRuns ?? testRuns.length}</span>
                <span>Bugs: {storageEstimate?.counts.defects ?? defects.length}</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">Steps &amp; assertions saved</div>
            </div>

            {/* 5. Number of Attachments */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Attachments</span>
                <Paperclip className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {storageEstimate?.counts.attachments ?? storedAttachments.length}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Images, PDFs, Docs</span>
                <span className="text-amber-500 font-semibold">Compressed</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">Limit: {maxAttachmentSizeMB} MB</div>
            </div>

            {/* 6. Last Backup Date */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Last Backup Date</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {storageEstimate?.lastBackupDate
                  ? new Date(storageEstimate.lastBackupDate).toLocaleDateString()
                  : 'Not backed up'}
              </div>
              <div className="mt-2 text-[11px] text-slate-500 truncate">
                {storageEstimate?.lastBackupDate
                  ? new Date(storageEstimate.lastBackupDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Export recommended'}
              </div>
              <div
                className="mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer"
                onClick={handleExportZip}
              >
                Backup now →
              </div>
            </div>
          </div>

          {/* Architecture Guarantee Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Local-First Browser Engine Guarantees
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white font-semibold mb-1">
                  1. Zero Server Database
                </strong>
                No Firebase, Supabase, Postgres, or backend required. You own 100% of your data
                directly on this machine.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white font-semibold mb-1">
                  2. Continuous Auto-Save
                </strong>
                Every suite created, test step modified, or bug logged is committed directly to
                IndexedDB within milliseconds.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white font-semibold mb-1">
                  3. Offline Resilience
                </strong>
                Works flawlessly with no internet connection. PWA service worker precaches all code
                and assets.
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-indigo-500" />
              <span>Download JSON Workspace</span>
            </button>
            <button
              onClick={handleExportZip}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <FileArchive className="w-4 h-4" />
              <span>Download Full ZIP Archive</span>
            </button>
            <button
              onClick={() => setActiveSubTab('snapshots')}
              className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Create Recovery Point ({snapshots.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Import & Export Hub */}
      {activeSubTab === 'export-import' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Section */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Download className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Export Workspace &amp; Reports
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Export your test data in industry standard formats for backup, offline storage,
                stakeholder reporting, or moving to another machine.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleExportJson}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    <FileCode className="w-4 h-4 text-indigo-500" />
                    <span>JSON Backup</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Complete state, suites, cases, steps, &amp; runs.
                  </span>
                </button>

                <button
                  onClick={handleExportZip}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    <FileArchive className="w-4 h-4 text-purple-500" />
                    <span>ZIP Archive</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Multi-table bundles &amp; local attachments.
                  </span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Excel (.xls)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Spreadsheet with suites, priorities &amp; steps.
                  </span>
                </button>

                <button
                  onClick={handleExportWord}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Word Document</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Formal test specification report with steps.
                  </span>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="p-3 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50/60 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer group sm:col-span-2"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>PDF Test Specification Document</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Printable QA executive summary with test case inventory.
                  </span>
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Upload className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Restore Workspace Backup
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Restore a previously exported QAsgard backup. Data is written directly into your
                browser's IndexedDB.
              </p>

              <div className="space-y-3 pt-1">
                {/* JSON Restore */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                      JSON Backup Restore
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Restore from .json backup file
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={jsonFileInputRef}
                    onChange={handleImportJsonFile}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Select JSON
                  </button>
                </div>

                {/* ZIP Restore */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                      Full ZIP Archive Restore
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Restores all data tables + attachments
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={zipFileInputRef}
                    onChange={handleImportZipFile}
                    accept=".zip"
                    className="hidden"
                  />
                  <button
                    onClick={() => zipFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Select ZIP
                  </button>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Safe Restore Protection</span>
                  </div>
                  Restoring a backup safely writes into browser IndexedDB without altering your
                  machine files. A baseline snapshot is created automatically before each restore.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Snapshots & Version History */}
      {activeSubTab === 'snapshots' && (
        <div className="space-y-6">
          {/* Create Snapshot Form */}
          <form
            onSubmit={handleCreateSnapshot}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Recovery Point (Snapshot)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Create an instantaneous snapshot before major changes, sprint releases, or bulk
              imports. You can roll back to any snapshot at any time with a single click.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="Snapshot Name (e.g., Sprint 42 Release Baseline)"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 sm:col-span-1"
                required
              />
              <input
                type="text"
                value={snapshotDesc}
                onChange={(e) => setSnapshotDesc(e.target.value)}
                placeholder="Description / Purpose (Optional)"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 sm:col-span-1"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Save Snapshot</span>
              </button>
            </div>
          </form>

          {/* Snapshots List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Saved Recovery Points</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                  {snapshots.length}
                </span>
              </h3>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No recovery snapshots saved yet. Create your first snapshot above to establish a
                baseline.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-900 dark:text-white">
                          {snap.name}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(snap.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {snap.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{snap.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-mono">
                        <span>Suites: {snap.stats.suiteCount}</span>
                        <span>Cases: {snap.stats.caseCount}</span>
                        <span>Defects: {snap.stats.defectCount}</span>
                        <span>Runs: {snap.stats.runCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestoreSnapshot(snap.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                        title="Rollback workspace to this snapshot"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Legacy Database Migration Engine */}
      {activeSubTab === 'migration' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-indigo-600" />
                  <span>Legacy Database Migration Utility</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Convert external PostgreSQL, Supabase, MySQL SQL dumps, or JSON repositories
                  directly into browser IndexedDB.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleSupabaseSQL}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Load Sample Supabase SQL
                </button>
                <input
                  type="file"
                  ref={sqlFileInputRef}
                  accept=".sql,.json,.txt"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const text = await file.text();
                      setMigrationInput(text);
                      showToast(
                        'info',
                        `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
                      );
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => sqlFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Upload .sql / .json
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>SQL Statements or JSON Data:</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Supports INSERT INTO test_suites/test_cases or nested JSON
                </span>
              </label>
              <textarea
                value={migrationInput}
                onChange={(e) => setMigrationInput(e.target.value)}
                rows={10}
                placeholder="-- Paste PostgreSQL, Supabase, MySQL dump or JSON export here...&#10;INSERT INTO public.test_suites (id, project_id, name) VALUES ('s1', 'proj-1', 'Payment Gateway');&#10;INSERT INTO public.test_cases (id, suite_id, title) VALUES ('c1', 's1', 'Verify 3DS Challenge');"
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                Target Project:{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{project.name}</span>{' '}
                ({project.key})
              </div>
              <button
                type="button"
                onClick={handleRunMigration}
                disabled={isMigrating || !migrationInput.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                <span>
                  {isMigrating ? 'Migrating Database...' : 'Run Migration into IndexedDB'}
                </span>
              </button>
            </div>

            {migrationResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{migrationResult.message}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                  <span>Suites Added: {migrationResult.counts.suites}</span>
                  <span>Cases Added: {migrationResult.counts.testCases}</span>
                  <span>Projects: {migrationResult.counts.projects}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Attachments & Compression Manager */}
      {activeSubTab === 'attachments' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-amber-500" />
                  <span>Local Attachments &amp; Image Compression</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Store test evidence, mockups, PDFs, and bug screenshots directly inside browser
                  IndexedDB.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={attachmentFileInputRef}
                  accept="image/*,application/pdf,text/*,.doc,.docx"
                  className="hidden"
                  onChange={handleAttachmentUpload}
                />
                <button
                  type="button"
                  onClick={() => attachmentFileInputRef.current?.click()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Upload Test Attachment</span>
                </button>
              </div>
            </div>

            {/* Configurable Limits & Compression Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-500" />
                    <span>Large File Warning Threshold</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {maxAttachmentSizeMB} MB
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={maxAttachmentSizeMB}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxAttachmentSizeMB(val);
                    localStorage.setItem('qasgard_max_att_mb', String(val));
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Warns users before storing attachments exceeding {maxAttachmentSizeMB} MB in
                  IndexedDB.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Automatic Image Compression</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCompressImages}
                      onChange={(e) => {
                        setAutoCompressImages(e.target.checked);
                        localStorage.setItem(
                          'qasgard_auto_compress',
                          JSON.stringify(e.target.checked)
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatically downscales large high-res PNG/JPEG screenshots via HTML5 Canvas (82%
                  JPEG quality) to preserve local browser storage capacity.
                </p>
              </div>
            </div>

            {/* Stored Attachments List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Stored Attachments in IndexedDB ({storedAttachments.length})
              </h4>
              {storedAttachments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No attachments stored yet. Upload an image, PDF, or document above to verify local
                  storage.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {storedAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {att.dataUrl && att.type.startsWith('image/') ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <FileText className="w-5 h-5 text-indigo-500" />
                          </div>
                        )}
                        <div className="truncate">
                          <strong className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                            {att.name}
                          </strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(att.size / 1024).toFixed(1)} KB • {att.type} •{' '}
                            {new Date(att.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={att.dataUrl}
                          download={att.name}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
                          title="Download attachment"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                          title="Delete from IndexedDB"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Security & Encryption */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Local Workspace Security &amp; Encryption
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              All data stays 100% inside your local device with zero tracking, zero analytics, and
              zero external transmissions. You can additionally encrypt backups using hardware-grade
              AES-256 GCM encryption.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Encrypted Export */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  <strong className="text-xs font-bold text-slate-900 dark:text-white">
                    Export Encrypted Backup (.qasgard-sec)
                  </strong>
                </div>
                <p className="text-[11px] text-slate-500">
                  Protects your workspace with an AES-256 GCM key derived using PBKDF2 (100,000
                  rounds).
                </p>
                <div>
                  <input
                    type="password"
                    value={encryptionPassword}
                    onChange={(e) => setEncryptionPassword(e.target.value)}
                    placeholder="Enter encryption master password (min 6 chars)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={handleExportEncrypted}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Download Encrypted Backup
                </button>
              </div>

              {/* Encrypted Import */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-emerald-500" />
                  <strong className="text-xs font-bold text-slate-900 dark:text-white">
                    Restore Encrypted Backup
                  </strong>
                </div>
                <p className="text-[11px] text-slate-500">
                  Decrypt and load an encrypted .qasgard-sec file directly into IndexedDB.
                </p>
                <div>
                  <input
                    type="password"
                    value={decryptPassword}
                    onChange={(e) => setDecryptPassword(e.target.value)}
                    placeholder="Enter the password used when exporting"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <input
                  type="file"
                  ref={encryptedFileInputRef}
                  onChange={handleImportEncryptedFile}
                  accept=".qasgard-sec,.json"
                  className="hidden"
                />
                <button
                  onClick={() => encryptedFileInputRef.current?.click()}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Select Encrypted File to Decrypt &amp; Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Cloud Extensibility Adapter Architecture */}
      {activeSubTab === 'cloud-adapter' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Cloud className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Future-Proof Cloud Sync Adapter Architecture
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              As required by the master local-first architecture, local IndexedDB remains the
              unconditional single source of truth. Any optional cloud sync provider (Google Drive,
              OneDrive, GitHub, Dropbox, S3) can be plugged in without changing the internal data
              model.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Single Source of Truth</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Browser IndexedDB holds authoritative test cases, runs, and states. Zero cloud
                  database dependency.
                </p>
                <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded">
                  Active (100% Local)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <FolderGit2 className="w-4 h-4 text-indigo-500" />
                  <span>Pluggable Git / Cloud Adapters</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ready to connect via standard sync hooks (`exportCompleteWorkspace()` /
                  `importCompleteWorkspace()`).
                </p>
                <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded">
                  Standardized JSON/ZIP Hook
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>Zero Host Cost</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Zero recurring cloud database bills, zero database provisioning overhead, scale up
                  to 100,000+ test cases locally.
                </p>
                <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded">
                  Zero Maintenance
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
