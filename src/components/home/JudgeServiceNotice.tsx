"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function JudgeServiceNotice() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="채점 서비스 임시 중단 안내"
      description="서버 비용 이슈로 채점 서버를 잠시 닫아두었습니다."
      className="max-w-md"
    >
      <div className="p-6">
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            현재 문제를 읽고 확인하는 것은 가능하지만, 코드 제출 및
            채점은 이용할 수 없습니다. 서비스 재개 시 다시 안내드리겠습니다.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={() => setOpen(false)}>
            확인했습니다
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
