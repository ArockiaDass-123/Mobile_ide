/**
 * In-Browser Sandbox Compiler & Bundler for React + Tailwind Applications.
 * Bulletproof execution using React 18 CDN and Babel Standalone with zero-lag fallback.
 */

export function generateSandboxHTML(files = {}) {
  const appFile = files['src/App.jsx']?.content || `function App() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 text-center">
        <h1 className="text-2xl font-bold text-blue-400">Preview Ready</h1>
        <p className="mt-2 text-xs text-slate-400">Generate or edit code to see changes live.</p>
      </div>
    );
  }`;

  const customCss = files['src/index.css']?.content || '';

  // Extract other component files if any
  const otherComponents = Object.entries(files)
    .filter(([path]) => path.startsWith('src/') && path.endsWith('.jsx') && path !== 'src/App.jsx')
    .map(([path, file]) => {
      return `\n// --- ${path} ---\n${sanitizeComponentCode(file.content)}\n`;
    })
    .join('\n');

  const sanitizedApp = sanitizeComponentCode(appFile);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Preview</title>
  <!-- Tailwind CSS Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React 18 UMD Production (Fast & Stable) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <!-- Babel Standalone for JSX Compilation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.10/babel.min.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      background-color: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    ${customCss}
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    const sendLog = (type, message) => {
      try {
        window.parent.postMessage({
          source: 'SANDBOX_RUNNER',
          type: type,
          text: String(message),
          timestamp: new Date().toLocaleTimeString()
        }, '*');
      } catch(e){}
    };

    window.onerror = function(message, source, lineno, colno, error) {
      sendLog('error', message + (lineno ? ' (Line: ' + lineno + ')' : ''));
      renderErrorUI(message, lineno);
      return false;
    };

    function renderErrorUI(msg, line) {
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = \`
          <div style="padding: 16px; background: #450a0a; border: 1px solid #7f1d1d; border-radius: 12px; margin: 16px; font-family: monospace; font-size: 12px; color: #fca5a5;">
            <div style="font-weight: bold; margin-bottom: 6px; color: #f87171;">⚠️ Preview Error</div>
            <div>\${msg}</div>
            \${line ? '<div style="color: #94a3b8; margin-top: 4px;">Line: ' + line + '</div>' : ''}
          </div>
        \`;
      }
    }
  </script>

  <script type="text/babel">
    try {
      const { useState, useEffect, useRef, useMemo, useCallback } = React;

      ${otherComponents}

      ${sanitizedApp}

      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      root.render(<App />);
      sendLog('info', 'Live preview rendered successfully.');
    } catch (err) {
      renderErrorUI(err.message);
      sendLog('error', err.message);
    }
  </script>
</body>
</html>`;
}

function sanitizeComponentCode(code) {
  if (!code) return '';
  return code
    .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
    .replace(/import\s+['"].*?['"];?/g, '')
    .replace(/export\s+default\s+function\s+/g, 'function ')
    .replace(/export\s+default\s+/g, 'const DefaultExport = ')
    .replace(/export\s+/g, '');
}
