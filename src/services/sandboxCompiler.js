/**
 * In-Browser Sandbox Compiler & Bundler for React + Tailwind Applications.
 * This runs client-side inside an isolated iframe, meaning zero backend servers or Node processes
 * are required on the Android phone.
 */

export function generateSandboxHTML(files = {}) {
  // Extract user files or fallback to default
  const appFile = files['src/App.jsx']?.content || 'export default function App() { return <div>No App.jsx found</div>; }';
  const customCss = files['src/index.css']?.content || '';

  // Extract other component files if any
  const otherComponents = Object.entries(files)
    .filter(([path]) => path.startsWith('src/') && path.endsWith('.jsx') && path !== 'src/App.jsx')
    .map(([path, file]) => {
      const componentName = path.split('/').pop().replace('.jsx', '');
      return `
        // Component: ${path}
        ${file.content}
      `;
    })
    .join('\n');

  // Strip standard import/export syntax for in-browser Babel Standalone evaluation
  const sanitizedApp = sanitizeComponentCode(appFile);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sandbox Preview</title>
  <!-- Tailwind CSS Play CDN for instant zero-config styling -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '#2563eb'
          }
        }
      }
    }
  </script>
  <!-- React 18 / 19 Standalone UMD -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <!-- Babel Standalone for live JSX translation inside browser -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Lucide Icons Standalone CDN for rich UI rendering -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      overflow-x: hidden;
    }
    ${customCss}
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    // Intercept console.log, console.error, and runtime errors to stream back to IDE
    const sendLog = (type, message) => {
      window.parent.postMessage({
        source: 'SANDBOX_RUNNER',
        type: type,
        text: String(message),
        timestamp: new Date().toLocaleTimeString()
      }, '*');
    };

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      sendLog('info', args.join(' '));
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      sendLog('error', args.join(' '));
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      sendLog('warn', args.join(' '));
      originalWarn.apply(console, args);
    };

    window.onerror = function(message, source, lineno, colno, error) {
      sendLog('error', 'Runtime Error: ' + message + ' (line ' + lineno + ')');
      renderErrorUI(message, lineno);
      return false;
    };

    function renderErrorUI(msg, line) {
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = \`
          <div style="padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; margin: 16px; font-family: monospace; font-size: 12px; color: #991b1b;">
            <div style="font-weight: bold; margin-bottom: 6px;">⚠️ Compilation / Runtime Error</div>
            <div>\${msg}</div>
            \${line ? '<div style="color: #6b7280; margin-top: 4px;">Line: ' + line + '</div>' : ''}
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

      // Mount into container
      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      root.render(<App />);

      // Notify parent that render succeeded
      sendLog('info', 'Application rendered successfully.');
      setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }, 50);
    } catch (err) {
      console.error(err.message);
      renderErrorUI(err.message);
    }
  </script>
</body>
</html>`;
}

/**
 * Remove import / export statements so code can run directly in Babel Standalone
 */
function sanitizeComponentCode(code) {
  return code
    .replace(/import\s+.*?from\s+['"].*?['"];?/g, '') // remove import statements
    .replace(/import\s+['"].*?['"];?/g, '')
    .replace(/export\s+default\s+function\s+/g, 'function ') // convert export default function App to function App
    .replace(/export\s+default\s+/g, 'const DefaultExport = ')
    .replace(/export\s+/g, '');
}
