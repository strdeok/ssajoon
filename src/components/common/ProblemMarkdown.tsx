"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { usePathname } from "next/navigation";
import "katex/dist/katex.min.css";

interface ProblemMarkdownProps {
  content: string | null | undefined;
  className?: string;
  variant?: "default" | "compact";
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeMarkdownContent(content: string | null | undefined) {
  if (!content) return "";

  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\\s+\)/g, "\\)")
    .replace(/\\\s+\]/g, "\\]")
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`)
    .replace(
      /\\\[([\s\S]*?)\\\]/g,
      (_, math: string) => `$$\n${math.trim()}\n$$`,
    )
    .replace(/^\s*[-*+]\s*$/gm, "")
    .replace(/^\s*[-*+]\s*\n+\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const defaultMarkdownClassName =
  "prose prose-zinc max-w-none dark:prose-invert " +
  "prose-p:my-3 prose-p:leading-8 " +
  "prose-li:my-1 prose-li:leading-8 " +
  "prose-ul:my-4 prose-ul:pl-6 " +
  "prose-ol:my-4 prose-ol:pl-6 " +
  "prose-pre:max-w-none prose-pre:overflow-x-auto prose-pre:bg-zinc-900 prose-pre:text-zinc-100 " +
  "prose-code:before:content-none prose-code:after:content-none " +
  "prose-table:max-w-none";

const compactMarkdownClassName =
  "max-w-none text-xs leading-5 text-zinc-400 dark:text-zinc-500";

export default function ProblemMarkdown({
  content,
  className,
  variant = "default",
}: ProblemMarkdownProps) {
  const pathname = usePathname();
  const normalizedContent = normalizeMarkdownContent(content);
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "problem-markdown w-full",
        isCompact ? compactMarkdownClassName : defaultMarkdownClassName,
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) =>
            isCompact ? (
              <span>{children}</span>
            ) : (
              <h1 className="mb-4 mt-0 w-full text-2xl font-bold">
                {children}
              </h1>
            ),

          h2: ({ children }) =>
            isCompact ? (
              <span>{children}</span>
            ) : (
              <h2 className="mb-3 mt-6 w-full text-xl font-bold">
                {children}
              </h2>
            ),

          h3: ({ children }) =>
            isCompact ? (
              <span>{children}</span>
            ) : (
              <h3 className="mb-2 mt-5 w-full text-lg font-semibold">
                {children}
              </h3>
            ),

          p: ({ children }) =>
            isCompact ? (
              <span>{children}</span>
            ) : (
              <p className="my-3 w-full leading-8 text-zinc-700 dark:text-zinc-300">
                {children}
              </p>
            ),

          ul: ({ children }) =>
            isCompact ? (
              <span>{children}</span>
            ) : (
              <ul className="my-4 w-full list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
                {children}
              </ul>
            ),

          ol: ({ children }) =>
            isCompact ? (
              <span>{children}</span>
            ) : (
              <ol className="my-4 w-full list-decimal space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
                {children}
              </ol>
            ),

          li: ({ children }) =>
            isCompact ? (
              <span>{children} </span>
            ) : (
              <li
                className={cn(
                  "leading-8 [&>p]:my-0 [&>p]:leading-8",
                  pathname === "/search" && "[&>p]:mt-0!",
                )}
              >
                {children}
              </li>
            ),

          table: ({ children }) =>
            isCompact ? (
              <span>{children}</span>
            ) : (
              <div className="my-4 w-full overflow-x-auto">
                <table className="min-w-max table-auto border-collapse text-sm">
                  {children}
                </table>
              </div>
            ),

          thead: ({ children }) => (
            <thead className="border-b border-zinc-200 dark:border-zinc-700">
              {children}
            </thead>
          ),

          th: ({ children }) => (
            <th className="whitespace-nowrap border border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="border border-zinc-200 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
              {children}
            </td>
          ),

          pre: ({ children }) =>
            isCompact ? (
              <span>{children}</span>
            ) : (
              <pre className="my-4 w-full overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
                {children}
              </pre>
            ),

          code: ({ children, className }) => {
            const isBlockCode = Boolean(className);

            if (isBlockCode) {
              return <code className={className}>{children}</code>;
            }

            return isCompact ? (
              <code className="text-blue-500 dark:text-blue-300">
                {children}
              </code>
            ) : (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-blue-600 dark:bg-zinc-800 dark:text-blue-300">
                {children}
              </code>
            );
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}