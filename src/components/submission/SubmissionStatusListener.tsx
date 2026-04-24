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
              failed_testcase_order: newRow.failed_testcase_order, // fail_order -> failed_testcase_order
            });
          }
        }
      )
      .subscribe(async (status) => {
        console.log(`Supabase Realtime status for ${channelName}:`, status);
        
        // Race condition 방지: 구독 성공 직후 최신 상태를 한 번 긁어온다.
        if (status === "SUBSCRIBED") {
          const { data, error } = await supabase
            .from("submissions")
            .select("id, status, result, failed_testcase_order, execution_time_ms, memory_kb")
            .eq("id", submissionId)
            .single();

          if (error) {
            console.error("초기 상태 fetch 에러:", error);
          } else if (data) {
            console.log("SUBSCRIBED 직후 초기 상태 반영:", data);
            
            if (data.status) {
              setStatus(data.status as SubmissionStatus);
            }
            
            setResult({
              status: data.status as SubmissionStatus,
              result: data.result,
              execution_time_ms: data.execution_time_ms,
              memory_kb: data.memory_kb,
              failed_testcase_order: data.failed_testcase_order,
            });
          }
        }
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
