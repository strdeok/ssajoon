"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSubmissionStore } from "@/store/submissionStore";
import { SubmissionStatus } from "@/types/submission";

interface SubmissionStatusListenerProps {
  submissionId: string | null;
}

export function SubmissionStatusListener({ submissionId }: SubmissionStatusListenerProps) {
  const { setStatus, setResult } = useSubmissionStore();

  useEffect(() => {
    if (!submissionId) return;

    const supabase = createClient();

    // 구독 채널 이름 생성 (안정성을 위해 고유 이름 사용)
    const channelName = `submission_${submissionId}`;

    // 특정 submissionId의 row 변경 감지
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "submissions",
          filter: `id=eq.${submissionId}`,
        },
        (payload) => {
          console.log("Realtime UPDATE received:", payload);
          const newRow = payload.new;

          if (newRow) {
            // 상태 갱신
            if (newRow.status) {
              setStatus(newRow.status as SubmissionStatus);
            }

            // 결과 및 리소스 사용량 갱신 (JudgeResult 형식에 맞게)
            setResult({
              status: newRow.status as SubmissionStatus,
              result: newRow.result,
              execution_time_ms: newRow.execution_time_ms,
              memory_kb: newRow.memory_kb,
              fail_order: newRow.fail_order, // fail_order 추가
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Supabase Realtime status for ${channelName}:`, status);
      });

    // Cleanup: 언마운트되거나 submissionId가 바뀔 때 구독 취소
    return () => {
      console.log(`Unsubscribing from ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [submissionId, setStatus, setResult]);

  // UI를 렌더링하지 않는 논리적 컴포넌트
  return null;
}
