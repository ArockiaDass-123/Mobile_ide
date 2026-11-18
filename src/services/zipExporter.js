import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Packages all files in the current Virtual Filesystem into a standard ZIP archive
 * and triggers a download directly to Android phone's Downloads directory.
 */
export async function exportProjectAsZip(projectName = 'my-vibe-project', files = {}) {
  const zip = new JSZip();

  // Add all project files into the zip
  Object.entries(files).forEach(([filePath, fileObj]) => {
    zip.file(filePath, fileObj.content || '');
  });

  // Ensure index.html and standard Vite configuration exist for zero-setup local running
  if (!files['index.html']) {
    zip.file('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);
  }

  if (!files['src/main.jsx']) {
    zip.file('src/main.jsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);
  }

  if (!files['README.md']) {
    zip.file('README.md', `# ${projectName}

Generated with **Vibe IDE** (Android-First Mobile AI Coding Platform).

## How to run locally:
\`\`\`bash
npm install
npm run dev
\`\`\`
`);
  }

  // Generate ZIP blob and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  saveAs(blob, `${sanitizedName}.zip`);
}
