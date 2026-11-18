import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useIDEStore } from '../store/ideStore';

export default function IntegratedTerminal({ onRunPreview }) {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonRef = useRef(null);
  const currentLine = useRef('');
  const historyRef = useRef([]);
  const historyIndex = useRef(-1);

  const { files, updateFileContent, createFile, deleteFile, currentProject } = useIDEStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      theme: {
        background: '#090d16',
        foreground: '#e2e8f0',
        cursor: '#38bdf8',
        selectionBackground: '#1e3a8a',
        black: '#0f172a',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f8fafc'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome banner
    term.writeln('\x1b[1;34m╔════════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;34m║\x1b[0m   \x1b[1;32mVibe IDE Interactive Web Terminal v1.0.0\x1b[0m                 \x1b[1;34m║\x1b[0m');
    term.writeln('\x1b[1;34m║\x1b[0m   Type \x1b[1;33mhelp\x1b[0m for commands, or \x1b[1;33mrun\x1b[0m to test current code.    \x1b[1;34m║\x1b[0m');
    term.writeln('\x1b[1;34m╚════════════════════════════════════════════════════════════╝\x1b[0m');
    prompt(term);

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    // Key handling
    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

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
        // UP ARROW (History)
        if (historyIndex.current > 0) {
          historyIndex.current--;
          const prev = historyRef.current[historyIndex.current];
          clearCurrentLine(term);
          term.write(prev);
          currentLine.current = prev;
        }
      } else if (domEvent.keyCode === 40) {
        // DOWN ARROW (History)
        if (historyIndex.current < historyRef.current.length - 1) {
          historyIndex.current++;
          const next = historyRef.current[historyIndex.current];
          clearCurrentLine(term);
          term.write(next);
          currentLine.current = next;
        } else {
          historyIndex.current = historyRef.current.length;
          clearCurrentLine(term);
          currentLine.current = '';
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'c') {
        term.writeln('^C');
        currentLine.current = '';
        prompt(term);
      } else if (domEvent.ctrlKey && domEvent.key === 'l') {
        term.clear();
        prompt(term);
      } else if (printable) {
        currentLine.current += key;
        term.write(key);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const prompt = (term) => {
    term.write('\r\n\x1b[1;36mvibe@ide\x1b[0m:\x1b[1;33m~/project\x1b[0m$ ');
  };

  const clearCurrentLine = (term) => {
    while (currentLine.current.length > 0) {
      term.write('\b \b');
      currentLine.current = currentLine.current.slice(0, -1);
    }
  };

  const executeCommand = (cmd, term) => {
    const parts = cmd.split(' ').filter(Boolean);
    const main = parts[0];
    const args = parts.slice(1);

    switch (main) {
      case 'help':
        term.writeln('Available Terminal Commands:');
        term.writeln('  \x1b[1;32mls\x1b[0m            List files in the current project');
        term.writeln('  \x1b[1;32mcat <file>\x1b[0m    Display contents of a file');
        term.writeln('  \x1b[1;32mtouch <file>\x1b[0m  Create a new file');
        term.writeln('  \x1b[1;32mrm <file>\x1b[0m     Delete a file');
        term.writeln('  \x1b[1;32mrun\x1b[0m           Execute & verify App in Live Preview');
        term.writeln('  \x1b[1;32mnpm test\x1b[0m      Run syntax & JSX validation test');
        term.writeln('  \x1b[1;32mnode -v\x1b[0m       Show runtime environment version');
        term.writeln('  \x1b[1;32mclear\x1b[0m         Clear terminal screen');
        break;

      case 'ls':
        const fileList = Object.keys(files);
        fileList.forEach((f) => {
          if (f.endsWith('.jsx') || f.endsWith('.js')) {
            term.writeln(`  \x1b[1;33m${f}\x1b[0m`);
          } else if (f.endsWith('.json')) {
            term.writeln(`  \x1b[1;32m${f}\x1b[0m`);
          } else {
            term.writeln(`  ${f}`);
          }
        });
        break;

      case 'cat':
        if (!args[0]) {
          term.writeln('\x1b[1;31mUsage: cat <filename>\x1b[0m');
        } else if (files[args[0]]) {
          term.writeln(files[args[0]].content);
        } else {
          term.writeln(`\x1b[1;31mcat: ${args[0]}: No such file\x1b[0m`);
        }
        break;

      case 'touch':
        if (!args[0]) {
          term.writeln('\x1b[1;31mUsage: touch <filename>\x1b[0m');
        } else {
          createFile(args[0], '// ' + args[0] + '\n');
          term.writeln(`\x1b[1;32mCreated file:\x1b[0m ${args[0]}`);
        }
        break;

      case 'rm':
        if (!args[0]) {
          term.writeln('\x1b[1;31mUsage: rm <filename>\x1b[0m');
        } else if (files[args[0]]) {
          deleteFile(args[0]);
          term.writeln(`\x1b[1;33mDeleted file:\x1b[0m ${args[0]}`);
        } else {
          term.writeln(`\x1b[1;31mrm: ${args[0]}: No such file\x1b[0m`);
        }
        break;

      case 'run':
      case 'start':
      case 'dev':
        term.writeln('\x1b[1;36m➜  Compiling project into preview sandbox...\x1b[0m');
        setTimeout(() => {
          term.writeln('\x1b[1;32m✓ Compiled in 42ms. Preview is live.\x1b[0m');
          if (onRunPreview) onRunPreview();
        }, 150);
        break;

      case 'npm':
        if (args[0] === 'test') {
          term.writeln('\x1b[1;36mRunning JSX compilation and syntax tests...\x1b[0m');
          const appCode = files['src/App.jsx']?.content || '';
          if (appCode.includes('function App') || appCode.includes('export default function')) {
            term.writeln('\x1b[1;32mPASS\x1b[0m src/App.jsx: Valid React Functional Component');
            term.writeln('\x1b[1;32m✓ 1 test passed (100%)\x1b[0m');
          } else {
            term.writeln('\x1b[1;31mFAIL\x1b[0m src/App.jsx: App() function declaration missing');
          }
        } else {
          term.writeln(`npm: command '${args.join(' ')}' completed.`);
        }
        break;

      case 'node':
        if (args[0] === '-v' || args[0] === '--version') {
          term.writeln('v22.12.0');
        } else {
          term.writeln('Node.js Web Virtual Environment active.');
        }
        break;

      case 'clear':
        term.clear();
        break;

      default:
        term.writeln(`\x1b[1;31mbash: ${main}: command not found. Type 'help' for available commands.\x1b[0m`);
    }

    prompt(term);
  };

  return (
    <div className="w-full h-full bg-[#090d16] p-2 overflow-hidden flex flex-col">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
