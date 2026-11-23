/**
 * JARVIS Tamil & English Intent Engine
 * Interprets natural voice commands in Tamil, Tanglish, and English.
 */

export function parseJarvisIntent(spokenText) {
  if (!spokenText) return { intent: 'UNKNOWN', text: '' };

  const raw = spokenText.trim();
  const lower = raw.toLowerCase();

  // 1. Phone Call Intent (e.g. "Amma-ku call pannu", "Call Mom", "Phone call pannu Appa-ku")
  const callMatch = lower.match(/(?:call\s+(?:pannu|podu)?\s*([a-zA-Z0-9\s]+)|([a-zA-Z0-9\s]+)(?:-ku|-kku|kku|ku)?\s*call\s*(?:pannu|podu)?)/i);
  if (lower.includes('call') || lower.includes('phone') || lower.includes('pesu')) {
    let target = 'Amma';
    if (lower.includes('amma') || lower.includes('mom') || lower.includes('mother')) target = 'Amma';
    else if (lower.includes('appa') || lower.includes('dad') || lower.includes('father')) target = 'Appa';
    else if (lower.includes('thambi') || lower.includes('brother')) target = 'Brother';
    else if (callMatch) {
      target = (callMatch[1] || callMatch[2] || 'Contact').trim().replace(/-?k?ku$/i, '');
    }

    return {
      intent: 'MAKE_CALL',
      target: target || 'Amma',
      confidence: 0.95,
      requiresConfirmation: true,
      originalText: raw
    };
  }

  // 2. Navigation to IDE / Terminal / Preview
  if (lower.includes('terminal') || lower.includes('termux') || lower.includes('shell')) {
    return { intent: 'NAVIGATE', destination: 'terminal', originalText: raw };
  }
  if (lower.includes('ide') || lower.includes('code') || lower.includes('editor')) {
    return { intent: 'NAVIGATE', destination: 'code', originalText: raw };
  }
  if (lower.includes('preview') || lower.includes('app paaru') || lower.includes('run')) {
    return { intent: 'NAVIGATE', destination: 'preview', originalText: raw };
  }
  if (lower.includes('chat') || lower.includes('assistant')) {
    return { intent: 'NAVIGATE', destination: 'chat', originalText: raw };
  }

  // 3. Attention / Status Check ("Attention pannu", "Jarvis attention", "Are you listening?")
  if (lower.includes('attention') || lower.includes('status') || lower.includes('irukiya') || lower.includes('online')) {
    return {
      intent: 'ATTENTION',
      responseTamil: 'Vanakkam! Naan unga kooda thaan iruken. Enna pannanum sollunga?',
      responseEnglish: 'Yes sir, I am online and listening. What can I do for you?',
      originalText: raw
    };
  }

  // 4. Autonomous Coding Task ("Restaurant website create pannu", "Build a calculator", "Create portfolio")
  if (
    lower.includes('create') ||
    lower.includes('build') ||
    lower.includes('make') ||
    lower.includes('pannu') ||
    lower.includes('website') ||
    lower.includes('app')
  ) {
    const cleanPrompt = raw
      .replace(/^jarvis\s*/i, '')
      .replace(/\s*create\s*pannu/i, '')
      .replace(/\s*pannu/i, '');

    return {
      intent: 'START_CODING',
      prompt: cleanPrompt || raw,
      originalText: raw
    };
  }

  // Default: General Query
  return {
    intent: 'GENERAL_QUERY',
    text: raw,
    originalText: raw
  };
}
