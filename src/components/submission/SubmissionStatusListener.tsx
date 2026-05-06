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

    const channelName = `submission_${submissionId}`;

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
          const newRow = payload.new;

          if (newRow) {
            if (newRow.status) {
              setStatus(newRow.status as SubmissionStatus);
            }

            setResult({
              status: newRow.status as SubmissionStatus,
              result: newRow.result,
              execution_time_ms: newRow.execution_time_ms,
              memory_kb: newRow.memory_kb,
              failed_testcase_order: newRow.failed_testcase_order,
            });
          }
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data, error } = await supabase
            .from("submissions")
            .select("id, status, result, failed_testcase_order, execution_time_ms, memory_kb")
            .eq("id", submissionId)
            .single();

          if (!error && data) {
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId, setStatus, setResult]);

  return null;
}
