import React, { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ value, onChange, language = 'javascript', readOnly = false }) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  const getExtension = (lang) => {
    switch (lang) {
      case 'python': return 'main.py';
      case 'cpp': return 'main.cpp';
      case 'c': return 'main.c';
      case 'java': default: return 'Main.java';
    }
  };

  const getMonacoLang = (lang) => {
    switch (lang) {
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'python': return 'python';
      case 'java': default: return 'java';
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('codehunt-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'D73A49', fontStyle: 'bold' },
        { token: 'type', foreground: 'E36209' },
        { token: 'string', foreground: '22863A' },
        { token: 'number', foreground: '005CC5' },
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'delimiter', foreground: '24292E' },
        { token: 'identifier', foreground: '24292E' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#24292E',
        'editor.lineHighlightBackground': '#F6F8FA',
        'editor.selectionBackground': '#BBDEFB',
        'editorCursor.foreground': '#F97316',
        'editor.inactiveSelectionBackground': '#E8F0FE',
        'editorLineNumber.foreground': '#BDBDBD',
        'editorLineNumber.activeForeground': '#F97316',
        'editorIndentGuide.background': '#EEEEEE',
        'editorIndentGuide.activeBackground': '#CCCCCC',
      },
    });
    monaco.editor.setTheme('codehunt-light');

    editor.focus();
    requestAnimationFrame(() => {
      editor.layout();
      setTimeout(() => editor.layout(), 100);
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        setTimeout(() => editorRef.current.layout(), 100);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="code-editor-root">
      <div className="code-editor-titlebar">
        <div className="code-editor-dots">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
        </div>
        <span className="code-editor-filename">
          {language.toUpperCase()} — {getExtension(language)}
        </span>
      </div>

      <div className="code-editor-body">
        <Editor
          key={language}
          height="100%"
          language={getMonacoLang(language)}
          defaultValue={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorMount}
          loading={
            <div className="code-editor-loading">
              <div className="code-editor-spinner"></div>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: isMobile ? 16 : 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            lineNumbers: isMobile ? 'off' : 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: readOnly,
            automaticLayout: false,
            padding: { top: isMobile ? 8 : 16, bottom: isMobile ? 8 : 16 },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            cursorStyle: 'line',
            cursorWidth: 2,
            renderLineHighlight: 'all',
            smoothScrolling: true,
            mouseWheelZoom: isMobile,
            contextmenu: false,
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            wordBasedSuggestions: false,
            parameterHints: { enabled: false },
            snippetSuggestions: 'none',
            tabSize: 4,
            insertSpaces: true,
            wordWrap: isMobile ? 'on' : 'off',
            folding: !isMobile,
            lineDecorationsWidth: isMobile ? 4 : 10,
            lineNumbersMinChars: 3,
            glyphMargin: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              vertical: 'auto',
              horizontal: isMobile ? 'hidden' : 'auto',
              verticalScrollbarSize: isMobile ? 16 : 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
            domReadOnly: false,
            renderLineHighlightOnlyWhenFocus: isMobile,
            fixedOverflowWidgets: true,
          }}
        />
      </div>
    </div>
  );
}
