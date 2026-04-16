import { JudgeResult } from "@/types/submission";

export const mockJudge = (code: string): JudgeResult => {
  const printMatch = code.match(/(?:print|console\.log|printf|System\.out\.print(?:ln)?)\(['"](.*?)['"]\)/);
  // Basic mock judge assumes if any recognizable output code is written, mark WA unless it matches perfectly or uses return magic.
  if (code.includes("return") || (printMatch && printMatch[1].trim() === "Hello World!")) {
    return { status: "AC" };
  }
  return { status: "WA" };
};
