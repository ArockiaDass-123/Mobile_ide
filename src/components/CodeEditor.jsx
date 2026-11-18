import React, { useState } from 'react';
import { useIDEStore } from '../store/ideStore';
import { Play, Copy, Check, Terminal as TerminalIcon, Code as CodeIcon, ChevronUp, ChevronDown } from 'lucide-react';
import MobileCodeMirror from './MobileCodeMirror';
import IntegratedTerminal from './IntegratedTerminal';

export default function CodeEditor() {
  const { files, activeFile, setActiveFile, updateFileContent, setActiveTab } = useIDEStore();
  const [copied, setCopied] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(180);

  const fileKeys = Object.keys(files);
  const currentContent = files[activeFile]?.content || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const insertSymbol = (sym) => {
    updateFileContent(activeFile, currentContent + sym);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-slate-900 text-slate-100 max-w-6xl mx-auto w-full overflow-hidden">
      {/* File Tabs & Controls */}
      <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto px-2 py-1 gap-1 shrink-0">
        {fileKeys.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFile(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition shrink-0 cursor-pointer ${
              activeFile === f
                ? 'bg-slate-800 text-blue-400 font-medium border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.split('/').pop()}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 shrink-0 pr-1">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition cursor-pointer ${
              showTerminal ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Terminal"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Terminal</span>
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium cursor-pointer shadow-xs active:scale-95 transition"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Preview</span>
          </button>
        </div>
      </div>

      {/* CodeMirror 6 Mobile-Optimized Syntax Editor */}
      <div className="flex-1 relative overflow-hidden flex flex-col min-h-[140px]">
        {activeFile ? (
          <MobileCodeMirror
            filePath={activeFile}
            content={currentContent}
            onChange={(val) => updateFileContent(activeFile, val)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            No active file selected. Choose a file from the Files tab.
          </div>
        )}
      </div>

      {/* Android Mobile Touch Symbol Bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-2 py-1 flex items-center gap-1.5 overflow-x-auto text-xs font-mono text-slate-300 shrink-0">
        <span className="text-[10px] text-slate-500 uppercase font-sans mr-1">Quick:</span>
        {['{', '}', '(', ')', '<', '>', '/', ';', '=', '=>', '"', "'", '[', ']', '$'].map((sym) => (
          <button
            key={sym}
            onClick={() => insertSymbol(sym)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded text-slate-200 transition cursor-pointer"
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Interactive VS Code Style Integrated Terminal */}
      {showTerminal && (
        <div 
          style={{ height: `${terminalHeight}px` }} 
          className="border-t border-slate-800 bg-[#090d16] flex flex-col shrink-0 select-text transition-all"
        >
          <div className="h-7 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 text-[11px] text-slate-400 select-none">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <TerminalIcon className="w-3 h-3 text-blue-400" /> TERMINAL
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">bash (interactive)</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setTerminalHeight(h => h === 180 ? 280 : 180)}
                className="p-1 hover:text-white"
                title="Resize terminal"
              >
                {terminalHeight === 180 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setShowTerminal(false)}
                className="p-1 hover:text-white text-xs font-bold"
                title="Close terminal"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <IntegratedTerminal onRunPreview={() => setActiveTab('preview')} />
          </div>
        </div>
      )}
    </div>
  );
}

