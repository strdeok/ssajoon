"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface ProblemMarkdownProps {
    content: string | null | undefined;
}

function normalizeMathSyntax(content: string | null | undefined) {
    if (!content) return "";

    return content
        .replace(/\\n/g, "\n")
        .replace(/\\\s+\)/g, "\\)")
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`)
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `$$${math.trim()}$$`)
        .replace(/\(\s*([^()]*\\(?:leq|geq|lt|gt|neq|times|cdot|frac|sqrt|sum|min|max|ldots|dots)[^()]*)\s*\)/g, (_, math: string) => `$${math.trim()}$`)
        .replace(/\(\s*([a-zA-Z][a-zA-Z0-9_]*(?:\s*,\s*(?:\\ldots|\\dots|[a-zA-Z][a-zA-Z0-9_]*))*)\s*\)/g, (_, math: string) => `$${math.trim()}$`);
}

export default function ProblemMarkdown({ content }: ProblemMarkdownProps) {
    const normalizedContent = normalizeMathSyntax(content);

    return (
        <div className="prose prose-zinc max-w-none dark:prose-invert prose-p:my-3 prose-p:leading-7 prose-li:leading-7 prose-pre:bg-zinc-900 prose-pre:text-zinc-100">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ children }) => (
                        <p className="my-3 leading-7 text-zinc-700 dark:text-zinc-300">{children}</p>
                    ),
                    ul: ({ children }) => (
                        <ul className="my-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="my-4 list-decimal space-y-2 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-7">{children}</li>
                    ),
                    code: ({ children }) => (
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-blue-600 dark:bg-zinc-800 dark:text-blue-300">{children}</code>
                    ),
                }}
            >
                {normalizedContent}
            </ReactMarkdown>
        </div>
    );
}