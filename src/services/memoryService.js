import { get, set } from 'idb-keyval';

const MEMORY_STORAGE_KEY = 'vibe_ide_langchain_memory';
const SUMMARY_STORAGE_KEY = 'vibe_ide_project_summary';

/**
 * LangChain-style Conversation & Context Memory Buffer
 * Manages conversation history, entity facts, and project semantic memory.
 */
class ConversationMemoryManager {
  constructor(maxWindow = 10) {
    this.maxWindow = maxWindow;
    this.buffer = [];
    this.summary = '';
    this.entities = {};
  }

  async init() {
    try {
      const savedBuffer = await get(MEMORY_STORAGE_KEY);
      if (Array.isArray(savedBuffer)) {
        this.buffer = savedBuffer;
      }
      const savedSummary = await get(SUMMARY_STORAGE_KEY);
      if (typeof savedSummary === 'string') {
        this.summary = savedSummary;
      }
    } catch (e) {
      console.warn('Failed to load memory from IndexedDB:', e);
    }
  }

  async saveContext(userMessage, aiMessage) {
    this.buffer.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });

    this.buffer.push({
      role: 'assistant',
      content: aiMessage,
      timestamp: Date.now()
    });

    // Keep sliding window
    if (this.buffer.length > this.maxWindow * 2) {
      this.buffer = this.buffer.slice(-this.maxWindow * 2);
    }

    try {
      await set(MEMORY_STORAGE_KEY, this.buffer);
    } catch (e) {
      console.warn('Failed to save memory buffer:', e);
    }
  }

  getRecentContext() {
    return this.buffer.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  }

  setProjectSummary(summary) {
    this.summary = summary;
    set(SUMMARY_STORAGE_KEY, summary).catch(() => {});
  }

  getProjectSummary() {
    return this.summary;
  }

  async clear() {
    this.buffer = [];
    this.summary = '';
    await set(MEMORY_STORAGE_KEY, []);
    await set(SUMMARY_STORAGE_KEY, '');
  }
}

export const memoryManager = new ConversationMemoryManager();
