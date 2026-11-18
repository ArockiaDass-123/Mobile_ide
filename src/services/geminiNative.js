/**
 * Direct Native Google Gemini API Engine
 * Calls https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 * 100% reliable, low-latency, and specifically designed for Google AI Studio keys.
 */

export const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini (Gemini 3.5 Flash)',
    defaultModel: 'gemini-3.5-flash'
  },
  ollama: {
    name: 'Ollama (Local / Custom URL)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2'
  }
};

/**
 * Generate code or conversational chat using Native Gemini API
 */
export async function generateWithGemini({
  apiKey,
  model = 'gemini-3.5-flash',
  prompt,
  systemInstruction = ''
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}
