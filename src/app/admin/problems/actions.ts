"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/auth/isAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteProblem(id: number) {
  await requireAdmin();
  const supabaseAdmin = createAdminClient();

  const now = new Date().toISOString();

  // 1. 하위 submissions soft delete (문제 삭제 시 연쇄)
  const { error: subError } = await supabaseAdmin
    .from('submissions')
    .update({ is_deleted: true, deleted_at: now })
    .eq('problem_id', id)
    .eq('is_deleted', false);
  if (subError) {}

  // 2. 하위 problem_examples soft delete
  const { error: exError } = await supabaseAdmin
    .from('problem_examples')
    .update({ is_deleted: true, deleted_at: now })
    .eq('problem_id', id)
    .eq('is_deleted', false);
  if (exError) {}

  // 3. 하위 problem_testcases soft delete
  const { error: tcError } = await supabaseAdmin
    .from('problem_testcases')
    .update({ is_deleted: true, deleted_at: now })
    .eq('problem_id', id)
    .eq('is_deleted', false);
  if (tcError) {}

  // 4. 부모 problems soft delete (최종)
  const { error } = await supabaseAdmin
    .from('problems')
    .update({ is_deleted: true, deleted_at: now })
    .eq('id', id);

  if (error) {
    throw new Error('문제 삭제에 실패했습니다.');
  }

  revalidatePath('/admin/problems');
  revalidatePath('/problems');
}

export async function saveProblem(formData: any) {
  await requireAdmin();
  const supabaseAdmin = createAdminClient();

  const { id, title, category, difficulty, description, input_description, output_description, time_limit_ms, memory_limit_mb, examples, testcases } = formData;

  let problemId = id;

  const problemData = {
    title,
    category,
    difficulty,
    description,
    input_description,
    output_description,
    time_limit_ms: time_limit_ms ? parseInt(time_limit_ms) : null,
    memory_limit_mb: memory_limit_mb ? parseInt(memory_limit_mb) : null,
  };

  if (problemId) {
    // Update existing
    const { error: updateError } = await supabaseAdmin
      .from('problems')
      .update(problemData)
      .eq('id', problemId);

    if (updateError) throw new Error(`문제 업데이트 실패: ${updateError.message}`);

    // 기존 예제 및 테스트케이스 일괄 삭제 후 재삽입
    await supabaseAdmin.from('problem_examples').delete().eq('problem_id', problemId);
    await supabaseAdmin.from('problem_testcases').delete().eq('problem_id', problemId);

  } else {
    // Insert new
    const { data: newProblem, error: insertError } = await supabaseAdmin
      .from('problems')
      .insert([problemData])
      .select()
      .single();

    if (insertError) throw new Error(`문제 생성 실패: ${insertError.message}`);
    problemId = newProblem.id;
  }

  // 예제 삽입
  if (examples && examples.length > 0) {
    const examplesToInsert = examples.map((ex: any, idx: number) => ({
      problem_id: problemId,
      example_order: idx + 1,
      input_text: ex.input_text,
      output_text: ex.output_text,
    }));
    const { error: exError } = await supabaseAdmin.from('problem_examples').insert(examplesToInsert);
    if (exError) throw new Error(`예제 삽입 실패: ${exError.message}`);
  }

  // 테스트케이스 삽입
  if (testcases && testcases.length > 0) {
    const testcasesToInsert = testcases.map((tc: any, idx: number) => ({
      problem_id: problemId,
      testcase_order: idx + 1,
      input_text: tc.input_text,
      expected_output: tc.expected_output,
      is_hidden: true, // 숨김 테스트케이스로 관리
    }));
    const { error: tcError } = await supabaseAdmin.from('problem_testcases').insert(testcasesToInsert);
    if (tcError) throw new Error(`테스트케이스 삽입 실패: ${tcError.message}`);
  }

  revalidatePath('/admin/problems');
  revalidatePath('/problems');
  redirect('/admin/problems');
}
