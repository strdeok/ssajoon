"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm cursor-pointer"
      title="복사"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
