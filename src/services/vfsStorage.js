import { get, set, del } from 'idb-keyval';
import { cleanFilePath, sanitizeCodeContent } from './multiFileParser';

const VFS_STORAGE_KEY = 'vibe_ide_vfs_files';

export const initialFiles = {
  'src/App.jsx': {
    content: `export default function App() {\n  return (\n    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-6">\n      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">\n        <h1 className="text-2xl font-bold tracking-tight text-blue-600">Vibe Code Mobile</h1>\n        <p className="mt-2 text-xs text-slate-600 leading-relaxed">\n          Your Android-First AI IDE is running. Describe an app in Chat to generate full code.\n        </p>\n        <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-blue-700 transition active:scale-95">\n          Explore Features\n        </button>\n      </div>\n    </div>\n  );\n}\n`
  },
  'src/index.css': {
    content: `@import "tailwindcss";\n`
  },
  'package.json': {
    content: `{\n  "name": "vibe-mobile-app",\n  "private": true,\n  "version": "0.1.0",\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0"\n  }\n}\n`
  }
};

/**
 * Load Virtual Filesystem from IndexedDB and auto-heal any legacy corrupted files
 */
export async function loadVFS() {
  try {
    const saved = await get(VFS_STORAGE_KEY);
    if (saved && Object.keys(saved).length > 0) {
      const sanitized = {};
      let changed = false;

      for (const [rawPath, fileObj] of Object.entries(saved)) {
        const cleanPath = cleanFilePath(rawPath);
        const originalContent = fileObj?.content || '';
        const cleanContent = sanitizeCodeContent(originalContent);

        if (cleanPath !== rawPath || cleanContent !== originalContent) {
          changed = true;
        }

        sanitized[cleanPath] = {
          content: cleanContent
        };
      }

      if (changed) {
        await set(VFS_STORAGE_KEY, sanitized);
      }

      return sanitized;
    }
  } catch (e) {
    console.warn('Failed to load VFS from IndexedDB:', e);
  }
  return initialFiles;
}

/**
 * Persist Virtual Filesystem to IndexedDB
 */
export async function saveVFS(files) {
  try {
    await set(VFS_STORAGE_KEY, files);
  } catch (e) {
    console.error('Failed to save VFS to IndexedDB:', e);
  }
}

/**
 * Reset VFS to default initial state
 */
export async function resetVFS() {
  try {
    await del(VFS_STORAGE_KEY);
    return initialFiles;
  } catch (e) {
    console.error('Failed to reset VFS:', e);
    return initialFiles;
  }
}
