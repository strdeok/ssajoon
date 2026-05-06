"use client"; // 이 컴포넌트는 클라이언트에서 Markdown과 LaTeX를 렌더링한다.

import ReactMarkdown from "react-markdown"; // Markdown 문자열을 React 컴포넌트로 변환하기 위해 가져온다.
import remarkGfm from "remark-gfm"; // GitHub Flavored Markdown 문법을 지원하기 위해 가져온다.
import remarkMath from "remark-math"; // Markdown 안의 $...$ 수식 문법을 파싱하기 위해 가져온다.
import rehypeKatex from "rehype-katex"; // remark-math가 파싱한 수식을 KaTeX HTML로 변환하기 위해 가져온다.

interface ProblemMarkdownProps { // ProblemMarkdown 컴포넌트 props 타입을 정의한다.
    content: string | null | undefined; // 문제 설명, 입력 설명, 출력 설명 원문을 받는다.
}

function normalizeMathSyntax(content: string | null | undefined) { // 깨진 Markdown + LaTeX 문자열을 렌더링 가능한 형태로 보정한다.
    if (!content) return ""; // content가 없으면 빈 문자열을 반환한다.

    return content // 원본 문자열을 기반으로 변환을 시작한다.
        .replace(/\\n/g, "\n") // DB에 "\\n" 문자열로 저장된 줄바꿈을 실제 줄바꿈으로 바꾼다.
        .replace(/\\\s+\)/g, "\\)") // "\ )"처럼 역슬래시와 닫는 괄호 사이에 공백이 낀 경우를 "\)"로 보정한다.
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`) // \( ... \) 형태의 inline LaTeX를 remark-math가 인식하는 $...$ 형태로 바꾼다.
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `$$${math.trim()}$$`) // \[ ... \] 형태의 block LaTeX를 $$...$$ 형태로 바꾼다.
        .replace(/\(\s*([^()]*\\(?:leq|geq|lt|gt|neq|times|cdot|frac|sqrt|sum|min|max|ldots|dots)[^()]*)\s*\)/g, (_, math: string) => `$${math.trim()}$`) // ( 1 \leq n \leq 50 ) 같은 LaTeX 명령 포함 괄호식을 수식으로 바꾼다.
        .replace(/\(\s*([a-zA-Z][a-zA-Z0-9_]*(?:\s*,\s*(?:\\ldots|\\dots|[a-zA-Z][a-zA-Z0-9_]*))*)\s*\)/g, (_, math: string) => `$${math.trim()}$`); // ( n ), ( t_i ), ( t_1, t_2, \ldots, t_n ) 같은 변수 괄호식을 수식으로 바꾼다.
}

export default function ProblemMarkdown({ content }: ProblemMarkdownProps) { // 문제 설명용 Markdown + LaTeX 렌더링 컴포넌트를 정의한다.
    const normalizedContent = normalizeMathSyntax(content); // 원문을 Markdown 렌더링 전에 보정한다.

    return ( // 렌더링할 JSX를 반환한다.
        <div className="prose prose-zinc max-w-none dark:prose-invert prose-p:my-3 prose-p:leading-7 prose-li:leading-7 prose-pre:bg-zinc-900 prose-pre:text-zinc-100"> {/* Markdown 기본 스타일을 적용한다. */}
            <ReactMarkdown // Markdown 렌더러를 사용한다.
                remarkPlugins={[remarkGfm, remarkMath]} // GFM 문법과 $...$ 수식 문법을 활성화한다.
                rehypePlugins={[rehypeKatex]} // 파싱된 수식을 KaTeX로 렌더링한다.
                components={{ // Markdown 태그별 스타일을 지정한다.
                    p: ({ children }) => ( // 문단 렌더링 방식을 지정한다.
                        <p className="my-3 leading-7 text-zinc-700 dark:text-zinc-300">{children}</p> // 문단 간격과 줄 높이를 적용한다.
                    ), // p 렌더링을 종료한다.
                    ul: ({ children }) => ( // ul 렌더링 방식을 지정한다.
                        <ul className="my-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ul> // 목록 스타일을 적용한다.
                    ), // ul 렌더링을 종료한다.
                    ol: ({ children }) => ( // ol 렌더링 방식을 지정한다.
                        <ol className="my-4 list-decimal space-y-2 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ol> // 번호 목록 스타일을 적용한다.
                    ), // ol 렌더링을 종료한다.
                    li: ({ children }) => ( // li 렌더링 방식을 지정한다.
                        <li className="leading-7">{children}</li> // 목록 아이템 줄 높이를 적용한다.
                    ), // li 렌더링을 종료한다.
                    code: ({ children }) => ( // 인라인 code 렌더링 방식을 지정한다.
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-blue-600 dark:bg-zinc-800 dark:text-blue-300">{children}</code> // 인라인 코드 스타일을 적용한다.
                    ), // code 렌더링을 종료한다.
                }} // components 설정을 종료한다.
            >
                {normalizedContent}
            </ReactMarkdown>
        </div>
    );
}