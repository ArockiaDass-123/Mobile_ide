import { create } from 'zustand';
import { initialFiles, saveVFS, loadVFS } from '../services/vfsStorage';

export const useIDEStore = create((set, get) => ({
  // Active Navigation Mode: 'chat' | 'files' | 'code' | 'preview'
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Mobile / Desktop Viewport Mode detection
  isMobile: true,
  setIsMobile: (val) => set({ isMobile: val }),

  // Current Project Metadata
  currentProject: {
    id: 'proj_default',
    name: 'My Vibe Project',
    description: 'React + Tailwind Web Application'
  },
  setCurrentProject: (proj) => set({ currentProject: proj }),

  // AI Provider & Credentials Configuration
  aiConfig: {
    provider: 'gemini',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    customBaseUrl: '',
    model: 'gemini-3.5-flash'
  },
  setAIConfig: (cfg) => set({ aiConfig: cfg }),

  isStreaming: false,
  setIsStreaming: (val) => set({ isStreaming: val }),

  // Chat & Agent State
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Ready when you are. Tell me what application you want to build, and I'll plan the architecture, write the code, and spin up a live preview right here on your phone.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, { ...msg, id: msg.id || Math.random().toString(36).substring(7), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] 
  })),

  updateStreamingMessage: (id, chunk) => set((state) => ({
    messages: state.messages.map((m) => m.id === id ? { ...m, content: chunk } : m)
  })),

  // Development Phases State
  planningPhase: {
    isActive: false,
    isApproved: false,
    overview: '',
    techStack: [],
    phases: []
  },
  setPlanningPhase: (plan) => set({ planningPhase: plan }),

  // Virtual File System (VFS) with IndexedDB Persistence
  files: initialFiles,
  activeFile: 'src/App.jsx',
  setActiveFile: (path) => set({ activeFile: path }),

  initVFS: async () => {
    const loaded = await loadVFS();
    set({ files: loaded });
  },

  updateFileContent: (path, content) => {
    const newFiles = {
      ...get().files,
      [path]: { content }
    };
    set({ files: newFiles });
    saveVFS(newFiles);
  },

  createFile: (path, content = '') => {
    const newFiles = {
      ...get().files,
      [path]: { content }
    };
    set({ files: newFiles, activeFile: path });
    saveVFS(newFiles);
  },

  deleteFile: (path) => {
    const newFiles = { ...get().files };
    delete newFiles[path];
    const remaining = Object.keys(newFiles);
    set({ 
      files: newFiles, 
      activeFile: remaining.length > 0 ? remaining[0] : '' 
    });
    saveVFS(newFiles);
  },

  renameFile: (oldPath, newPath) => {
    if (!newPath || oldPath === newPath) return;
    const current = get().files[oldPath];
    if (!current) return;

    const newFiles = { ...get().files };
    delete newFiles[oldPath];
    newFiles[newPath] = current;
    set({ 
      files: newFiles, 
      activeFile: get().activeFile === oldPath ? newPath : get().activeFile 
    });
    saveVFS(newFiles);
  },

  // Execution & Live Preview State
  previewState: {
    isRunning: true,
    lastBuildTime: null,
    logs: [
      { type: 'info', text: 'Virtual preview server online.' }
    ],
    lastError: null
  },
  addLog: (log) => set((state) => ({
    previewState: {
      ...state.previewState,
      logs: [...state.previewState.logs, log],
      lastError: log.type === 'error' ? log.text : state.previewState.lastError
    }
  })),
  clearLastError: () => set((state) => ({
    previewState: {
      ...state.previewState,
      lastError: null
    }
  })),
}));

