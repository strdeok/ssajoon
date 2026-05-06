"use client"; // 이 페이지를 클라이언트 컴포넌트로 사용한다.

import { use, useCallback, useEffect, useRef, useState } from "react"; // React hook과 use 유틸을 가져온다.
import { useRouter } from "next/navigation"; // 페이지 이동을 위해 Next.js router를 가져온다.
import { Play, Send, Loader2, Sun, Moon } from "lucide-react"; // 버튼, 테마, 로딩에 사용할 아이콘을 가져온다.
import { ProblemDetail } from "@/components/problem/ProblemDetail"; // 문제 상세 표시 컴포넌트를 가져온다.
import { CodeEditor } from "@/components/editor/CodeEditor"; // 코드 에디터 컴포넌트를 가져온다.
import { ResultViewer } from "@/components/submission/ResultViewer"; // 제출 결과 표시 컴포넌트를 가져온다.
import { TestResultViewer, TestResult } from "@/components/submission/TestResultViewer"; // 실행 결과 표시 컴포넌트를 가져온다.
import { useSubmissionStore } from "@/store/submissionStore"; // 제출 상태 전역 스토어를 가져온다.
import { Problem } from "@/types/problem"; // 문제 타입을 가져온다.
import type { SubmissionStatus } from "@/types/submission"; // 제출 상태 타입을 가져온다. (타입 명시)
import { createClient } from "@/utils/supabase/client"; // 브라우저용 Supabase 클라이언트를 가져온다.
import { getSubmissionLabel } from "@/lib/submission/getSubmissionLabel"; // 제출 결과 라벨 유틸을 가져온다.
import { useProblemStarterCode } from "@/hooks/useProblemStarterCode"; // 최신 제출 코드 또는 기본 템플릿을 불러오는 hook을 가져온다.

type JudgeEventPayload = { // 오케스트레이터 SSE payload 타입을 정의한다.
  submissionId: string | number; // 제출 id를 의미한다. (오케스트레이터에 따라 타입이 다를 수 있음)
  phase: SubmissionStatus; // 현재 채점 phase를 의미한다. (정의된 타입을 사용)
  completedTestcases: number; // 완료된 테스트케이스 수를 의미한다.
  totalTestcases: number; // 전체 테스트케이스 수를 의미한다.
  progressPercent: number; // 진행률 퍼센트를 의미한다.
  result: SubmissionStatus | null; // 최종 결과를 의미한다.
}; // JudgeEventPayload 타입 정의를 종료한다.

export default function ProblemPage({ // 문제 상세 페이지 컴포넌트를 정의한다.
  params, // Next.js 동적 라우트 params를 받는다.
}: { // props 타입 정의를 시작한다.
  params: Promise<{ id: string }>; // 문제 id가 들어 있는 params Promise 타입을 정의한다.
}) { // 컴포넌트 본문을 시작한다.
  const { id } = use(params); // params에서 문제 id를 꺼낸다.

  const router = useRouter(); // 페이지 이동을 위한 router를 생성한다.

  const [problem, setProblem] = useState<Problem | null>(null); // 현재 문제 데이터를 저장한다.
  const [language, setLanguage] = useState("python"); // 현재 선택된 제출 언어를 저장한다.
  const [isLoading, setIsLoading] = useState(true); // 문제 상세 로딩 상태를 저장한다.
  const [testResults, setTestResults] = useState<TestResult[] | null>(null); // 예제 실행 결과를 저장한다.
  const [isTesting, setIsTesting] = useState(false); // 예제 실행 중인지 저장한다.
  const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중인지 저장한다.
  const [submitError, setSubmitError] = useState<string | null>(null); // 제출 관련 에러 메시지를 저장한다.
  const [user, setUser] = useState<any>(null); // 현재 로그인 유저 정보를 저장한다.
  const [progress, setProgress] = useState<JudgeEventPayload | null>(null); // 실시간 채점 진행 상태를 저장한다.
  const [editorTheme, setEditorTheme] = useState<"light" | "dark" | null>(null); // 에디터 전용 테마 상태를 정의한다.

  const eventSourceRef = useRef<EventSource | null>(null); // 현재 열려 있는 SSE 연결을 저장한다.
  const receivedDoneRef = useRef(false); // DONE 이벤트를 받았는지 여부를 저장한다.

  const { // 문제별 시작 코드 hook을 사용한다.
    code, // 에디터에 표시할 코드를 가져온다.
    isCodeLoading, // 최신 제출 코드 로딩 상태를 가져온다.
    handleCodeChange, // 코드 변경 핸들러를 가져온다.
  } = useProblemStarterCode({ // 현재 문제, 유저, 언어 기준으로 시작 코드를 관리한다.
    problemId: id, // 현재 문제 id를 전달한다.
    userId: user?.id, // 현재 유저 id를 전달한다.
    language, // 현재 선택된 언어를 전달한다.
  }); // useProblemStarterCode 호출을 종료한다.

  const { submissionId, status, result, setSubmissionId, setStatus, reset } = useSubmissionStore(); // 제출 전역 상태와 액션을 가져온다.

  // 디버깅을 위해 컴포넌트 리렌더링 시 상태를 출력한다.
  console.log("[ProblemPage] Render - Status:", status, "HasProgress:", !!progress, "ProgressPercent:", progress?.progressPercent + "%");

  const closeEventSource = useCallback(() => { // 현재 SSE 연결을 안전하게 닫는 함수를 정의한다.
    eventSourceRef.current?.close(); // 열려 있는 EventSource가 있으면 닫는다.
    eventSourceRef.current = null; // EventSource ref를 비운다.
  }, []); // 외부 의존성이 없으므로 빈 배열을 사용한다.

  const parseJudgeEvent = useCallback((event: Event) => { // SSE Event 객체에서 JSON payload를 파싱하는 함수를 정의한다.
    const messageEvent = event as MessageEvent<string>; // Event를 MessageEvent<string>으로 취급한다.
    return JSON.parse(messageEvent.data) as JudgeEventPayload; // data 문자열을 JSON으로 파싱한다.
  }, []); // 외부 의존성이 없으므로 빈 배열을 사용한다.

  const handleRunningEvent = useCallback((event: Event) => { // event:RUNNING 이벤트 처리 함수를 정의한다.
    try { // JSON 파싱 실패에 대비한다.
      const payload = parseJudgeEvent(event); // SSE data를 payload로 파싱한다.
      console.log("[SSE] RUNNING:", payload); // RUNNING payload를 콘솔에 출력한다.
      setProgress({ ...payload }); // 새 객체 참조를 만들어 확실한 리렌더링을 유도한다.
      setStatus("RUNNING"); // 제출 상태를 RUNNING으로 저장한다.
    } catch (error) { // 파싱 중 에러가 발생한 경우를 처리한다.
      console.error("[SSE] RUNNING parse error:", error); // 파싱 에러를 콘솔에 출력한다.
    } // try-catch를 종료한다.
  }, [parseJudgeEvent, setStatus]); // parseJudgeEvent와 setStatus가 바뀌면 갱신한다.

  const handleDoneEvent = useCallback((event: Event) => { // event:DONE 이벤트 처리 함수를 정의한다.
    try { // JSON 파싱과 상태 업데이트 실패에 대비한다.
      const payload = parseJudgeEvent(event); // SSE data를 payload로 파싱한다.
      console.log("[SSE] DONE:", payload); // DONE payload를 콘솔에 출력한다.

      receivedDoneRef.current = true; // DONE 이벤트를 받았다고 표시한다.
      setProgress({ ...payload }); // 최종 진행 상태를 저장한다.
      setStatus((payload.result || "DONE") as any); // 최종 결과가 있으면 결과값을 상태로 저장한다. (타입 에러 방지를 위해 캐스팅)
      setIsSubmitting(false); // 제출 중 상태를 종료한다.
      closeEventSource(); // 최종 이벤트를 받았으므로 SSE 연결을 닫는다.
    } catch (error) { // DONE 이벤트 처리 실패를 잡는다.
      console.error("[SSE] DONE parse error:", error); // 파싱 에러를 콘솔에 출력한다.
      setSubmitError("채점 결과를 처리하지 못했습니다."); // 사용자에게 결과 처리 실패를 알린다.
      setIsSubmitting(false); // 제출 중 상태를 종료한다.
      closeEventSource(); // 오류 상황에서도 SSE 연결을 닫는다.
    } // try-catch를 종료한다.
  }, [closeEventSource, parseJudgeEvent, setStatus]); // 필요한 의존성을 등록한다.

  const handleProxyErrorEvent = useCallback((event: Event) => { // event:PROXY_ERROR 이벤트 처리 함수를 정의한다.
    const messageEvent = event as MessageEvent<string>; // Event를 MessageEvent<string>으로 취급한다.
    console.error("[SSE] PROXY_ERROR:", messageEvent.data); // 프록시 에러 데이터를 콘솔에 출력한다.
    setSubmitError("채점 상태를 실시간으로 불러오지 못했습니다."); // 사용자에게 실시간 상태 조회 실패를 알린다.
    setIsSubmitting(false); // 제출 중 상태를 종료한다.
    closeEventSource(); // SSE 연결을 닫는다.
  }, [closeEventSource]); // closeEventSource가 바뀌면 갱신한다.

  const startJudgeEventStream = useCallback((sid: string) => { // 제출 id 기준으로 SSE 스트림을 시작하는 함수를 정의한다.
    closeEventSource(); // 기존 SSE 연결이 있으면 먼저 닫는다.
    receivedDoneRef.current = false; // 새 제출이므로 DONE 수신 여부를 초기화한다.

    const eventSource = new EventSource(`/api/submissions/${sid}/events`); // Next.js SSE 프록시 endpoint에 연결한다.
    eventSourceRef.current = eventSource; // 생성한 EventSource를 ref에 저장한다.

    eventSource.onopen = () => { // SSE 연결이 열렸을 때 실행한다.
      console.log("[SSE] Connected:", sid); // 연결 성공 로그를 출력한다.
    }; // onopen 핸들러를 종료한다.

    eventSource.addEventListener("RUNNING", handleRunningEvent); // 오케스트레이터의 RUNNING 이벤트를 구독한다.
    eventSource.addEventListener("DONE", handleDoneEvent); // 오케스트레이터의 DONE 이벤트를 구독한다.
    eventSource.addEventListener("PROXY_ERROR", handleProxyErrorEvent); // 프록시 에러 이벤트를 구독한다.

    eventSource.onmessage = (event) => { // 기본 message 이벤트가 올 경우를 대비한다.
      console.log("[SSE] MESSAGE:", event.data); // 기본 message 이벤트 데이터를 출력한다.
    }; // onmessage 핸들러를 종료한다.

    eventSource.onerror = (event) => { // 네트워크 오류나 비정상 종료 시 호출될 수 있다.
      console.error("[SSE] Error:", event); // 원본 error 이벤트를 출력한다.

      if (receivedDoneRef.current) { // 이미 DONE을 받은 뒤 발생한 error인지 확인한다.
        console.log("[SSE] Ignored error after DONE"); // 정상 종료 이후 error로 보고 무시한다.
        closeEventSource(); // 연결을 닫는다.
        return; // 사용자에게 에러를 보여주지 않는다.
      } // DONE 이후 error 처리를 종료한다.

      setSubmitError("채점 상태를 실시간으로 불러오지 못했습니다."); // DONE 전에 끊긴 경우에만 에러를 표시한다.
      setIsSubmitting(false); // 제출 중 상태를 종료한다.
      closeEventSource(); // 실패한 SSE 연결을 닫는다.
    }; // onerror 핸들러를 종료한다.
  }, [closeEventSource, handleDoneEvent, handleProxyErrorEvent, handleRunningEvent]); // 의존성 배열을 등록한다.

  useEffect(() => { // 문제 페이지 최초 로드 또는 id 변경 시 데이터를 가져온다.
    const fetchUser = async () => { // 현재 유저를 가져오는 비동기 함수를 정의한다.
      const supabase = createClient(); // 브라우저용 Supabase 클라이언트를 생성한다.
      const { data } = await supabase.auth.getUser(); // 현재 로그인 유저 정보를 가져온다.
      setUser(data.user); // 유저 정보를 상태에 저장한다.
    }; // fetchUser 함수를 종료한다.

    const fetchProblem = async () => { // 현재 문제 상세를 가져오는 비동기 함수를 정의한다.
      setIsLoading(true); // 문제 로딩 상태를 시작한다.
      const response = await fetch(`/api/problems/${id}`); // 문제 상세 API를 호출한다.
      const data = await response.json(); // 응답 JSON을 파싱한다.
      setProblem(data); // 문제 데이터를 상태에 저장한다.
      setIsLoading(false); // 문제 로딩 상태를 종료한다.
    }; // fetchProblem 함수를 종료한다.

    void fetchUser(); // 현재 유저 정보를 조회한다.
    void fetchProblem(); // 문제 상세 정보를 조회한다.

    return () => { // 문제 변경 또는 unmount 시 실행한다.
      closeEventSource(); // 열려 있는 SSE 연결을 닫는다.
      reset(); // 제출 전역 상태를 초기화한다.
    }; // cleanup 함수를 종료한다.
  }, [closeEventSource, id, reset]); // id가 바뀌면 다시 실행한다.

  useEffect(() => { // 채점 완료 후 제출 상세 페이지로 이동한다.
    if (!submissionId || !status) return; // 제출 id나 상태가 없으면 종료한다.
    if (status === "PENDING" || status === "QUEUED" || status === "RUNNING") return; // 진행 중 상태면 이동하지 않는다.

    const timer = window.setTimeout(() => { // 결과를 잠시 보여준 뒤 이동하기 위한 타이머를 만든다.
      router.push(`/submissions/${submissionId}`); // 제출 상세 페이지로 이동한다.
    }, 1500); // 1.5초 후 이동한다.

    return () => window.clearTimeout(timer); // effect 정리 시 타이머를 제거한다.
  }, [router, status, submissionId]); // status 또는 submissionId가 바뀔 때 실행한다.

  const handleSubmit = async () => { // 제출 버튼 클릭 시 실행되는 함수를 정의한다.
    setSubmitError(null); // 이전 제출 에러를 초기화한다.

    if (!code.trim()) { // 코드가 비어 있는지 확인한다.
      setSubmitError("제출할 코드를 작성해주세요."); // 코드 없음 에러를 표시한다.
      return; // 제출 로직을 중단한다.
    } // 코드 검사를 종료한다.

    reset(); // 이전 제출 상태를 초기화한다.
    closeEventSource(); // 이전 SSE 연결이 남아 있다면 닫는다.
    setIsSubmitting(true); // 제출 중 상태를 시작한다.
    setProgress(null); // 이전 진행률을 초기화한다.
    setStatus("PENDING"); // 제출 상태를 PENDING으로 설정한다.

    try { // 제출 생성, SSE 연결, 채점 요청 과정의 에러를 처리한다.
      const response = await fetch("/api/submissions", { // 우리 서버에 제출 row 생성을 요청한다.
        method: "POST", // 새 제출을 생성하므로 POST를 사용한다.
        headers: { "Content-Type": "application/json" }, // JSON 요청임을 명시한다.
        body: JSON.stringify({ // 요청 본문을 JSON 문자열로 만든다.
          problemId: id, // 현재 문제 id를 전달한다.
          language, // 선택한 언어를 전달한다.
          sourceCode: code, // 작성한 코드를 전달한다.
        }), // body 생성을 종료한다.
      }); // 제출 생성 요청을 종료한다.

      const data = await response.json(); // 제출 생성 응답을 JSON으로 파싱한다.

      if (!response.ok) { // 제출 생성이 실패했는지 확인한다.
        throw new Error(data.message || "제출 생성에 실패했습니다."); // 실패 메시지로 예외를 던진다.
      } // 제출 생성 실패 검사를 종료한다.

      const sid = String(data.submissionId); // 응답에서 submissionId를 문자열로 가져온다. (DB는 UUID 문자열 사용)

      if (!sid) { // submissionId가 존재하는지 확인한다.
        throw new Error("제출 ID가 올바르지 않습니다."); // 없으면 예외를 던진다.
      } // submissionId 검사를 종료한다.

      setSubmissionId(sid); // 전역 제출 상태에 submissionId를 저장한다.
      startJudgeEventStream(sid); // RUNNING/DONE SSE 이벤트 구독을 시작한다.

      const judgeResponse = await fetch("/api/judge-executions", { // Next.js 프록시를 통해 채점 실행을 요청한다.
        method: "POST", // 채점 실행 요청이므로 POST를 사용한다.
        headers: { "Content-Type": "application/json" }, // JSON 요청임을 명시한다.
        body: JSON.stringify({ submissionId: sid }), // 채점할 submissionId를 전달한다.
      }); // 채점 요청을 종료한다.

      if (!judgeResponse.ok) { // 채점 요청이 실패했는지 확인한다.
        const judgeData = await judgeResponse.json().catch(() => ({})); // 실패 응답을 JSON으로 읽되 실패해도 빈 객체를 사용한다.
        throw new Error(judgeData.error || "채점 요청에 실패했습니다."); // 채점 실패 메시지로 예외를 던진다.
      } // 채점 요청 실패 검사를 종료한다.
    } catch (error: any) { // 제출 과정에서 발생한 모든 에러를 처리한다.
      console.error("[Submit] Error:", error); // 에러를 콘솔에 출력한다.
      setSubmitError(error.message || "제출 중 오류가 발생했습니다."); // 사용자에게 에러 메시지를 보여준다.
      setStatus(null); // 제출 상태를 초기화한다.
      setIsSubmitting(false); // 제출 중 상태를 종료한다.
      closeEventSource(); // 실패한 경우 SSE 연결을 닫는다.
    } // try-catch를 종료한다.
  }; // handleSubmit 함수를 종료한다.

  const handleRun = async () => { // 예제 실행 버튼 클릭 시 실행되는 함수를 정의한다.
    setIsTesting(true); // 실행 중 상태를 시작한다.
    setTestResults(null); // 이전 실행 결과를 초기화한다.

    try { // 실행 요청 중 에러를 처리한다.
      const response = await fetch("/api/submissions/run", { // 예제 실행 API를 호출한다.
        method: "POST", // 실행 요청이므로 POST를 사용한다.
        headers: { "Content-Type": "application/json" }, // JSON 요청임을 명시한다.
        body: JSON.stringify({ // 요청 본문을 만든다.
          problemId: id, // 현재 문제 id를 전달한다.
          language, // 선택한 언어를 전달한다.
          sourceCode: code, // 작성한 코드를 전달한다.
        }), // body 생성을 종료한다.
      }); // 실행 요청을 종료한다.

      const data = await response.json(); // 실행 응답을 JSON으로 파싱한다.

      if (!response.ok) { // 실행 요청이 실패했는지 확인한다.
        throw new Error(data.message || "실행에 실패했습니다."); // 실행 실패 메시지로 예외를 던진다.
      } // 실행 실패 검사를 종료한다.

      setTestResults(data.results ?? []); // 실행 결과를 상태에 저장한다.
    } catch (error) { // 실행 과정에서 에러가 발생한 경우를 처리한다.
      console.error("[Run] Error:", error); // 실행 에러를 콘솔에 출력한다.
      setTestResults([]); // 실패 시 빈 결과를 저장한다.
    } finally { // 성공과 실패와 관계없이 실행한다.
      setIsTesting(false); // 실행 중 상태를 종료한다.
    } // try-catch-finally를 종료한다.
  }; // handleRun 함수를 종료한다.

  const label = getSubmissionLabel(status, result?.result, result?.failed_testcase_order); // 현재 제출 상태에 맞는 라벨 정보를 가져온다.

  let editorBorderClass = "border-transparent"; // 기본 에디터 테두리 스타일을 정의한다.

  if (label.isSuccess) { // 성공 상태인지 확인한다.
    editorBorderClass = "border-emerald-500 ring-4 ring-emerald-500/20"; // 성공 스타일을 적용한다.
  } else if (label.isFail) { // 실패 상태인지 확인한다.
    editorBorderClass = "border-red-500 ring-4 ring-red-500/20"; // 실패 스타일을 적용한다.
  } else if (label.isPending) { // 진행 중 상태인지 확인한다.
    editorBorderClass = "border-blue-500 ring-4 ring-blue-500/20"; // 진행 중 스타일을 적용한다.
  } // 에디터 테두리 스타일 계산을 종료한다.

  if (isLoading || !problem) { // 문제 로딩 중이거나 문제 데이터가 없으면 확인한다.
    return ( // 로딩 UI를 반환한다.
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-black"> {/* 로딩 화면 wrapper를 렌더링한다. */}
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" /> {/* 로딩 스피너를 렌더링한다. */}
      </div> // 로딩 wrapper를 종료한다.
    ); // 로딩 UI 반환을 종료한다.
  } // 로딩 조건을 종료한다.

  return ( // 실제 문제 상세 페이지 UI를 반환한다.
    <div className="flex-1 flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] bg-zinc-50 dark:bg-black p-4 gap-4"> {/* 전체 페이지 레이아웃을 렌더링한다. */}
      <div className="flex-1 lg:w-1/2 flex flex-col min-h-0 bg-white dark:bg-[#09090b] rounded-xl shadow-2xl border border-zinc-200 dark:border-white/5 relative"> {/* 왼쪽 문제 설명 패널을 렌더링한다. */}
        <ProblemDetail problem={problem} /> {/* 문제 상세 내용을 렌더링한다. */}
      </div> {/* 왼쪽 패널을 종료한다. */}

      <div id="code-editor-section" className="flex-1 lg:w-1/2 flex flex-col gap-4 relative scroll-mt-20"> {/* 오른쪽 코드 작성 패널을 렌더링한다. */}
        <div className={`min-h-60 flex-1 flex flex-col relative rounded-xl border-2 transition-all duration-300 ${editorBorderClass} lg:overflow-hidden`}> {/* 에디터 wrapper를 렌더링한다. */}
          <button
            onClick={() => setEditorTheme(editorTheme === "light" ? "dark" : "light")}
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all shadow-md backdrop-blur-sm border border-zinc-200 dark:border-zinc-700"
            title="에디터 테마 변경"
          >
            {editorTheme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <CodeEditor // 코드 에디터를 렌더링한다.
            value={code} // 현재 코드 값을 전달한다.
            onChange={handleCodeChange} // 코드 변경 핸들러를 전달한다.
            language={language} // 현재 선택된 언어를 전달한다.
            theme={editorTheme || undefined} // 선택된 테마를 전달한다.
            isLoading={isCodeLoading} // 최신 제출 코드 로딩 상태를 전달한다.
          />
        </div> {/* 에디터 wrapper를 종료한다. */}

        <div className="flex flex-col gap-4 lg:relative sticky bottom-4 z-40"> {/* 하단 액션바와 결과 영역을 렌더링한다. */}
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-center bg-white/95 dark:bg-zinc-900/95 p-4 rounded-xl border border-zinc-200 dark:border-white/10 backdrop-blur-xl shadow-2xl transition-all"> {/* 액션바 컨테이너를 렌더링한다. */}
            <div className="flex items-center space-x-2"> {/* 언어 선택 영역을 렌더링한다. */}
              <label htmlFor="language-select" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">언어</label> {/* 언어 select 라벨을 렌더링한다. */}
              <select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"> {/* 언어 select를 렌더링한다. */}
                <option value="python">Python</option> {/* Python 선택지를 렌더링한다. */}
                <option value="java">Java</option> {/* Java 선택지를 렌더링한다. */}
                <option value="cpp">C++</option> {/* C++ 선택지를 렌더링한다. */}
              </select> {/* 언어 select를 종료한다. */}
            </div> {/* 언어 선택 영역을 종료한다. */}

            <div className="flex items-center gap-2 mt-3 lg:mt-0"> {/* 실행/제출 버튼 영역을 렌더링한다. */}
              <button onClick={handleRun} disabled={isTesting || isSubmitting} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"> {/* 실행 버튼을 렌더링한다. */}
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} {/* 실행 상태에 따라 아이콘을 렌더링한다. */}
                실행 {/* 실행 버튼 텍스트를 렌더링한다. */}
              </button> {/* 실행 버튼을 종료한다. */}

              <button onClick={handleSubmit} disabled={isSubmitting || isTesting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"> {/* 제출 버튼을 렌더링한다. */}
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {/* 제출 상태에 따라 아이콘을 렌더링한다. */}
                제출 {/* 제출 버튼 텍스트를 렌더링한다. */}
              </button> {/* 제출 버튼을 종료한다. */}
            </div> {/* 실행/제출 버튼 영역을 종료한다. */}
          </div> {/* 액션바 컨테이너를 종료한다. */}

          {status && ( // 제출 상태가 있으면 결과 뷰어를 렌더링한다.
            <ResultViewer
              problem={problem}
              progress={progress}
              submitError={submitError}
            /> // 제출 결과 뷰어를 렌더링한다. (실시간 진행 상황 및 에러 전달)
          )} {/* 결과 뷰어 조건부 렌더링을 종료한다. */}

          {testResults && ( // 예제 실행 결과가 있으면 렌더링한다.
            <TestResultViewer results={testResults} /> // 예제 실행 결과 뷰어를 렌더링한다.
          )} {/* 예제 실행 결과 조건부 렌더링을 종료한다. */}
        </div> {/* 하단 액션바와 결과 영역을 종료한다. */}
      </div> {/* 오른쪽 코드 작성 패널을 종료한다. */}
    </div> // 전체 페이지 레이아웃을 종료한다.
  ); // JSX 반환을 종료한다.
} // ProblemPage 컴포넌트를 종료한다.