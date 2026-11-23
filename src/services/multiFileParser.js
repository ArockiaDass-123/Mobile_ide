/**
 * Robust Multi-File Code & Tool Parser for Qwen / Gemini / Claude / Ollama
 * Handles:
 * 1. Explicit <<<TOOL_CALL:create_file>>> or <<<TOOL_CALL:update_file>>>
 * 2. Markdown blocks with filenames: ### File: src/App.jsx or File: style.css
 * 3. Fenced code blocks with language/filename: ```html:index.html or ```css:style.css
 * 4. Generic language code blocks (html, css, js/jsx)
 * 5. Sanitizes and unescapes any tool-call or JSON escape artifacts (\n, \", etc.)
 */

export function cleanFilePath(p) {
  if (!p) return 'src/App.jsx';
  let clean = p.replace(/[`*"'=:]/g, '').trim();
  clean = clean.replace(/^[./\\]+/, '');
  clean = clean.replace(/[/\\]+/g, '/');

  // Normalize App.jsx variations to standard src/App.jsx
  if (clean === 'App.jsx' || clean === 'App.js' || clean === 'src/App.js' || clean === './App.jsx') {
    return 'src/App.jsx';
  }
  return clean || 'src/App.jsx';
}

/**
 * Strips any leftover tool-call wrappers, JSON stringification, or escaped newlines
 */
export function sanitizeCodeContent(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();

  // If wrapped in or contains <<<TOOL_CALL:...>>>
  if (str.includes('<<<TOOL_CALL') || str.includes('<<<END_TOOL_CALL>>>')) {
    // Check if there is a JSON "content": "..." block
    const contentMatch = str.match(/"content"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"path"|\}\s*<<<END_TOOL_CALL>>>|\}$)/);
    if (contentMatch) {
      str = contentMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else {
      str = str
        .replace(/<<<TOOL_CALL:[a-zA-Z0-9_]+>>>/g, '')
        .replace(/<<<END_TOOL_CALL>>>/g, '')
        .trim();
    }
  }

  // If it's a raw JSON object string like {"path": "...", "content": "..."}
  if (str.startsWith('{') && str.includes('"content"')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed.content) str = parsed.content;
    } catch (e) {
      const contentMatch = str.match(/"content"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"path"|\}$)/);
      if (contentMatch) {
        str = contentMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
    }
  }

  // Strip any residual tool markers
  str = str
    .replace(/<<<TOOL_CALL:[a-zA-Z0-9_]+>>>/g, '')
    .replace(/<<<END_TOOL_CALL>>>/g, '')
    .trim();

  // If code contains literal \n instead of real newlines and has no real newlines
  if (str.includes('\\n') && !str.includes('\n')) {
    str = str.replace(/\\n/g, '\n');
  }

  return str;
}

export function parseMultiFileResponse(rawResponse) {
  if (!rawResponse || typeof rawResponse !== 'string') return [];

  const files = [];

  // 1. Check for explicit JSON tool calls <<<TOOL_CALL:create_file>>> or <<<TOOL_CALL:update_file>>>
  const toolCallRegex = /<<<TOOL_CALL:(?:create_file|update_file)>>>([\s\S]*?)<<<END_TOOL_CALL>>>/gi;
  let match;
  while ((match = toolCallRegex.exec(rawResponse)) !== null) {
    const rawBlock = match[1].trim();
    try {
      const parsed = JSON.parse(rawBlock);
      if (parsed.path && parsed.content) {
        files.push({
          path: cleanFilePath(parsed.path),
          content: sanitizeCodeContent(parsed.content)
        });
        continue;
      }
    } catch (e) {
      // JSON.parse failed (likely unescaped newlines/quotes from small LLM)
      const pathMatch = rawBlock.match(/"path"\s*:\s*"([^"]+)"/);
      const contentMatch = rawBlock.match(/"content"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"path"|\}$)/);
      if (pathMatch && contentMatch) {
        files.push({
          path: cleanFilePath(pathMatch[1]),
          content: sanitizeCodeContent(contentMatch[1])
        });
        continue;
      }
    }
  }

  if (files.length > 0) return files;

  // 2. Check for File header markers, e.g.:
  // ### File: src/App.jsx
  // ```jsx ... ```
  // OR === style.css ===
  const fileHeaderRegex = /(?:###?\s*(?:File:\s*)?|===\s*|---\s*|\*\*File:\s*\*\*|File:\s*)([\w./-]+\.(?:html|jsx|js|css|json|ts|tsx))[\s:=]*\n```(?:html|css|javascript|jsx|js|json|tsx|ts)?\s*([\s\S]*?)```/gi;
  while ((match = fileHeaderRegex.exec(rawResponse)) !== null) {
    const filePath = cleanFilePath(match[1]);
    const fileContent = sanitizeCodeContent(match[2]);
    if (filePath && fileContent) {
      files.push({ path: filePath, content: fileContent });
    }
  }

  if (files.length > 0) return files;

  // 3. Check for fenced code blocks with language/filename: ```html:index.html or ```css:style.css
  const fencedNamedRegex = /```(?:html|css|javascript|jsx|js|json)[:\s]+([\w./-]+\.(?:html|jsx|js|css|json))\s*([\s\S]*?)```/gi;
  while ((match = fencedNamedRegex.exec(rawResponse)) !== null) {
    const filePath = cleanFilePath(match[1]);
    const fileContent = sanitizeCodeContent(match[2]);
    if (filePath && fileContent) {
      files.push({ path: filePath, content: fileContent });
    }
  }

  if (files.length > 0) return files;

  // 4. Intelligent generic code block extraction:
  // If the response contains markdown blocks for html, css, js
  const genericBlockRegex = /```(html|css|javascript|jsx|js)\s*([\s\S]*?)```/gi;
  const blocks = [];
  while ((match = genericBlockRegex.exec(rawResponse)) !== null) {
    blocks.push({
      lang: match[1].toLowerCase(),
      content: sanitizeCodeContent(match[2])
    });
  }

  if (blocks.length > 0) {
    for (const b of blocks) {
      if (b.lang === 'html') {
        files.push({ path: 'src/App.jsx', content: b.content });
      } else if (b.lang === 'css') {
        files.push({ path: 'style.css', content: b.content });
      } else if (b.lang === 'javascript' || b.lang === 'js') {
        if (b.content.includes('function App') || b.content.includes('return') || b.content.includes('React')) {
          files.push({ path: 'src/App.jsx', content: b.content });
        } else {
          files.push({ path: 'script.js', content: b.content });
        }
      } else if (b.lang === 'jsx') {
        files.push({ path: 'src/App.jsx', content: b.content });
      }
    }
  }

  if (files.length > 0) return files;

  // 5. Ultimate Fallback: Direct code string (strip conversational prefixes)
  let cleanCode = sanitizeCodeContent(rawResponse.replace(/```(?:html|css|javascript|jsx|js)?/g, '').replace(/```/g, '').trim());

  const htmlStart = cleanCode.indexOf('<!DOCTYPE html');
  if (htmlStart !== -1) {
    cleanCode = cleanCode.slice(htmlStart);
    files.push({ path: 'src/App.jsx', content: cleanCode });
    return files;
  }

  const funcStart = cleanCode.indexOf('function App');
  if (funcStart !== -1) {
    cleanCode = cleanCode.slice(funcStart);
    files.push({ path: 'src/App.jsx', content: cleanCode });
    return files;
  }

  files.push({ path: 'src/App.jsx', content: cleanCode });
  return files;
}
