export type SubmissionStatus = "PENDING" | "AC" | "WA";

export interface Submission {
  id: string;
  problemId: string;
  code: string;
  language: string;
  status: SubmissionStatus;
  createdAt: string;
}

export interface JudgeResult {
  status: SubmissionStatus;
}
