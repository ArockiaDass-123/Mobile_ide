/**
 * Autonomous Multi-Agent Orchestrator
 * Coordinates Planner, Developer, Code Reviewer, Debugger, and Tester.
 */

import { executeAIRequest } from './universalAIProvider';
import { memoryManager } from './memoryService';
import { useIDEStore } from '../store/ideStore';

export class AgentOrchestrator {
  /**
   * 1. Planner Agent: Decomposes natural language into technical roadmap & file plan
   */
  static async planProject({ prompt, aiConfig }) {
    const store = useIDEStore.getState();
    store.setCurrentAgent({
      role: 'planner',
      name: 'Planner Agent',
      status: 'Analyzing architecture and planning files...',
      progress: 25,
      activeTool: 'plan_architecture'
    });

    const planningPrompt = `You are a Principal Software Architect.
Analyze this application request: "${prompt}".
Produce a structured technical implementation plan.
Return a STRICT JSON response (no markdown, no code fences, only valid JSON) matching this schema:
{
  "overview": "Brief architectural summary",
  "techStack": ["React 18", "Tailwind CSS", "Lucide Icons"],
  "phases": [
    { "id": 1, "title": "Phase 1: Component Layout", "description": "Configure base App and navigation", "status": "pending" },
    { "id": 2, "title": "Phase 2: Core State & Features", "description": "Implement state, cards, and interactions", "status": "pending" },
    { "id": 3, "title": "Phase 3: Quality Review", "description": "Verify responsive styling and error handling", "status": "pending" }
  ],
  "fileBlueprint": [
    { "path": "src/App.jsx", "purpose": "Main root layout and container" }
  ]
}`;

    const rawResponse = await executeAIRequest({
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.apiKey,
      customBaseUrl: aiConfig.customBaseUrl,
      messages: [{ role: 'user', content: planningPrompt }]
    });

    try {
      const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      store.setCurrentAgent({ role: 'idle', status: 'Plan Ready for Review', progress: 100 });
      return parsed;
    } catch (e) {
      // Fallback structured plan if JSON parse fails
      return {
        overview: prompt,
        techStack: ['React 18', 'Tailwind CSS', 'Vite'],
        phases: [
          { id: 1, title: 'Phase 1: Architecture & Layout', description: 'Setup components and theme', status: 'pending' },
          { id: 2, title: 'Phase 2: Interactive Features', description: 'Build stateful views and actions', status: 'pending' },
          { id: 3, title: 'Phase 3: Sandbox Verification', description: 'Verify rendering and error handling', status: 'pending' }
        ],
        fileBlueprint: [{ path: 'src/App.jsx', purpose: 'Root application' }]
      };
    }
  }

  /**
   * 2. Developer Agent: Writes code across components using structured tool calls
   */
  static async developProject({ prompt, blueprint = [], aiConfig }) {
    const store = useIDEStore.getState();
    store.setCurrentAgent({
      role: 'developer',
      name: 'Developer Agent',
      status: 'Writing production code...',
      progress: 50,
      activeTool: 'write_code'
    });

    const devPrompt = `You are a Senior React Developer.
Task: Write the complete, production-ready React component App() for: "${prompt}".
Requirements:
1. Write a complete function App() using React and Tailwind CSS.
2. DO NOT import React, useState, or any packages (React hooks are provided globally in the sandbox).
3. DO NOT import external CSS files like './App.css'.
4. Include interactive state, click handlers, and modern Tailwind design.
5. Output ONLY the code inside:
<<<TOOL_CALL:create_file>>>
{"path": "src/App.jsx", "content": "function App() {\\n  return (<div className=\\"min-h-screen bg-slate-900 text-white p-6\\">...</div>);\\n}\\nexport default App;"}
<<<END_TOOL_CALL>>>
If you cannot output JSON, simply write the code directly starting with:
function App() { ... }
export default App;`;

    const codeResult = await executeAIRequest({
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.apiKey,
      customBaseUrl: aiConfig.customBaseUrl,
      messages: [{ role: 'user', content: devPrompt }]
    });

    // Parse tool calls
    const toolRegex = /<<<TOOL_CALL:create_file>>>([\s\S]*?)<<<END_TOOL_CALL>>>/g;
    let match;
    const generatedFiles = [];

    while ((match = toolRegex.exec(codeResult)) !== null) {
      try {
        const fileData = JSON.parse(match[1].trim());
        generatedFiles.push(fileData);
      } catch (e) {}
    }

    if (generatedFiles.length === 0) {
      // Direct raw code fallback
      let rawCode = codeResult.replace(/```(?:jsx|javascript|tsx|js)?/g, '').replace(/```/g, '').trim();
      generatedFiles.push({ path: 'src/App.jsx', content: rawCode });
    }

    // Stage changes for Code Reviewer Agent
    for (const file of generatedFiles) {
      const oldContent = store.files[file.path]?.content || '';
      store.addPendingDiff({
        id: 'diff_' + Date.now() + Math.random().toString(36).substring(5),
        path: file.path,
        oldContent,
        newContent: file.content,
        diffSummary: `Generated full component implementation (${file.content.length} bytes)`,
        status: 'pending'
      });
    }

    store.setCurrentAgent({
      role: 'reviewer',
      name: 'Code Reviewer Agent',
      status: 'Reviewing code diffs...',
      progress: 75,
      activeTool: 'review_diff'
    });

    return generatedFiles;
  }

  /**
   * 3. Debugger Agent: Self-heals runtime errors caught by the sandbox
   */
  static async fixError({ errorText, aiConfig }) {
    const store = useIDEStore.getState();
    store.setCurrentAgent({
      role: 'debugger',
      name: 'Debugger Agent',
      status: 'Diagnosing runtime error...',
      progress: 50,
      activeTool: 'inspect_stack'
    });

    const currentCode = store.files['src/App.jsx']?.content || '';

    const debugPrompt = `You are an expert React Debugger.
The sandbox crashed with this error:
"${errorText}"

Current src/App.jsx code:
\`\`\`jsx
${currentCode}
\`\`\`

Identify the root cause, fix it, and return the corrected complete code inside:
<<<TOOL_CALL:update_file>>>
{"path": "src/App.jsx", "content": "..."}
<<<END_TOOL_CALL>>>`;

    const fixResult = await executeAIRequest({
      provider: aiConfig.provider,
      model: aiConfig.model,
      apiKey: aiConfig.apiKey,
      customBaseUrl: aiConfig.customBaseUrl,
      messages: [{ role: 'user', content: debugPrompt }]
    });

    const match = fixResult.match(/<<<TOOL_CALL:update_file>>>([\s\S]*?)<<<END_TOOL_CALL>>>/);
    if (match) {
      try {
        const data = JSON.parse(match[1].trim());
        store.updateFileContent(data.path, data.content);
        store.clearLastError();
        store.setCurrentAgent({ role: 'idle', status: 'Error Patched Successfully', progress: 100 });
        return true;
      } catch (e) {}
    }

    return false;
  }
}
