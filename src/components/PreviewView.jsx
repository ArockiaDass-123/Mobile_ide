import React, { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '../store/ideStore';
import { RotateCw, Smartphone, Monitor, AlertTriangle } from 'lucide-react';

export default function PreviewView() {
  const { files, activeFile } = useIDEStore();
  const [deviceMode, setDeviceMode] = useState('mobile');
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [previewError, setPreviewError] = useState(null);
  const iframeRef = useRef(null);

  // Look for entry file: App.jsx, src/App.jsx, index.html, or currently active file
  const activeContent = files[activeFile]?.content;
  const rawCode = files['App.jsx']?.content || files['src/App.jsx']?.content || files['index.html']?.content || activeContent || '';

  // Robust code cleaner to extract executable React component
  const cleanCode = (code) => {
    if (!code) return '';
    let c = code;

    // 1. Extract markdown code blocks if present
    const codeBlockMatch = c.match(/```(?:jsx|javascript|tsx|js)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      c = codeBlockMatch[1];
    } else {
      // If no code block, but response has explanatory text before/after, isolate the App function
      const funcMatch = c.match(/((?:function\s+App|const\s+App\s*=\s*|class\s+App)[\s\S]*)/);
      if (funcMatch) {
        c = funcMatch[1];
      }
    }

    // 2. Strip imports and exports that fail in standalone browser Babel
    c = c
      .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
      .replace(/import\s+['"].*?['"];?/g, '')
      .replace(/export\s+default\s+function\s+App/g, 'function App')
      .replace(/export\s+default\s+App\s*;?/g, '')
      .replace(/export\s+default\s+/g, 'const DefaultExport = ')
      .replace(/export\s+/g, '')
      .trim();

    // 3. Auto-wrap bare JSX tags like <h1>hello world</h1> into a valid function App() if user or model wrote bare JSX
    if (!c.includes('function App') && !c.includes('const App') && !c.includes('class App')) {
      if (c.trim().startsWith('<') || c.includes('</')) {
        c = `function App() {\n  return (\n    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">\n      ${c}\n    </div>\n  );\n}`;
      }
    }

    return c;
  };

  const processedCode = cleanCode(rawCode);

  const isHtmlDocument = rawCode.trim().toLowerCase().startsWith('<!doctype html') || rawCode.trim().toLowerCase().startsWith('<html');

  useEffect(() => {
    setPreviewError(null);

    // CASE 1: If the user/model generated a standard full HTML/CSS page (<!DOCTYPE html>)
    if (isHtmlDocument) {
      if (iframeRef.current) {
        let htmlToRender = rawCode;

        // Inline CSS from Virtual File System (e.g. style.css or src/style.css)
        const cssFile = files['style.css']?.content || files['src/style.css']?.content || files['src/index.css']?.content || '';
        if (cssFile) {
          htmlToRender = htmlToRender.replace(/<link\s+rel=["']stylesheet["']\s+href=["'].*?style\.css["']\s*\/?>/i, `<style>${cssFile}</style>`);
          if (!htmlToRender.includes(cssFile)) {
            htmlToRender = htmlToRender.replace('</head>', `<style>${cssFile}</style></head>`);
          }
        }

        // Inline JavaScript from Virtual File System (e.g. script.js or src/script.js)
        const jsFile = files['script.js']?.content || files['src/script.js']?.content || '';
        if (jsFile) {
          htmlToRender = htmlToRender.replace(/<script\s+src=["'].*?script\.js["']\s*><\/script>/i, `<script>${jsFile}</script>`);
          if (!htmlToRender.includes(jsFile)) {
            htmlToRender = htmlToRender.replace('</body>', `<script>${jsFile}</script></body>`);
          }
        }

        // Ensure visible fallback styles
        if (!htmlToRender.includes('<style>')) {
          htmlToRender = htmlToRender.replace('</head>', '<style>body { margin:0; padding:16px; font-family:sans-serif; background:#fff; color:#111; }</style></head>');
        }

        const blob = new Blob([htmlToRender], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframeRef.current.src = url;
        return () => URL.revokeObjectURL(url);
      }
      return;
    }

    // CASE 2: React 18 JSX component
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.4/babel.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background: #ffffff;
      color: #0f172a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #root {
      width: 100%;
      min-height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <div id="error-display" style="display:none; padding:16px; margin:16px; background:#fef2f2; border:1px solid #fecaca; border-radius:12px; color:#991b1b; font-family:monospace; font-size:12px;">
    <b style="color:#b91c1c;">⚠️ Preview Runtime / Syntax Error:</b>
    <div id="error-text" style="margin-top:6px; white-space:pre-wrap;"></div>
  </div>

  <script>
    window.onerror = function(msg, src, line, col, err) {
      var errDisp = document.getElementById('error-display');
      var errTxt = document.getElementById('error-text');
      if (errDisp && errTxt) {
        errDisp.style.display = 'block';
        errTxt.innerText = (err && err.message) ? err.message : msg + (line ? ' (Line: ' + line + ')' : '');
      }
      window.parent.postMessage({ source: 'SANDBOX_ERROR', error: String(msg) }, '*');
      return false;
    };
  </script>

  <script type="text/babel">
    try {
      if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        throw new Error("React CDN failed to load. Please check network connection.");
      }

      const { useState, useEffect, useRef, useMemo, useCallback } = React;

      ${processedCode}

      if (typeof App === 'function') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
      } else {
        throw new Error("Could not find 'function App()'. Please ensure your App.jsx exports an App component.");
      }
    } catch(err) {
      console.error("Preview execution error:", err);
      var errDisp = document.getElementById('error-display');
      var errTxt = document.getElementById('error-text');
      if (errDisp && errTxt) {
        errDisp.style.display = 'block';
        errTxt.innerText = err.message || String(err);
      }
      window.parent.postMessage({ source: 'SANDBOX_ERROR', error: err.message || String(err) }, '*');
    }
  </script>
</body>
</html>`;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = fullHTML;
    }
  }, [processedCode, rawCode, isHtmlDocument, reloadTrigger]);

  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data && e.data.source === 'SANDBOX_ERROR') {
        setPreviewError(e.data.error);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-slate-100 max-w-5xl mx-auto w-full relative overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-11 border-b border-gray-200 flex items-center justify-between px-3 bg-white shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${previewError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="font-mono text-gray-700 font-medium">
            {previewError ? `Error: ${previewError.slice(0, 45)}...` : 'Live Preview Running'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1 rounded text-xs ${deviceMode === 'mobile' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500'}`}
              title="Mobile Mockup"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('responsive')}
              className={`p-1 rounded text-xs ${deviceMode === 'responsive' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500'}`}
              title="Full Width"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setReloadTrigger(r => r + 1)}
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition active:rotate-180"
            title="Reload Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-100">
        <div
          className={`h-full transition-all duration-200 overflow-hidden shadow-md bg-white ${
            deviceMode === 'mobile'
              ? 'w-full max-w-[390px] rounded-3xl border-4 border-slate-300'
              : 'w-full rounded-xl border border-slate-200'
          }`}
        >
          <iframe
            ref={iframeRef}
            title="App Preview"
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="w-full h-full border-none bg-white"
          />
        </div>
      </div>
    </div>
  );
}
