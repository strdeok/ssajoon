"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: "light" | "dark";
  readOnly?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const getEditorTypography = (width: number) => {
  if (width < 640) {
    return { fontSize: 12, lineHeight: 20 };
  }

  if (width < 1024) {
    return { fontSize: 12, lineHeight: 22 };
  }

  return { fontSize: 14, lineHeight: 24 };
};

const normalizeCodeMirrorLanguage = (language?: string) => {
  const normalized = language?.toLowerCase().replace(/\s+/g, "") ?? "python";

  if (
    normalized === "python" ||
    normalized === "py" ||
    normalized === "python3"
  ) {
    return "python";
  }

  if (normalized === "java") {
    return "java";
  }

  if (
    normalized === "c++" ||
    normalized === "cpp" ||
    normalized === "cxx"
  ) {
    return "cpp";
  }

  return "python";
};

const getLanguageExtension = (language?: string) => {
  const normalizedLanguage = normalizeCodeMirrorLanguage(language);

  switch (normalizedLanguage) {
    case "python":
      return python();
    case "java":
      return java();
    case "cpp":
      return cpp();
    default:
      return python();
  }
};

const createEditorTheme = ({
  mode,
  fontSize,
  lineHeight,
}: {
  mode: "light" | "dark";
  fontSize: number;
  lineHeight: number;
}) => {
  const isDark = mode === "dark";

  const baseTheme = EditorView.theme(
    {
      "&": {
        height: "100%",
        fontSize: `${fontSize}px`,
        backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
        color: isDark ? "#e4e4e7" : "#18181b",
      },
      ".cm-editor": {
        height: "100%",
      },
      ".cm-scroller": {
        height: "100%",
        overflow: "auto",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineHeight: `${lineHeight}px`,
      },
      ".cm-content": {
        minHeight: "100%",
        padding: "20px 0",
        caretColor: isDark ? "#f4f4f5" : "#18181b",
      },
      ".cm-line": {
        padding: "0 16px",
      },
      ".cm-gutters": {
        backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
        color: isDark ? "#71717a" : "#a1a1aa",
        borderRight: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e4e4e7",
      },
      ".cm-activeLine": {
        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(24,24,27,0.04)",
      },
      ".cm-activeLineGutter": {
        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(24,24,27,0.04)",
        color: isDark ? "#e4e4e7" : "#18181b",
      },
      ".cm-selectionBackground": {
        backgroundColor: isDark ? "rgba(96,165,250,0.35) !important" : "rgba(59,130,246,0.25) !important",
      },
      ".cm-focused": {
        outline: "none",
      },
      ".cm-cursor": {
        borderLeftColor: isDark ? "#f4f4f5" : "#18181b",
      },
      ".cm-matchingBracket, .cm-nonmatchingBracket": {
        backgroundColor: isDark ? "rgba(250,204,21,0.18)" : "rgba(250,204,21,0.25)",
        outline: "none",
      },
    },
    {
      dark: isDark,
    },
  );

  const highlightStyle = HighlightStyle.define([
    {
      tag: tags.comment,
      color: isDark ? "#a1a1aa" : "#4b5563",
    },
    {
      tag: tags.string,
      color: isDark ? "#86efac" : "#047857",
    },
    {
      tag: tags.keyword,
      color: isDark ? "#93c5fd" : "#2563eb",
      fontWeight: "600",
    },
    {
      tag: tags.number,
      color: isDark ? "#fca5a5" : "#dc2626",
    },
    {
      tag: tags.function(tags.variableName),
      color: isDark ? "#c4b5fd" : "#7c3aed",
    },
    {
      tag: tags.typeName,
      color: isDark ? "#67e8f9" : "#0891b2",
    },
    {
      tag: tags.operator,
      color: isDark ? "#f4f4f5" : "#18181b",
    },
    {
      tag: tags.variableName,
      color: isDark ? "#e4e4e7" : "#18181b",
    },
  ]);

  return [baseTheme, syntaxHighlighting(highlightStyle)];
};

export function CodeEditor({
  value,
  onChange,
  language = "python",
  theme,
  readOnly = false,
  isLoading = false,
  loadingText = "최근 제출 코드를 불러오는 중...",
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);

  const [editorHeight, setEditorHeight] = useState(500);
  const [editorTypography, setEditorTypography] = useState({
    fontSize: 14,
    lineHeight: 24,
  });

  const editorMode = useMemo<"light" | "dark">(() => {
    if (theme) {
      return theme;
    }

    return resolvedTheme === "light" ? "light" : "dark";
  }, [theme, resolvedTheme]);

  const extensions = useMemo(() => {
    return [
      getLanguageExtension(language),
      EditorState.tabSize.of(4),
      EditorView.lineWrapping,
      ...createEditorTheme({
        mode: editorMode,
        fontSize: editorTypography.fontSize,
        lineHeight: editorTypography.lineHeight,
      }),
    ];
  }, [language, editorMode, editorTypography.fontSize, editorTypography.lineHeight]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;

        if (height > 0) {
          setEditorHeight(height);
        }
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateTypography = () => {
      setEditorTypography(getEditorTypography(window.innerWidth));
    };

    updateTypography();

    window.addEventListener("resize", updateTypography);

    return () => {
      window.removeEventListener("resize", updateTypography);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-80 w-full flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1e1e1e]"
    >
      <CodeMirror
        theme={editorMode}
        value={value}
        height={`${editorHeight}px`}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: false,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        onChange={(nextValue) => {
          onChange(nextValue);
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-sm font-semibold text-white backdrop-blur-sm">
          {loadingText}
        </div>
      )}
    </div>
  );
}