import { create } from 'zustand';
import { initialFiles, saveVFS, loadVFS } from '../services/vfsStorage';
import { loadChatHistory, saveChatHistory, clearChatHistory, initialMessages } from '../services/chatStorage';

export const useIDEStore = create((set, get) => ({
  // Navigation & Workspace Layout
  activeTab: 'chat', // 'chat' | 'files' | 'code' | 'preview' | 'review'
  setActiveTab: (tab) => set({ activeTab: tab }),

  isMobile: window.innerWidth < 1024,
  setIsMobile: (val) => set({ isMobile: val }),

  // Desktop Panel Sizing & Split Visibility
  panelSizes: {
    sidebar: 240,
    chat: 380,
    editor: 450,
    preview: 400,
    terminalHeight: 180
  },
  setPanelSizes: (sizes) => set((state) => ({ panelSizes: { ...state.panelSizes, ...sizes } })),

  // Active Multi-Agent State
  currentAgent: {
    role: 'idle', // 'planner' | 'developer' | 'reviewer' | 'debugger' | 'tester' | 'idle'
    name: 'Vibe Architect',
    status: 'Ready',
    currentTask: '',
    progress: 0,
    activeTool: null
  },
  setCurrentAgent: (agent) => set((state) => ({ currentAgent: { ...state.currentAgent, ...agent } })),

  // Cursor-Style Pending Code Changes & Diffs
  pendingDiffs: [], // Array of { id, path, oldContent, newContent, diffSummary, status: 'pending'|'accepted'|'rejected', comments: [] }
  addPendingDiff: (diff) => set((state) => ({ pendingDiffs: [...state.pendingDiffs, diff] })),
  clearPendingDiffs: () => set({ pendingDiffs: [] }),
  resolveDiff: (id, accept = true) => {
    const diff = get().pendingDiffs.find((d) => d.id === id);
    if (!diff) return;

    if (accept) {
      get().updateFileContent(diff.path, diff.newContent);
    }
    const updated = get().pendingDiffs.filter((d) => d.id !== id);
    set({ pendingDiffs: updated });
  },
  acceptAllDiffs: () => {
    const diffs = get().pendingDiffs;
    diffs.forEach((d) => {
      get().updateFileContent(d.path, d.newContent);
    });
    set({ pendingDiffs: [] });
  },
  rejectAllDiffs: () => {
    set({ pendingDiffs: [] });
  },

  // Project Metadata
  currentProject: {
    id: 'proj_default',
    name: 'My Vibe Project',
    description: 'React 18 + Tailwind Multi-Component Application'
  },
  setCurrentProject: (proj) => set({ currentProject: proj }),

  // Universal AI Provider & Credentials Configuration
  aiConfig: {
    provider: 'gemini', // 'gemini' | 'ollama' | 'openai' | 'groq' | 'anthropic'
    apiKey: '',
    customBaseUrl: 'http://127.0.0.1:11434',
    model: 'gemini-3.5-flash',
    thinkingBudget: 0
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

  // Development Roadmap State
  planningPhase: {
    isActive: false,
    isApproved: false,
    overview: '',
    techStack: [],
    phases: [],
    fileBlueprint: []
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
  }))
}));
