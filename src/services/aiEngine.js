/**
 * Universal AI Engine Client for Vibe IDE
 * Supports: OpenAI, Groq, OpenRouter, DeepSeek, Anthropic, and custom Ollama endpoints.
 */

export const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini (Gemini 3.5 Flash - Stable & Fast)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-3.5-flash',
    fallbackModels: ['gemini-3.1-flash-lite', 'gemini-3.8-flash']
  },
  ollama: {
    name: 'Ollama (Local / Mobile Termux / Remote URL)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'qwen2.5-coder', 'deepseek-r1', 'codellama']
  },
  groq: {
    name: 'Groq (Llama 3.3 70B - High Speed)',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile'
  },
  openrouter: {
    name: 'OpenRouter (Multi-model)',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free'
  },
  openai: {
    name: 'OpenAI (GPT-4o-mini)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini'
  }
};

/**
 * System Prompt instructing the model to behave as an autonomous Vibe Coding Architect & Engineer.
 */
export const SYSTEM_PROMPT = `You are VibeCoder AI, an expert Full-Stack Software Architect and Autonomous Developer.
Your role is to build complete, functional web applications (React + Tailwind CSS) based on user prompts.

CRITICAL WORKFLOW:
1. When receiving a user's new project request, FIRST enter PLANNING MODE.
   Respond with a clear project overview, technology stack, directory layout, and 3-5 distinct development phases.
   Format this plan cleanly with markdown.
2. Ask for the user's confirmation before writing code, OR if given a phased instruction, execute that exact phase.
3. When generating or modifying code, use the structured tool call format:
   <<<TOOL_CALL:create_file>>>
   {"path": "src/App.jsx", "content": "..."}
   <<<END_TOOL_CALL>>>

Available Tool Actions:
- create_file: {"path": string, "content": string}
- update_file: {"path": string, "content": string}
- delete_file: {"path": string}

Never output pseudo-code or placeholders like "// TODO" or "// Implement later". Output complete, robust, beautiful React 19 + Tailwind CSS code.
`;

/**
 * Stream completion from an OpenAI-compatible endpoint.
 */
export async function streamAICompletion({
  provider = 'gemini',
  apiKey = '',
  customBaseUrl = '',
  model = '',
  messages = [],
  onChunk = () => {},
  onToolCall = () => {}
}) {
  const providerConfig = AI_PROVIDERS[provider] || AI_PROVIDERS.gemini;
  const endpoint = `${customBaseUrl || providerConfig.baseUrl}/chat/completions`;
  const primaryModel = model || providerConfig.defaultModel;

  const candidateModels = provider === 'gemini' 
    ? [primaryModel, ...(providerConfig.fallbackModels || [])]
    : [primaryModel];

  let lastError = null;

  for (const currentModel of candidateModels) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const payload = {
        model: currentModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.3,
        stream: true
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        // If 503 (Overloaded) or 404, try next candidate model
        if ((response.status === 503 || response.status === 404) && candidateModels.length > 1) {
          console.warn(`Model ${currentModel} failed with ${response.status}. Trying next fallback model...`);
          lastError = new Error(`Model ${currentModel} returned ${response.status}: ${errText}`);
          continue;
        }
        throw new Error(`API Error (${response.status}): ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.replace('data: ', '');
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onChunk(delta, fullText);
            }
          } catch (e) {
            // ignore chunk parse issues
          }
        }
      }

      parseToolCalls(fullText, onToolCall);
      return fullText;
    } catch (err) {
      lastError = err;
      if (candidateModels.indexOf(currentModel) === candidateModels.length - 1) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('All model endpoints unavailable.');
}

/**
 * Extract structured tool calls from generated text.
 */
export function parseToolCalls(text, onToolCall) {
  const toolCallRegex = /<<<TOOL_CALL:([a-zA-Z_]+)>>>\s*([\s\S]*?)\s*<<<END_TOOL_CALL>>>/g;
  let match;
  while ((match = toolCallRegex.exec(text)) !== null) {
    const action = match[1];
    const rawPayload = match[2];
    try {
      const data = JSON.parse(rawPayload);
      onToolCall({ action, data });
    } catch (e) {
      console.warn('Failed to parse tool call JSON payload:', rawPayload);
    }
  }
}
