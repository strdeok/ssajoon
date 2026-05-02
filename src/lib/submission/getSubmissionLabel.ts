export interface SubmissionLabelInfo {
  text: string;
  isSuccess: boolean;
  isFail: boolean;
  isPending: boolean;
  isError: boolean;
  colorClass: string;
}

/**
 * 제출 상태(status)와 결과(result), 실패 순서(failed_testcase_order)를 조합하여
 * UI에 표시될 정확한 한글 라벨과 상태 메타데이터를 반환합니다.
 */
export function getSubmissionLabel(
  status: string | null | undefined,
  result: string | null | undefined,
  failedTestcaseOrder?: number | null,
  publicTestcaseCount: number = 0 // 추가: 히든 테스트케이스 번호 보정용 공개 테스트케이스 수
): SubmissionLabelInfo {
  // 채점 중으로 간주할 status 목록을 정의한다.
  const pendingStatuses = ["PENDING", "QUEUED", "RUNNING"];

  // result가 실제 채점 결과인지 먼저 판단한다.
  const hasFinalResult = !!result && result !== "DONE";

  // 최종 해석 상태를 정한다.
  // result가 있으면 result를 최우선으로 사용하고, 없으면 status를 사용한다.
  const finalState = hasFinalResult ? result : status;

  // 최종 결과가 있으면 더 이상 pending으로 보지 않는다.
  const isPending = !hasFinalResult && pendingStatuses.includes(status || "");

  // 성공 여부를 계산한다.
  const isSuccess = finalState === "AC" || finalState === "SUCCESS";

  // 서버 에러성 상태를 계산한다.
  const isError = finalState === "FAILED" || finalState === "ERROR";

  // 실패 여부를 계산한다.
  const isFail =
    !!finalState &&
    !isSuccess &&
    !isPending &&
    !isError &&
    finalState !== "DONE";

  // 기본 표시값을 초기화한다.
  let text = "";
  let colorClass = "text-zinc-500";

  // 채점 대기/진행 상태를 처리한다.
  if (isPending) {
    text = status === "RUNNING" ? "채점 중" : "채점 대기 중";
    colorClass = "text-blue-500 animate-pulse";
  }
  // 정답 상태를 처리한다.
  else if (isSuccess) {
    text = "정답입니다";
    colorClass = "text-emerald-500";
  }
  // 실패 상태를 처리한다.
  else if (isFail) {
    colorClass = "text-red-500";

    switch (finalState) {
      case "WA":
        if (failedTestcaseOrder) {
          // 공개 테스트케이스 수를 기준으로 번호 보정 (히든 테스트케이스 실패 시)
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
  // 서버 내부 실패 상태를 처리한다.
  else if (isError) {
    colorClass = "text-orange-500";
    text = "채점 실패 (서버 에러)";
  }
  // DONE인데 result가 비어 있는 예외 상황을 처리한다.
  else if (status === "DONE") {
    text = "채점 완료 (결과 미상)";
  }
  // 그 외 예외 상황을 처리한다.
  else {
    text = "결과 확인 중";
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