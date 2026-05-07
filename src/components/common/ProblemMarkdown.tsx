"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface ProblemMarkdownProps {
    content: string | null | undefined;
    className?: string;
    variant?: "default" | "compact";
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

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function ProblemMarkdown({
    content,
    className,
    variant = "default",
}: ProblemMarkdownProps) {
    const normalizedContent = normalizeMathSyntax(content);
    const isCompact = variant === "compact";

    return (
        <div
            className={cn(
                isCompact
                    ? "max-w-none text-xs text-zinc-400 dark:text-zinc-500"
                    : "prose prose-zinc max-w-none dark:prose-invert prose-p:my-3 prose-p:leading-7 prose-li:leading-7 prose-pre:bg-zinc-900 prose-pre:text-zinc-100",
                className,
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    h1: ({ children }) => isCompact ? <span>{children}</span> : <h1>{children}</h1>,
                    h2: ({ children }) => isCompact ? <span>{children}</span> : <h2>{children}</h2>,
                    h3: ({ children }) => isCompact ? <span>{children}</span> : <h3>{children}</h3>,
                    p: ({ children }) => (
                        isCompact
                            ? <span>{children}</span>
                            : <p className="my-3 leading-7 text-zinc-700 dark:text-zinc-300">{children}</p>
                    ),
                    ul: ({ children }) => (
                        isCompact
                            ? <span>{children}</span>
                            : <ul className="my-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        isCompact
                            ? <span>{children}</span>
                            : <ol className="my-4 list-decimal space-y-2 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ol>
                    ),
                    li: ({ children }) => (
                        isCompact ? <span>{children} </span> : <li className="leading-7">{children}</li>
                    ),
                    code: ({ children }) => (
                        isCompact
                            ? <code className="text-blue-500 dark:text-blue-300">{children}</code>
                            : <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-blue-600 dark:bg-zinc-800 dark:text-blue-300">{children}</code>
                    ),
                }}
            >
                {normalizedContent}
            </ReactMarkdown>
        </div>
    );
}
