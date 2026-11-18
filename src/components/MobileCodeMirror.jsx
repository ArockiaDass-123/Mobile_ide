import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';

export default function MobileCodeMirror({
  content = '',
  filePath = 'src/App.jsx',
  onChange = () => {}
}) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);

  const getLanguageExtension = (path) => {
    if (path.endsWith('.jsx') || path.endsWith('.js') || path.endsWith('.json')) {
      return javascript({ jsx: true, typescript: true });
    }
    if (path.endsWith('.html')) {
      return html();
    }
    if (path.endsWith('.css')) {
      return css();
    }
    return javascript({ jsx: true });
  };

  useEffect(() => {
    if (!editorRef.current) return;

    // Custom touch-friendly mobile editor theme
    const mobileTheme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '13px',
        backgroundColor: '#0f172a'
      },
      '.cm-content': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        padding: '12px 6px',
        caretColor: '#60a5fa'
      },
      '.cm-cursor': {
        borderLeftColor: '#60a5fa',
        borderLeftWidth: '2px'
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        backgroundColor: '#1e3a8a !important'
      },
      '.cm-gutters': {
        backgroundColor: '#0b0f19',
        color: '#475569',
        borderRight: '1px solid #1e293b',
        minWidth: '32px'
      },
      '.cm-activeLine': {
        backgroundColor: '#1e293b40'
      }
    });

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    });

    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        getLanguageExtension(filePath),
        oneDark,
        mobileTheme,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        updateListener
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [filePath]); // re-mount editor when active file changes

  // Synchronize incoming external changes (e.g. from AI tool calls or symbol bar)
  useEffect(() => {
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (content !== currentDoc) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: content }
        });
      }
    }
  }, [content]);

  return <div ref={editorRef} className="w-full h-full overflow-hidden select-text" />;
}
