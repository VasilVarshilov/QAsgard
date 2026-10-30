import React, { useState } from 'react';
import { Copy, Check, Table as TableIcon, Code2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isDark?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockId(id);
    setTimeout(() => setCopiedBlockId(null), 2500);
  };

  if (!content) return null;

  // Split content into blocks: code blocks, tables, headings, lists, paragraphs
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentTableLines: string[] = [];
  let currentCodeLines: string[] = [];
  let currentCodeLang = '';
  let inCodeBlock = false;

  const flushTable = (index: number) => {
    if (currentTableLines.length === 0) return;
    const tableId = `tbl-${index}`;
    const rawTableText = currentTableLines.join('\n');

    // Parse header and rows
    const headerLine = currentTableLines[0];
    const dataRows = currentTableLines.slice(2); // Skip separator line | :--- | :--- |

    const parseCells = (line: string) => {
      const trimmed = line.trim();
      const cells = trimmed.split('|');
      // If starts with | and ends with |, drop empty head and tail
      if (trimmed.startsWith('|')) cells.shift();
      if (trimmed.endsWith('|')) cells.pop();
      return cells.map((c) => c.trim());
    };

    const headers = parseCells(headerLine);

    blocks.push(
      <div key={tableId} className="my-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 shadow-xs">
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <TableIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Test Specification Table</span>
          </span>
          <button
            type="button"
            onClick={() => copySnippet(rawTableText, tableId)}
            className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer font-semibold"
            title="Copy table to clipboard"
          >
            {copiedBlockId === tableId ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Table</span>
              </>
            )}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3.5 py-2.5 whitespace-nowrap first:pl-4 last:pr-4">
                    {renderInlineFormatted(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {dataRows.map((rowLine, rIdx) => {
                const cells = parseCells(rowLine);
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                  >
                    {cells.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 first:pl-4 last:pr-4 align-top leading-relaxed"
                      >
                        {renderInlineFormatted(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
    currentTableLines = [];
  };

  const flushCode = (index: number) => {
    if (currentCodeLines.length === 0) return;
    const codeId = `code-${index}`;
    const rawCodeText = currentCodeLines.join('\n');

    blocks.push(
      <div key={codeId} className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#0f1422] shadow-sm">
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161c2e] border-b border-slate-800 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-mono text-indigo-400 font-bold uppercase tracking-wider">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            {currentCodeLang || 'typescript'}
          </span>
          <button
            type="button"
            onClick={() => copySnippet(rawCodeText, codeId)}
            className="flex items-center gap-1 hover:text-white cursor-pointer text-slate-400 font-semibold"
            title="Copy script"
          >
            {copiedBlockId === codeId ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed">
          <code>{rawCodeText}</code>
        </pre>
      </div>
    );
    currentCodeLines = [];
    currentCodeLang = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block check
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCode(i);
        inCodeBlock = false;
      } else {
        if (currentTableLines.length > 0) flushTable(i);
        inCodeBlock = true;
        currentCodeLang = trimmed.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeLines.push(line);
      continue;
    }

    // Markdown Table Check
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      currentTableLines.push(trimmed);
      continue;
    } else if (currentTableLines.length > 0) {
      flushTable(i);
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace('### ', '');
      blocks.push(
        <h3 key={i} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
          <span>{renderInlineFormatted(headingText)}</span>
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const headingText = trimmed.replace('## ', '');
      blocks.push(
        <h2 key={i} className="text-base font-extrabold text-slate-900 dark:text-white mt-5 mb-2.5 pb-1.5 border-b-2 border-indigo-500/40">
          {renderInlineFormatted(headingText)}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      const headingText = trimmed.replace('# ', '');
      blocks.push(
        <h1 key={i} className="text-lg font-black text-slate-900 dark:text-white mt-5 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          {renderInlineFormatted(headingText)}
        </h1>
      );
      continue;
    }

    // Divider line
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push(
        <hr key={i} className="my-4 border-t border-slate-200 dark:border-slate-700/80" />
      );
      continue;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      blocks.push(
        <div key={i} className="flex items-start gap-2.5 my-1 text-slate-700 dark:text-slate-300 leading-relaxed pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 shrink-0" />
          <div className="flex-1">{renderInlineFormatted(itemText)}</div>
        </div>
      );
      continue;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      blocks.push(
        <div key={i} className="flex items-start gap-2 my-1 text-slate-700 dark:text-slate-300 leading-relaxed pl-1">
          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/40 shrink-0">
            {numMatch[1]}
          </span>
          <div className="flex-1">{renderInlineFormatted(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Empty lines
    if (!trimmed) {
      blocks.push(<div key={i} className="h-1.5" />);
      continue;
    }

    // Standard paragraph
    blocks.push(
      <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed my-1">
        {renderInlineFormatted(trimmed)}
      </p>
    );
  }

  // Flush remaining table or code if any at the end
  if (currentTableLines.length > 0) flushTable(lines.length);
  if (currentCodeLines.length > 0) flushCode(lines.length);

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
};

/**
 * Parses inline formatting: **bold**, `code`, [TAGS], etc.
 */
function renderInlineFormatted(text: string): React.ReactNode {
  if (!text) return null;

  // Split by inline code `...`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={pIdx}
          className="px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700"
        >
          {codeContent}
        </code>
      );
    }

    // Process bold **...**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={pIdx}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            const boldText = bPart.slice(2, -2);
            return (
              <strong key={bIdx} className="font-bold text-slate-900 dark:text-white">
                {renderBadges(boldText)}
              </strong>
            );
          }
          return renderBadges(bPart);
        })}
      </span>
    );
  });
}

function renderBadges(text: string): React.ReactNode {
  // Highlight test case keys like [TC-101], [PAY-01]
  const badgeRegex = /(\[[A-Za-z0-9_-]+\])/g;
  const parts = text.split(badgeRegex);

  if (parts.length === 1) return text;

  return parts.map((seg, idx) => {
    if (seg.startsWith('[') && seg.endsWith(']')) {
      const key = seg.slice(1, -1);
      const isNeg = key.includes('NEG') || key.includes('BUG');
      return (
        <span
          key={idx}
          className={`inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[10px] font-mono font-bold ${
            isNeg
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
          }`}
        >
          {key}
        </span>
      );
    }
    return seg;
  });
}
