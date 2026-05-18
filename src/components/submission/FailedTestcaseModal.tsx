"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface TestcaseDisplayData {
  id: string;
  input_text: string;
  expected_output: string;
  is_hidden: boolean;
}

interface FailedTestcaseModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  failedOrder?: number;
  testcase?: TestcaseDisplayData;
  submissionId?: string;
  problemId?: string;
}

export function FailedTestcaseModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  failedOrder: propFailedOrder,
  testcase: propTestcase,
  submissionId,
  problemId,
}: FailedTestcaseModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [testcase, setTestcase] = useState<TestcaseDisplayData | null>(
    propTestcase || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const onClose = propOnClose || (() => setInternalIsOpen(false));
  const failedOrder = propFailedOrder || 0;

  const handleOpen = async () => {
    setInternalIsOpen(true);
    if (!propTestcase && submissionId && problemId && propFailedOrder) {
      await fetchTestcaseDetails();
    }
  };

  const fetchTestcaseDetails = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data, error: fetchError } = await supabase
        .from("problem_testcases")
        .select("*")
        .eq("problem_id", problemId)
        .eq("testcase_order", propFailedOrder)
        .single();

      if (fetchError) throw fetchError;
      if (data) {
        setTestcase({
          id: data.id,
          input_text: data.input_text,
          expected_output: data.expected_output,
          is_hidden: data.is_hidden,
        });
      }
    } catch {
      setError("테스트케이스 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submissionId && !propIsOpen && !internalIsOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleOpen}
        className="rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
      >
        <Search className="h-4 w-4" />
        실패 테스트케이스 보기
      </Button>
    );
  }

  return (
    <Dialog
      open={Boolean(isOpen)}
      onClose={onClose}
      title="실패 테스트케이스 분석"
      description="오답이 발생한 입력과 기대 출력값을 확인합니다."
      className="max-w-2xl"
    >
      <div className="custom-scrollbar flex max-h-[70vh] flex-col gap-6 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-500">정보를 가져오는 중입니다.</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-red-500">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : testcase ? (
          <>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              이 제출은 {failedOrder}번 테스트케이스에서 오답 판정을 받았습니다.
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                입력값
              </h3>
              <div className="custom-scrollbar max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm dark:border-white/5 dark:bg-black/40">
                {testcase.input_text || "입력값이 없습니다."}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                기대 출력값
              </h3>
              <div className="custom-scrollbar max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm dark:border-white/5 dark:bg-black/40">
                {testcase.expected_output || "기대 출력값이 없습니다."}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex justify-end border-t border-border p-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Dialog>
  );
}
