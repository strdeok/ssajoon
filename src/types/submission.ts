export type SubmissionStatus = "PENDING" | "QUEUED" | "RUNNING" | "AC" | "WA" | "CE" | "RE" | "TLE" | "MLE" | "DONE" | "FAILED" | "ERROR";

export interface Submission {
  id: string; // uuid
  user_id: string;
  problem_id: string;
  language: string;
  source_code: string;
  status: SubmissionStatus;
  result?: string;
  execution_time_ms?: number;
  memory_kb?: number;
  submitted_at: string;
  judged_at?: string;
}

export interface SubmissionTestcaseResult {
  id: string; // uuid
  submission_id: string;
  testcase_id: string;
  result: string;
  execution_time_ms?: number;
  memory_kb?: number;
  error_message?: string;
}

export interface JudgeResult {
  status: SubmissionStatus;
  result?: string;
  execution_time_ms?: number;
  memory_kb?: number;
}
