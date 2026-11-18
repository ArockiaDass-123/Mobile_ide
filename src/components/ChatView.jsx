import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../store/ideStore';
import { Plus, Mic, MicOff, ArrowUp, Sparkles, CheckCircle2, ChevronRight, Layers, Loader2 } from 'lucide-react';
import { streamAICompletion } from '../services/aiEngine';

export default function ChatView() {
  const {
    messages,
    addMessage,
    updateStreamingMessage,
    planningPhase,
    setPlanningPhase,
    setActiveTab,
    aiConfig,
    isStreaming,
    setIsStreaming,
    updateFileContent
  } = useIDEStore();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, planningPhase]);

  // Adjust textarea height dynamically to prevent keyboard overflow on mobile
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Voice Input (Web Speech API for Android Mobile Chrome)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
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

    // Check if user has provided an API key or if using local ollama
    if (!aiConfig.apiKey && aiConfig.provider !== 'ollama') {
      // Simulate intelligent planning mode response directly if no API key is entered yet
      setTimeout(() => {
        setPlanningPhase({
          isActive: true,
          isApproved: false,
          overview: `Architecture plan formulated for: "${userText}"`,
          techStack: ['React 19', 'Tailwind CSS', 'Vite', 'Lucide Icons'],
          phases: [
            { id: 1, title: 'Phase 1: Project Skeleton & Responsive Layout', status: 'ready', description: 'Configure React components, dark/light theme, and main container.' },
            { id: 2, title: 'Phase 2: Interactive Features & State Binding', status: 'pending', description: 'Build interactive cards, filters, and dynamic user actions.' },
            { id: 3, title: 'Phase 3: Runtime Verification & Build Test', status: 'pending', description: 'Compile preview sandbox and verify zero runtime errors.' }
          ]
        });

        addMessage({
          role: 'assistant',
          content: `I have analyzed your request: **"${userText}"** and entered **Planning Mode**.\n\nPlease review the architectural roadmap above. Once approved, I will implement Phase 1.\n\n*(Note: You can connect your live Groq, OpenAI, or OpenRouter API key in the top right menu to enable full live streaming code generation).*`
        });
      }, 600);
      return;
    }

    // Call live AI Engine with streaming
    setIsStreaming(true);
    const streamMsgId = 'stream_' + Date.now();
    addMessage({
      id: streamMsgId,
      role: 'assistant',
      content: 'Thinking and planning project...'
    });

    try {
      await streamAICompletion({
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        customBaseUrl: aiConfig.customBaseUrl,
        model: aiConfig.model,
        messages: [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userText }
        ],
        onChunk: (chunk, fullText) => {
          updateStreamingMessage(streamMsgId, fullText);
        },
        onToolCall: ({ action, data }) => {
          if (action === 'create_file' || action === 'update_file') {
            if (data.path && data.content) {
              updateFileContent(data.path, data.content);
            }
          }
        }
      });
    } catch (err) {
      updateStreamingMessage(
        streamMsgId,
        `⚠️ AI Error: ${err.message}. Please verify your API key and provider in settings.`
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const approvePlan = () => {
    setPlanningPhase({
      ...planningPhase,
      isApproved: true,
      phases: planningPhase.phases.map((p, idx) => idx === 0 ? { ...p, status: 'in-progress' } : p)
    });

    addMessage({
      role: 'assistant',
      content: `Plan approved! Now building **Phase 1: Project Setup & Layout Foundation**...`
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-white max-w-4xl mx-auto w-full relative">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-gray-100/90 text-gray-800 rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div
                className={`text-[10px] mt-1.5 ${
                  msg.role === 'user' ? 'text-blue-200 text-right' : 'text-gray-400'
                }`}
              >
                {msg.timestamp}
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition"
              >
                <span>Approve Plan & Begin Phase 1</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                <span>Phase 1 implementation in progress...</span>
                <button
                  onClick={() => setActiveTab('code')}
                  className="underline font-semibold"
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
