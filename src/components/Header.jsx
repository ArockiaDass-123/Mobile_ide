import React, { useState } from 'react';
import { useIDEStore } from '../store/ideStore';
import { MessageSquare, FolderTree, Code, Eye, Sparkles, Download, Settings, Cpu, FolderKanban } from 'lucide-react';
import AISettingsModal from './AISettingsModal';
import ProjectModal from './ProjectModal';

export default function Header() {
  const { activeTab, setActiveTab, currentProject, aiConfig } = useIDEStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'files', label: 'Files', icon: FolderTree },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  return (
    <header className="h-14 border-b border-gray-100 flex items-center justify-between px-3 md:px-6 bg-white sticky top-0 z-30 select-none">
      {/* Brand & Project Info */}
      <div 
        onClick={() => setIsProjectOpen(true)}
        className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 leading-tight flex items-center gap-1">
            {currentProject.name}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Vibe IDE · React + Tailwind
          </span>
        </div>
      </div>

      {/* Mobile-First Segmented View Switcher */}
      <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Quick Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsProjectOpen(true)}
          title="Project Options & Export ZIP"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-95 transition"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Configure AI Provider & Keys"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 active:scale-95 transition text-xs font-medium"
        >
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline capitalize">{aiConfig.provider}</span>
        </button>
      </div>

      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ProjectModal
        isOpen={isProjectOpen}
        onClose={() => setIsProjectOpen(false)}
      />
    </header>
  );
}
