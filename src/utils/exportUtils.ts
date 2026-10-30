import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Project,
  TestCase,
  TestSuite,
  TestRun,
  Attachment,
  Defect,
  TestExecution,
  StepExecutionResult,
  TestRepository,
  Requirement,
} from '../types';

/**
 * Universal browser file download helper.
 * Uses link element injection with safely deferred URL cleanup.
 */
export function downloadBlob(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      } catch {
        // ignore cleanup error
      }
    }, 3000);
    return true;
  } catch (err) {
    console.error('downloadBlob failed:', err);
    // Fallback using data URI
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const a = document.createElement('a');
        a.href = reader.result as string;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 3000);
      };
      reader.readAsDataURL(blob);
      return true;
    } catch (fallbackErr) {
      console.error('data URI fallback failed:', fallbackErr);
      return false;
    }
  }
}

/**
 * Helper to download text / formatted string
 */
export function downloadText(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): boolean {
  const blob = new Blob([content], { type: mimeType });
  return downloadBlob(blob, filename);
}

/**
 * Recursively resolves all test cases for a given suite ID,
 * including test cases from all nested descendant child suites.
 * When suiteId is empty or 'all', returns all test cases.
 */
export function getTestCasesForSuite(
  suiteId: string | null | undefined,
  allSuites: TestSuite[],
  allCases: TestCase[]
): TestCase[] {
  if (!suiteId || suiteId === 'all') {
    return allCases;
  }

  // Collect target suite and all descendant child suites recursively
  const targetSuiteIds = new Set<string>([suiteId]);
  const collectChildren = (parentId: string) => {
    allSuites
      .filter((s) => s.parentId === parentId)
      .forEach((child) => {
        targetSuiteIds.add(child.id);
        collectChildren(child.id);
      });
  };
  collectChildren(suiteId);

  return allCases.filter((tc) => targetSuiteIds.has(tc.suiteId));
}

/**
 * Calculates the total recursive test case count for a suite,
 * including direct cases and all cases from descendant child suites.
 */
export function getSuiteRecursiveCaseCount(
  suiteId: string,
  allSuites: TestSuite[],
  allCases: TestCase[]
): number {
  return getTestCasesForSuite(suiteId, allSuites, allCases).length;
}

/**
 * Recursively collects all descendant suite IDs for a parent suite.
 */
export function getDescendantSuiteIds(parentId: string, suites: TestSuite[]): string[] {
  const result: string[] = [];
  const collect = (pId: string) => {
    suites
      .filter((s) => s.parentId === pId)
      .forEach((child) => {
        result.push(child.id);
        collect(child.id);
      });
  };
  collect(parentId);
  return result;
}

/**
 * Sorts test cases in natural chronological / sequential numerical order:
 * 1. Explicit TC numbers in title (TC-001, TC-002, TC-003, ..., TC-021)
 * 2. Sequential numbers in case key (e.g. ZUGFERD-1, ZUGFERD-2, ZUGFERD-10, PAY-101)
 * 3. Natural alphanumeric key sorting
 * 4. Title comparison
 * 5. Created date
 */
export function sortTestCasesChronological(cases: TestCase[]): TestCase[] {
  return [...cases].sort((a, b) => {
    // 1. Look for explicit "TC-001", "TC-1", "TC 001" in title
    const matchA = a.title?.match(/(?:TC|tc)[-_#\s]*(\d+)/i);
    const matchB = b.title?.match(/(?:TC|tc)[-_#\s]*(\d+)/i);

    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) {
        return numA - numB;
      }
    } else if (matchA && !matchB) {
      return -1;
    } else if (!matchA && matchB) {
      return 1;
    }

    // 2. Check for numeric suffix or embedded number in case key
    // E.g. "ZUGFERD-1" vs "ZUGFERD-2" vs "ZUGFERD-10" or "PAY-101" vs "PAY-102"
    const keyMatchA = a.key?.match(/^([A-Za-z_-]+)(\d+)$/);
    const keyMatchB = b.key?.match(/^([A-Za-z_-]+)(\d+)$/);

    if (keyMatchA && keyMatchB && keyMatchA[1] === keyMatchB[1]) {
      const numA = parseInt(keyMatchA[2], 10);
      const numB = parseInt(keyMatchB[2], 10);
      if (numA !== numB) {
        return numA - numB;
      }
    }

    // 3. Fallback to natural locale comparison on key
    const keyDiff = (a.key || '').localeCompare(b.key || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    if (keyDiff !== 0) return keyDiff;

    // 4. Natural comparison on title
    const titleDiff = (a.title || '').localeCompare(b.title || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    if (titleDiff !== 0) return titleDiff;

    // 5. Fallback to createdAt
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}

/**
 * Sorts test cases strictly according to the hierarchical suite tree structure of the repository:
 * 1. Root suites in suite order / natural sort
 * 2. Child suites recursively under their parent
 * 3. Cases within each suite in natural chronological / key sort
 * 4. Any unassigned cases at the end
 */
export function sortTestCasesTreeOrder(cases: TestCase[], suites: TestSuite[] = []): TestCase[] {
  if (!suites || suites.length === 0) {
    return sortTestCasesChronological(cases);
  }

  const childMap = new Map<string, TestSuite[]>();
  const rootSuites: TestSuite[] = [];

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

  suites.forEach((s) => {
    if (!s.parentId || !suites.some((other) => other.id === s.parentId)) {
      rootSuites.push(s);
    } else {
      const existing = childMap.get(s.parentId) || [];
      existing.push(s);
      childMap.set(s.parentId, existing);
    }
  });

  const orderedSuites: TestSuite[] = [];
  const traverse = (currentSuites: TestSuite[]) => {
    const sorted = sortSuitesList(currentSuites);
    for (const s of sorted) {
      orderedSuites.push(s);
      const children = childMap.get(s.id);
      if (children && children.length > 0) {
        traverse(children);
      }
    }
  };
  traverse(rootSuites);

  const casesBySuiteId = new Map<string, TestCase[]>();
  const unassignedCases: TestCase[] = [];
  const knownSuiteIds = new Set(suites.map((s) => s.id));

  cases.forEach((c) => {
    if (c.suiteId && knownSuiteIds.has(c.suiteId)) {
      const list = casesBySuiteId.get(c.suiteId) || [];
      list.push(c);
      casesBySuiteId.set(c.suiteId, list);
    } else {
      unassignedCases.push(c);
    }
  });

  const result: TestCase[] = [];
  for (const s of orderedSuites) {
    const suiteCases = casesBySuiteId.get(s.id);
    if (suiteCases && suiteCases.length > 0) {
      result.push(...sortTestCasesChronological(suiteCases));
    }
  }

  if (unassignedCases.length > 0) {
    result.push(...sortTestCasesChronological(unassignedCases));
  }

  return result;
}

/**
 * Export test suite / repository as JSON maintaining exact hierarchical tree structure
 */
export function exportSuiteAsJson(
  project: Project,
  suiteName: string,
  cases: TestCase[],
  suites: TestSuite[] = []
): string {
  const sortedCases = sortTestCasesTreeOrder(cases, suites);

  const exportData = {
    title: `${project.name} - Test Specification (${suiteName})`,
    project: {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      exportedAt: new Date().toISOString(),
    },
    statistics: {
      totalCases: sortedCases.length,
      automatedCount: sortedCases.filter((c) => c.automationStatus === 'automated').length,
      manualCount: sortedCases.filter((c) => c.automationStatus === 'manual').length,
      criticalBlockerCount: sortedCases.filter(
        (c) => c.severity === 'blocker' || c.severity === 'critical'
      ).length,
      highPriorityCount: sortedCases.filter(
        (c) => c.priority === 'high' || c.priority === 'highest'
      ).length,
    },
    suites: suites.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      parentId: s.parentId || null,
      order: s.order,
      caseCount: getTestCasesForSuite(s.id, suites, sortedCases).length,
    })),
    testCases: sortedCases.map((tc) => ({
      id: tc.id,
      key: tc.key,
      suiteId: tc.suiteId,
      suiteName: tc.suiteName,
      title: tc.title,
      description: tc.description,
      preconditions: tc.preconditions,
      priority: tc.priority,
      severity: tc.severity,
      behavior: tc.behavior,
      type: tc.type,
      layer: tc.layer,
      automationStatus: tc.automationStatus,
      status: tc.status,
      tags: tc.tags,
      requirementRefs: tc.requirementRefs,
      steps: (tc.steps || []).map((st) => ({
        stepNumber: st.stepNumber,
        action: st.action,
        expectedResult: st.expectedResult,
        data: st.data,
        attachments: st.attachments || [],
      })),
      createdAt: tc.createdAt,
      updatedAt: tc.updatedAt,
    })),
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const cleanName = `${project.key}_${suiteName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
  downloadText(jsonStr, cleanName, 'application/json');
  return cleanName;
}

/**
 * Export test suite / repository as CSV (UTF-8 BOM for Microsoft Excel compatibility)
 */
export function exportSuiteAsCsv(project: Project, suiteName: string, cases: TestCase[]): string {
  const sortedCases = sortTestCasesChronological(cases);

  // UTF-8 BOM so Excel opens non-ASCII characters cleanly
  let csv = '\uFEFF';
  csv +=
    'Suite,Case Key,Title,Description,Preconditions,Priority,Severity,Behavior,Type,Layer,Automation,Status,Tags,Step #,Action,Expected Result,Test Data\n';

  sortedCases.forEach((tc) => {
    const suiteStr = `"${(tc.suiteName || suiteName).replace(/"/g, '""')}"`;
    const keyStr = `"${tc.key.replace(/"/g, '""')}"`;
    const titleStr = `"${tc.title.replace(/"/g, '""')}"`;
    const descStr = `"${(tc.description || '').replace(/"/g, '""')}"`;
    const precondStr = `"${(tc.preconditions || '').replace(/"/g, '""')}"`;
    const priorityStr = `"${tc.priority || 'medium'}"`;
    const severityStr = `"${tc.severity || 'normal'}"`;
    const behaviorStr = `"${tc.behavior || 'positive'}"`;
    const typeStr = `"${tc.type || 'functional'}"`;
    const layerStr = `"${tc.layer || 'e2e'}"`;
    const autoStr = `"${tc.automationStatus || 'manual'}"`;
    const statusStr = `"${tc.status || 'actual'}"`;
    const tagsStr = `"${(tc.tags || []).join('; ').replace(/"/g, '""')}"`;

    if (!tc.steps || tc.steps.length === 0) {
      csv += `${suiteStr},${keyStr},${titleStr},${descStr},${precondStr},${priorityStr},${severityStr},${behaviorStr},${typeStr},${layerStr},${autoStr},${statusStr},${tagsStr},1,"Execute test procedure","Expected outcome verified",""\n`;
    } else {
      tc.steps.forEach((st) => {
        const actionStr = `"${st.action.replace(/"/g, '""')}"`;
        const expectedStr = `"${st.expectedResult.replace(/"/g, '""')}"`;
        const dataStr = `"${(st.data || '').replace(/"/g, '""')}"`;
        csv += `${suiteStr},${keyStr},${titleStr},${descStr},${precondStr},${priorityStr},${severityStr},${behaviorStr},${typeStr},${layerStr},${autoStr},${statusStr},${tagsStr},${st.stepNumber},${actionStr},${expectedStr},${dataStr}\n`;
      });
    }
  });

  const cleanName = `${project.key}_${suiteName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadText(csv, cleanName, 'text/csv;charset=utf-8');
  return cleanName;
}

/**
 * Export test suite / repository as Markdown specification
 */
export function exportSuiteAsMarkdown(
  project: Project,
  suiteName: string,
  cases: TestCase[]
): string {
  const sortedCases = sortTestCasesChronological(cases);

  const total = sortedCases.length;
  const automated = sortedCases.filter((c) => c.automationStatus === 'automated').length;
  const blockers = sortedCases.filter(
    (c) => c.severity === 'blocker' || c.severity === 'critical'
  ).length;
  const autoRate = total > 0 ? Math.round((automated / total) * 100) : 0;

  let md = `# ${project.name} - Test Specification Document\n\n`;
  md += `**Scope:** ${suiteName}  \n`;
  md += `**Project Key:** [${project.key}]  \n`;
  md += `**Export Date:** ${new Date().toLocaleDateString()} (${new Date().toISOString()})  \n`;
  md += `**Compliance Baseline:** ISO/IEC/IEEE 29119 Standard  \n\n`;

  md += `## 1. Executive Summary & KPIs\n\n`;
  md += `| Total Test Cases | Automated | Manual | Critical / Blockers | Automation Rate |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  md += `| **${total}** | ${automated} | ${total - automated} | ${blockers} | **${autoRate}%** |\n\n`;

  md += `## 2. Test Procedures & Detailed Assertions\n\n`;

  if (sortedCases.length === 0) {
    md += `*No test cases match the selected scope.*\n\n`;
  } else {
    sortedCases.forEach((tc, idx) => {
      md += `### ${idx + 1}. [${tc.key}] ${tc.title}\n\n`;
      md += `- **Suite:** ${tc.suiteName || suiteName}\n`;
      md += `- **Priority:** ${(tc.priority || 'medium').toUpperCase()} | **Severity:** ${(tc.severity || 'normal').toUpperCase()}\n`;
      md += `- **Type / Layer:** ${tc.type || 'functional'} / ${tc.layer || 'e2e'}\n`;
      md += `- **Automation Status:** ${tc.automationStatus || 'manual'} | **Status:** ${tc.status || 'actual'}\n`;
      if (tc.tags && tc.tags.length > 0) {
        md += `- **Tags:** \`${tc.tags.join('`, `')}\`\n`;
      }
      if (tc.requirementRefs && tc.requirementRefs.length > 0) {
        md += `- **Traceable Requirements:** ${tc.requirementRefs.join(', ')}\n`;
      }
      md += `\n**Description:**  \n${tc.description || 'N/A'}\n\n`;
      md += `**Preconditions:**  \n${tc.preconditions || 'None specified'}\n\n`;

      if (tc.steps && tc.steps.length > 0) {
        md += `#### Test Steps:\n\n`;
        md += `| # | Action | Expected Result | Test Data |\n`;
        md += `| :-: | :--- | :--- | :--- |\n`;
        tc.steps.forEach((st) => {
          md += `| ${st.stepNumber} | ${st.action.replace(/\|/g, '\\|')} | ${st.expectedResult.replace(/\|/g, '\\|')} | ${(st.data || '-').replace(/\|/g, '\\|')} |\n`;
        });
        md += `\n`;
      } else {
        md += `*Single procedure verification without step sequence.*\n\n`;
      }
      md += `---\n\n`;
    });
  }

  md += `## 3. Formal Sign-Off\n\n`;
  md += `| Role | Name | Title | Date | Status |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  md += `| Lead QA Architect | QA Lead | Staff QA Architect | ${new Date().toLocaleDateString()} | Approved |\n`;
  md += `| Engineering Lead | Platform Lead | VP Platform & Eng | ${new Date().toLocaleDateString()} | Approved |\n`;
  md += `| Quality Director | Compliance Officer | Director of QA & Compliance | ${new Date().toLocaleDateString()} | Approved |\n\n`;
  md += `*Generated automatically by QAsgard.*\n`;

  const cleanName = `${project.key}_${suiteName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`;
  downloadText(md, cleanName, 'text/markdown;charset=utf-8');
  return cleanName;
}

/**
 * Export test suite / repository as PDF
 */
export function exportSuiteAsPdf(project: Project, suiteName: string, cases: TestCase[]): string {
  const sortedCases = sortTestCasesChronological(cases);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 16;

  // Header banner
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${project.name} - Test Specification`, 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  doc.text(
    `Scope: ${suiteName}   |   Project: [${project.key}]   |   Date: ${new Date().toLocaleDateString()}`,
    14,
    19
  );

  const total = sortedCases.length;
  const automated = sortedCases.filter((c) => c.automationStatus === 'automated').length;
  const blockers = sortedCases.filter(
    (c) => c.severity === 'blocker' || c.severity === 'critical'
  ).length;
  const highPriority = sortedCases.filter(
    (c) => c.priority === 'high' || c.priority === 'highest'
  ).length;

  doc.text(
    `Total Cases: ${total}   |   Automated: ${automated}   |   Critical/Blockers: ${blockers}`,
    14,
    24
  );

  currentY = 34;

  // KPI Summary Table
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Total Test Cases', 'Automated', 'Manual', 'Critical / Blocker', 'High Priority']],
    body: [
      [
        total.toString(),
        automated.toString(),
        (total - automated).toString(),
        blockers.toString(),
        highPriority.toString(),
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

  if (sortedCases.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No test cases found in selected suite scope.', 14, currentY + 6);
  } else {
    sortedCases.forEach((tc, idx) => {
      if (currentY > 235) {
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

      // Meta Table
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
            tc.suiteName || suiteName,
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

  // Footer on all pages
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

  const pdfBlob = doc.output('blob');
  const cleanName = `${project.key}_${suiteName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadBlob(pdfBlob, cleanName);
  return cleanName;
}

/**
 * Export single test case
 */
export function exportSingleTestCase(
  project: Project,
  tc: TestCase,
  format: 'json' | 'md' | 'csv'
): string {
  if (format === 'json') {
    const jsonStr = JSON.stringify(tc, null, 2);
    const filename = `${tc.key}_test_case.json`;
    downloadText(jsonStr, filename, 'application/json');
    return filename;
  } else if (format === 'csv') {
    return exportSuiteAsCsv(project, tc.suiteName, [tc]);
  } else {
    let md = `# [${tc.key}] ${tc.title}\n\n`;
    md += `**Project:** ${project.name} (${project.key})  \n`;
    md += `**Suite:** ${tc.suiteName}  \n`;
    md += `**Priority:** ${tc.priority?.toUpperCase()}  \n`;
    md += `**Severity:** ${tc.severity?.toUpperCase()}  \n`;
    md += `**Layer / Type:** ${tc.layer} / ${tc.type}  \n`;
    md += `**Automation:** ${tc.automationStatus}  \n`;
    md += `**Status:** ${tc.status}  \n\n`;
    md += `## Description\n${tc.description || 'None'}\n\n`;
    md += `## Preconditions\n${tc.preconditions || 'None'}\n\n`;
    md += `## Steps\n`;
    if (tc.steps && tc.steps.length > 0) {
      md += `| # | Action | Expected Result | Data |\n| :-: | :--- | :--- | :--- |\n`;
      tc.steps.forEach((s) => {
        md += `| ${s.stepNumber} | ${s.action} | ${s.expectedResult} | ${s.data || '-'} |\n`;
      });
    } else {
      md += `No sequential steps.\n`;
    }
    const filename = `${tc.key}_test_case.md`;
    downloadText(md, filename, 'text/markdown;charset=utf-8');
    return filename;
  }
}

/**
 * Export completed or active Test Run as a comprehensive PDF report
 */
export function exportTestRunAsPdf(
  project: Project,
  run: TestRun,
  testCases: TestCase[],
  defects?: Defect[],
  suites?: TestSuite[]
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 16;

  // Sort executions strictly by tree order
  const orderedCases = suites && suites.length > 0 ? sortTestCasesTreeOrder(testCases, suites) : testCases;
  const sortedExecutions = [...run.executions].sort((a, b) => {
    const idxA = orderedCases.findIndex((c) => c.id === a.testCaseId);
    const idxB = orderedCases.findIndex((c) => c.id === b.testCaseId);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.testCaseKey || '').localeCompare(b.testCaseKey || '', undefined, { numeric: true });
  });

  // Helper to thoroughly clean out any strange noise like "A4A4", "A 4 A 4", "B 5 A B", "1 J 3", Cyrillic "А4А4", or hex tokens
  const cleanNoteText = (str: string): string => {
    if (!str) return '';
    let c = str.trim();

    // 1. Un-space single spaced characters if someone or some tool typed e.g. "t e s t   c o m m e n t"
    if (/^[A-Za-zА-Яа-я0-9](?:\s[A-Za-zА-Яа-я0-9])+/.test(c)) {
      c = c.replace(/([A-Za-zА-Яа-я0-9])\s+(?=[A-Za-zА-Яа-я0-9])/g, '$1');
    }

    // 2. Remove all variations of A4A4 (Latin A and Cyrillic А \u0410, \u0430, with or without spaces)
    c = c.replace(/[Aa\u0410\u0430]\s*4\s*[Aa\u0410\u0430]\s*4/gi, '');
    c = c.replace(/[Aa\u0410\u0430]4[Aa\u0410\u0430]4/gi, '');
    c = c.replace(/\b[Aa\u0410\u0430]\s*4\b/gi, '');

    // 3. Remove artifacts like B 5 A B, 1 J 3, B5AB, 1J3
    c = c.replace(/B\s*5\s*A\s*B/gi, '');
    c = c.replace(/1\s*J\s*3/gi, '');
    c = c.replace(/\b(?:B5AB|1J3)\b/gi, '');

    // 4. Remove prefixes like "B5AB | Step 1", "Step 1: ..."
    c = c.replace(/^(?:[A-Za-zА-Яа-я0-9\s]{2,10}\s*\|\s*)?(?:Step\s*\d+:?\s*)?/i, '');
    c = c.replace(/^[A-Za-zА-Яа-я0-9\s]{2,8}\s*:\s*/i, '');

    // 5. Remove repetitive 2-3 char tokens like XYXY
    c = c.replace(/\b([A-Za-z0-9]{2,3})\1+\b/gi, '');

    // 6. Remove alphanumeric short codes / random hex hashes
    c = c.replace(/\b[A-Za-z0-9]{3,8}\b/g, (match) => {
      if (
        /\d/.test(match) &&
        /[A-Za-z]/.test(match) &&
        !/^(PAY|AUTH|SEC|DEF|FAIL|PASS|TEST|TC|STEP|RUN)[-_]?\d*$/i.test(match)
      ) {
        return '';
      }
      return match;
    });

    // 7. Clean punctuation & extra whitespace left over
    c = c
      .replace(/[\s|,;:-]+$/g, '')
      .replace(/^[\s|,;:-]+/g, '')
      .trim();
    c = c.replace(/\s{2,}/g, ' ');

    // 8. If remaining text is too short or doesn't have regular readable words, discard
    if (c.length < 3 || (!/[a-zа-я]{3,}/i.test(c) && !/\s/.test(c))) {
      return '';
    }
    return c;
  };

  // Helper to check if a defect is active (not resolved and not closed)
  const isDefectActive = (defectIdOrKey: string): boolean => {
    if (!defectIdOrKey) return false;
    const match = defects?.find((d) => d.id === defectIdOrKey || d.key === defectIdOrKey);
    if (match) {
      return match.status !== 'resolved' && match.status !== 'closed';
    }
    return true;
  };

  // Helper to extract defect keys associated with an execution
  const getExecutionDefectKeys = (exec: TestExecution): string[] => {
    const keys = new Set<string>();
    if (exec.defectIds && exec.defectIds.length > 0) {
      exec.defectIds.forEach((id: string) => {
        const match = defects?.find((d) => d.id === id || d.key === id);
        if (match?.key) {
          keys.add(match.key);
        } else if (id.toUpperCase().startsWith('DEF-')) {
          keys.add(id.toUpperCase());
        } else if (id.toLowerCase().startsWith('def-')) {
          keys.add(`DEF-${id.slice(4).toUpperCase()}`);
        } else {
          keys.add(id);
        }
      });
    }
    if (exec.stepResults) {
      exec.stepResults.forEach((s: StepExecutionResult) => {
        if (s.defectKey) keys.add(s.defectKey);
        if (s.defectIds) {
          s.defectIds.forEach((id: string) => {
            const match = defects?.find((d) => d.id === id || d.key === id);
            if (match?.key) keys.add(match.key);
            else if (id.toUpperCase().startsWith('DEF-')) keys.add(id.toUpperCase());
            else if (id.toLowerCase().startsWith('def-'))
              keys.add(`DEF-${id.slice(4).toUpperCase()}`);
            else keys.add(id);
          });
        }
      });
    }
    if (defects) {
      defects
        .filter(
          (d) => (d.runId === run.id || d.runKey === run.key) && d.testCaseId === exec.testCaseId
        )
        .forEach((d) => keys.add(d.key));
    }
    return Array.from(keys);
  };

  // Header banner
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${run.title} [${run.key}] - Test Run Report`, 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  // Requirement: Remove Environment from export completely
  doc.text(
    `Project: [${project.key}] ${project.name}   |   Status: ${run.status.toUpperCase()}`,
    14,
    19
  );
  doc.text(
    `Assigned / Executed By: ${run.assignedTo || 'QA Tester'}   |   Date: ${new Date(run.createdAt).toLocaleDateString()}`,
    14,
    24
  );

  currentY = 34;

  const total = run.executions.length;
  const passed = run.executions.filter((e) => e.status === 'passed').length;
  const failed = run.executions.filter((e) => e.status === 'failed').length;
  const blocked = run.executions.filter((e) => e.status === 'blocked').length;
  const skipped = run.executions.filter((e) => e.status === 'skipped').length;
  const untested = run.executions.filter((e) => e.status === 'untested').length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // KPI Summary Table
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Total Cases', 'Passed', 'Failed', 'Blocked', 'Skipped', 'Untested', 'Pass Rate']],
    body: [
      [
        total.toString(),
        passed.toString(),
        failed.toString(),
        blocked.toString(),
        skipped.toString(),
        untested.toString(),
        `${passRate}%`,
      ],
    ],
    headStyles: {
      fillColor: [67, 56, 202],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8.5,
      halign: 'center',
      textColor: [30, 41, 59],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Detailed Cases Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('Detailed Test Execution Results', 14, currentY);
  currentY += 4;

  const caseRows = sortedExecutions.map((exec, idx) => {
    const tc = testCases.find((c) => c.id === exec.testCaseId);
    const defectKeys = getExecutionDefectKeys(exec);
    const noteItems: string[] = [];

    // Requirement: When step/case is passed or defect is resolved, do NOT show bug numbers in export!
    if (exec.status !== 'passed' && defectKeys.length > 0) {
      defectKeys.forEach((key) => {
        if (isDefectActive(key)) {
          noteItems.push(`Bug number: ${key}`);
        }
      });
    }

    // Check if user entered step comments
    const hasStepComments = exec.stepResults?.some((s) => s.comment && s.comment.trim());
    if (exec.stepResults && exec.stepResults.length > 0) {
      exec.stepResults.forEach((s) => {
        if (s.comment && s.comment.trim()) {
          const clean = cleanNoteText(s.comment);
          const normalized = clean.toLowerCase().replace(/\s+/g, '');
          const alreadyAdded = noteItems.some(
            (item) => item.toLowerCase().replace(/\s+/g, '') === normalized
          );
          if (clean && !alreadyAdded) {
            noteItems.push(clean);
          }
        }
      });
    }

    // Only include failureReason if NO step comments exist, to prevent duplicated and corrupted lines
    if (!hasStepComments && exec.failureReason && exec.failureReason.trim()) {
      const clean = cleanNoteText(exec.failureReason);
      const normalized = clean.toLowerCase().replace(/\s+/g, '');
      const alreadyAdded = noteItems.some(
        (item) => item.toLowerCase().replace(/\s+/g, '') === normalized
      );
      if (
        clean &&
        !alreadyAdded &&
        !clean.includes('AssertionError') &&
        !clean.toLowerCase().includes('execution failed at step')
      ) {
        noteItems.push(clean);
      }
    }

    let notes = noteItems.length > 0 ? noteItems.join('\n') : '-';
    // Ensure long words do not break table layout
    notes = notes
      .split('\n')
      .map((line) =>
        line
          .split(' ')
          .map((w) => (w.length > 28 ? w.match(/.{1,28}/g)?.join(' ') || w : w))
          .join(' ')
      )
      .join('\n');

    return [
      (idx + 1).toString(),
      exec.testCaseKey,
      exec.testCaseTitle,
      exec.suiteName || tc?.suiteName || 'General',
      exec.status.toUpperCase(),
      notes,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    head: [['#', 'Key', 'Test Title', 'Suite', 'Result', 'Notes / Observations']],
    body: caseRows,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2.5,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
      5: { cellWidth: 52 }, // 8 + 22 + 50 + 30 + 20 + 52 = 182mm (exact A4 printable area)
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = data.cell.raw as string;
        if (val === 'PASSED') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (val === 'FAILED') {
          data.cell.styles.textColor = [239, 68, 68];
        } else if (val === 'BLOCKED') {
          data.cell.styles.textColor = [245, 158, 11];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Step-level Breakdown & Evidence directly under each step:
  const executionsWithStepsOrEvidence = sortedExecutions.filter((exec) => {
    const tc = testCases.find((c) => c.id === exec.testCaseId);
    const hasStepResults = exec.stepResults && exec.stepResults.length > 0;
    const hasStepAtts = tc?.steps?.some((s) => s.attachments && s.attachments.length > 0);
    const hasAttachments =
      (exec.attachments && exec.attachments.length > 0) ||
      exec.stepResults?.some((s) => s.attachments && s.attachments.length > 0) ||
      hasStepAtts;
    return hasStepResults || hasAttachments || (tc?.steps && tc.steps.length > 0);
  });

  if (executionsWithStepsOrEvidence.length > 0) {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 27, 75);
    doc.text('Step-by-Step Execution Evidence & Verification', 14, currentY);
    currentY += 6;

    for (const exec of executionsWithStepsOrEvidence) {
      const tc = testCases.find((c) => c.id === exec.testCaseId);
      const defectKeys = getExecutionDefectKeys(exec);
      // Filter out defects that are resolved or closed
      const activeDefectKeys = defectKeys.filter((k) => isDefectActive(k));

      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 20;
      }

      // Test Case Header Banner
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, currentY, pageWidth - 28, 7, 1.5, 1.5, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`[${exec.testCaseKey}] ${exec.testCaseTitle}`, 16, currentY + 4.8);

      const statusColor: [number, number, number] =
        exec.status === 'passed'
          ? [16, 185, 129]
          : exec.status === 'failed'
            ? [239, 68, 68]
            : [245, 158, 11];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(exec.status.toUpperCase(), pageWidth - 32, currentY + 4.8, { align: 'right' });

      currentY += 10;

      // Requirement: When test case is passed or defect is resolved, do NOT show bug numbers!
      // If test case is NOT passed and has active defects, display them ONE UNDER ANOTHER structured
      if (exec.status !== 'passed' && activeDefectKeys.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(225, 29, 72);
        for (const key of activeDefectKeys) {
          if (currentY > pageHeight - 25) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(`• Bug number: ${key}`, 18, currentY);
          currentY += 4.5;
        }
        currentY += 2;
      }

      // Iterate steps
      const stepsToRender =
        tc?.steps && tc.steps.length > 0
          ? tc.steps
          : (exec.stepResults || []).map((sr) => ({
              stepNumber: sr.stepNumber,
              action: `Step ${sr.stepNumber} execution`,
              expectedResult: '',
              data: '',
              notes: '',
              attachments: [],
            }));

      for (const step of stepsToRender) {
        const stepRes = exec.stepResults?.find((s) => s.stepNumber === step.stepNumber);
        const stepStatus = stepRes?.status || 'untested';
        const stepAttachments = [
          ...(step.attachments || []),
          ...(stepRes?.attachments || []),
        ];
        const rawStepDefects =
          stepRes?.defectIds || (stepRes?.defectKey ? [stepRes.defectKey] : []);
        const stepComment = cleanNoteText(stepRes?.comment || '');

        // Resolve defect keys and filter out resolved ones
        const activeStepDefects = rawStepDefects
          .map((d) => {
            const match = defects?.find((df) => df.id === d || df.key === d);
            return match?.key || (d.toUpperCase().startsWith('DEF-') ? d.toUpperCase() : d);
          })
          .filter((k) => isDefectActive(k));

        // Estimate vertical space required for this step to ensure nothing overlaps and page breaks cleanly
        const actionLines = doc.splitTextToSize(
          `Step ${step.stepNumber}: ${step.action}`,
          pageWidth - 55
        );
        const actionHeight = actionLines.length * 4;
        const defectsHeight = stepStatus !== 'passed' ? activeStepDefects.length * 4.5 : 0;
        const commentHeight = stepComment ? 7 : 0;
        const attachmentsHeight = stepAttachments.length > 0 ? stepAttachments.length * 64 : 0;
        const totalStepHeight =
          actionHeight + defectsHeight + commentHeight + attachmentsHeight + 8;

        // If not enough room for step header + content, start a clean new page
        if (currentY + Math.min(totalStepHeight, 55) > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        // Render Step Action with proper line wrapping
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(actionLines, 16, currentY);

        // Step status tag
        const sColor: [number, number, number] =
          stepStatus === 'passed'
            ? [16, 185, 129]
            : stepStatus === 'failed'
              ? [239, 68, 68]
              : stepStatus === 'blocked'
                ? [245, 158, 11]
                : [148, 163, 184];
        doc.setFontSize(7.5);
        doc.setTextColor(sColor[0], sColor[1], sColor[2]);
        doc.text(`[${stepStatus.toUpperCase()}]`, pageWidth - 32, currentY, { align: 'right' });
        currentY += actionHeight + 2;

        // Step expected result (if provided)
        if (step.expectedResult && step.expectedResult.trim()) {
          const expLines = doc.splitTextToSize(`Expected Result: ${step.expectedResult}`, pageWidth - 55);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 116, 139);
          doc.text(expLines, 18, currentY);
          currentY += expLines.length * 3.5 + 2;
        }

        // REQUIREMENT: Step authoring reference screenshots appear directly under EXPECTED RESULT
        const authoringAttachments = step.attachments || [];
        if (authoringAttachments.length > 0) {
          if (currentY > pageHeight - 55) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(79, 70, 229); // Indigo
          doc.text('Expected Step Reference Screenshot(s):', 20, currentY);
          currentY += 4.5;

          for (const att of authoringAttachments) {
            if (att.url && att.url.startsWith('data:image')) {
              try {
                const format = att.url.includes('image/png') ? 'PNG' : 'JPEG';
                const props = doc.getImageProperties(att.url);
                const maxW = 88;
                const maxH = 46;
                let renderW = maxW;
                let renderH = maxH;
                if (props && props.width > 0 && props.height > 0) {
                  const naturalAspect = props.width / props.height;
                  if (naturalAspect >= maxW / maxH) {
                    renderW = maxW;
                    renderH = Math.max(12, maxW / naturalAspect);
                  } else {
                    renderH = maxH;
                    renderW = Math.max(12, maxH * naturalAspect);
                  }
                }

                if (currentY + renderH + 10 > pageHeight - 15) {
                  doc.addPage();
                  currentY = 20;
                }

                doc.setDrawColor(199, 210, 254);
                doc.setFillColor(245, 247, 255);
                doc.roundedRect(20, currentY, renderW + 4, renderH + 4, 1.5, 1.5, 'FD');
                doc.addImage(att.url, format, 22, currentY + 2, renderW, renderH);
                currentY += renderH + 5.5;

                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                doc.text(`[Expected] ${att.name || 'expected_reference.png'} (${att.size || 'image'})`, 22, currentY);
                currentY += 5;
              } catch {
                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.text(`[Expected Reference] ${att.name}`, 22, currentY);
                currentY += 4.5;
              }
            }
          }
        }

        // Requirement: When step is passed or defect is resolved, do NOT show bug numbers!
        // Output each active defect ONE UNDER ANOTHER structured
        if (stepStatus !== 'passed' && activeStepDefects.length > 0) {
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(225, 29, 72);
          for (const d of activeStepDefects) {
            if (currentY > pageHeight - 25) {
              doc.addPage();
              currentY = 20;
            }
            doc.text(`• Bug number: ${d}`, 20, currentY);
            currentY += 4.2;
          }
          currentY += 1;
        }

        // Step Actual Observation / Result
        if (stepComment) {
          const commentLines = doc.splitTextToSize(`Actual Observation: ${stepComment}`, pageWidth - 55);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(commentLines, 20, currentY);
          currentY += commentLines.length * 3.5 + 2;
        }

        // REQUIREMENT: Run execution evidence screenshots appear directly under ACTUAL RESULT
        const runExecutionAttachments = stepRes?.attachments || [];
        if (runExecutionAttachments.length > 0) {
          if (currentY > pageHeight - 55) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(13, 148, 136); // Teal
          doc.text('Actual Execution Evidence (Captured during Test Run):', 20, currentY);
          currentY += 4.5;

          for (const att of runExecutionAttachments) {
            if (att.url && att.url.startsWith('data:image')) {
              try {
                const format = att.url.includes('image/png') ? 'PNG' : 'JPEG';
                const props = doc.getImageProperties(att.url);
                const maxW = 88;
                const maxH = 46;
                let renderW = maxW;
                let renderH = maxH;
                if (props && props.width > 0 && props.height > 0) {
                  const naturalAspect = props.width / props.height;
                  if (naturalAspect >= maxW / maxH) {
                    renderW = maxW;
                    renderH = Math.max(12, maxW / naturalAspect);
                  } else {
                    renderH = maxH;
                    renderW = Math.max(12, maxH * naturalAspect);
                  }
                }

                if (currentY + renderH + 10 > pageHeight - 15) {
                  doc.addPage();
                  currentY = 20;
                }

                doc.setDrawColor(204, 251, 241);
                doc.setFillColor(240, 253, 250);
                doc.roundedRect(20, currentY, renderW + 4, renderH + 4, 1.5, 1.5, 'FD');
                doc.addImage(att.url, format, 22, currentY + 2, renderW, renderH);
                currentY += renderH + 5.5;

                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(15, 118, 110);
                doc.text(`[Actual Evidence] ${att.name || 'run_screenshot.png'} (${att.size || 'image'})`, 22, currentY);
                currentY += 5;
              } catch {
                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.text(`[Actual Evidence] ${att.name}`, 22, currentY);
                currentY += 4.5;
              }
            } else {
              doc.setFontSize(7.5);
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(100, 116, 139);
              doc.text(`Attachment: ${att.name} (${att.size || 'file'})`, 20, currentY);
              currentY += 4.5;
            }
          }
        }

        // Step separator divider line
        currentY += 2;
        doc.setDrawColor(226, 232, 240);
        doc.line(16, currentY, pageWidth - 16, currentY);
        currentY += 4;
      }

      currentY += 4;
    }
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages}  •  ${run.key} Run Report  •  ${project.name}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  const pdfBlob = doc.output('blob');
  const cleanName = `${project.key}_${run.key}_Execution_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadBlob(pdfBlob, cleanName);
  return cleanName;
}

/**
 * Export complete repository (project, all suites, all test cases) as a clean JSON backup
 */
export function exportRepositoryAsJson(
  project: Project,
  suites: TestSuite[],
  cases: TestCase[]
): string {
  const sortedCases = sortTestCasesChronological(cases);
  const data = {
    version: '1.0',
    type: 'qasgard_repository_export',
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description || '',
    },
    statistics: {
      totalSuites: suites.length,
      totalCases: sortedCases.length,
      automatedCases: sortedCases.filter((c) => c.automationStatus === 'automated').length,
      manualCases: sortedCases.filter((c) => c.automationStatus === 'manual').length,
    },
    suites: suites.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      parentId: s.parentId || null,
    })),
    testCases: sortedCases.map((tc) => ({
      id: tc.id,
      key: tc.key,
      title: tc.title,
      description: tc.description || '',
      preconditions: tc.preconditions || '',
      suiteId: tc.suiteId,
      suiteName: tc.suiteName,
      priority: tc.priority,
      severity: tc.severity,
      behavior: tc.behavior,
      type: tc.type,
      layer: tc.layer,
      automationStatus: tc.automationStatus,
      status: tc.status,
      tags: tc.tags || [],
      steps: (tc.steps || []).map((st) => ({
        stepNumber: st.stepNumber,
        action: st.action,
        expectedResult: st.expectedResult,
        data: st.data || '',
      })),
      requirementRefs: tc.requirementRefs || [],
      attachments: tc.attachments || [],
      customFields: tc.customFields || [],
      createdAt: tc.createdAt,
      updatedAt: tc.updatedAt,
    })),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const filename = `${project.key}_repository_export_${new Date().toISOString().slice(0, 10)}.json`;
  downloadText(jsonStr, filename, 'application/json');
  return filename;
}

/**
 * Export entire project backup as JSON (all repositories, suites, test cases, test runs, defects, requirements)
 */
export function exportProjectAsJson(
  project: Project,
  repositories: TestRepository[],
  suites: TestSuite[],
  cases: TestCase[],
  testRuns?: TestRun[],
  defects?: Defect[],
  requirements?: Requirement[]
): string {
  const sortedCases = sortTestCasesChronological(cases);
  const data = {
    version: '1.0',
    type: 'qasgard_project_export',
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description || '',
      organizationId: project.organizationId,
      suiteCount: suites.length,
      caseCount: sortedCases.length,
      openBugsCount: defects ? defects.filter((d) => d.status === 'open' || d.status === 'in_progress').length : 0,
    },
    repositories: (repositories || []).map((r) => ({
      id: r.id,
      projectId: r.projectId,
      name: r.name,
      description: r.description || '',
      isDefault: r.isDefault,
      createdAt: r.createdAt,
    })),
    suites: suites.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      repositoryId: s.repositoryId,
      name: s.name,
      description: s.description || '',
      parentId: s.parentId || null,
      order: s.order,
      caseCount: getTestCasesForSuite(s.id, suites, sortedCases).length,
    })),
    testCases: sortedCases.map((tc) => ({
      id: tc.id,
      key: tc.key,
      projectId: tc.projectId,
      repositoryId: tc.repositoryId,
      suiteId: tc.suiteId,
      suiteName: tc.suiteName,
      title: tc.title,
      description: tc.description || '',
      preconditions: tc.preconditions || '',
      priority: tc.priority,
      severity: tc.severity,
      behavior: tc.behavior,
      type: tc.type,
      layer: tc.layer,
      automationStatus: tc.automationStatus,
      status: tc.status,
      tags: tc.tags || [],
      steps: (tc.steps || []).map((st) => ({
        stepNumber: st.stepNumber,
        action: st.action,
        expectedResult: st.expectedResult,
        data: st.data || '',
        attachments: st.attachments || [],
      })),
      requirementRefs: tc.requirementRefs || [],
      attachments: tc.attachments || [],
      customFields: tc.customFields || [],
      createdAt: tc.createdAt,
      updatedAt: tc.updatedAt,
    })),
    testRuns: (testRuns || []).map((tr) => ({
      id: tr.id,
      key: tr.key,
      projectId: tr.projectId,
      title: tr.title,
      description: tr.description || '',
      status: tr.status,
      createdAt: tr.createdAt,
      executions: tr.executions || [],
    })),
    defects: (defects || []).map((d) => ({
      id: d.id,
      key: d.key,
      projectId: d.projectId,
      title: d.title,
      description: d.description || '',
      status: d.status,
      severity: d.severity,
      priority: d.priority,
      runId: d.runId,
      testCaseId: d.testCaseId,
      createdAt: d.createdAt,
    })),
    requirements: requirements || [],
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const filename = `${project.key}_full_project_backup_${new Date().toISOString().slice(0, 10)}.json`;
  downloadText(jsonStr, filename, 'application/json');
  return filename;
}
