"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Code2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface CodeViewerProps {
  code: string;
  language: string;
}

export default function CodeViewer({ code, language }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Monaco language mapping
  const getMonacoLanguage = (lang: string) => {
    const lower = lang.toLowerCase();
    if (lower === "cpp" || lower === "c++") return "cpp";
    if (lower === "python" || lower === "python3") return "python";
    if (lower === "java") return "java";
    return lower;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-500" />
          제출 코드
          <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 capitalize">
            ({language})
          </span>
        </h2>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-600 dark:text-zinc-400"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>복사됨</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>코드 복사</span>
            </>
          )}
        </button>
      </div>

      <div className="relative rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-2xl bg-[#1e1e1e]">
        <div className="h-[500px]">
          <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 20, bottom: 20 },
              lineNumbersMinChars: 3,
            }}
          />
        </div>
      </div>
    </div>
  );
}
