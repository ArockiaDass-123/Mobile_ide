import React, { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '../store/ideStore';
import { RotateCw, Smartphone, Monitor, Terminal, AlertCircle, CheckCircle2, Maximize2 } from 'lucide-react';
import { generateSandboxHTML } from '../services/sandboxCompiler';

export default function PreviewView() {
  const { files, previewState, addLog } = useIDEStore();
  const [deviceMode, setDeviceMode] = useState('mobile'); // 'mobile' | 'responsive'
  const [showConsole, setShowConsole] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const iframeRef = useRef(null);

  // Compile and load virtual files into the sandboxed iframe
  useEffect(() => {
    const htmlContent = generateSandboxHTML(files);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = htmlContent;
    }
  }, [files, reloadTrigger]);

  // Listen to sandbox logs and runtime errors posted by the iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.source === 'SANDBOX_RUNNER') {
        addLog({
          type: event.data.type,
          text: event.data.text,
          timestamp: event.data.timestamp
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  const handleRefresh = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  const hasErrors = previewState.logs.some((l) => l.type === 'error');

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-slate-100 max-w-5xl mx-auto w-full relative overflow-hidden select-none">
      {/* Preview Control Header */}
      <div className="h-11 border-b border-gray-200 flex items-center justify-between px-3 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              hasErrors ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span className="text-xs font-mono text-gray-700 font-medium">
            localhost:3000 (Sandboxed)
          </span>
        </div>

        {/* Device Mode & Console Toggles */}
        <div className="flex items-center gap-1.5">
          <div className="bg-gray-100 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setDeviceMode('mobile')}
              title="Mobile View"
              className={`p-1 rounded-md text-xs transition ${
                deviceMode === 'mobile' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('responsive')}
              title="Full Responsive View"
              className={`p-1 rounded-md text-xs transition ${
                deviceMode === 'responsive' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
              hasErrors
                ? 'bg-red-100 text-red-700 font-semibold'
                : showConsole
                ? 'bg-gray-200 text-gray-800'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Console</span>
            {hasErrors && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
          </button>

          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition active:rotate-180"
            title="Reload Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container with Responsive/Mobile Frames */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-100">
        <div
          className={`h-full bg-white transition-all duration-200 shadow-md overflow-hidden ${
            deviceMode === 'mobile'
              ? 'w-full max-w-[390px] rounded-3xl border-4 border-slate-300'
              : 'w-full rounded-xl border border-slate-200'
          }`}
        >
          <iframe
            ref={iframeRef}
            title="App Preview"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-none bg-white"
          />
        </div>
      </div>

      {/* Bottom Collapsible Interactive Console / Logs Drawer */}
      {showConsole && (
        <div className="h-44 bg-slate-950 border-t border-slate-800 text-slate-200 p-2 font-mono text-xs overflow-y-auto shrink-0 select-text">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Terminal className="w-3 h-3 text-blue-400" />
              RUNTIME CONSOLE & BUILD LOGS
            </span>
            <button
              onClick={() => setShowConsole(false)}
              className="p-1 hover:text-white rounded"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            {previewState.logs.length === 0 ? (
              <div className="text-slate-500 text-[11px] py-1">No console output recorded.</div>
            ) : (
              previewState.logs.map((log, i) => (
                <div
                  key={i}
                  className={`py-0.5 text-[11px] leading-relaxed flex items-start gap-2 ${
                    log.type === 'error'
                      ? 'text-red-400 bg-red-950/30 px-1 rounded'
                      : log.type === 'warn'
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-500 shrink-0 text-[10px]">
                    [{log.timestamp || '00:00:00'}]
                  </span>
                  <span className="font-semibold uppercase text-[9px] px-1 py-0.2 rounded bg-slate-800 shrink-0">
                    {log.type}
                  </span>
                  <span className="break-all">{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
