import { JudgeResult } from "@/types/submission";

export const mockJudge = (code: string): JudgeResult => {
  if (code.includes("return")) {
    return { status: "AC" };
  }
  return { status: "WA" };
};
