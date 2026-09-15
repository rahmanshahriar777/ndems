'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { useAiCompletion } from '../../../hooks/use-ai-completion';
import { Copy, Check, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

interface AIModelOption {
  id: string;
  name: string;
  contextWindow: string;
  modelKey: string;
}

const AI_MODELS: AIModelOption[] = [
  {
    id: 'gemini-1.5-flash',
    name: 'Google Gemini 1.5 Flash',
    contextWindow: '1,000,000 tokens',
    modelKey: 'gemini-1.5-flash',
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B Versatile (Groq)',
    contextWindow: '128,000 tokens',
    modelKey: 'llama-3.3-70b-versatile',
  },
];

const SUGGESTIONS = [
  'Summarize standard company annual leave carryover and accrual rules',
  'Draft formal email approving employee remote work arrangement request',
  'Generate 30-60-90 day onboarding checklist for new department hires',
  'Draft structured performance review feedback focusing on leadership growth',
];

export default function AIAssistantPage() {
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id);
  const [prompt, setPrompt] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const { generate, data, loading, error, reset } = useAiCompletion();

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    const currentModel = AI_MODELS.find((m) => m.id === selectedModel);
    await generate({
      prompt: trimmed,
      model: currentModel?.modelKey,
    });
  };

  const handleCopy = () => {
    if (!data?.content) return;
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectSuggestion = (text: string) => {
    setPrompt(text);
  };

  return (
    <DashboardLayout title="AI Assistant">
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Assistant</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise workplace intelligence and task automation for personnel operations.
          </p>
        </div>

        {/* 1. AI Model Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Select AI Model
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {AI_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-600 ring-1 ring-indigo-600 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{model.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{model.contextWindow}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Suggestion Tips (Unobtrusive) */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Suggested Prompts
          </label>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/20 transition text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Prompt Input Area */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <label htmlFor="prompt-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Prompt
          </label>
          <textarea
            id="prompt-input"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type or paste your workplace task, document drafting prompt, or policy inquiry here..."
            className="w-full text-sm rounded-xl p-4 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition placeholder:text-slate-400 text-slate-800 resize-y leading-relaxed"
            disabled={loading}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">
              {prompt.length} characters
            </span>

            <div className="flex items-center gap-2">
              {data && (
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('');
                    reset();
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-xs ${
                  !prompt.trim() || loading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert if Failed */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <span>{error.message}</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:underline ml-3"
            >
              <RotateCcw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 4. Result Output Area */}
        {data && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Generated Result
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Response</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {data.content}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
