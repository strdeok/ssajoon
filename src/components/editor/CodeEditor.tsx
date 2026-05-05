"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  readOnly = false,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(500);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setEditorHeight(h);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 h-full min-h-80 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#1e1e1e]"
    >
      <Editor
        height={editorHeight}
        language={language}
        theme={"vs-dark"}
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 16,
          lineHeight: 24,
          padding: { top: 20 },
          readOnly,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          scrollBeyondLastLine: false,
        }}
        loading={
          <div className="flex items-center justify-center h-full text-zinc-500 animate-pulse">
            에디터를 불러오는 중...
          </div>
        }
      />
    </div>
  );
}
