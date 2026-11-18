import React, { useState } from 'react';
import { useIDEStore } from '../store/ideStore';
import { FolderKanban, Plus, Download, Trash2, Edit3, X, Check, Laptop } from 'lucide-react';
import { exportProjectAsZip } from '../services/zipExporter';

export default function ProjectModal({ isOpen, onClose }) {
  const { currentProject, setCurrentProject, files } = useIDEStore();
  const [projectName, setProjectName] = useState(currentProject.name);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e) => {
    e?.preventDefault();
    if (projectName.trim()) {
      setCurrentProject({
        ...currentProject,
        name: projectName.trim()
      });
      onClose();
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportProjectAsZip(currentProject.name, files);
    } catch (err) {
      alert('Failed to export ZIP: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Project Management</h3>
              <p className="text-[11px] text-gray-500">Configure or export your project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Project Name Form */}
        <form onSubmit={handleSaveName} className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-700">Project Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-medium text-gray-800"
            />
            <button
              type="submit"
              className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium"
            >
              Rename
            </button>
          </div>
        </form>

        {/* Export ZIP Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">Export as ZIP</div>
              <div className="text-[11px] text-slate-500">
                Downloads complete source code, ready for Vercel, Netlify, or local run.
              </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full mt-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm active:scale-98 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Packaging ZIP...' : 'Download Project ZIP'}</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}
