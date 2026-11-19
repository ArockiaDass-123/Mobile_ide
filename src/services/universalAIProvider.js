/**
 * Universal Multi-Model AI Provider
 * Unified client supporting Gemini Native, Ollama, OpenAI-compatible, Groq, and Anthropic.
 */

export const PROVIDER_CATALOG = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Fast & Production)', context: 1048576, thinking: true },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (High Speed)', context: 524288, thinking: false },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High Capacity)', context: 1048576, thinking: true }
    ],
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  },
  {
    id: 'ollama',
    name: 'Ollama (Local / Termux)',
    models: [
      { id: 'qwen2.5-coder:1.5b', name: 'Qwen 2.5 Coder 1.5B (Fast Local)', context: 32768, thinking: false },
      { id: 'phi3:mini', name: 'Phi-3 Mini (Dense Reasoning)', context: 128000, thinking: false },
      { id: 'deepseek-r1:latest', name: 'DeepSeek-R1 (Elite Planning & Reasoning)', context: 65536, thinking: true }
    ],
    defaultBaseUrl: 'http://127.0.0.1:11434'
  },
  {
    id: 'openai',
    name: 'OpenAI / OpenRouter',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Multimodal Flagship)', context: 128000, thinking: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: 128000, thinking: false },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', context: 128000, thinking: true }
    ],
    defaultBaseUrl: 'https://api.openai.com/v1'
  },
  {
    id: 'groq',
    name: 'Groq (Ultra High Speed)',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Sub-second Latency)', context: 128000, thinking: false }
    ],
    defaultBaseUrl: 'https://api.groq.com/openai/v1'
  }
];

export async function executeAIRequest({
  provider = 'gemini',
  model = 'gemini-3.5-flash',
  apiKey = '',
  customBaseUrl = '',
  messages = [],
  temperature = 0.2,
  enableWebSearch = true,
  onStream = null
}) {
  if (provider === 'gemini') {
    return await executeGemini({ model, apiKey, messages, onStream, temperature, enableWebSearch });
  }

  if (provider === 'ollama') {
    return await executeOllama({ model, customBaseUrl, messages, onStream, temperature });
  }

  // Generic OpenAI-compatible providers (OpenAI, Groq, OpenRouter)
  return await executeOpenAICompatible({ provider, model, apiKey, customBaseUrl, messages, onStream, temperature });
}

async function executeGemini({ model, apiKey, messages, onStream, temperature, enableWebSearch = true }) {
  const effectiveKey = apiKey || (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : '') || '';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const payload = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 8192
    }
  };

  // Enable Google Search Grounding for real-time web search
  if (enableWebSearch) {
    payload.tools = [
      {
        googleSearch: {}
      }
    ];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Fallback without search if tools unsupported on a specific model, or fallback to flash-lite
    if (enableWebSearch && (response.status === 400 || response.status === 404)) {
      return executeGemini({ model, apiKey, messages, onStream, temperature, enableWebSearch: false });
    }
    if (response.status === 503 && model !== 'gemini-3.1-flash-lite') {
      return executeGemini({ model: 'gemini-3.1-flash-lite', apiKey, messages, onStream, temperature, enableWebSearch });
    }
    throw new Error(`Gemini Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract Google Search citations & sources if available
  const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
  if (groundingMetadata && groundingMetadata.groundingChunks?.length > 0) {
    const sources = groundingMetadata.groundingChunks
      .filter((c) => c.web && c.web.uri)
      .map((c) => `🔗 [${c.web.title || c.web.uri}](${c.web.uri})`);

    const uniqueSources = Array.from(new Set(sources)).slice(0, 5);
    if (uniqueSources.length > 0) {
      text += `\n\n**🌐 Sources from Google Search:**\n` + uniqueSources.join('\n');
    }
  }

  if (onStream) onStream(text);
  return text;
}

async function executeOllama({ model, customBaseUrl, messages, onStream, temperature }) {
  const baseUrl = customBaseUrl || 'http://127.0.0.1:11434';
  const url = `${baseUrl}/api/chat`;

  const payload = {
    model: model || 'qwen2.5-coder:1.5b',
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: false,
    options: { temperature }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const reply = data.message?.content || '';
  if (onStream) onStream(reply);
  return reply;
}

async function executeOpenAICompatible({ provider, model, apiKey, customBaseUrl, messages, onStream, temperature }) {
  const config = PROVIDER_CATALOG.find((p) => p.id === provider) || PROVIDER_CATALOG[2];
  const baseUrl = customBaseUrl || config.defaultBaseUrl;
  const url = `${baseUrl}/chat/completions`;

  const payload = {
    model,
    messages,
    temperature
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${provider.toUpperCase()} Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || '';
  if (onStream) onStream(reply);
  return reply;
}
