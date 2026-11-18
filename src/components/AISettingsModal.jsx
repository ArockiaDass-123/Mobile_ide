import React from 'react';
import { useIDEStore } from '../store/ideStore';
import { Settings, Key, Cpu, Globe, Check, X } from 'lucide-react';
import { AI_PROVIDERS } from '../services/aiEngine';

export default function AISettingsModal({ isOpen, onClose }) {
  const { aiConfig, setAIConfig } = useIDEStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI Provider Settings</h3>
              <p className="text-[11px] text-gray-500">Configure your LLM backend & credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-700">AI Provider</label>
          <select
            value={aiConfig.provider}
            onChange={(e) => setAIConfig({ ...aiConfig, provider: e.target.value })}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 text-gray-800"
          >
            {Object.entries(AI_PROVIDERS).map(([key, prov]) => (
              <option key={key} value={key}>
                {prov.name}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-700 flex items-center justify-between">
            <span>API Key</span>
            <span className="text-[10px] text-gray-400 font-normal">Stored locally in browser</span>
          </label>
          <div className="relative flex items-center">
            <Key className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
            <input
              type="password"
              placeholder="Enter your API Key (e.g. gsk_... or sk-...)"
              value={aiConfig.apiKey || ''}
              onChange={(e) => setAIConfig({ ...aiConfig, apiKey: e.target.value })}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-blue-500 text-gray-800 font-mono"
            />
          </div>
          <p className="text-[10px] text-gray-400">
            Tip: Get a 100% free Gemini API key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">aistudio.google.com</a> (Gemini 2.5 Flash has a generous free quota!).
          </p>
        </div>

        {/* Custom Endpoint (for Ollama or Self-hosted) */}
        {aiConfig.provider === 'ollama' && (
          <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-800">Ollama Model</label>
              <select
                value={aiConfig.model || 'llama3.2'}
                onChange={(e) => setAIConfig({ ...aiConfig, model: e.target.value })}
                className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none font-mono"
              >
                <option value="llama3.2">Llama 3.2 (Mobile & Edge)</option>
                <option value="qwen2.5-coder">Qwen 2.5 Coder (Best for Coding)</option>
                <option value="deepseek-r1">DeepSeek R1 (Reasoning)</option>
                <option value="codellama">CodeLlama</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-800">Ollama Endpoint URL</label>
              <input
                type="text"
                placeholder="http://10.0.2.2:11434/v1 or Ngrok/Tunnel URL"
                value={aiConfig.customBaseUrl || ''}
                onChange={(e) => setAIConfig({ ...aiConfig, customBaseUrl: e.target.value })}
                className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Tip: Run <code className="bg-slate-200 px-1 rounded">ollama run qwen2.5-coder</code> on your PC/Termux and enter your local IP or cloudflare tunnel URL.
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition"
        >
          <Check className="w-4 h-4" />
          <span>Save & Apply Settings</span>
        </button>
      </div>
    </div>
  );
}
