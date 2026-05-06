"use client"; // 이 컴포넌트는 클라이언트에서 렌더링되도록 지정한다.

import ReactMarkdown from "react-markdown"; // Markdown 문자열을 React 컴포넌트로 렌더링하기 위해 가져온다.
import remarkGfm from "remark-gfm"; // GitHub Flavored Markdown을 지원하기 위해 가져온다.
import remarkMath from "remark-math"; // Markdown 안의 LaTeX 수식을 파싱하기 위해 가져온다.
import rehypeKatex from "rehype-katex"; // 파싱된 수식을 KaTeX HTML로 변환하기 위해 가져온다.

interface ProblemMarkdownProps { // 문제 Markdown 렌더러가 받을 props 타입을 정의한다.
    content: string | null | undefined; // DB에서 가져온 문제 설명, 입력 설명, 출력 설명 문자열을 의미한다.
} // props 타입 정의를 종료한다.

function normalizeContent(content: string | null | undefined) { // DB 문자열을 화면 렌더링에 맞게 정리하는 함수를 정의한다.
    if (!content) return ""; // content가 없으면 빈 문자열을 반환한다.

    return content.replace(/\\n/g, "\n"); // DB에 문자열 "\\n"으로 저장된 줄바꿈이 있다면 실제 줄바꿈으로 바꾼다.
} // normalizeContent 함수를 종료한다.

export default function ProblemMarkdown({ content }: ProblemMarkdownProps) { // 문제 설명용 Markdown + LaTeX 렌더링 컴포넌트를 정의한다.
    const normalizedContent = normalizeContent(content); // 전달받은 내용을 렌더링 가능한 문자열로 정리한다.

    return ( // 렌더링 결과를 반환한다.
        <div className="prose prose-zinc max-w-none dark:prose-invert prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:text-blue-600 dark:prose-code:text-blue-300"> {/* Markdown 기본 스타일을 적용하는 wrapper를 렌더링한다. */}
            <ReactMarkdown // Markdown 문자열을 React 요소로 렌더링한다.
                remarkPlugins={[remarkGfm, remarkMath]} // GFM 문법과 LaTeX 수식 문법을 활성화한다.
                rehypePlugins={[rehypeKatex]} // LaTeX 수식을 KaTeX로 렌더링한다.
                components={{ // Markdown 요소별 커스텀 렌더링 스타일을 지정한다.
                    p: ({ children }) => ( // 문단 요소 렌더링 방식을 정의한다.
                        <p className="my-3 leading-7 text-zinc-700 dark:text-zinc-300">{children}</p> // 문단의 간격과 줄 높이를 지정한다.
                    ), // 문단 렌더링 정의를 종료한다.
                    ul: ({ children }) => ( // 순서 없는 목록 렌더링 방식을 정의한다.
                        <ul className="my-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ul> // 목록의 여백과 bullet 스타일을 지정한다.
                    ), // 순서 없는 목록 렌더링 정의를 종료한다.
                    ol: ({ children }) => ( // 순서 있는 목록 렌더링 방식을 정의한다.
                        <ol className="my-4 list-decimal space-y-2 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ol> // 번호 목록의 여백과 스타일을 지정한다.
                    ), // 순서 있는 목록 렌더링 정의를 종료한다.
                    li: ({ children }) => ( // 목록 아이템 렌더링 방식을 정의한다.
                        <li className="leading-7">{children}</li> // 목록 아이템의 줄 높이를 지정한다.
                    ), // 목록 아이템 렌더링 정의를 종료한다.
                    code: ({ children }) => ( // 인라인 코드 렌더링 방식을 정의한다.
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">{children}</code> // 인라인 코드 배경과 여백을 지정한다.
                    ), // 인라인 코드 렌더링 정의를 종료한다.
                }} // 커스텀 components 정의를 종료한다.
            >
                {normalizedContent}
            </ReactMarkdown>
        </div>
    );
}