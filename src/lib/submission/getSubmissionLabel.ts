export interface SubmissionLabelInfo {
  text: string;
  isSuccess: boolean;
  isFail: boolean;
  isPending: boolean;
  isError: boolean;
  colorClass: string;
}

export function getSubmissionLabel(
  status: string | null | undefined,
  result: string | null | undefined,
  failedTestcaseOrder?: number | null,
  publicTestcaseCount: number = 0
): SubmissionLabelInfo {
  const pendingStatuses = ["PENDING", "QUEUED", "RUNNING"];

  const hasFinalResult = !!result && result !== "DONE";

  const finalState = hasFinalResult ? result : status;

  const isPending = !hasFinalResult && pendingStatuses.includes(status || "");

  const isSuccess = finalState === "AC" || finalState === "SUCCESS";

  const isError = finalState === "FAILED" || finalState === "ERROR";

  const isFail =
    !!finalState &&
    !isSuccess &&
    !isPending &&
    !isError &&
    finalState !== "DONE";

  let text = "";
  let colorClass = "text-zinc-500";

  if (isPending) {
    text = status === "RUNNING" ? "채점 중" : "채점 대기 중";
    colorClass = "text-blue-500 animate-pulse";
  }
  else if (isSuccess) {
    text = "정답입니다";
    colorClass = "text-emerald-500";
  }
  else if (isFail) {
    colorClass = "text-red-500";

    switch (finalState) {
      case "WA":
        if (failedTestcaseOrder) {
          const isHiddenFail = failedTestcaseOrder > publicTestcaseCount;
          const displayOrder = isHiddenFail ? failedTestcaseOrder - publicTestcaseCount : failedTestcaseOrder;
          const labelPrefix = isHiddenFail ? "히든 " : "";

          text = `${labelPrefix}${displayOrder}번 테스트케이스에서 틀렸습니다`;
        } else {
          text = "오답입니다";
        }
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
        break;
    }
  }
  else if (isError) {
    colorClass = "text-orange-500";
    text = "채점 실패 (서버 에러)";
  }
  else if (status === "DONE") {
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