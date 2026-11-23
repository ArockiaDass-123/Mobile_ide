import React, { useEffect } from 'react';
import { useIDEStore } from './store/ideStore';
import Header from './components/Header';
import ChatView from './components/ChatView';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import PreviewView from './components/PreviewView';
import DiffViewer from './components/DiffViewer';
import TermuxTerminal from './components/TermuxTerminal';
import JarvisAssistantOverlay from './components/JarvisAssistantOverlay';

export default function App() {
  const { activeTab, initVFS, initChatHistory } = useIDEStore();

  useEffect(() => {
    // Load persisted files and chat history from IndexedDB on initial mount
    initVFS();
    initChatHistory();
  }, [initVFS, initChatHistory]);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white select-none">
      {/* Universal Top Header */}
      <Header />

      {/* Main View Area switched by active tab */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'terminal' && <TermuxTerminal />}
        {activeTab === 'files' && <FileExplorer />}
        {activeTab === 'code' && <CodeEditor />}
        {activeTab === 'preview' && <PreviewView />}
        {activeTab === 'review' && <DiffViewer />}
      </main>

      {/* Floating JARVIS Voice Assistant & Security Confirmation Bridge */}
      <JarvisAssistantOverlay />
    </div>
  );
}
