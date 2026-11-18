import React, { useState } from 'react';
import { useIDEStore } from '../store/ideStore';
import { FileCode, FileJson, FileText, Plus, Trash2, Edit3, X, Check } from 'lucide-react';

export default function FileExplorer() {
  const { files, activeFile, setActiveFile, setActiveTab, createFile, deleteFile, renameFile } = useIDEStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [editingPath, setEditingPath] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) {
      return <FileCode className="w-4 h-4 text-amber-500" />;
    }
    if (fileName.endsWith('.json')) {
      return <FileJson className="w-4 h-4 text-emerald-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const handleCreateSubmit = (e) => {
    e?.preventDefault();
    if (!newFilePath.trim()) return;
    createFile(newFilePath.trim(), '// Start coding here\n');
    setNewFilePath('');
    setIsCreating(false);
    setActiveTab('code');
  };

  const startRename = (path, e) => {
    e.stopPropagation();
    setEditingPath(path);
    setRenameValue(path);
  };

  const handleRenameSubmit = (e) => {
    e?.preventDefault();
    if (renameValue.trim() && editingPath) {
      renameFile(editingPath, renameValue.trim());
      setEditingPath(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-white max-w-4xl mx-auto w-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Project Files</h2>
          <p className="text-xs text-gray-500 font-mono">Virtual Filesystem (IndexedDB Synchronized)</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition active:scale-95 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New File</span>
        </button>
      </div>

      {/* New File Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2">
          <input
            type="text"
            autoFocus
            placeholder="e.g. src/components/Card.jsx"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none font-mono"
          />
          <button type="submit" className="p-1.5 bg-blue-600 text-white rounded-lg">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setIsCreating(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {Object.keys(files).map((filePath) => {
          const isSelected = activeFile === filePath;
          const isEditing = editingPath === filePath;

          if (isEditing) {
            return (
              <form key={filePath} onSubmit={handleRenameSubmit} className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl border border-blue-200">
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 font-mono"
                />
                <button type="submit" className="p-1 text-blue-600"><Check className="w-4 h-4" /></button>
                <button type="button" onClick={() => setEditingPath(null)} className="p-1 text-gray-400"><X className="w-4 h-4" /></button>
              </form>
            );
          }

          return (
            <div
              key={filePath}
              onClick={() => {
                setActiveFile(filePath);
                setActiveTab('code');
              }}
              className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition select-none ${
                isSelected
                  ? 'bg-blue-50/80 border border-blue-200 text-blue-900'
                  : 'hover:bg-gray-50 border border-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {getFileIcon(filePath)}
                <span className="text-xs font-mono font-medium">{filePath}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 mr-2 font-mono">
                  {files[filePath].content.length} chars
                </span>
                <button
                  onClick={(e) => startRename(filePath, e)}
                  title="Rename"
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {Object.keys(files).length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${filePath}?`)) deleteFile(filePath);
                    }}
                    title="Delete"
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
