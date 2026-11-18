import { get, set } from 'idb-keyval';

const CHAT_HISTORY_KEY = 'vibe_ide_chat_history';

export const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content: "Ready when you are. Tell me what application you want to build, and I'll plan the architecture, write the code, and spin up a live preview right here on your phone.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

/**
 * Load chat history from IndexedDB
 */
export async function loadChatHistory() {
  try {
    const saved = await get(CHAT_HISTORY_KEY);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load chat history from IndexedDB:', e);
  }
  return initialMessages;
}

/**
 * Save chat history to IndexedDB
 */
export async function saveChatHistory(messages) {
  try {
    // Keep last 100 messages to prevent excessive storage
    const trimmed = messages.slice(-100);
    await set(CHAT_HISTORY_KEY, trimmed);
  } catch (e) {
    console.error('Failed to save chat history to IndexedDB:', e);
  }
}

/**
 * Clear chat history from IndexedDB
 */
export async function clearChatHistory() {
  try {
    await set(CHAT_HISTORY_KEY, initialMessages);
    return initialMessages;
  } catch (e) {
    console.error('Failed to clear chat history:', e);
    return initialMessages;
  }
}
