/**
 * Multi-Model Service: Direct Native Connection to Ollama and Gemini
 */
import { generateWithGemini } from './geminiNative';

export async function generateAppCode({
  provider = 'ollama',
  model = 'qwen2.5-coder:1.5b',
  apiKey = '',
  prompt
}) {
  if (provider === 'gemini') {
    return await generateWithGemini({
      apiKey,
      model,
      prompt
    });
  }

  // Direct connection to local Ollama with CORS support
  const endpoint = 'http://127.0.0.1:11434/api/generate';
  const payload = {
    model: model || 'qwen2.5-coder:1.5b',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.2
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.response || '';
}
