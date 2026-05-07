"use client"; // 이 컴포넌트를 Next.js 클라이언트 컴포넌트로 실행한다.

import ReactMarkdown from "react-markdown"; // Markdown 문자열을 React 컴포넌트로 렌더링하기 위해 불러온다.
import remarkGfm from "remark-gfm"; // GitHub Flavored Markdown 문법을 지원하기 위해 불러온다.
import remarkMath from "remark-math"; // Markdown 안의 LaTeX 수식을 파싱하기 위해 불러온다.
import rehypeKatex from "rehype-katex"; // 파싱된 LaTeX 수식을 KaTeX HTML로 변환하기 위해 불러온다.
import { usePathname } from "next/navigation";

interface ProblemMarkdownProps { // ProblemMarkdown 컴포넌트가 받을 props 타입을 정의한다.
    content: string | null | undefined; // 렌더링할 Markdown 문자열을 받는다.
    className?: string; // 외부에서 추가로 넣을 className을 받는다.
    variant?: "default" | "compact"; // 기본 렌더링과 compact 렌더링을 구분한다.
}

function cn(...classes: Array<string | false | null | undefined>) { // 여러 className을 안전하게 합치는 유틸 함수다.
    return classes.filter(Boolean).join(" "); // falsy 값을 제거한 뒤 공백으로 이어 붙인다.
}

function normalizeMarkdownContent(content: string | null | undefined) { // DB에서 가져온 Markdown 문자열을 렌더링 전에 정리한다.
    if (!content) return ""; // content가 없으면 빈 문자열을 반환한다.

    return content // 원본 문자열을 기준으로 정규화를 시작한다.
        .replace(/\r\n/g, "\n") // Windows 줄바꿈을 일반 줄바꿈으로 통일한다.
        .replace(/\r/g, "\n") // 단독 carriage return도 일반 줄바꿈으로 통일한다.
        .replace(/\\n/g, "\n") // DB에 문자열로 저장된 \n을 실제 줄바꿈으로 바꾼다.
        .replace(/\\\s+\)/g, "\\)") // 잘못 띄어진 인라인 수식 닫힘 기호를 복구한다.
        .replace(/\\\s+\]/g, "\\]") // 잘못 띄어진 블록 수식 닫힘 기호를 복구한다.
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`) // \( ... \) 형태의 인라인 수식을 $ ... $ 형태로 변환한다.
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `$$\n${math.trim()}\n$$`) // \[ ... \] 형태의 블록 수식을 $$ ... $$ 형태로 변환한다.
        .replace(/^\s*[-*+]\s*$/gm, "") // 내용 없이 bullet 기호만 있는 줄을 제거한다.
        .replace(/^\s*[-*+]\s*\n+\s+/gm, "- ") // bullet 기호와 내용 사이에 빈 줄이 들어간 경우 한 줄로 붙인다.
        .replace(/\n{3,}/g, "\n\n") // 3개 이상 연속된 줄바꿈을 2개로 줄인다.
        .trim(); // 앞뒤 불필요한 공백을 제거한다.
}

const defaultMarkdownClassName = // 기본 Markdown 렌더링 스타일을 따로 분리한다.
    "prose prose-zinc max-w-none dark:prose-invert " + // prose 기본 스타일을 적용하고 전체 컨테이너 폭 제한은 해제한다.
    "prose-p:my-2 prose-p:max-w-[72ch] prose-p:leading-7 " + // 일반 문단은 읽기 좋은 폭과 줄 높이를 적용한다.
    "prose-li:my-1 prose-li:max-w-[72ch] prose-li:leading-7 " + // 리스트 아이템도 너무 길어지지 않게 폭과 줄 높이를 제한한다.
    "prose-ul:my-3 prose-ul:max-w-[72ch] prose-ul:pl-6 " + // 순서 없는 리스트의 여백과 폭을 지정한다.
    "prose-ol:my-3 prose-ol:max-w-[72ch] prose-ol:pl-6 " + // 순서 있는 리스트의 여백과 폭을 지정한다.
    "prose-pre:bg-zinc-900 prose-pre:text-zinc-100 " + // 코드 블록의 배경색과 글자색을 지정한다.
    "prose-code:before:content-none prose-code:after:content-none"; // prose가 inline code 앞뒤에 붙이는 백틱 표시를 제거한다.

const compactMarkdownClassName = // compact 모드 스타일을 따로 분리한다.
    "max-w-none text-xs leading-5 text-zinc-400 dark:text-zinc-500"; // compact 모드에서는 작은 글씨와 짧은 줄 높이를 사용한다.

export default function ProblemMarkdown({ // 문제 설명 Markdown을 렌더링하는 컴포넌트를 정의한다.
    content, // 렌더링할 Markdown 문자열을 받는다.
    className, // 외부에서 전달된 className을 받는다.
    variant = "default", // variant 기본값을 default로 설정한다.
}: ProblemMarkdownProps) { // props 구조 분해를 끝낸다.
    const normalizedContent = normalizeMarkdownContent(content); // Markdown 렌더링 전에 문자열을 정리한다.

    const isCompact = variant === "compact"; // 현재 compact 모드인지 확인한다.

    const pathname = usePathname();
    
    return ( // JSX 반환을 시작한다.
        <div // Markdown 전체를 감싸는 컨테이너를 만든다.
            className={cn( // 조건부 className을 조합한다.
                "problem-markdown",
                isCompact ? compactMarkdownClassName : defaultMarkdownClassName, // compact 여부에 따라 스타일을 선택한다.
                className, // 외부에서 전달된 className을 추가한다.
            )} // className 조합을 끝낸다.
        >
            <ReactMarkdown // Markdown 문자열을 React 노드로 변환한다.
                remarkPlugins={[remarkGfm, remarkMath]} // GFM 문법과 수식 문법 파서를 적용한다.
                rehypePlugins={[rehypeKatex]} // KaTeX 수식 렌더러를 적용한다.
                components={{ // Markdown 태그별 커스텀 렌더링 방식을 정의한다.
                    h1: ({ children }) => ( // h1 렌더링 방식을 정의한다.
                        isCompact // compact 모드인지 확인한다.
                            ? <span>{children}</span> // compact 모드에서는 h1을 span으로 렌더링한다.
                            : <h1 className="mb-4 mt-0 max-w-[72ch] text-2xl font-bold">{children}</h1> // 기본 모드에서는 제목 스타일과 폭 제한을 적용한다.
                    ), // h1 렌더러를 닫는다.
                    h2: ({ children }) => ( // h2 렌더링 방식을 정의한다.
                        isCompact // compact 모드인지 확인한다.
                            ? <span>{children}</span> // compact 모드에서는 h2를 span으로 렌더링한다.
                            : <h2 className="mb-3 mt-6 max-w-[72ch] text-xl font-bold">{children}</h2> // 기본 모드에서는 제목 스타일과 폭 제한을 적용한다.
                    ), // h2 렌더러를 닫는다.
                    h3: ({ children }) => ( // h3 렌더링 방식을 정의한다.
                        isCompact // compact 모드인지 확인한다.
                            ? <span>{children}</span> // compact 모드에서는 h3를 span으로 렌더링한다.
                            : <h3 className="mb-2 mt-5 max-w-[72ch] text-lg font-semibold">{children}</h3> // 기본 모드에서는 제목 스타일과 폭 제한을 적용한다.
                    ), // h3 렌더러를 닫는다.
                    p: ({ children }) => ( // 문단 렌더링 방식을 정의한다.
                        isCompact // compact 모드인지 확인한다.
                            ? <span>{children}</span> // compact 모드에서는 문단을 span으로 렌더링한다.
                            : <p className="my-2 max-w-[72ch] leading-7 text-zinc-700 dark:text-zinc-300">{children}</p> // 기본 모드에서는 읽기 좋은 폭과 줄 높이를 적용한다.
                    ), // p 렌더러를 닫는다.
                    ul: ({ children }) => ( // 순서 없는 리스트 렌더링 방식을 정의한다.
                        isCompact // compact 모드인지 확인한다.
                            ? <span>{children}</span> // compact 모드에서는 리스트를 span으로 렌더링한다.
                            : <ul className="my-3 max-w-[72ch] list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ul> // 기본 모드에서는 리스트 폭과 간격을 제한한다.
                    ), // ul 렌더러를 닫는다.
                    ol: ({ children }) => ( // 순서 있는 리스트 렌더링 방식을 정의한다.
                        isCompact // compact 모드인지 확인한다.
                            ? <span>{children}</span> // compact 모드에서는 리스트를 span으로 렌더링한다.
                            : <ol className="my-3 max-w-[72ch] list-decimal space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">{children}</ol> // 기본 모드에서는 리스트 폭과 간격을 제한한다.
                    ), // ol 렌더러를 닫는다.
                    li: ({ children }) => ( // 리스트 아이템 렌더링 방식을 정의한다.
                        isCompact // compact 모드인지 확인한다.
                            ? <span>{children} </span> // compact 모드에서는 줄바꿈 없이 이어서 보여준다.
                            : <li className={`max-w-[72ch] leading-7 [&>p]:my-0 [&>p]:max-w-[72ch] [&>p]:leading-7 ${pathname === "/generate" ? "[&>p]:mt-0!" : ""}`}>{children}</li> // 기본 모드에서는 li 폭을 제한하고 내부 p 여백을 제거한다.
                    ), // li 렌더러를 닫는다.
                    code: ({ children, className }) => { // 코드 렌더링 방식을 정의한다.
                        const isBlockCode = Boolean(className); // className이 있으면 코드 블록일 가능성이 높다고 판단한다.

                        if (isBlockCode) { // 코드 블록인지 확인한다.
                            return <code className={className}>{children}</code>; // 코드 블록은 ReactMarkdown 기본 구조를 최대한 유지한다.
                        } // 코드 블록 분기를 끝낸다.

                        return ( // 인라인 코드 JSX를 반환한다.
                            isCompact // compact 모드인지 확인한다.
                                ? <code className="text-blue-500 dark:text-blue-300">{children}</code> // compact 모드의 인라인 코드 스타일을 적용한다.
                                : <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-blue-600 dark:bg-zinc-800 dark:text-blue-300">{children}</code> // 기본 모드의 인라인 코드 스타일을 적용한다.
                        ); // 인라인 코드 반환을 끝낸다.
                    }, // code 렌더러를 닫는다.
                }} // components 설정을 끝낸다.
            >
                {normalizedContent} 
            </ReactMarkdown>
        </div>
    ); // JSX 반환을 끝낸다.
}