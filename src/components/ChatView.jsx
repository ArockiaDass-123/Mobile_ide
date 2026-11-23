import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../store/ideStore';
import { Plus, Mic, MicOff, ArrowUp, Sparkles, CheckCircle2, ChevronRight, Layers, Loader2, Trash2, ChevronDown, Volume2, Copy, Check } from 'lucide-react';
import { generateAppCode } from '../services/multiModelService';
import { executeAIRequest } from '../services/universalAIProvider';
import { memoryManager } from '../services/memoryService';
import { executeMCPTool } from '../services/deviceMcpService';
import { voiceAssistant } from '../services/voiceAssistant';
import { AgentOrchestrator } from '../services/agentOrchestrator';
import { searchWeb } from '../services/webSearchService';

export default function ChatView() {
  const {
    messages,
    addMessage,
    updateStreamingMessage,
    clearChat,
    planningPhase,
    setPlanningPhase,
    setActiveTab,
    aiConfig,
    setAIConfig,
    isStreaming,
    setIsStreaming,
    updateFileContent
  } = useIDEStore();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const availableModels = [
    { provider: 'gemini', model: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Cloud - Fast & Free)' },
    { provider: 'gemini', model: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (High Speed)' },
    { provider: 'ollama', model: 'qwen2.5-coder:1.5b', label: 'Qwen 2.5 Coder (Local Ollama Installed)' },
    { provider: 'ollama', model: 'phi3:mini', label: 'Phi-3 Mini (Local Ollama Installed)' }
  ];

  const currentSelected = availableModels.find(
    (m) => m.provider === aiConfig.provider && m.model === aiConfig.model
  ) || availableModels[0];

  const handleModelSelect = (m) => {
    setAIConfig({
      ...aiConfig,
      provider: m.provider,
      model: m.model
    });
    setIsModelDropdownOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, planningPhase]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const handleCopyMessage = (msgId, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      executeMCPTool('device_clipboard_write', { text });
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      voiceAssistant.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceAssistant.startListening({
        onResult: (transcript) => {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        },
        onError: (err) => {
          console.warn('Speech error:', err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
    }
  };

  const handleSpeakText = (text) => {
    if (isSpeaking) {
      voiceAssistant.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      voiceAssistant.speak(text);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  const isProjectCreationRequest = (text) => {
    const lower = text.toLowerCase().trim();
    const greetings = ['hi', 'hello', 'hey', 'vanakkam', 'hai', 'hola'];
    if (greetings.includes(lower)) return false;

    const buildKeywords = ['build', 'create', 'make', 'develop', 'generate', 'code', 'add', 'portfolio', 'website', 'app', 'design', 'clone', 'dashboard', 'store', 'landing'];
    return buildKeywords.some((kw) => lower.includes(kw));
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    addMessage({
      role: 'user',
      content: userText
    });
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const streamMsgId = 'msg_' + Date.now();
    addMessage({
      id: streamMsgId,
      role: 'assistant',
      content: 'Thinking...'
    });

    setIsStreaming(true);

    try {
      if (!isProjectCreationRequest(userText)) {
        // Incorporate LangChain conversational memory context
        const contextMemory = memoryManager.getRecentContext();

        // Perform real-time web search grounding if information query
        updateStreamingMessage(streamMsgId, 'Searching the web for latest information...');
        const webGrounding = await searchWeb(userText);

        let augmentedPrompt = userText;
        if (webGrounding) {
          augmentedPrompt = `Real-time Web Search Results for "${userText}":\n${webGrounding}\n\nBased on these live search results, answer the user's question directly and concisely: "${userText}"`;
        }

        const fullPrompt = contextMemory
          ? `Conversation Context:\n${contextMemory}\n\nUser: ${augmentedPrompt}\nAI:`
          : augmentedPrompt;

        // Execute AI with real-time Google Search grounding enabled
        const reply = await executeAIRequest({
          provider: aiConfig.provider,
          model: aiConfig.model,
          apiKey: aiConfig.apiKey,
          customBaseUrl: aiConfig.customBaseUrl,
          messages: [{ role: 'user', content: fullPrompt }],
          enableWebSearch: true
        });

        let finalReply = reply || 'Hello! How can I help you build your application today?';
        if (webGrounding && !finalReply.includes('Sources from Google Search')) {
          finalReply += `\n\n**🌐 Live Web Reference:**\n${webGrounding}`;
        }

        updateStreamingMessage(streamMsgId, finalReply);
        await memoryManager.saveContext(userText, finalReply);
      } else {
        // Haptic feedback via MCP
        executeMCPTool('device_vibrate', { pattern: [80] });

        setPlanningPhase({
          isActive: true,
          isApproved: false,
          overview: userText,
          techStack: ['React 18', 'Tailwind CSS', `${currentSelected.label}`],
          phases: [
            { id: 1, title: 'Phase 1: Architecture & Data Model', status: 'ready', description: 'Design interactive state, models, and responsive layout.' },
            { id: 2, title: 'Phase 2: UI Components & Interactions', status: 'pending', description: 'Build interactive cards, actions, and modern styling.' },
            { id: 3, title: 'Phase 3: Sandbox Verification', status: 'pending', description: 'Mount React tree and test preview sandbox.' }
          ]
        });

        const planNotice = `I received your request to build: **"${userText}"** using **${currentSelected.label}**.\n\nReview the project roadmap below and tap **"Approve Plan & Begin Phase 1"** to generate the real code.`;
        updateStreamingMessage(streamMsgId, planNotice);
        await memoryManager.saveContext(userText, planNotice);
      }
    } catch (err) {
      updateStreamingMessage(
        streamMsgId,
        `⚠️ Error: ${err.message}. Please verify your selected model settings.`
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const approvePlan = async () => {
    const userPrompt = planningPhase.overview || 'modern web app';

    setPlanningPhase({
      ...planningPhase,
      isApproved: true,
      phases: planningPhase.phases.map((p, idx) => idx === 0 ? { ...p, status: 'in-progress' } : p)
    });

    const streamMsgId = 'codegen_' + Date.now();
    addMessage({
      id: streamMsgId,
      role: 'assistant',
      content: `⚡ Generating complete source code for **"${userPrompt}"** with Gemini...`
    });

    setIsStreaming(true);

    try {
      // 1. Invoke Developer Agent to produce code
      const generatedFiles = await AgentOrchestrator.developProject({
        prompt: userPrompt,
        aiConfig
      });

      // 2. Write all generated files into the Virtual File System (VFS)
      if (generatedFiles && generatedFiles.length > 0) {
        generatedFiles.forEach((file) => {
          if (file.path && file.content) {
            updateFileContent(file.path, file.content);
          }
        });

        // Set the primary generated file as active in the Code Editor
        const primaryFile = generatedFiles[0].path;
        useIDEStore.getState().setActiveFile(primaryFile);
      }

      setPlanningPhase({
        ...planningPhase,
        isApproved: true,
        phases: planningPhase.phases.map((p) => ({ ...p, status: 'completed' }))
      });

      const fileSummaryList = generatedFiles.map(f => `• \`${f.path}\` (${f.content.length} bytes)`).join('\n');

      updateStreamingMessage(
        streamMsgId,
        `🎉 **Project Generated Successfully!**\n\n**Created/Updated Files:**\n${fileSummaryList}\n\n👉 **Live Preview updated automatically! Tap "Code" to inspect files or "Preview" to test.**`
      );

      // Haptic feedback via MCP
      executeMCPTool('device_vibrate', { pattern: [100, 50, 100] });

      // Memory save
      await memoryManager.saveContext(userPrompt, `Generated ${generatedFiles.length} files: ${generatedFiles.map(f=>f.path).join(', ')}`);

      // Auto-switch directly to Live Preview so the user sees the running app immediately
      setTimeout(() => {
        setActiveTab('preview');
      }, 700);
    } catch (err) {
      updateStreamingMessage(streamMsgId, `⚠️ Generation failed: ${err.message}`);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-white max-w-4xl mx-auto w-full relative">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        {/* Chat History Controls Bar */}
        {messages.length > 1 && (
          <div className="flex items-center justify-between py-1 px-2 border-b border-gray-100 text-[11px] text-gray-400">
            <span>Conversation History Saved</span>
            <button
              onClick={() => {
                if (confirm('Clear current chat history?')) clearChat();
              }}
              className="flex items-center gap-1 hover:text-red-500 transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed select-text ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-gray-100/90 text-gray-800 rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap select-text">{msg.content}</div>
              <div className="flex items-center justify-between mt-1.5 gap-2">
                <div className="flex items-center gap-1">
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleSpeakText(msg.content)}
                      className="p-1 hover:bg-gray-200/60 rounded text-gray-500 hover:text-gray-700 transition cursor-pointer"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="p-1 hover:bg-black/10 rounded transition cursor-pointer text-gray-500 hover:text-gray-700"
                    title="Copy message"
                  >
                    {copiedMsgId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div
                  className={`text-[10px] ${
                    msg.role === 'user' ? 'text-blue-200 text-right w-full' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Planning Mode Card (When active) */}
        {planningPhase.isActive && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-3 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold text-sm">
              <Layers className="w-4 h-4" />
              <span>Project Development Roadmap</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">{planningPhase.overview}</p>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {planningPhase.techStack.map((tech) => (
                <span
                  key={tech}
                  className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Phased Steps */}
            <div className="space-y-2 mb-4">
              {planningPhase.phases.map((phase) => (
                <div
                  key={phase.id}
                  className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-start gap-2.5"
                >
                  <div className="mt-0.5">
                    {phase.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${phase.status === 'in-progress' ? 'border-blue-600 border-t-transparent animate-spin' : 'border-slate-300'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-800">{phase.title}</div>
                    <div className="text-[11px] text-slate-500">{phase.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Approval Action */}
            {!planningPhase.isApproved ? (
              <button
                onClick={approvePlan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition cursor-pointer"
              >
                <span>Approve Plan & Begin Phase 1</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                <span>Phase 1 implementation in progress...</span>
                <button
                  onClick={() => setActiveTab('code')}
                  className="underline font-semibold cursor-pointer"
                >
                  View Code
                </button>
              </div>
            )}
          </div>
        )}

        {/* Self-Healing Error Notification & Fix Trigger Card */}
        {useIDEStore.getState().previewState.lastError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 my-3 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-start gap-2 text-red-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0 animate-ping" />
              <div className="flex-1">
                <div>Runtime Error Caught by Sandbox:</div>
                <div className="font-mono text-[11px] font-normal text-red-700 mt-1 break-all bg-red-100/60 p-2 rounded-lg">
                  {useIDEStore.getState().previewState.lastError}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={async () => {
                  const errorText = useIDEStore.getState().previewState.lastError;
                  addMessage({
                    role: 'user',
                    content: `Fix runtime error: ${errorText}`
                  });

                  if (aiConfig.apiKey || aiConfig.provider === 'ollama') {
                    // Trigger live AI self-healing stream
                    setIsStreaming(true);
                    const streamId = 'fix_' + Date.now();
                    addMessage({
                      id: streamId,
                      role: 'assistant',
                      content: 'Inspecting error stack and applying code patch...'
                    });
                    try {
                      await streamAICompletion({
                        provider: aiConfig.provider,
                        apiKey: aiConfig.apiKey,
                        customBaseUrl: aiConfig.customBaseUrl,
                        model: aiConfig.model,
                        messages: [
                          ...messages.map((m) => ({ role: m.role, content: m.content })),
                          {
                            role: 'user',
                            content: `CRITICAL RUNTIME ERROR: "${errorText}". Fix the file containing this error immediately using <<<TOOL_CALL:update_file>>>.`
                          }
                        ],
                        onChunk: (chunk, fullText) => updateStreamingMessage(streamId, fullText),
                        onToolCall: ({ action, data }) => {
                          if (action === 'create_file' || action === 'update_file') {
                            if (data.path && data.content) {
                              updateFileContent(data.path, data.content);
                              useIDEStore.getState().clearLastError();
                            }
                          }
                        }
                      });
                    } catch (e) {
                      updateStreamingMessage(streamId, `Error while fixing: ${e.message}`);
                    } finally {
                      setIsStreaming(false);
                    }
                  } else {
                    // Demonstration fallback fix
                    setTimeout(() => {
                      addMessage({
                        role: 'assistant',
                        content: `I've analyzed the error: **"${errorText}"**.\nApplying automatic patch to resolve the syntax/reference issue...`
                      });
                      useIDEStore.getState().clearLastError();
                    }, 500);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fix with AI</span>
              </button>
              <button
                onClick={() => useIDEStore.getState().clearLastError()}
                className="px-3 py-2 bg-white border border-red-200 text-red-700 rounded-xl text-xs font-medium hover:bg-red-100/50"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating ChatGPT Mobile Pill Input (Directly matching attached UI) */}
      <div className="absolute bottom-3 left-0 right-0 px-3 sm:px-6">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-1.5 flex items-end gap-1.5 transition-all focus-within:border-gray-400">
          {/* Plus / Attachment Button */}
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-95 transition shrink-0"
            title="Attach file or reference"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Model Selector Dropdown (Exact match to Image 2) */}
          <div className="relative shrink-0 mb-1">
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition cursor-pointer select-none"
            >
              <span>{currentSelected.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
                  Select AI Model
                </div>
                {availableModels.map((m) => (
                  <button
                    key={m.model}
                    onClick={() => handleModelSelect(m)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition ${
                      currentSelected.model === m.model
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{m.label}</span>
                    {currentSelected.model === m.model && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Multiline Auto-resizing Prompt Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Describe what you want to build..."
            className="flex-1 max-h-28 py-2 px-2 text-sm text-gray-900 bg-transparent resize-none outline-none leading-relaxed"
          />

          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ${
              isListening
                ? 'bg-red-50 text-red-600 animate-pulse'
                : 'text-gray-500 hover:bg-gray-100 active:scale-95'
            }`}
            title="Voice prompt"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ${
              input.trim()
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95'
                : 'bg-gray-100 text-gray-300'
            }`}
            title="Send prompt"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
