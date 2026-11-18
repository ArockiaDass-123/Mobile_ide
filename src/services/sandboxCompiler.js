/**
 * Bulletproof In-Browser Sandbox Compiler & Bundler for React + Tailwind Applications.
 * Solves:
 * 1. Sandboxed iframe white-screen / script loading block
 * 2. Babel JSX translation error handling
 * 3. Extracts clean React component from AI output
 */

export function generateSandboxHTML(files = {}) {
  let appFile = files['src/App.jsx']?.content || `function App() {
    return (
      <div style={{minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center'}}>
        <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#60a5fa'}}>Preview Ready</h1>
        <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '8px'}}>Your project is running in the sandbox.</p>
      </div>
    );
  }`;

  // Sanitize the code to ensure it's a valid React component function App
  appFile = sanitizeComponentCode(appFile);

  const customCss = files['src/index.css']?.content || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.10/babel.min.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow-x: hidden;
    }
    #root {
      width: 100%;
      min-height: 100%;
    }
    ${customCss}
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    function sendLog(type, msg) {
      try {
        window.parent.postMessage({
          source: 'SANDBOX_RUNNER',
          type: type,
          text: String(msg),
          timestamp: new Date().toLocaleTimeString()
        }, '*');
      } catch(e) {}
    }

    function renderErrorUI(msg, details) {
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = \`
          <div style="padding: 16px; margin: 16px; background: #450a0a; border: 1px solid #991b1b; border-radius: 12px; color: #fca5a5; font-family: monospace; font-size: 12px;">
            <div style="font-weight: bold; color: #f87171; margin-bottom: 6px;">⚠️ Preview Error</div>
            <div style="margin-bottom: 4px;">\${msg}</div>
            \${details ? '<div style="color: #94a3b8; font-size: 11px;">' + details + '</div>' : ''}
          </div>
        \`;
      }
    }

    window.onerror = function(message, source, lineno, colno, error) {
      sendLog('error', message + (lineno ? ' (Line: ' + lineno + ')' : ''));
      renderErrorUI(message, 'Line ' + lineno);
      return false;
    };
  </script>

  <script type="text/babel">
    try {
      const { useState, useEffect, useRef, useMemo, useCallback } = React;

      // Executing user component
      ${appFile}

      // Check if App is defined
      if (typeof App !== 'function') {
        throw new Error("Could not find 'function App()'. Please check your App.jsx export.");
      }

      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      root.render(<App />);
      sendLog('info', 'Live preview rendered successfully.');
    } catch (err) {
      console.error(err);
      renderErrorUI(err.message, err.stack ? err.stack.split('\\n')[0] : '');
      sendLog('error', err.message);
    }
  </script>
</body>
</html>`;
}

/**
 * Robust code extractor & sanitizer:
 * Handles markdown backticks, import statements, and ensures function App exists.
 */
export function sanitizeComponentCode(code) {
  if (!code) return '';

  let cleaned = code;

  // 1. If wrapped in markdown code blocks, extract inner code
  const codeBlockMatch = cleaned.match(/```(?:jsx|javascript|tsx|js)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1];
  }

  // 2. Strip imports
  cleaned = cleaned
    .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
    .replace(/import\s+['"].*?['"];?/g, '')
    // Replace export default function App to function App
    .replace(/export\s+default\s+function\s+App/g, 'function App')
    .replace(/export\s+default\s+App\s*;?/g, '')
    .replace(/export\s+default\s+/g, 'const DefaultExport = ')
    .replace(/export\s+/g, '');

  return cleaned.trim();
}
