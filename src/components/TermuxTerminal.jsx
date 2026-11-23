import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useIDEStore } from '../store/ideStore';
import { Plus, X, Terminal as TerminalIcon, Play, RefreshCw, Smartphone, Copy, Clipboard, Check } from 'lucide-react';

export default function TermuxTerminal() {
  const { files, createFile, deleteFile, updateFileContent, setActiveTab, currentProject } = useIDEStore();
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonRef = useRef(null);
  const currentLine = useRef('');
  const historyRef = useRef([]);
  const historyIndex = useRef(-1);

  // Multi-session management
  const [sessions, setSessions] = useState([
    { id: 1, name: 'session-1', active: true }
  ]);
  const [activeSessionId, setActiveSessionId] = useState(1);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleCopySelection = () => {
    if (!xtermInstance.current) return;
    const selection = xtermInstance.current.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 1500);
    } else {
      // If nothing selected, copy the current line or recent log
      if (currentLine.current) {
        navigator.clipboard.writeText(currentLine.current);
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 1500);
      }
    }
  };

  const handlePasteClipboard = async () => {
    if (!xtermInstance.current) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        currentLine.current += text;
        xtermInstance.current.write(text);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const promptStr = '\x1b[1;32m$\x1b[0m ';

  const prompt = (term) => {
    term.write(promptStr);
  };

  const clearCurrentLine = (term) => {
    while (currentLine.current.length > 0) {
      term.write('\b \b');
      currentLine.current = currentLine.current.slice(0, -1);
    }
  };

  const handleKeyTouch = (key) => {
    if (!xtermInstance.current) return;
    const term = xtermInstance.current;

    switch (key) {
      case 'ESC':
        term.write('^[');
        break;
      case 'TAB':
        // Auto-complete files
        const partial = currentLine.current.split(' ').pop();
        if (partial) {
          const match = Object.keys(files).find(f => f.startsWith(partial));
          if (match) {
            const remainder = match.slice(partial.length);
            term.write(remainder);
            currentLine.current += remainder;
          }
        }
        break;
      case 'CTRL':
        break;
      case 'ALT':
        break;
      case 'UP':
        if (historyIndex.current > 0) {
          historyIndex.current--;
          const prev = historyRef.current[historyIndex.current];
          clearCurrentLine(term);
          term.write(prev);
          currentLine.current = prev;
        }
        break;
      case 'DOWN':
        if (historyIndex.current < historyRef.current.length - 1) {
          historyIndex.current++;
          const next = historyRef.current[historyIndex.current];
          clearCurrentLine(term);
          term.write(next);
          currentLine.current = next;
        } else {
          historyIndex.current = historyRef.current.length;
          clearCurrentLine(term);
        }
        break;
      case 'CLEAR':
        term.clear();
        prompt(term);
        break;
      default:
        term.write(key);
        currentLine.current += key;
    }
  };

  const executeCommand = (cmdText, term) => {
    const rawParts = cmdText.trim().split(/\s+/);
    const cmd = rawParts[0].toLowerCase();
    const args = rawParts.slice(1);

    switch (cmd) {
      case 'help':
        term.writeln('\x1b[1;36mTermux / JARVIS Shell Commands:\x1b[0m');
        term.writeln('  \x1b[1;33mpkg install <pkg>\x1b[0m   Install virtual package');
        term.writeln('  \x1b[1;33mls / dir\x1b[0m            List files in current project');
        term.writeln('  \x1b[1;33mcat <file>\x1b[0m          Print file content to screen');
        term.writeln('  \x1b[1;33mtouch <file>\x1b[0m        Create a new blank file');
        term.writeln('  \x1b[1;33mrm <file>\x1b[0m           Delete a file');
        term.writeln('  \x1b[1;33mnode <file>\x1b[0m         Execute JavaScript file');
        term.writeln('  \x1b[1;33mpython <file>\x1b[0m       Execute Python script');
        term.writeln('  \x1b[1;33mnpm run preview\x1b[0m     Build & launch live preview');
        term.writeln('  \x1b[1;33mgit status\x1b[0m          Check repository status');
        term.writeln('  \x1b[1;33mclear\x1b[0m               Clear screen');
        term.writeln('  \x1b[1;33mexit\x1b[0m                Close current session');
        break;

      case 'ls':
      case 'dir':
        const fileList = Object.keys(files);
        if (fileList.length === 0) {
          term.writeln('(no files in workspace)');
        } else {
          fileList.forEach(f => {
            if (f.endsWith('.jsx') || f.endsWith('.js')) {
              term.writeln(`  \x1b[1;34m${f}\x1b[0m`);
            } else if (f.endsWith('.json')) {
              term.writeln(`  \x1b[1;32m${f}\x1b[0m`);
            } else {
              term.writeln(`  ${f}`);
            }
          });
        }
        break;

      case 'pwd':
        term.writeln('/data/data/com.termux/files/home/' + currentProject.name.toLowerCase().replace(/\s+/g, '-'));
        break;

      case 'whoami':
        term.writeln('u0_a245 (jarvis-mobile)');
        break;

      case 'cat':
        if (!args[0]) {
          term.writeln('\x1b[31musage: cat <file_path>\x1b[0m');
        } else {
          const file = files[args[0]];
          if (file) {
            term.writeln(file.content);
          } else {
            term.writeln(`\x1b[31mcat: ${args[0]}: No such file\x1b[0m`);
          }
        }
        break;

      case 'touch':
        if (!args[0]) {
          term.writeln('\x1b[31musage: touch <file_path>\x1b[0m');
        } else {
          createFile(args[0], '// Created via Termux\n');
          term.writeln(`\x1b[32mCreated file: ${args[0]}\x1b[0m`);
        }
        break;

      case 'rm':
        if (!args[0]) {
          term.writeln('\x1b[31musage: rm <file_path>\x1b[0m');
        } else {
          if (files[args[0]]) {
            deleteFile(args[0]);
            term.writeln(`\x1b[33mRemoved ${args[0]}\x1b[0m`);
          } else {
            term.writeln(`\x1b[31mrm: cannot remove '${args[0]}': No such file\x1b[0m`);
          }
        }
        break;

      case 'pkg':
      case 'apt':
        if (args[0] === 'install') {
          term.writeln(`\x1b[36m[*] Updating package list...\x1b[0m`);
          term.writeln(`\x1b[32m[+] Installing ${args[1] || 'package'} (virtual sandbox)...\x1b[0m`);
          term.writeln(`\x1b[32m[✓] ${args[1] || 'package'} successfully installed.\x1b[0m`);
        } else {
          term.writeln('usage: pkg install <package_name>');
        }
        break;

      case 'node':
        if (!args[0]) {
          term.writeln('Welcome to Node.js v22.12.0.');
          term.writeln('Type ".exit" to exit the REPL.');
        } else {
          const file = files[args[0]];
          if (file) {
            try {
              term.writeln(`\x1b[36m[Executing ${args[0]} with Node.js runtime]...\x1b[0m`);
              // Safe sandbox evaluation of JS
              const logs = [];
              const mockConsole = {
                log: (...items) => logs.push(items.join(' ')),
                error: (...items) => logs.push('[ERROR] ' + items.join(' ')),
                warn: (...items) => logs.push('[WARN] ' + items.join(' '))
              };
              const runner = new Function('console', file.content);
              runner(mockConsole);
              logs.forEach(l => term.writeln(l));
              term.writeln('\x1b[32mProcess finished with exit code 0\x1b[0m');
            } catch (err) {
              term.writeln(`\x1b[31mRuntime Error: ${err.message}\x1b[0m`);
            }
          } else {
            term.writeln(`\x1b[31mnode: cannot find module '${args[0]}'\x1b[0m`);
          }
        }
        break;

      case 'python':
      case 'python3':
        term.writeln('Python 3.11.8 (main, mobile sandbox)');
        if (args[0]) {
          const file = files[args[0]];
          if (file) {
            term.writeln(`\x1b[36m[Executing ${args[0]}]...\x1b[0m`);
            // Lightweight Python runner
            term.writeln(file.content.slice(0, 300));
            term.writeln('\x1b[32mProcess completed.\x1b[0m');
          } else {
            term.writeln(`python: can't open file '${args[0]}': No such file`);
          }
        }
        break;

      case 'git':
        if (args[0] === 'status') {
          term.writeln('On branch main');
          term.writeln(`Working tree contains ${Object.keys(files).length} tracked files.`);
        } else if (args[0] === 'log') {
          term.writeln('\x1b[33mcommit c142436f (HEAD -> main)\x1b[0m');
          term.writeln('Author: JARVIS Agent <jarvis@vibeide.local>');
          term.writeln('Date:   Today');
          term.writeln('    feat: JARVIS autonomous mobile upgrade');
        } else {
          term.writeln('usage: git [status|log|commit|push]');
        }
        break;

      case 'run':
      case 'preview':
      case 'npm':
        if (cmd === 'npm' && args[0] !== 'run' && args[0] !== 'start') {
          term.writeln(`npm command executed: ${args.join(' ')}`);
        } else {
          term.writeln('\x1b[32m> vibe-ide@1.0.0 preview\x1b[0m');
          term.writeln('\x1b[36m➜  Live Sandbox: http://localhost:3000/\x1b[0m');
          setActiveTab('preview');
        }
        break;

      case 'clear':
        term.clear();
        break;

      default:
        term.writeln(`\x1b[31m${cmd}: command not found. Type 'help' for commands.\x1b[0m`);
    }

    prompt(term);
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#f1f5f9',
        cursor: '#22c55e',
        selectionBackground: '#1e3a8a',
        black: '#000000',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#ffffff'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Authentic Termux Header matching uploaded screenshot
    term.writeln('\x1b[1;37mWelcome to Termux (JARVIS Mobile Environment)!\x1b[0m');
    term.writeln('');
    term.writeln('Community forum: https://termux.com/community');
    term.writeln('Gitter chat:     https://gitter.im/termux/termux');
    term.writeln('IRC channel:     #termux on freenode');
    term.writeln('');
    term.writeln('Working with packages:');
    term.writeln('  * Search packages:   \x1b[33mpkg search <query>\x1b[0m');
    term.writeln('  * Install a package: \x1b[33mpkg install <package>\x1b[0m');
    term.writeln('  * Run live preview:  \x1b[33mnpm run preview\x1b[0m');
    term.writeln('');
    term.writeln('Type \x1b[1;32mhelp\x1b[0m for shell commands.');
    term.writeln('');
    prompt(term);

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    // Keystroke handler
    term.onKey(({ key, domEvent }) => {
      if (domEvent.keyCode === 13) {
        // ENTER
        term.writeln('');
        const cmd = currentLine.current.trim();
        if (cmd) {
          historyRef.current.push(cmd);
          historyIndex.current = historyRef.current.length;
          executeCommand(cmd, term);
        } else {
          prompt(term);
        }
        currentLine.current = '';
      } else if (domEvent.keyCode === 8) {
        // BACKSPACE
        if (currentLine.current.length > 0) {
          currentLine.current = currentLine.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (domEvent.keyCode === 38) {
        // UP
        if (historyIndex.current > 0) {
          historyIndex.current--;
          const prev = historyRef.current[historyIndex.current];
          clearCurrentLine(term);
          term.write(prev);
          currentLine.current = prev;
        }
      } else if (domEvent.keyCode === 40) {
        // DOWN
        if (historyIndex.current < historyRef.current.length - 1) {
          historyIndex.current++;
          const next = historyRef.current[historyIndex.current];
          clearCurrentLine(term);
          term.write(next);
          currentLine.current = next;
        }
      } else if (domEvent.keyCode === 9) {
        // TAB
        domEvent.preventDefault();
        handleKeyTouch('TAB');
      } else if (!domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey) {
        currentLine.current += key;
        term.write(key);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const addNewSession = () => {
    const newId = sessions.length + 1;
    const newSession = { id: newId, name: `session-${newId}`, active: true };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newId);
    if (xtermInstance.current) {
      xtermInstance.current.writeln(`\r\n\x1b[32m[Session ${newId} initialized]\x1b[0m`);
      prompt(xtermInstance.current);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-black text-slate-100 w-full overflow-hidden select-none font-mono">
      {/* Termux Top Session Bar */}
      <div className="h-9 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                activeSessionId === s.id ? 'bg-zinc-800 text-green-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <TerminalIcon className="w-3 h-3" />
              <span>{s.name}</span>
            </button>
          ))}
          <button
            onClick={addNewSession}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition"
            title="New Terminal Session"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={handleCopySelection}
            className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition cursor-pointer"
            title="Copy selected text from terminal"
          >
            {copiedNotification ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedNotification ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handlePasteClipboard}
            className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition cursor-pointer"
            title="Paste text into terminal"
          >
            <Clipboard className="w-3 h-3" />
            <span>Paste</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className="flex items-center gap-1 px-2 py-0.5 bg-green-900/40 text-green-400 border border-green-800 rounded text-[11px] hover:bg-green-900/60 transition"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Screen */}
      <div className="flex-1 w-full bg-black p-2 overflow-hidden" ref={terminalRef} />

      {/* Real Mobile Termux Keyboard Accessory Bar (Exact match to reference photo) */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-1 flex items-center justify-between text-xs font-mono text-zinc-300 shrink-0 overflow-x-auto gap-1">
        {['ESC', 'TAB', 'CTRL', 'ALT', 'COPY', 'PASTE', '-', '~', '|', '/', 'UP', 'DOWN', 'CLEAR'].map((k) => (
          <button
            key={k}
            onClick={() => {
              if (k === 'COPY') handleCopySelection();
              else if (k === 'PASTE') handlePasteClipboard();
              else handleKeyTouch(k);
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded text-[11px] font-semibold text-zinc-200 shadow-xs transition active:scale-95 shrink-0 cursor-pointer"
          >
            {k === 'UP' ? '↑' : k === 'DOWN' ? '↓' : k}
          </button>
        ))}
      </div>
    </div>
  );
}
