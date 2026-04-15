import { create } from "zustand";
import { JudgeResult, SubmissionStatus } from "@/types/submission";

interface SubmissionState {
  submissionId: string | null;
  status: SubmissionStatus | null;
  result: JudgeResult | null;
  setSubmissionId: (id: string | null) => void;
  setStatus: (status: SubmissionStatus | null) => void;
  setResult: (res: JudgeResult | null) => void;
  reset: () => void;
}

export const useSubmissionStore = create<SubmissionState>((set) => ({
  submissionId: null,
  status: null,
  result: null,
  setSubmissionId: (submissionId) => set({ submissionId }),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result }),
  reset: () => set({ submissionId: null, status: null, result: null }),
}));
