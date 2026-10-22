import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Printer,
  Search,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Tag,
} from 'lucide-react';
import { PRD_METADATA, PRD_SECTIONS, PRDSection } from '../data/prdDocument';

export const PRDViewer: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState(PRD_SECTIONS[0].id);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeSection = PRD_SECTIONS.find((s) => s.id === activeSectionId) || PRD_SECTIONS[0];

  const fullMarkdown = `# ${PRD_METADATA.documentTitle}
**Version**: ${PRD_METADATA.version} | **Author**: ${PRD_METADATA.author} | **Status**: ${PRD_METADATA.status}
**Date**: ${PRD_METADATA.date} | **Target Release**: ${PRD_METADATA.targetRelease}

---

${PRD_SECTIONS.map((s) => `## ${s.title}\n\n${s.content}\n\n---`).join('\n\n')}
`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const payload = {
      metadata: PRD_METADATA,
      sections: PRD_SECTIONS,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QAsgard_PRD_Spec_${PRD_METADATA.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSections = PRD_SECTIONS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Table of Contents Sidebar */}
      <aside className="w-72 sm:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              PRD Table of Contents
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specification..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {filteredSections.map((sec) => {
            const isSelected = sec.id === activeSection.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-violet-50 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200 font-bold border border-violet-200 dark:border-violet-800 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span className="truncate pr-2">{sec.title}</span>
                {sec.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                      isSelected
                        ? 'bg-violet-200 dark:bg-violet-900 text-violet-800 dark:text-violet-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Document Metadata Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Author:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Senior Product Manager
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Approved for MVP
            </span>
          </div>
          <div className="flex justify-between">
            <span>Version:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              {PRD_METADATA.version}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Document Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Document Action Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50 rounded">
              SPEC v1.0
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
              {PRD_METADATA.documentTitle}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy entire document in Markdown format"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied Full PRD!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export as structured JSON specification"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Print document"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Reader Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-6 print:p-0">
          <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50">
                {activeSection.badge || 'Specification Section'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • QAsgard • Where Quality Rules
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeSection.title}
            </h1>
          </div>

          {/* Formatted Markdown Content Render */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <MarkdownRenderer content={activeSection.content} />
          </div>

          {/* Section Navigation Footer */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {PRD_SECTIONS.findIndex((s) => s.id === activeSection.id) > 0 ? (
              <button
                onClick={() => {
                  const idx = PRD_SECTIONS.findIndex((s) => s.id === activeSection.id);
                  setActiveSectionId(PRD_SECTIONS[idx - 1].id);
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                &larr; Previous Section
              </button>
            ) : (
              <div />
            )}

            {PRD_SECTIONS.findIndex((s) => s.id === activeSection.id) < PRD_SECTIONS.length - 1 && (
              <button
                onClick={() => {
                  const idx = PRD_SECTIONS.findIndex((s) => s.id === activeSection.id);
                  setActiveSectionId(PRD_SECTIONS[idx + 1].id);
                }}
                className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-300 flex items-center gap-1 cursor-pointer"
              >
                Next Section &rarr;
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Clean Markdown renderer for headers, tables, bold, lists, and callouts
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const dataRows = tableRows.slice(2); // Skip separator row
      elements.push(
        <div
          key={`table-${key}`}
          className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="py-2.5 px-3 whitespace-nowrap">
                    {h.replace(/\*\*/g, '').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {dataRows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  {r.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2 px-3 align-top text-slate-800 dark:text-slate-200"
                    >
                      {renderInlineFormatting(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">
          {trimmed.replace('### ', '')}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={idx} className="text-sm font-bold text-indigo-950 dark:text-indigo-300 mt-4 mb-1">
          {trimmed.replace('#### ', '')}
        </h4>
      );
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={idx}
          className="border-l-4 border-violet-500 bg-violet-50/60 dark:bg-violet-950/40 p-3 my-3 rounded-r-lg italic text-slate-800 dark:text-slate-200"
        >
          {trimmed.replace('> ', '')}
        </blockquote>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={idx} className="ml-4 list-disc my-1 text-slate-700 dark:text-slate-300">
          {renderInlineFormatting(trimmed.slice(2))}
        </li>
      );
    } else if (trimmed.startsWith('```')) {
      // Code blocks
      elements.push(
        <pre
          key={idx}
          className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto border border-slate-800"
        >
          <code>{trimmed.replace(/```[a-z]*/g, '')}</code>
        </pre>
      );
    } else if (trimmed === '---') {
      elements.push(<hr key={idx} className="my-6 border-slate-200 dark:border-slate-800" />);
    } else if (trimmed.length > 0) {
      elements.push(
        <p key={idx} className="my-2 leading-relaxed text-slate-700 dark:text-slate-300">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    }
  });

  if (inTable) {
    flushTable(9999);
  }

  return <div>{elements}</div>;
}

function renderInlineFormatting(text: string) {
  // Simple regex for bold, inline code, and backticks
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono text-indigo-700 dark:text-indigo-400 rounded text-[11px] border border-slate-200 dark:border-slate-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
