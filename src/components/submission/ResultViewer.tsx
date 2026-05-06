"use client"; // 이 컴포넌트가 클라이언트에서 실행되도록 지정한다.

import { Activity, CheckCircle2, Clock, Hash, Loader2, XCircle } from "lucide-react"; // 결과 UI에 사용할 아이콘들을 가져온다.
import { useSubmissionStore } from "@/store/submissionStore"; // 제출 상태 전역 스토어를 가져온다.
import { Problem } from "@/types/problem"; // 문제 타입을 가져온다.

import { SubmissionStatus } from "@/types/submission"; // 제출 상태 타입을 가져온다.

export type JudgeProgressPayload = { // 오케스트레이터 SSE payload 타입을 정의한다.
  submissionId: string | number; // 제출 id를 의미한다. (문자열 UUID 또는 숫자 허용)
  phase: SubmissionStatus; // 현재 채점 phase를 의미한다.
  completedTestcases: number; // 완료된 테스트케이스 수를 의미한다.
  totalTestcases: number; // 전체 테스트케이스 수를 의미한다.
  progressPercent: number; // 진행률 퍼센트를 의미한다.
  result: SubmissionStatus | null; // 최종 채점 결과를 의미한다.
}; // JudgeProgressPayload 타입 정의를 종료한다.

interface ResultViewerProps { // ResultViewer가 받을 props 타입을 정의한다.
  problem?: Problem | null; // 현재 문제 정보를 받는다.
  progress?: JudgeProgressPayload | null; // SSE로 받은 실시간 채점 진행 상태를 받는다.
  submitError?: string | null; // 제출 또는 SSE 에러 메시지를 받는다.
} // ResultViewerProps 타입 정의를 종료한다.

const RESULT_LABELS: Record<string, { text: string; className: string; type: "success" | "fail" | "pending" }> = { // 결과 코드별 화면 표시 정보를 정의한다.
  AC: { text: "맞았습니다!!", className: "text-emerald-600 dark:text-emerald-400", type: "success" }, // AC 결과 표시 정보를 정의한다.
  ACCEPTED: { text: "맞았습니다!!", className: "text-emerald-600 dark:text-emerald-400", type: "success" }, // ACCEPTED 결과 표시 정보를 정의한다.
  WA: { text: "틀렸습니다", className: "text-red-600 dark:text-red-400", type: "fail" }, // WA 결과 표시 정보를 정의한다.
  WRONG_ANSWER: { text: "틀렸습니다", className: "text-red-600 dark:text-red-400", type: "fail" }, // WRONG_ANSWER 결과 표시 정보를 정의한다.
  TLE: { text: "시간 초과", className: "text-orange-600 dark:text-orange-400", type: "fail" }, // TLE 결과 표시 정보를 정의한다.
  TIME_LIMIT_EXCEEDED: { text: "시간 초과", className: "text-orange-600 dark:text-orange-400", type: "fail" }, // TIME_LIMIT_EXCEEDED 결과 표시 정보를 정의한다.
  MLE: { text: "메모리 초과", className: "text-purple-600 dark:text-purple-400", type: "fail" }, // MLE 결과 표시 정보를 정의한다.
  MEMORY_LIMIT_EXCEEDED: { text: "메모리 초과", className: "text-purple-600 dark:text-purple-400", type: "fail" }, // MEMORY_LIMIT_EXCEEDED 결과 표시 정보를 정의한다.
  RE: { text: "런타임 에러", className: "text-rose-600 dark:text-rose-400", type: "fail" }, // RE 결과 표시 정보를 정의한다.
  RUNTIME_ERROR: { text: "런타임 에러", className: "text-rose-600 dark:text-rose-400", type: "fail" }, // RUNTIME_ERROR 결과 표시 정보를 정의한다.
  CE: { text: "컴파일 에러", className: "text-yellow-600 dark:text-yellow-400", type: "fail" }, // CE 결과 표시 정보를 정의한다.
  COMPILE_ERROR: { text: "컴파일 에러", className: "text-yellow-600 dark:text-yellow-400", type: "fail" }, // COMPILE_ERROR 결과 표시 정보를 정의한다.
  PENDING: { text: "채점 대기 중", className: "text-blue-600 dark:text-blue-400", type: "pending" }, // PENDING 상태 표시 정보를 정의한다.
  QUEUED: { text: "채점 대기 중", className: "text-blue-600 dark:text-blue-400", type: "pending" }, // QUEUED 상태 표시 정보를 정의한다.
  RUNNING: { text: "채점 중", className: "text-blue-600 dark:text-blue-400", type: "pending" }, // RUNNING 상태 표시 정보를 정의한다.
}; // RESULT_LABELS 정의를 종료한다.

function normalizeValue(value: string | null | undefined) { // 결과 문자열을 비교 가능한 형태로 정규화한다.
  return (value ?? "").trim().toUpperCase(); // null을 빈 문자열로 바꾸고 공백 제거 후 대문자로 변환한다.
} // normalizeValue 함수를 종료한다.

function clampPercent(value: number | null | undefined) { // 진행률을 0~100 사이로 보정한다.
  if (typeof value !== "number" || !Number.isFinite(value)) return 0; // 유효한 숫자가 아니면 0을 반환한다.
  return Math.max(0, Math.min(100, value)); // 0보다 작으면 0, 100보다 크면 100으로 제한한다.
} // clampPercent 함수를 종료한다.

function getResultInfo(resultCode: string, fallbackStatus: string) { // 최종 결과 또는 상태에 맞는 표시 정보를 가져온다.
  const resultInfo = RESULT_LABELS[resultCode]; // resultCode에 해당하는 표시 정보를 찾는다.
  if (resultInfo) return resultInfo; // 결과 표시 정보가 있으면 그대로 반환한다.

  const statusInfo = RESULT_LABELS[fallbackStatus]; // 상태값에 해당하는 표시 정보를 찾는다.
  if (statusInfo) return statusInfo; // 상태 표시 정보가 있으면 그대로 반환한다.

  return { text: resultCode || fallbackStatus || "채점 상태 확인 중", className: "text-zinc-600 dark:text-zinc-300", type: "pending" as const }; // 매칭되지 않으면 기본 표시 정보를 반환한다.
} // getResultInfo 함수를 종료한다.

export function ResultViewer({ problem, progress = null, submitError = null }: ResultViewerProps) { // 제출 결과 뷰어 컴포넌트를 정의한다.
  const { status, submissionId, result } = useSubmissionStore(); // 제출 전역 스토어에서 상태, 제출 id, 결과 상세를 가져온다.

  // 디버깅을 위해 전달된 데이터를 출력한다.
  console.log("[ResultViewer] Render - Status:", status, "Progress:", progress?.phase, progress?.progressPercent + "%");

  const progressPhase = normalizeValue(progress?.phase); // SSE progress의 phase를 정규화한다.
  const progressResult = normalizeValue(progress?.result); // SSE progress의 result를 정규화한다.
  const storeStatus = normalizeValue(status); // store의 status를 정규화한다.
  const storeResult = normalizeValue(result?.result); // store의 result를 정규화한다.

  const effectiveSubmissionId = submissionId ?? progress?.submissionId ?? null; // 표시할 제출 id를 결정한다.
  // SSE phase가 진행 중(RUNNING/PENDING 등)이면 무조건 SSE 데이터를 우선한다.
  const isSseActive = progressPhase && progressPhase !== "DONE" && !progressResult;
  const effectiveStatus = isSseActive ? progressPhase : (storeStatus || progressPhase || "PENDING");
  const effectiveResult = progressResult || storeResult || (RESULT_LABELS[effectiveStatus]?.type !== "pending" ? effectiveStatus : ""); // 최종 결과 코드를 결정한다.

  const isRunning = effectiveStatus === "RUNNING" || effectiveStatus === "PENDING" || effectiveStatus === "QUEUED" || isSseActive; // 현재 진행 중 상태인지 판단한다.
  const isDone = (effectiveStatus === "DONE" || Boolean(effectiveResult)) && !isSseActive; // 완료 상태인지 판단한다.
  const resultInfo = getResultInfo(effectiveResult, isRunning ? "RUNNING" : effectiveStatus); // 화면에 표시할 결과 정보를 계산한다.

  const completedTestcases = Math.max(0, progress?.completedTestcases ?? 0); // 완료된 테스트케이스 수를 안전하게 계산한다.
  const totalTestcases = Math.max(0, progress?.totalTestcases ?? 0); // 전체 테스트케이스 수를 안전하게 계산한다.
  const progressPercent = clampPercent(progress?.progressPercent); // 진행률을 안전하게 계산한다.

  if (!progress && !status && !submissionId && !submitError) return null; // 표시할 데이터가 전혀 없으면 렌더링하지 않는다.

  return ( // 결과 UI JSX를 반환한다.
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-white/10 dark:bg-zinc-900/70"> {/* 결과 카드 컨테이너를 렌더링한다. */}
      <div className="mb-4 flex items-center justify-between gap-3"> {/* 카드 상단 영역을 렌더링한다. */}
        <div className="flex items-center gap-3"> {/* 상태 아이콘과 텍스트 영역을 렌더링한다. */}
          {isRunning && !isDone ? ( // 진행 중이고 완료되지 않은 경우를 확인한다.
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" /> // 진행 중 스피너를 렌더링한다.
          ) : resultInfo.type === "success" ? ( // 성공 결과인지 확인한다.
            <CheckCircle2 className="h-6 w-6 text-emerald-500" /> // 성공 아이콘을 렌더링한다.
          ) : resultInfo.type === "fail" ? ( // 실패 결과인지 확인한다.
            <XCircle className="h-6 w-6 text-red-500" /> // 실패 아이콘을 렌더링한다.
          ) : ( // 그 외 상태를 처리한다.
            <Clock className="h-6 w-6 text-blue-500" /> // 기본 상태 아이콘을 렌더링한다.
          )}

          <div> {/* 상태 텍스트 wrapper를 렌더링한다. */}
            <p className={`text-lg font-bold ${resultInfo.className}`}> {/* 결과 제목을 렌더링한다. */}
              {isRunning && !isDone ? "채점 중" : resultInfo.text} {/* 진행 중이면 채점 중, 아니면 결과 텍스트를 표시한다. */}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400"> {/* 보조 설명을 렌더링한다. */}
              {problem?.title ? `${problem.title} 채점 결과` : "실시간 채점 상태"} {/* 문제 제목이 있으면 포함해서 표시한다. */}
            </p>
          </div>
        </div>

        {effectiveSubmissionId && ( // 제출 id가 있으면 표시한다.
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"> {/* 제출 id 배지를 렌더링한다. */}
            <Hash className="h-3.5 w-3.5" /> {/* 해시 아이콘을 렌더링한다. */}
            {effectiveSubmissionId} {/* 제출 id를 출력한다. */}
          </div>
        )}
      </div>

      {progress && ( // SSE 진행 데이터가 있으면 진행률 UI를 렌더링한다.
        <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10"> {/* 진행률 박스를 렌더링한다. */}
          <div className="flex items-center justify-between text-sm text-blue-700 dark:text-blue-300"> {/* 진행률 상단 텍스트를 렌더링한다. */}
            <div className="flex items-center gap-2 font-semibold"> {/* phase 표시 영역을 렌더링한다. */}
              <Activity className="h-4 w-4" /> {/* 활동 아이콘을 렌더링한다. */}
              <span>{progress.phase === "DONE" ? "채점 완료" : "테스트케이스 채점 중"}</span> {/* phase에 맞는 문구를 출력한다. */}
            </div>
            <span className="font-mono font-bold">{progressPercent}%</span> {/* 진행률 숫자를 출력한다. */}
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950"> {/* 진행바 배경을 렌더링한다. */}
            <div className="h-full rounded-full bg-blue-600 " style={{ width: `${progressPercent}%` }} /> {/* 진행률만큼 채워지는 바를 렌더링한다. */}
          </div>

          <div className="flex items-center justify-between text-xs text-blue-700/80 dark:text-blue-300/80"> {/* 테스트케이스 수 표시 영역을 렌더링한다. */}
            <span>완료된 테스트케이스</span> {/* 라벨을 출력한다. */}
            <span className="font-mono font-semibold">{completedTestcases} / {totalTestcases}</span> {/* 완료/전체 테스트케이스 수를 출력한다. */}
          </div>
        </div>
      )}

      {submitError && ( // 제출 에러가 있으면 에러 박스를 렌더링한다.
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"> {/* 에러 메시지 컨테이너를 렌더링한다. */}
          {submitError} {/* 에러 메시지를 출력한다. */}
        </div>
      )}

      {(result?.execution_time_ms !== undefined || result?.memory_kb !== undefined) && ( // 실행 시간 또는 메모리 정보가 있으면 렌더링한다.
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2"> {/* 성능 정보 그리드를 렌더링한다. */}
          {result?.execution_time_ms !== undefined && ( // 실행 시간 정보가 있는지 확인한다.
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-black/30"> {/* 실행 시간 박스를 렌더링한다. */}
              실행 시간: <strong>{result.execution_time_ms}</strong> ms {/* 실행 시간을 출력한다. */}
            </div>
          )}

          {result?.memory_kb !== undefined && ( // 메모리 정보가 있는지 확인한다.
            <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-black/30"> {/* 메모리 박스를 렌더링한다. */}
              메모리: <strong>{(result.memory_kb / 1024).toFixed(2)}</strong> MB {/* 메모리 사용량을 출력한다. */}
            </div>
          )}
        </div>
      )}
    </section>
  );
}