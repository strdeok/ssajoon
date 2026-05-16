"use client"; // 이 컴포넌트가 클라이언트에서 실행되도록 지정한다.

import { useEffect, useMemo, useRef, useState } from "react"; // React 훅들을 가져온다.
import Editor from "@monaco-editor/react"; // Monaco Editor React 래퍼를 가져온다.
import type { Monaco } from "@monaco-editor/react"; // Monaco 인스턴스 타입을 가져온다.
import { useTheme } from "next-themes"; // 현재 라이트/다크 테마 정보를 가져온다.
import { normalizeLanguage } from "@/lib/codeTemplates"; // 프로젝트 내부 언어 값을 Monaco 언어 값으로 정규화하는 함수를 가져온다.

interface CodeEditorProps { // CodeEditor 컴포넌트가 받을 props 타입을 정의한다.
  value: string; // 에디터에 표시할 코드 값을 의미한다.
  onChange: (value: string | undefined) => void; // 코드가 변경될 때 부모 상태를 업데이트할 함수를 의미한다.
  language?: string; // 현재 선택된 프로그래밍 언어를 의미한다.
  theme?: "light" | "dark"; // 에디터 전용 테마를 선택적으로 받는다.
  readOnly?: boolean; // 에디터를 읽기 전용으로 사용할지 여부를 의미한다.
  isLoading?: boolean; // 부모에서 최신 제출 코드 등을 불러오는 중인지 여부를 의미한다.
  loadingText?: string; // 로딩 중 화면에 표시할 문구를 의미한다.
} // CodeEditorProps 타입 정의를 종료한다.

export function CodeEditor({ // CodeEditor 컴포넌트를 정의한다.
  value, // 부모에서 전달한 코드 값을 받는다.
  onChange, // 부모에서 전달한 코드 변경 함수를 받는다.
  language = "python", // 언어 값이 없으면 python을 기본값으로 사용한다.
  theme, // 부모로부터 전달받은 에디터 전용 테마를 받는다.
  readOnly = false, // readOnly 값이 없으면 false를 기본값으로 사용한다.
  isLoading = false, // isLoading 값이 없으면 false를 기본값으로 사용한다.
  loadingText = "최근 제출 코드를 불러오는 중...", // loadingText 값이 없으면 기본 로딩 문구를 사용한다.
}: CodeEditorProps) { // props 구조 분해를 종료한다.
  const { resolvedTheme } = useTheme(); // 현재 적용된 테마 정보를 가져온다.

  const containerRef = useRef<HTMLDivElement>(null); // 에디터 컨테이너 DOM을 참조하기 위한 ref를 만든다.

  const [editorHeight, setEditorHeight] = useState(500); // Monaco Editor 높이를 상태로 관리한다.

  const normalizedLanguage = useMemo(() => { // Monaco Editor에 전달할 언어 값을 메모이제이션한다.
    return normalizeLanguage(language); // 전달받은 language를 프로젝트 기준으로 정규화한다.
  }, [language]); // language가 바뀔 때만 다시 계산한다.

  const editorTheme = useMemo(() => { // 적용할 Monaco Editor 테마를 결정한다.
    const currentTheme = theme || (resolvedTheme === "light" ? "light" : "dark"); // 주입된 테마가 있으면 사용하고, 없으면 시스템 테마를 따른다.
    return currentTheme === "light" ? "ssajoon-light" : "ssajoon-dark"; // SSAJOON 전용 대비 보정 테마를 반환한다.
  }, [theme, resolvedTheme]); // 주입된 테마나 시스템 테마가 바뀔 때 재계산한다.

  const handleBeforeMount = (monaco: Monaco) => { // Monaco가 마운트되기 전에 접근성 대비를 보정한 테마를 등록한다.
    monaco.editor.defineTheme("ssajoon-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "4B5563" },
        { token: "string", foreground: "047857" },
      ],
      colors: {
        "editor.background": "#ffffff",
      },
    });

    monaco.editor.defineTheme("ssajoon-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "A1A1AA" },
        { token: "string", foreground: "86EFAC" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
      },
    });
  };

  useEffect(() => { // 컨테이너 크기가 바뀔 때 에디터 높이를 동적으로 조정한다.
    const element = containerRef.current; // 현재 컨테이너 DOM을 가져온다.

    if (!element) return; // 컨테이너가 아직 없으면 effect를 종료한다.

    const observer = new ResizeObserver((entries) => { // 컨테이너 크기 변화를 감지하는 ResizeObserver를 생성한다.
      for (const entry of entries) { // 감지된 크기 변화 목록을 순회한다.
        const height = entry.contentRect.height; // 현재 컨테이너 높이를 가져온다.

        if (height > 0) { // 높이가 0보다 큰 경우만 처리한다.
          setEditorHeight(height); // Monaco Editor 높이를 컨테이너 높이로 갱신한다.
        } // 높이 조건문을 종료한다.
      } // entries 순회를 종료한다.
    }); // ResizeObserver 생성을 종료한다.

    observer.observe(element); // 컨테이너 DOM의 크기 변화를 감시한다.

    return () => { // 컴포넌트가 unmount되거나 effect가 정리될 때 실행한다.
      observer.disconnect(); // ResizeObserver 연결을 해제한다.
    }; // cleanup 함수를 종료한다.
  }, []); // 최초 마운트 시 한 번만 실행한다.

  return ( // 컴포넌트 JSX를 반환한다.
    <div // 에디터 전체를 감싸는 wrapper를 렌더링한다.
      ref={containerRef} // 컨테이너 크기 측정을 위해 ref를 연결한다.
      className="relative w-full flex-1 h-full min-h-80 rounded-xl overflow-hidden border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1e1e1e]" // 에디터 컨테이너 스타일을 지정한다.
    >
      <Editor // Monaco Editor 컴포넌트를 렌더링한다.
        height={editorHeight} // ResizeObserver로 계산한 높이를 적용한다.
        language={normalizedLanguage} // Monaco Editor에 정규화된 언어 값을 전달한다.
        theme={editorTheme} // 현재 앱 테마에 맞는 Monaco 테마를 적용한다.
        value={value} // 부모가 관리하는 코드 값을 에디터에 표시한다.
        onChange={onChange} // 코드 변경 시 부모의 onChange 함수를 실행한다.
        beforeMount={handleBeforeMount} // Monaco 테마를 등록한다.
        options={{ // Monaco Editor 옵션을 설정한다.
          minimap: { enabled: false }, // 우측 미니맵을 비활성화한다.
          fontSize: 16, // 코드 폰트 크기를 16px로 설정한다.
          lineHeight: 24, // 코드 줄 높이를 24px로 설정한다.
          padding: { top: 20 }, // 에디터 상단 여백을 설정한다.
          readOnly, // 읽기 전용 여부를 설정한다.
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace", // 코드용 폰트를 설정한다.
          smoothScrolling: true, // 부드러운 스크롤을 활성화한다.
          cursorBlinking: "smooth", // 커서 깜빡임을 부드럽게 설정한다.
          scrollBeyondLastLine: false, // 마지막 줄 아래로 과도하게 스크롤되지 않게 한다.
          automaticLayout: true, // 부모 크기 변경 시 Monaco가 자동으로 레이아웃을 다시 계산하게 한다.
          tabSize: 4, // 탭 크기를 4칸으로 설정한다.
          insertSpaces: true, // 탭 입력 시 공백을 사용하도록 설정한다.
        }} // Monaco Editor 옵션 설정을 종료한다.
        loading={ // Monaco Editor 자체가 로딩 중일 때 보여줄 UI를 설정한다.
          <div className="flex h-full items-center justify-center text-zinc-500 animate-pulse"> {/* 에디터 로딩 UI를 렌더링한다. */}
            에디터를 불러오는 중... {/* Monaco Editor 로딩 문구를 표시한다. */}
          </div>
        } // loading 설정을 종료한다.
      />

      {isLoading && ( // 부모에서 코드 로딩 중이라고 전달한 경우를 확인한다.
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-sm font-semibold text-white backdrop-blur-sm"> {/* 코드 로딩 오버레이를 렌더링한다. */}
          {loadingText} {/* 부모에서 전달한 로딩 문구를 표시한다. */}
        </div>
      )} {/* 코드 로딩 오버레이 조건부 렌더링을 종료한다. */}
    </div>
  ); // JSX 반환을 종료한다.
} // CodeEditor 컴포넌트를 종료한다.
