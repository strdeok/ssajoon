"use client";

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

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={language}
        theme={resolvedTheme === "light" ? "light" : "vs-dark"}
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
            Loading Editor...
          </div>
        }
      />
    </div>
  );
}
