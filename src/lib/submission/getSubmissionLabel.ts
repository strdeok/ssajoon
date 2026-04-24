export interface SubmissionLabelInfo {
  text: string;
  isSuccess: boolean;
  isFail: boolean;
  isPending: boolean;
  isError: boolean;
  colorClass: string;
}

/**
 * 제출 상태(status)와 결과(result), 실패 순서(fail_order)를 조합하여
 * UI에 표시될 정확한 한글 라벨과 상태 메타데이터를 반환합니다.
 */
export function getSubmissionLabel(
  status: string | null | undefined,
  result: string | null | undefined,
  failOrder?: number | null
): SubmissionLabelInfo {
  const pendingStatuses = ["PENDING", "QUEUED", "RUNNING"];
  const isPending = pendingStatuses.includes(status || "");
  
  // result가 있으면 우선적으로 사용하고, 없으면 status를 사용.
  // 단, result === 'DONE'이거나 status === 'DONE'일 때, result 값이 없다면 단순 완료 상태일 수 있음.
  // 하지만 채점 시스템에서는 result 필드에 AC, WA 등이 들어오는 것이 원칙이므로, result 값을 최우선 해석.
  const finalState = result && result !== "DONE" ? result : status;

  const isSuccess = finalState === "AC" || finalState === "SUCCESS";
  const isError = finalState === "FAILED" || finalState === "ERROR";
  const isFail = !!finalState && !isSuccess && !isPending && !isError && finalState !== "DONE";

  let text = "";
  let colorClass = "text-zinc-500"; // 기본 컬러

  if (isPending) {
    text = status === "RUNNING" ? "채점 중" : "채점 대기 중";
    colorClass = "text-blue-500 animate-pulse";
  } else if (isSuccess) {
    text = "정답입니다";
    colorClass = "text-emerald-500";
  } else if (isFail) {
    colorClass = "text-red-500";
    switch (finalState) {
      case "WA":
        text = failOrder ? `${failOrder}번 테스트케이스에서 틀렸습니다` : "오답입니다";
        break;
      case "CE":
        text = "컴파일 에러입니다";
        break;
      case "RE":
        text = "런타임 에러입니다";
        break;
      case "TLE":
        text = "시간 초과입니다";
        break;
      case "MLE":
        text = "메모리 초과입니다";
        break;
      case "PE":
        text = "출력 형식 오류입니다";
        break;
      case "SYSTEM_ERROR":
        text = "시스템 에러입니다";
        break;
      default:
        text = "채점에 실패했습니다";
    }
  } else if (isError) {
    colorClass = "text-orange-500";
    text = "채점 실패 (서버 에러)";
  } else if (status === "DONE") {
    // 혹시라도 status가 DONE인데 result가 매핑되지 않은 예외 상황 방어
    text = "채점 완료 (결과 미상)";
  }

  return {
    text,
    isSuccess,
    isFail,
    isPending,
    isError,
    colorClass,
  };
}
