import { create } from 'zustand';
import { initialFiles, saveVFS, loadVFS } from '../services/vfsStorage';
import { loadChatHistory, saveChatHistory, clearChatHistory, initialMessages } from '../services/chatStorage';

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

  // AI Provider & Credentials Configuration (Default: Qwen 2.5 Coder)
  aiConfig: {
    provider: 'ollama',
    apiKey: '',
    customBaseUrl: 'http://127.0.0.1:11434',
    model: 'qwen2.5-coder:1.5b'
  },
  setAIConfig: (cfg) => set({ aiConfig: cfg }),

  isStreaming: false,
  setIsStreaming: (val) => set({ isStreaming: val }),

  // Chat & Persistent History State
  messages: initialMessages,
  initChatHistory: async () => {
    const loaded = await loadChatHistory();
    set({ messages: loaded });
  },
  addMessage: (msg) => {
    const newMsg = {
      ...msg,
      id: msg.id || Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...get().messages, newMsg];
    set({ messages: updated });
    saveChatHistory(updated);
  },

  updateStreamingMessage: (id, chunk) => {
    const updated = get().messages.map((m) => m.id === id ? { ...m, content: chunk } : m);
    set({ messages: updated });
    saveChatHistory(updated);
  },

  clearChat: async () => {
    const reset = await clearChatHistory();
    set({ messages: reset });
  },

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

