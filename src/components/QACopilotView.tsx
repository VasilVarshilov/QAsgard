import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  RefreshCw,
  Copy,
  Check,
  PlusCircle,
  FileText,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Cpu,
  Trash2,
  Sliders,
  ChevronDown,
  CornerDownLeft,
  HelpCircle,
  BookOpen,
  Terminal,
} from 'lucide-react';
import { Project, TestCase, TestSuite, Defect, User } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

interface QACopilotViewProps {
  project: Project;
  testSuites: TestSuite[];
  testCases: TestCase[];
  defects?: Defect[];
  currentUser?: User;
  onAddTestCase?: (testCase: Partial<TestCase>) => void;
}

export const QACopilotView: React.FC<QACopilotViewProps> = ({
  project,
  testSuites,
  testCases,
  defects = [],
  currentUser,
  onAddTestCase,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('all');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial welcome message from QA Copilot
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      role: 'model',
      text: `👋 Greetings! I am **QA Copilot**, your senior AI QA Architect and Testing Consultant with 20+ years of software quality engineering experience.

I have synchronized with **${project.name}** (${project.key}):
- **Repository Scope**: ${testCases.length} active test cases across ${testSuites.length} test suites.
- **Coverage Baseline**: PCI-DSS v4.0 Tokenization, 3DS 2.0 Strong Customer Authentication, and Idempotency protocols.
- **Defects Monitored**: ${defects.length} logged defects.

### How I Can Assist You Right Now:
- **Chat with Test Suite**: Ask questions about test distribution, coverage blind spots, or edge cases.
- **Smart QA Review**: Submit any test case or procedure for a 5-point quality audit (What is good, missing, improvable, additional tests, and risks).
- **Generate Test Cases**: Provide a user story or checklist to produce complete test cases with measurable expected results.
- **Negative & Boundary Scenarios**: Uncover fault-injection, timeout, and authorization failure tests.
- **Automation Prioritization**: Receive ranked ROI recommendations for Playwright and API suites.

What would you like to review or generate?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const activeSuite =
    selectedSuiteId === 'all' ? null : testSuites.find((s) => s.id === selectedSuiteId);

  // Quick Prompt Chips
  const quickPrompts = [
    {
      label: 'Generate Negative Tests',
      prompt:
        'Generate 3 mission-critical negative and boundary test cases for this suite with measurable expected results.',
    },
    {
      label: 'Smart QA Review',
      prompt:
        'Perform a comprehensive 5-point QA review on the active test suite: What is good? What is missing? What should be improved? Additional tests recommended? Remaining risks?',
    },
    {
      label: 'What Should be Automated First?',
      prompt:
        'Analyze all test cases in this project and recommend top automation candidates ranked by ROI, regression frequency, and business value.',
    },
    {
      label: 'Coverage & Missing Scenarios',
      prompt:
        'Which functional scenarios, negative flows, or edge cases are currently missing from this test suite?',
    },
    {
      label: 'Build Smoke Suite',
      prompt: 'Build an optimized 5-case Smoke Test pack for release gatekeeper validation.',
    },
    {
      label: 'Generate Test Data',
      prompt:
        'Generate realistic test datasets (valid and boundary values) for payment checkout simulation.',
    },
  ];

  const handleSendMessage = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const contextPayload = {
        organization: { name: project.name || 'Workspace' },
        project: { name: project.name, key: project.key, id: project.id },
        activeSuite: activeSuite
          ? { id: activeSuite.id, name: activeSuite.name, description: activeSuite.description }
          : null,
        activeRequirement: activeSuite?.description || '',
        totalCases: testCases.length,
        suitesCount: testSuites.length,
        defectsCount: defects.length,
        testCasesSample: testCases.slice(0, 15).map((tc) => ({
          key: tc.key,
          title: tc.title,
          suite: tc.suiteName,
          priority: tc.priority,
          severity: tc.severity,
          stepsCount: tc.steps?.length || 0,
        })),
      };

      const res = await fetch('/api/ai/qa-copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          model: selectedModel,
          context: contextPayload,
        }),
      });

      const data = await res.json();

      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.reply || 'I have completed the analysis for your testing repository.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || selectedModel,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (error) {
      console.error('QA Copilot error:', error);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Apologies, I encountered an issue analyzing the repository. Please verify your connection or retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Clear entire conversation history with QA Copilot?')) {
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'model',
          text: `Conversation reset. I am ready to analyze **${project.name}** or generate new QA assets.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
        },
      ]);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Banner / Studio Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">QA Copilot</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Bot className="w-3 h-3" />
                Senior QA Architect
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Context-Aware AI Assistant for Test Authoring, Review, Coverage Gap Detection &amp;
              Automation
            </p>
          </div>
        </div>

        {/* Model & Suite Context Selectors */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Active Suite Context */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <select
              value={selectedSuiteId}
              onChange={(e) => setSelectedSuiteId(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Suites ({testCases.length} Cases)</option>
              {testSuites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({testCases.filter((c) => c.suiteId === s.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">
                gemini-3.1-pro-preview (Deep Reasoning)
              </option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isModel ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-2xs ${
                    isModel
                      ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500'
                      : 'bg-slate-800 dark:bg-slate-700'
                  }`}
                >
                  {isModel ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-xs space-y-2 leading-relaxed shadow-2xs ${
                    isModel
                      ? 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {/* Message Header */}
                  <div
                    className={`flex items-center justify-between gap-3 text-[10px] pb-1 border-b ${
                      isModel
                        ? 'border-slate-200 dark:border-slate-700 text-slate-400'
                        : 'border-indigo-500 text-indigo-200'
                    }`}
                  >
                    <span className="font-semibold">{isModel ? 'QA Copilot' : 'You'}</span>
                    <div className="flex items-center gap-2">
                      {msg.modelUsed && (
                        <span className="font-mono text-[9px]">[{msg.modelUsed}]</span>
                      )}
                      <span>{msg.timestamp}</span>
                      {isModel && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer ml-1"
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>
                  QA Copilot is analyzing repository context and crafting recommendation...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Carousel */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            Quick Prompts:
          </span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Composer */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask QA Copilot about ${activeSuite ? activeSuite.name : 'any test suite, requirement, or execution'}... (Shift+Enter for newline)`}
              rows={2}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none px-2 py-1 max-h-32"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs"
              title="Send message to QA Copilot"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-2">
            <span>Powered by Gemini 3.5 Flash &amp; Gemini 3.1 Pro • Context Grounded</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
