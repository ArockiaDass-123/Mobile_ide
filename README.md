# Vibe IDE — Android-First AI Vibe Coding Platform

Vibe IDE is a fully client-side and cloud-deployable AI coding platform designed specifically to develop, run, test, and preview full-stack web applications directly from an Android smartphone browser or desktop.

---

## 🌟 Key Features

1. **Android Mobile-First Interface:**
   - Minimal ChatGPT-inspired conversation flow with auto-resizing bottom input dock.
   - Built-in **Web Speech API** for voice dictation prompts.
   - Touch-optimized symbol bar for typing brackets and code characters effortlessly on mobile.
   - PWA support ("Add to Home Screen" on Android Chrome).
   - Resilient viewport handling (`interactive-widget=resizes-content`) preventing keyboard overlap.

2. **Autonomous AI Planning Mode:**
   - Translates high-level natural language prompts into technical architectures, tech stacks, and phased roadmaps.
   - Enforces user approval before any code generation occurs.
   - Uses structured tool calling (`<<<TOOL_CALL:create_file>>>` / `<<<TOOL_CALL:update_file>>>`).

3. **Virtual File System (VFS) & IndexedDB Persistence:**
   - In-browser file management: Create, rename, delete, and switch between project files.
   - Code is automatically synced to browser IndexedDB (`idb-keyval`) so work survives tab discard or refresh.

4. **Zero-Backend In-Browser Execution Sandbox:**
   - Live preview runs via an isolated `iframe` with Babel Standalone, React 18/19, Tailwind CSS Play CDN, and Lucide icons.
   - Real-time `postMessage` console capturing `console.log`, `console.warn`, and runtime errors into a collapsible drawer.

5. **Self-Healing AI Debugger:**
   - Automatically detects errors in the preview sandbox.
   - One-tap "Auto-Fix with AI" feeds error stacks directly back to the model for automated code patches.

6. **Instant ZIP Export:**
   - Download the full project source code as a clean `.zip` archive ready for deployment or local execution.

---

## 🚀 Instant Deployment Guide (Zero Laptop Required)

You can deploy Vibe IDE directly from your Android phone using any of the following free hosting platforms:

### Option 1: Vercel (Recommended — Free Tier)
1. Push this repository to GitHub (or upload via GitHub mobile web).
2. Go to [vercel.com](https://vercel.com) on your Android phone and sign in.
3. Tap **"Add New"** > **"Project"** and select your repository (root directory: `ide-app`).
4. Framework Preset: **Vite**.
5. Tap **Deploy**. You will receive a permanent HTTPS URL (e.g., `https://vibe-ide.vercel.app`) within 60 seconds.

### Option 2: Render (Static Site — Free Tier)
1. Go to [render.com](https://render.com) on your phone.
2. Create a new **Static Site**.
3. Build Command: `npm run build`
4. Publish Directory: `dist`
5. Tap **Create Static Site**.

---

## 📱 How to Use on Your Android Phone

1. Open your deployed HTTPS URL in **Chrome for Android**.
2. Tap the Chrome three-dot menu (⋮) and select **"Add to Home Screen"** (or **"Install App"**).
3. Tap the top-right **AI Provider** icon to enter your API key (Groq, OpenRouter, OpenAI, or a custom Ollama tunnel URL).
4. Tap the microphone icon to dictate your app idea or type in normal English.
5. Review the AI's **Development Roadmap**, tap **"Approve Plan & Begin Phase 1"**, and watch your app build and run live in the **Preview** tab!
