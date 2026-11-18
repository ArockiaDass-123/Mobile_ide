import React from 'react';
import { useIDEStore } from '../store/ideStore';
import { Play, Copy, Check, FilePlus } from 'lucide-react';
import MobileCodeMirror from './MobileCodeMirror';

export default function CodeEditor() {
  const { files, activeFile, setActiveFile, updateFileContent, setActiveTab } = useIDEStore();
  const [copied, setCopied] = React.useState(false);

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
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-slate-900 text-slate-100 max-w-5xl mx-auto w-full">
      {/* File Tabs */}
      <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto px-2 py-1 gap-1">
        {fileKeys.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFile(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition shrink-0 ${
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
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white rounded"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* CodeMirror 6 Mobile-Optimized Syntax Editor */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
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
      <div className="bg-slate-950 border-t border-slate-800 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto text-xs font-mono text-slate-300">
        <span className="text-[10px] text-slate-500 uppercase font-sans mr-1">Quick:</span>
        {['{', '}', '(', ')', '<', '>', '/', ';', '=', '=>', '"', "'", '[', ']', '$'].map((sym) => (
          <button
            key={sym}
            onClick={() => insertSymbol(sym)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded text-slate-200 transition"
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}

