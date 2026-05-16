import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { Problem } from "@/types/problem";
import {
  ProblemContent,
  type PublicTestcase,
} from "@/components/problem/ProblemContent";
import { ProblemSolveClient } from "@/components/problem/ProblemSolveClient";

type ProblemPageProps = {
  params: Promise<{ id: string }>;
};

type PublicProblemRow = {
  id: number;
  title: string;
  tag1: string;
  tag2?: string | null;
  description: string;
  input_description: string;
  output_description: string;
  difficulty?: string | null;
  time_limit_ms?: number | null;
  memory_limit_mb?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getProblem(
  supabase: ServerSupabaseClient,
  problemId: number,
): Promise<Problem | null> {
  const { data, error } = await supabase
    .from("problems")
    .select(
      "id, title, tag1, tag2, description, input_description, output_description, difficulty, time_limit_ms, memory_limit_mb, created_at, updated_at",
    )
    .eq("id", problemId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !data) return null;

  const problem = data as PublicProblemRow;

  return {
    id: problem.id,
    title: problem.title,
    tag1: problem.tag1,
    tag2: problem.tag2,
    description: problem.description,
    input_description: problem.input_description,
    output_description: problem.output_description,
    difficulty: problem.difficulty ?? undefined,
    time_limit_ms: problem.time_limit_ms ?? undefined,
    memory_limit_mb: problem.memory_limit_mb ?? undefined,
    created_at: problem.created_at ?? undefined,
    updated_at: problem.updated_at ?? undefined,
  };
}

async function getPublicTestcases(
  supabase: ServerSupabaseClient,
  problemId: number,
): Promise<PublicTestcase[]> {
  const { data, error } = await supabase
    .from("problem_testcases")
    .select("id, input_text, expected_output, testcase_order")
    .eq("problem_id", problemId)
    .eq("is_hidden", false)
    .eq("is_deleted", false)
    .order("testcase_order", { ascending: true });

  if (error) return [];

  return (data ?? []) as PublicTestcase[];
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params;
  const problemId = Number(id);

  if (!Number.isFinite(problemId)) {
    notFound();
  }

  const supabase = await createClient();
  const [problem, publicTestcases] = await Promise.all([
    getProblem(supabase, problemId),
    getPublicTestcases(supabase, problemId),
  ]);

  if (!problem) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row lg:h-full bg-zinc-50 dark:bg-black p-4 gap-4">
      <div className="flex-1 lg:w-1/2 h-[calc(100dvh-120px)] overflow-y-scroll flex flex-col min-h-0 bg-white dark:bg-[#09090b] rounded-xl shadow-2xl border border-zinc-200 dark:border-white/5 relative">
        <ProblemContent problem={problem} publicTestcases={publicTestcases} />
      </div>

      <ProblemSolveClient problem={problem} />
    </div>
  );
}
