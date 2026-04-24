import { isAdmin } from "@/lib/auth/isAdmin";
import { redirect } from "next/navigation";
import { ProblemForm } from "@/components/admin/ProblemForm";
import { createClient } from "@/utils/supabase/server";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  const { id } = await params;
  const supabase = await createClient();

  const { data: problem, error } = await supabase
    .from("problems")
    .select(`
      *,
      problem_examples (*),
      problem_testcases (*)
    `)
    .eq("id", id)
    .single();

  if (error || !problem) {
    redirect("/admin/problems");
  }

  // 예제와 테스트케이스는 order 기준으로 정렬
  problem.problem_examples = problem.problem_examples?.sort((a: any, b: any) => a.example_order - b.example_order) || [];
  problem.problem_testcases = problem.problem_testcases?.sort((a: any, b: any) => a.testcase_order - b.testcase_order) || [];

  return (
    <div className="pb-12">
      <ProblemForm initialData={problem} />
    </div>
  );
}
