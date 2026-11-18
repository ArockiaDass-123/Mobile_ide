/**
 * Ollama Integration Service for Vibe IDE
 * Connects directly to local Ollama (http://127.0.0.1:11434) or remote network/Termux URL
 */

export async function generateWithOllama({
  baseUrl = 'http://127.0.0.1:11434',
  model = 'phi3:mini',
  prompt,
  systemInstruction = ''
}) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate`;

  const payload = {
    model: model,
    prompt: prompt,
    system: systemInstruction,
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
    const errorText = await response.text();
    throw new Error(`Ollama Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.response || '';
}
