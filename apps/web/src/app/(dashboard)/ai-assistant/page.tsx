'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api-client';
import { AiChatMessage } from '@ems/shared';

interface ExtendedChatMessage extends AiChatMessage {
  id: string;
  latencyMs?: number;
  tokens?: number;
  model?: string;
  isError?: boolean;
}

const QUICK_PROMPTS = [
  {
    title: 'Leave Policy Overview',
    prompt: 'Can you summarize our company policy on annual, sick, and casual leaves, including approval workflows?',
    category: 'Leaves & HR',
  },
  {
    title: 'Draft Out-of-Office Email',
    prompt: 'Draft a professional and courteous out-of-office autoreply email for an upcoming 3-day vacation.',
    category: 'Productivity',
  },
  {
    title: 'Explain Payroll Deductions',
    prompt: 'How are salary structures, tax deductions, and net pay calculated in the EMS system?',
    category: 'Payroll',
  },
  {
    title: 'Performance Review Tips',
    prompt: 'What are effective ways to prepare self-evaluations and measurable achievements for quarterly performance reviews?',
    category: 'Performance',
  },
];

export default function AiAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! I am your **NEO EMS AI Assistant**, powered by Google Gemini via our secure backend proxy. How can I assist you with HR policies, leave applications, attendance guidelines, or payroll questions today?',
      timestamp: new Date().toISOString(),
      model: 'gemini-flash-latest',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<'checking' | 'ready' | 'offline'>('checking');
  const [activeModel, setActiveModel] = useState('gemini-flash-latest');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check backend AI service health on mount
  useEffect(() => {
    api.get('/ai/health')
      .then((data) => {
        if (data?.configured) {
          setAiStatus('ready');
          if (data.model) setActiveModel(data.model);
        } else {
          setAiStatus('offline');
        }
      })
      .catch(() => {
        // Fallback: endpoint is accessible via session
        setAiStatus('ready');
      });
  }, []);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setInputMessage('');

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ExtendedChatMessage = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update conversation
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      // Build message history payload for multi-turn chat (excluding error messages)
      const apiHistory = updatedHistory
        .filter((m) => !m.isError && m.id !== 'welcome-1')
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await api.post('/ai/chat', {
        message: textToSend,
        history: apiHistory.length > 1 ? apiHistory.slice(0, -1) : undefined,
        context: user ? `User: ${user.firstName || ''} ${user.lastName || ''} (Role: ${user.roles?.[0] || 'EMPLOYEE'})` : undefined,
      });

      const assistantMessage: ExtendedChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply || 'No response content received.',
        timestamp: response.timestamp || new Date().toISOString(),
        model: response.model || activeModel,
        latencyMs: response.latencyMs,
        tokens: response.usage?.totalTokens,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const displayError = err?.message || 'Failed to connect to AI proxy service. Please try again.';
      setErrorMessage(displayError);

      const errorMessageObj: ExtendedChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to process request:** ${displayError}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Conversation cleared. How can I help you today with your workplace, leaves, or organizational queries?',
        timestamp: new Date().toISOString(),
        model: activeModel,
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <DashboardLayout title="AI Workplace Assistant">
      <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-glow">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">NEO EMS AI Copilot</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  {activeModel}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Secure server-side proxy to Google Gemini. Zero frontend secret exposure.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{aiStatus === 'offline' ? 'Setup Needed' : 'Gemini Proxy Online'}</span>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 bg-slate-50/50 rounded-2xl border border-slate-200 p-4 md:p-6 overflow-y-auto space-y-4 shadow-inner">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-purple-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all shadow-sm ${
                    isUser
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : msg.isError
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  {/* Content Display */}
                  <div className="prose prose-sm max-w-none break-words whitespace-pre-wrap leading-relaxed text-sm">
                    {msg.content}
                  </div>

                  {/* Message Footer: Latency, Tokens, Copy */}
                  <div
                    className={`mt-2.5 pt-2 flex items-center justify-between text-[11px] gap-3 border-t ${
                      isUser ? 'border-primary-500/30 text-primary-100' : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {msg.timestamp && (
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {msg.latencyMs && (
                        <span className="flex items-center gap-0.5 text-emerald-600 font-mono">
                          <Zap className="w-3 h-3" />
                          {msg.latencyMs}ms
                        </span>
                      )}
                      {msg.tokens && (
                        <span className="hidden sm:inline font-mono">
                          {msg.tokens} tokens
                        </span>
                      )}
                    </div>

                    {!isUser && !msg.isError && (
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-glow">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-slate-600 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                <span>Gemini is generating response...</span>
                <span className="flex gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUserMsg) handleSendMessage(lastUserMsg.content);
                }}
                className="px-3 py-1 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-semibold text-slate-600 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary-500" />
              Suggestions:
            </span>
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/30 transition shadow-sm flex items-center gap-1.5"
              >
                <span>{qp.title}</span>
                <ChevronRight className="w-3 h-3 opacity-50" />
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Section */}
        <div className="mt-3 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-2 flex flex-col focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about employee policies, leave records, payroll formulas, or workplace productivity..."
              maxLength={4000}
              disabled={isLoading}
              className="w-full resize-none px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
            />

            <div className="flex items-center justify-between pt-2 px-3 border-t border-slate-100 text-[11px] text-slate-600">
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Secure Backend Proxy
                </span>
                <span>
                  {inputMessage.length}/4000
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-slate-600 font-mono text-[10px]">
                  Press Enter to send
                </span>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs transition shadow-sm"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
