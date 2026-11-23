import React, { useState } from 'react';
import { useIDEStore } from '../store/ideStore';
import { Check, X, CheckCheck, XCircle, FileCode, ShieldAlert, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { sanitizeCodeContent, cleanFilePath } from '../services/multiFileParser';

export default function DiffViewer() {
  const { pendingDiffs, resolveDiff, acceptAllDiffs, rejectAllDiffs, setActiveTab } = useIDEStore();
  const [selectedDiffId, setSelectedDiffId] = useState(pendingDiffs[0]?.id || null);

  if (!pendingDiffs || pendingDiffs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-3.5rem)] bg-white p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <FileCode className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No Pending Code Changes</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          When AI agents write or update files, file-by-file diffs and security reviews will appear here for your approval.
        </p>
        <button
          onClick={() => setActiveTab('chat')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition"
        >
          Return to Chat
        </button>
      </div>
    );
  }

  const activeDiff = pendingDiffs.find((d) => d.id === selectedDiffId) || pendingDiffs[0];

  // Simple line-by-line diff calculation
  const cleanOld = sanitizeCodeContent(activeDiff.oldContent || '');
  const cleanNew = sanitizeCodeContent(activeDiff.newContent || '');
  const oldLines = cleanOld.split('\n');
  const newLines = cleanNew.split('\n');

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-white max-w-6xl mx-auto w-full select-none">
      {/* Top Action Bar */}
      <div className="h-14 border-b border-gray-200 px-4 flex items-center justify-between bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-gray-900">Cursor-Style Code Review</h2>
            <p className="text-[10px] text-gray-500 font-mono">
              {pendingDiffs.length} file change{pendingDiffs.length > 1 ? 's' : ''} awaiting approval
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={rejectAllDiffs}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject All</span>
          </button>
          <button
            onClick={() => {
              acceptAllDiffs();
              setActiveTab('preview');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Accept All & Run</span>
          </button>
        </div>
      </div>

      {/* Main Content: Files List on Left, Diff on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tabs Sidebar */}
        <div className="w-48 sm:w-64 border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Modified Files
          </div>
          {pendingDiffs.map((diff) => (
            <button
              key={diff.id}
              onClick={() => setSelectedDiffId(diff.id)}
              className={`flex items-center justify-between p-2.5 text-xs text-left transition border-l-2 ${
                activeDiff.id === diff.id
                  ? 'bg-blue-50/70 border-blue-600 text-blue-900 font-medium'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate font-mono">{diff.path}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Diff Inspection View */}
        <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
          {/* File Header */}
          <div className="h-10 bg-slate-950 px-4 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-blue-400">{activeDiff.path}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => resolveDiff(activeDiff.id, false)}
                className="px-2.5 py-1 rounded bg-red-900/40 text-red-400 hover:bg-red-900/60 transition cursor-pointer"
              >
                Reject File
              </button>
              <button
                onClick={() => {
                  resolveDiff(activeDiff.id, true);
                  setActiveTab('preview');
                }}
                className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                Accept File
              </button>
            </div>
          </div>

          {/* Code Diff Display */}
          <div className="flex-1 overflow-auto font-mono text-xs p-3 space-y-0.5">
            {newLines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 py-0.5 px-2 rounded bg-emerald-950/20 text-emerald-300"
              >
                <span className="text-slate-600 select-none w-8 text-right shrink-0">{idx + 1}</span>
                <span className="text-emerald-500 select-none shrink-0">+</span>
                <span className="whitespace-pre-wrap break-all">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
