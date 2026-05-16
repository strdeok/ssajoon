import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ProblemMarkdown from "@/components/common/ProblemMarkdown";

type ServerProblemMarkdownProps = {
  content: string | null | undefined;
};

function normalizeMarkdownContent(content: string | null | undefined) {
  if (!content) return "";

  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\\s+\)/g, "\\)")
    .replace(/\\\s+\]/g, "\\]")
    .replace(/^\s*[-*+]\s*$/gm, "")
    .replace(/^\s*[-*+]\s*\n+\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasMathSyntax(content: string) {
  return /(^|[^\\])\$\$[\s\S]+?\$\$|(^|[^\\])\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/.test(
    content,
  );
}

export function ServerProblemMarkdown({ content }: ServerProblemMarkdownProps) {
  const normalizedContent = normalizeMarkdownContent(content);

  if (!normalizedContent) return null;

  if (hasMathSyntax(normalizedContent)) {
    return <ProblemMarkdown content={normalizedContent} />;
  }

  return (
    <div className="problem-markdown prose prose-zinc max-w-none dark:prose-invert prose-p:my-2 prose-p:max-w-[72ch] prose-p:leading-7 prose-li:my-1 prose-li:max-w-[72ch] prose-li:leading-7 prose-ul:my-3 prose-ul:max-w-[72ch] prose-ul:pl-6 prose-ol:my-3 prose-ol:max-w-[72ch] prose-ol:pl-6 prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-0 max-w-[72ch] text-2xl font-bold">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 max-w-[72ch] text-xl font-bold">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 max-w-[72ch] text-lg font-semibold">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-2 max-w-[72ch] leading-7 text-zinc-700 dark:text-zinc-300">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 max-w-[72ch] list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 max-w-[72ch] list-decimal space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="max-w-[72ch] leading-7 [&>p]:my-0 [&>p]:max-w-[72ch] [&>p]:leading-7">
              {children}
            </li>
          ),
          code: ({ children, className }) => {
            if (className) {
              return <code className={className}>{children}</code>;
            }

            return (
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
