import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  ExternalLink,
  Code2,
  Table as TableIcon,
  Image as ImageIcon,
  AlertTriangle,
  Clock,
  UserCheck,
  Building2,
  ChevronRight,
  Filter,
  Eye,
  FileDown,
} from 'lucide-react';
import { Project, TestCase, TestSuite, TestPriority, TestSeverity } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getTestCasesForSuite, sortTestCasesChronological } from '../utils/exportUtils';

interface TestSuiteExportViewProps {
  project: Project;
  testSuites: TestSuite[];
  testCases: TestCase[];
  initialSuiteId?: string | null;
}

export const TestSuiteExportView: React.FC<TestSuiteExportViewProps> = ({
  project,
  testSuites,
  testCases,
  initialSuiteId,
}) => {
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>(initialSuiteId || 'all');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'xlsx' | 'json' | 'csv' | 'md'>(
    'pdf'
  );

  React.useEffect(() => {
    if (initialSuiteId) {
      setSelectedSuiteId(initialSuiteId);
    }
  }, [initialSuiteId]);
  const [isProfessionalSpec, setIsProfessionalSpec] = useState<boolean>(true);
  const [includeCodeBlocks, setIncludeCodeBlocks] = useState<boolean>(true);
  const [includeNestedTables, setIncludeNestedTables] = useState<boolean>(true);
  const [includeScreenshots, setIncludeScreenshots] = useState<boolean>(true);
  const [includeSignOff, setIncludeSignOff] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Recursively collect all descendant cases and sort in chronological order (TC-001, TC-002, ...)
  const filteredCases = React.useMemo(() => {
    const cases = getTestCasesForSuite(selectedSuiteId, testSuites, testCases);
    return sortTestCasesChronological(cases);
  }, [selectedSuiteId, testSuites, testCases]);

  const activeSuiteName =
    selectedSuiteId === 'all'
      ? 'All Test Suites (Complete Repository)'
      : testSuites.find((s) => s.id === selectedSuiteId)?.name || 'Selected Suite';

  // Statistics calculation
  const totalCases = filteredCases.length;
  const automatedCount = filteredCases.filter((c) => c.automationStatus === 'automated').length;
  const automationRate = totalCases > 0 ? Math.round((automatedCount / totalCases) * 100) : 0;
  const blockerCount = filteredCases.filter(
    (c) => c.severity === 'blocker' || c.severity === 'critical'
  ).length;
  const highPriorityCount = filteredCases.filter(
    (c) => c.priority === 'high' || c.priority === 'highest'
  ).length;

  // Requirement coverage sample
  const requirementCoverage = [
    {
      reqId: 'REQ-PAY-301',
      title: 'Zero PAN/CVV Plaintext Persistence in Merchant DOM',
      status: 'Covered',
      cases: ['PAY-101', 'PAY-102'],
    },
    {
      reqId: 'REQ-3DS-402',
      title: 'Step-up 3DS 2.0 Challenge on Transactions >= $50',
      status: 'Covered',
      cases: ['PAY-103'],
    },
    {
      reqId: 'REQ-IDEM-505',
      title: 'UUIDv4 Idempotency Key with SHA256 Replay Prevention',
      status: 'Covered',
      cases: ['PAY-104'],
    },
    {
      reqId: 'REQ-FAIL-601',
      title: 'Graceful Fallback to Issuer ACS on Timeout < 450ms',
      status: 'Covered',
      cases: ['PAY-105'],
    },
  ];

  // Document Revision History
  const revisionHistory = [
    {
      version: 'v1.0',
      date: '2026-09-15',
      author: 'Admin (Lead QA)',
      approvedBy: 'David Kim (Product Owner)',
      summary: 'Initial baseline test suite specification for PCI tokenization.',
    },
    {
      version: 'v1.1',
      date: '2026-09-28',
      author: 'Marcus Vance (Senior QA)',
      approvedBy: 'Elena Rostova (Test Manager)',
      summary: 'Added 3DS 2.0 biometric assertions and fallback matrix.',
    },
    {
      version: 'v2.0',
      date: '2026-10-05',
      author: 'Elena Rostova (Test Manager)',
      approvedBy: 'Alex Rivera (VP Eng)',
      summary: 'Updated security thresholds to $50 and added automated Playwright hooks.',
    },
  ];

  // Sign-off list
  const signOffOfficers = [
    {
      role: 'Principal QA Lead',
      name: 'Marcus Vance',
      title: 'Staff QA Architect',
      date: 'October 05, 2026',
      status: 'Approved',
    },
    {
      role: 'VP of Engineering',
      name: 'Alex Rivera',
      title: 'VP of Engineering & Platform',
      date: 'October 05, 2026',
      status: 'Approved',
    },
    {
      role: 'Principal Product Manager',
      name: 'David Kim',
      title: 'Director of Payments Product',
      date: 'October 05, 2026',
      status: 'Approved',
    },
    {
      role: 'Information Security & Compliance',
      name: 'Elena Rostova',
      title: 'Head of Quality & Compliance',
      date: 'October 05, 2026',
      status: 'Approved',
    },
  ];

  // Professional PDF Document Generator using jsPDF and autoTable
  const generatePdfBlob = (): Blob => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 16;

    // Header Background
    doc.setFillColor(30, 27, 75); // Dark Indigo
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(`${project.name} - Test Specification`, 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 231, 255);
    doc.text(
      `Scope: ${activeSuiteName}   |   Project: [${project.key}]   |   Date: ${new Date().toLocaleDateString()}`,
      14,
      19
    );
    doc.text(
      `Total Cases: ${totalCases}   |   Automation: ${automationRate}%   |   Blocker/Critical: ${blockerCount}`,
      14,
      24
    );

    currentY = 34;

    // Executive Summary KPI Table
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['Total Test Cases', 'Automated', 'Manual', 'Blocker / Critical', 'High Priority']],
      body: [
        [
          totalCases.toString(),
          automatedCount.toString(),
          (totalCases - automatedCount).toString(),
          blockerCount.toString(),
          highPriorityCount.toString(),
        ],
      ],
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      bodyStyles: { fontSize: 8.5, halign: 'center' },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    if (filteredCases.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('No test cases found in selected suite scope.', 14, currentY + 6);
    } else {
      // Test Cases List
      filteredCases.forEach((tc, idx) => {
        if (currentY > 245) {
          doc.addPage();
          currentY = 16;
        }

        // Test Case Banner
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, currentY, pageWidth - 28, 8, 1, 1, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        const bannerText = `${idx + 1}. [${tc.key}] ${tc.title}`;
        doc.text(
          bannerText.length > 90 ? bannerText.slice(0, 87) + '...' : bannerText,
          16,
          currentY + 5.5
        );

        currentY += 10;

        // Details Row
        autoTable(doc, {
          startY: currentY,
          theme: 'plain',
          styles: { fontSize: 8, cellPadding: 1.5 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 24, textColor: [71, 85, 105] },
            1: { cellWidth: 66 },
            2: { fontStyle: 'bold', cellWidth: 24, textColor: [71, 85, 105] },
            3: { cellWidth: 66 },
          },
          body: [
            [
              'Suite:',
              tc.suiteName || activeSuiteName,
              'Priority:',
              (tc.priority || 'medium').toUpperCase(),
            ],
            [
              'Severity:',
              (tc.severity || 'normal').toUpperCase(),
              'Automation:',
              tc.automationStatus || 'manual',
            ],
            [
              'Type / Layer:',
              `${tc.type || 'functional'} / ${tc.layer || 'e2e'}`,
              'Status:',
              tc.status || 'actual',
            ],
            [
              'Preconditions:',
              tc.preconditions || 'None specified',
              'Description:',
              tc.description || 'N/A',
            ],
          ],
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 3;

        // Steps Table
        if (tc.steps && tc.steps.length > 0) {
          autoTable(doc, {
            startY: currentY,
            theme: 'striped',
            head: [['#', 'Action', 'Expected Result', 'Test Data']],
            body: tc.steps.map((st) => [
              st.stepNumber.toString(),
              st.action,
              st.expectedResult,
              st.data || '-',
            ]),
            headStyles: {
              fillColor: [99, 102, 241],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold',
            },
            bodyStyles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
              0: { cellWidth: 10, halign: 'center' },
              1: { cellWidth: 72 },
              2: { cellWidth: 72 },
              3: { cellWidth: 28 },
            },
            margin: { left: 14, right: 14 },
          });

          currentY = (doc as any).lastAutoTable.finalY + 8;
        } else {
          currentY += 5;
        }
      });
    }

    // Sign-Off Block
    if (includeSignOff) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 16;
      }

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 27, 75);
      doc.text('Document Formal Sign-Off & Verification', 14, currentY + 4);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        head: [['Role / Authority', 'Signatory Name', 'Title', 'Date', 'Status']],
        body: signOffOfficers.map((off) => [off.role, off.name, off.title, off.date, off.status]),
        headStyles: {
          fillColor: [30, 27, 75],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });
    }

    // Page Numbers Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${i} of ${totalPages}  •  ${project.name}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );
    }

    return doc.output('blob');
  };

  // Export handlers
  const handlePrint = () => {
    // Generate and download PDF directly so user immediately receives the file
    const filename = `${project.key}_Test_Specification_${new Date().toISOString().slice(0, 10)}`;
    const pdfBlob = generatePdfBlob();
    triggerFileDownload(pdfBlob, `${filename}.pdf`);

    // Also attempt window.print() if browser allows
    try {
      window.print();
    } catch {
      // Ignored in sandboxed iframes
    }
  };

  const handleDownload = () => {
    const filename = `${project.key}_Test_Specification_${new Date().toISOString().slice(0, 10)}`;

    if (exportFormat === 'pdf') {
      const pdfBlob = generatePdfBlob();
      triggerFileDownload(pdfBlob, `${filename}.pdf`);
    } else if (exportFormat === 'json') {
      const exportData = {
        title: isProfessionalSpec
          ? `${project.name} - Enterprise Test Specification`
          : activeSuiteName,
        project: {
          id: project.id,
          name: project.name,
          key: project.key,
          exportedAt: new Date().toISOString(),
        },
        statistics: {
          totalTestCases: totalCases,
          automationRate: `${automationRate}%`,
          blockerOrCritical: blockerCount,
          highPriority: highPriorityCount,
        },
        suites: testSuites.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          casesCount: filteredCases.filter((c) => c.suiteId === s.id).length,
        })),
        testCases: filteredCases.map((tc) => ({
          key: tc.key,
          title: tc.title,
          description: tc.description,
          preconditions: tc.preconditions,
          suite: tc.suiteName,
          priority: tc.priority,
          severity: tc.severity,
          behavior: tc.behavior || 'positive',
          type: tc.type,
          layer: tc.layer,
          automation: tc.automationStatus,
          status: tc.status,
          tags: tc.tags,
          requirements: tc.requirementRefs || ['REQ-PAY-301'],
          defects: tc.linkedDefects || [],
          steps: tc.steps.map((st) => ({
            number: st.stepNumber,
            action: st.action,
            expectedResult: st.expectedResult,
            data: st.data,
          })),
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      triggerFileDownload(blob, `${filename}.json`);
    } else if (exportFormat === 'csv') {
      let csvContent =
        '\uFEFFSuite,Case Key,Title,Description,Preconditions,Priority,Severity,Behavior,Type,Layer,Automation,Status,Tags,Step #,Action,Expected Result,Test Data\n';

      filteredCases.forEach((tc) => {
        const sName = tc.suiteName || activeSuiteName;
        if (!tc.steps || tc.steps.length === 0) {
          csvContent += `"${sName}","${tc.key}","${tc.title.replace(/"/g, '""')}","${(tc.description || '').replace(/"/g, '""')}","${(tc.preconditions || '').replace(/"/g, '""')}","${tc.priority || 'medium'}","${tc.severity || 'normal'}","${tc.behavior || 'positive'}","${tc.type || 'functional'}","${tc.layer || 'e2e'}","${tc.automationStatus || 'manual'}","${tc.status || 'actual'}","${(tc.tags || []).join('; ')}",1,"Execute test procedure","Expected outcome verified",""\n`;
        } else {
          tc.steps.forEach((st) => {
            csvContent += `"${sName}","${tc.key}","${tc.title.replace(/"/g, '""')}","${(tc.description || '').replace(/"/g, '""')}","${(tc.preconditions || '').replace(/"/g, '""')}","${tc.priority || 'medium'}","${tc.severity || 'normal'}","${tc.behavior || 'positive'}","${tc.type || 'functional'}","${tc.layer || 'e2e'}","${tc.automationStatus || 'manual'}","${tc.status || 'actual'}","${(tc.tags || []).join('; ')}",${st.stepNumber},"${st.action.replace(/"/g, '""')}","${st.expectedResult.replace(/"/g, '""')}","${(st.data || '').replace(/"/g, '""')}"\n`;
          });
        }
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerFileDownload(blob, `${filename}.csv`);
    } else if (exportFormat === 'md') {
      const total = filteredCases.length;
      const automated = filteredCases.filter((c) => c.automationStatus === 'automated').length;
      const blockers = filteredCases.filter(
        (c) => c.severity === 'blocker' || c.severity === 'critical'
      ).length;
      const autoRate = total > 0 ? Math.round((automated / total) * 100) : 0;

      let md = `# ${project.name} - Test Specification Document\n\n`;
      md += `**Scope:** ${activeSuiteName}  \n`;
      md += `**Project:** [${project.key}]  \n`;
      md += `**Export Date:** ${new Date().toLocaleDateString()}  \n`;
      md += `**Compliance Protocol:** ISO/IEC/IEEE 29119 Standard  \n\n`;
      md += `## 1. Executive Metrics\n\n`;
      md += `| Total Test Cases | Automated | Manual | Critical / Blockers | Automation Rate |\n`;
      md += `| :-: | :-: | :-: | :-: | :-: |\n`;
      md += `| **${total}** | ${automated} | ${total - automated} | ${blockers} | **${autoRate}%** |\n\n`;
      md += `## 2. Test Procedures\n\n`;
      filteredCases.forEach((tc, idx) => {
        md += `### ${idx + 1}. [${tc.key}] ${tc.title}\n\n`;
        md += `- **Suite:** ${tc.suiteName || activeSuiteName}\n`;
        md += `- **Priority:** ${(tc.priority || 'medium').toUpperCase()} | **Severity:** ${(tc.severity || 'normal').toUpperCase()}\n`;
        md += `- **Layer / Type:** ${tc.layer || 'e2e'} / ${tc.type || 'functional'}\n`;
        md += `- **Preconditions:** ${tc.preconditions || 'None'}\n\n`;
        md += `${tc.description || ''}\n\n`;
        if (tc.steps && tc.steps.length > 0) {
          md += `| # | Action | Expected Result | Test Data |\n| :-: | :--- | :--- | :--- |\n`;
          tc.steps.forEach((st) => {
            md += `| ${st.stepNumber} | ${st.action.replace(/\|/g, '\\|')} | ${st.expectedResult.replace(/\|/g, '\\|')} | ${(st.data || '-').replace(/\|/g, '\\|')} |\n`;
          });
          md += `\n`;
        }
      });
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      triggerFileDownload(blob, `${filename}.md`);
    } else if (exportFormat === 'xlsx') {
      // Clean HTML table wrapper formatted for native Excel opening
      let excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/><title>${project.name} Test Export</title></head>
<body>
<h2>${project.name} - Test Suite Export (${activeSuiteName})</h2>
<p>Export Date: ${new Date().toLocaleDateString()} | Total Cases: ${totalCases} | Automation Rate: ${automationRate}%</p>
<table border="1">
  <tr style="background-color: #4338ca; color: #ffffff; font-weight: bold;">
    <th>Suite</th><th>Key</th><th>Title</th><th>Priority</th><th>Severity</th><th>Behavior</th><th>Layer</th><th>Automation</th><th>Step #</th><th>Action</th><th>Expected Result</th>
  </tr>`;

      filteredCases.forEach((tc) => {
        if (!tc.steps || tc.steps.length === 0) {
          excelHtml += `<tr>
            <td>${tc.suiteName || activeSuiteName}</td>
            <td><strong>${tc.key}</strong></td>
            <td>${tc.title}</td>
            <td>${(tc.priority || 'medium').toUpperCase()}</td>
            <td>${(tc.severity || 'normal').toUpperCase()}</td>
            <td>${tc.behavior || 'positive'}</td>
            <td>${tc.layer}</td>
            <td>${tc.automationStatus}</td>
            <td>1</td>
            <td>Execute test verification</td>
            <td>Outcome verified</td>
          </tr>`;
        } else {
          tc.steps.forEach((st) => {
            excelHtml += `<tr>
              <td>${tc.suiteName || activeSuiteName}</td>
              <td><strong>${tc.key}</strong></td>
              <td>${tc.title}</td>
              <td>${(tc.priority || 'medium').toUpperCase()}</td>
              <td>${(tc.severity || 'normal').toUpperCase()}</td>
              <td>${tc.behavior || 'positive'}</td>
              <td>${tc.layer}</td>
              <td>${tc.automationStatus}</td>
              <td>${st.stepNumber}</td>
              <td>${st.action}</td>
              <td>${st.expectedResult}</td>
            </tr>`;
          });
        }
      });

      excelHtml += `</table></body></html>`;
      const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
      triggerFileDownload(blob, `${filename}.xls`);
    } else if (exportFormat === 'docx') {
      // Clean HTML-based Word document with styles, headers, and tables
      let docHtml = `<html xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"/><title>${project.name} Test Specification</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; }
  h1 { font-size: 24pt; color: #1e1b4b; border-bottom: 2pt solid #4f46e5; padding-bottom: 6pt; }
  h2 { font-size: 16pt; color: #312e81; margin-top: 18pt; border-bottom: 1pt solid #cbd5e1; }
  h3 { font-size: 13pt; color: #4338ca; margin-top: 12pt; }
  table { border-collapse: collapse; width: 100%; margin: 12pt 0; font-size: 10pt; }
  th { background-color: #f1f5f9; border: 1pt solid #94a3b8; padding: 6pt; text-align: left; }
  td { border: 1pt solid #cbd5e1; padding: 6pt; }
  .badge { background: #e0e7ff; color: #3730a3; padding: 2pt 6pt; border-radius: 4pt; font-weight: bold; font-size: 9pt; }
  .code-block { background: #f8fafc; border: 1pt solid #e2e8f0; padding: 8pt; font-family: Consolas, monospace; font-size: 9pt; }
</style>
</head>
<body>
  <h1>${project.name} - Test Specification Document</h1>
  <p><strong>Suite:</strong> ${activeSuiteName} | <strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>System Version:</strong> 2.4.0-RC1</p>
  <p><strong>Total Cases:</strong> ${totalCases} | <strong>Automation Rate:</strong> ${automationRate}% | <strong>Blockers/Critical:</strong> ${blockerCount}</p>
  <hr/>`;

      filteredCases.forEach((tc) => {
        docHtml += `<h2>[${tc.key}] ${tc.title}</h2>
        <p><strong>Suite:</strong> ${tc.suiteName || activeSuiteName} | <strong>Priority:</strong> ${(tc.priority || 'medium').toUpperCase()} | <strong>Severity:</strong> ${(tc.severity || 'normal').toUpperCase()} | <strong>Automation:</strong> ${tc.automationStatus}</p>
        <p><strong>Description:</strong> ${tc.description || 'N/A'}</p>
        <p><strong>Preconditions:</strong> ${tc.preconditions || 'None specified'}</p>
        <table>
          <tr><th style="width: 10%;">Step</th><th style="width: 45%;">Action</th><th style="width: 45%;">Expected Result</th></tr>`;

        if (!tc.steps || tc.steps.length === 0) {
          docHtml += `<tr><td><strong>1</strong></td><td>Execute test verification</td><td>Expected outcome verified</td></tr>`;
        } else {
          tc.steps.forEach((st) => {
            docHtml += `<tr>
              <td><strong>${st.stepNumber}</strong></td>
              <td>${st.action}</td>
              <td>${st.expectedResult}</td>
            </tr>`;
          });
        }

        docHtml += `</table>`;
      });

      docHtml += `</body></html>`;
      const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
      triggerFileDownload(blob, `${filename}.doc`);
    }
  };

  const triggerFileDownload = (blob: Blob, name: string) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 3000);

      setDownloadSuccess(name);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('Trigger file download failed:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Configuration Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 rounded-full flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-600" />
                Enterprise Test Suite Exporter
              </span>
              <span className="text-xs text-slate-400">• Multi-Format Compliance Engine</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Export Test Specifications &amp; Reports
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate customer-ready QA specifications, audit matrices, and spreadsheet packages
              with full step procedures.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Download {exportFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* 1. Format Selector */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              Export Format
            </label>
            <div className="grid grid-cols-6 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg font-mono">
              {(['pdf', 'docx', 'xlsx', 'json', 'csv', 'md'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`py-1.5 rounded-md font-bold text-center transition-all cursor-pointer ${
                    exportFormat === fmt
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Suite Scope */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              Test Suite Scope
            </label>
            <select
              value={selectedSuiteId}
              onChange={(e) => setSelectedSuiteId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Test Suites ({testCases.length} Cases)</option>
              {testSuites.map((s) => {
                const count = getTestCasesForSuite(s.id, testSuites, testCases).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({count} Cases)
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Document Preset Mode */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              Specification Preset
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProfessionalSpec(true)}
                className={`flex-1 py-2 px-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isProfessionalSpec
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Professional Spec</span>
              </button>

              <button
                onClick={() => setIsProfessionalSpec(false)}
                className={`flex-1 py-2 px-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isProfessionalSpec
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Raw Test List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            Include Sections:
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeCodeBlocks}
              onChange={(e) => setIncludeCodeBlocks(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Code Blocks &amp; JSON Payloads</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeNestedTables}
              onChange={(e) => setIncludeNestedTables(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Nested Configuration Tables</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeScreenshots}
              onChange={(e) => setIncludeScreenshots(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Screenshots &amp; Visual Evidences</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeSignOff}
              onChange={(e) => setIncludeSignOff(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Formal Sign-Off Block</span>
          </label>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Successfully generated and downloaded <strong>{downloadSuccess}</strong>
              </span>
            </div>
            <span className="font-mono text-[10px]">Ready for distribution</span>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* HIGH-FIDELITY DOCUMENT PREVIEW (PRINTABLE CANVAS) */}
      {/* ==================================================================== */}
      <div
        ref={printAreaRef}
        className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none print:m-0"
      >
        {/* DOCUMENT HEADER / COVER PAGE */}
        {isProfessionalSpec && (
          <div className="p-8 sm:p-12 border-b-4 border-indigo-600 bg-gradient-to-b from-slate-50 to-white space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-600 block">
                    QAsgard Quality Assurance Architecture
                  </span>
                  <span className="text-xl font-bold text-slate-900">{project.name}</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded font-mono text-[10px] font-bold uppercase tracking-wider">
                  CONFIDENTIAL - INTERNAL / AUDIT ONLY
                </span>
                <div className="text-[11px] text-slate-500 font-mono">
                  Doc ID: QA-SPEC-{project.key}-2026-V2
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-200">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Software Test Specification &amp; Verification Protocol
              </h1>
              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Comprehensive test procedure documentation, step-by-step assertions, nested data
                matrices, and requirement traceability for the <strong>{activeSuiteName}</strong>{' '}
                subsystem.
              </p>
            </div>

            {/* Document Metadata Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Release Baseline
                </span>
                <span className="font-semibold text-slate-900">v2.4.0-RC1 (Staging)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Generation Date
                </span>
                <span className="font-semibold text-slate-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Document Author
                </span>
                <span className="font-semibold text-slate-900">Elena Rostova (Test Lead)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Compliance Standard
                </span>
                <span className="font-semibold text-slate-900">ISO/IEC/IEEE 29119</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-8 sm:p-12 space-y-10">
          {/* SECTION 1: EXECUTIVE SUMMARY & METRICS */}
          {isProfessionalSpec && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                  Executive Summary &amp; Repository Statistics
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  Scope: {filteredCases.length} Test Cases
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 block">
                    Total Test Cases
                  </span>
                  <span className="text-2xl font-bold font-mono text-indigo-950 mt-1 block">
                    {totalCases}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Across {selectedSuiteId === 'all' ? testSuites.length : 1} Suite(s)
                  </span>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                    Automation Rate
                  </span>
                  <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">
                    {automationRate}%
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {automatedCount} of {totalCases} Automated
                  </span>
                </div>

                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="text-[10px] font-bold uppercase text-rose-700 block">
                    Critical / Blockers
                  </span>
                  <span className="text-2xl font-bold font-mono text-rose-950 mt-1 block">
                    {blockerCount}
                  </span>
                  <span className="text-[11px] text-slate-500">P0 Security &amp; Checkout</span>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold uppercase text-amber-700 block">
                    High Priority Cases
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">
                    {highPriorityCount}
                  </span>
                  <span className="text-[11px] text-slate-500">Regression Gatekeepers</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DOCUMENT REVISION HISTORY */}
          {isProfessionalSpec && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                  Document Revision &amp; Change History
                </h2>
                <span className="text-xs text-slate-500 font-mono">Audit Traceable</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200 w-16">Version</th>
                      <th className="p-2.5 border-r border-slate-200 w-24">Date</th>
                      <th className="p-2.5 border-r border-slate-200 w-36">Author</th>
                      <th className="p-2.5 border-r border-slate-200 w-36">Approved By</th>
                      <th className="p-2.5">Summary of Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revisionHistory.map((rev, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono text-indigo-700 border-r border-slate-200">
                          {rev.version}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 border-r border-slate-200">
                          {rev.date}
                        </td>
                        <td className="p-2.5 text-slate-800 border-r border-slate-200">
                          {rev.author}
                        </td>
                        <td className="p-2.5 text-slate-800 border-r border-slate-200">
                          {rev.approvedBy}
                        </td>
                        <td className="p-2.5 text-slate-600">{rev.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: REQUIREMENT COVERAGE TRACEABILITY MATRIX */}
          {isProfessionalSpec && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                  Requirement Traceability Matrix (RTM)
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  100% Core Requirements Covered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200 w-28">Req ID</th>
                      <th className="p-2.5 border-r border-slate-200">
                        Functional Requirement Description
                      </th>
                      <th className="p-2.5 border-r border-slate-200 w-28">Coverage</th>
                      <th className="p-2.5 w-40">Linked Test Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirementCoverage.map((req, qIdx) => (
                      <tr key={qIdx} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono text-indigo-700 border-r border-slate-200">
                          {req.reqId}
                        </td>
                        <td className="p-2.5 text-slate-800 border-r border-slate-200 font-medium">
                          {req.title}
                        </td>
                        <td className="p-2.5 border-r border-slate-200">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                            {req.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          {req.cases.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: DETAILED TEST CASE PROCEDURES */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {isProfessionalSpec ? '4' : '1'}
                </span>
                Detailed Test Case Specifications &amp; Step Procedures
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {filteredCases.length} Procedures Documented
              </span>
            </div>

            <div className="space-y-8">
              {filteredCases.map((tc, tcIdx) => (
                <div
                  key={tc.id}
                  className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-4 text-xs page-break-inside-avoid"
                >
                  {/* Case Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-bold rounded-md text-xs shadow-2xs">
                        {tc.key}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{tc.title}</h3>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tc.priority === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tc.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                        {tc.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        {tc.layer}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {tc.automationStatus}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Suite Hierarchy
                      </span>
                      <span className="font-semibold text-slate-800">{tc.suiteName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Behavior / Type
                      </span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {tc.behavior || 'positive'} • {tc.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Requirement Trace
                      </span>
                      <span className="font-mono text-indigo-700 font-semibold">
                        {tc.requirementRefs?.join(', ') || 'REQ-PAY-301'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Linked Defect
                      </span>
                      <span className="font-mono text-rose-700 font-semibold">
                        {tc.linkedDefects?.join(', ') || 'None (Clean)'}
                      </span>
                    </div>
                  </div>

                  {/* Description & Preconditions */}
                  <div className="space-y-1.5">
                    <p className="text-slate-700 leading-relaxed">
                      <strong>Description:</strong> {tc.description}
                    </p>
                    {tc.preconditions && (
                      <p className="text-slate-600 bg-amber-50/70 p-2 rounded border border-amber-200/60 text-[11px]">
                        <strong>Preconditions:</strong> {tc.preconditions}
                      </p>
                    )}
                  </div>

                  {/* Sequential Steps Table */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Execution Step Procedure &amp; Verifications:
                    </span>
                    <table className="w-full text-xs text-left border-collapse border border-slate-200 bg-white">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="p-2 border-r border-slate-200 w-12 text-center">#</th>
                          <th className="p-2 border-r border-slate-200 w-1/2">
                            Action / Input Procedure
                          </th>
                          <th className="p-2 w-1/2">Expected Result &amp; Assertion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tc.steps.map((st) => (
                          <tr
                            key={st.stepNumber}
                            className="border-b border-slate-200 hover:bg-slate-50"
                          >
                            <td className="p-2 font-mono font-bold text-center border-r border-slate-200 text-slate-700">
                              {st.stepNumber}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-800">
                              <div>{st.action}</div>
                              {st.data && (
                                <div className="mt-1 font-mono text-[10px] text-slate-500 bg-slate-50 p-1 rounded">
                                  Data: {st.data}
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-emerald-800 font-medium">
                              {st.expectedResult}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Code Snippet / Payload Block */}
                  {includeCodeBlocks && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>API Request Payload / Configuration JSON</span>
                      </div>
                      <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                        {`{
  "order_id": "ord_stage_${tc.key.toLowerCase()}_09",
  "amount_cents": 7500,
  "currency": "USD",
  "payment_method": {
    "type": "card",
    "token": "tok_visa_verified_3ds2",
    "challenge_indicator": "challenge_preferred"
  },
  "metadata": {
    "test_case_ref": "${tc.key}",
    "suite": "${tc.suiteName}"
  }
}`}
                      </pre>
                    </div>
                  )}

                  {/* Nested Configuration Table */}
                  {includeNestedTables && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Data Variation &amp; Environmental Boundary Matrix</span>
                      </div>
                      <table className="w-full text-[11px] border-collapse border border-slate-200 bg-white">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700">
                            <th className="p-1.5 border border-slate-200">Test Vector</th>
                            <th className="p-1.5 border border-slate-200">Simulation Cardholder</th>
                            <th className="p-1.5 border border-slate-200">Challenge Outcome</th>
                            <th className="p-1.5 border border-slate-200">Expected SLA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-1.5 border border-slate-200 font-mono">
                              Vector Alpha
                            </td>
                            <td className="p-1.5 border border-slate-200">
                              Visa Direct Frictionless
                            </td>
                            <td className="p-1.5 border border-slate-200 text-emerald-700 font-semibold">
                              200 Authorized
                            </td>
                            <td className="p-1.5 border border-slate-200 font-mono">&lt; 120ms</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 border border-slate-200 font-mono">Vector Beta</td>
                            <td className="p-1.5 border border-slate-200">
                              Mastercard Identity Check
                            </td>
                            <td className="p-1.5 border border-slate-200 text-indigo-700 font-semibold">
                              Step-Up Modal
                            </td>
                            <td className="p-1.5 border border-slate-200 font-mono">&lt; 180ms</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Screenshot & Attachment Previews */}
                  {includeScreenshots && tc.attachments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Attached Visual Evidences &amp; Trace Logs</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-xs">
                          <FileCode className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-slate-800">
                            {tc.attachments[0].name}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({tc.attachments[0].size})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: SIGN-OFF & APPROVAL BLOCK */}
          {isProfessionalSpec && includeSignOff && (
            <div className="space-y-6 pt-6 border-t-2 border-slate-200 page-break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    5
                  </span>
                  Quality Assurance Sign-Off &amp; Formal Authorization
                </h2>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All Signatures Collected
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                By signing below, the authorized officers confirm that the test cases outlined in
                this specification have been reviewed, audited for requirement completeness, and
                verified to satisfy release criteria.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {signOffOfficers.map((off, oIdx) => (
                  <div
                    key={oIdx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-indigo-700">
                        {off.role}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                        {off.status}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-sm">{off.name}</div>
                      <div className="text-slate-500 text-[11px]">{off.title}</div>
                    </div>

                    {/* Signature simulation line */}
                    <div className="pt-3 border-t border-dashed border-slate-300 flex items-center justify-between">
                      <span className="font-serif italic text-indigo-900 font-bold text-sm tracking-wide">
                        /s/ {off.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{off.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCUMENT FOOTER */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
            <span>Generated via QAsgard Enterprise Test Management System</span>
            <span>Document Hash: 9f8a32b...c41e • ISO/IEC/IEEE 29119 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
