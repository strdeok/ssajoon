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
    .from("submissions")
    .update({ is_deleted: true, deleted_at: now })
    .eq("problem_id", id)
    .eq("is_deleted", false);
  if (subError) {
  }

  // 2. 하위 problem_examples soft delete
  const { error: exError } = await supabaseAdmin
    .from("problem_examples")
    .update({ is_deleted: true, deleted_at: now })
    .eq("problem_id", id)
    .eq("is_deleted", false);
  if (exError) {
  }

  // 3. 하위 problem_testcases soft delete
  const { error: tcError } = await supabaseAdmin
    .from("problem_testcases")
    .update({ is_deleted: true, deleted_at: now })
    .eq("problem_id", id)
    .eq("is_deleted", false);
  if (tcError) {
  }

  // 4. 부모 problems soft delete (최종)
  const { error } = await supabaseAdmin
    .from("problems")
    .update({ is_deleted: true, deleted_at: now })
    .eq("id", id);

  if (error) {
    throw new Error("문제 삭제에 실패했습니다.");
  }

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
}

export async function saveProblem(rawFormData: any) {
  // 관리자 권한 확인
  await requireAdmin();
  // Supabase 어드민 클라이언트 생성
  const supabaseAdmin = createAdminClient();

  // 프론트에서 배열로 올 경우를 대비한 방어 로직 (배열이면 첫 번째 요소 사용, 아니면 그대로)
  const formData = Array.isArray(rawFormData) ? rawFormData[0] : rawFormData;

  // formData에서 필요한 필드들을 구조 분해 할당으로 추출
  const {
    id,
    title,
    tag1,
    tag2,
    difficulty,
    description,
    input_description,
    output_description,
    time_limit_ms,
    memory_limit_mb,
    examples,
    testcases,
  } = formData;

  // id 유효성 검증 및 정제 (falsy 값이나 "undefined", "$undefined" 문자열은 null로 처리)
  let problemId: number | null = null;
  if (
    id !== undefined &&
    id !== null &&
    id !== "" &&
    id !== "undefined" &&
    id !== "$undefined"
  ) {
    // 유효한 형태의 id라면 숫자로 변환 시도
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      // 숫자 변환 실패 시 명확한 에러 발생
      throw new Error(`유효하지 않은 문제 ID입니다: ${id}`);
    }
    // 성공 시 problemId에 할당 (업데이트 모드)
    problemId = parsedId;
  }

  // DB에 삽입 또는 업데이트할 문제 데이터 객체 구성
  const problemData = {
    title,
    tag1,
    tag2,
    difficulty,
    description,
    input_description,
    output_description,
    is_deleted: false,
    time_limit_ms: time_limit_ms ? parseInt(time_limit_ms, 10) : null,
    memory_limit_mb: memory_limit_mb ? parseInt(memory_limit_mb, 10) : null,
  };

  if (problemId !== null) {
    // problemId가 null이 아니면 기존 문제 업데이트(Update) 수행
    const { error: updateError } = await supabaseAdmin
      .from("problems")
      .update(problemData)
      .eq("id", problemId);

    // 업데이트 실패 시 에러 발생
    if (updateError)
      throw new Error(`문제 업데이트 실패: ${updateError.message}`);

    // 기존 문제가 가지고 있던 예제 데이터 일괄 삭제
    await supabaseAdmin
      .from("problem_examples")
      .delete()
      .eq("problem_id", problemId);
    // 기존 문제가 가지고 있던 테스트케이스 데이터 일괄 삭제
    await supabaseAdmin
      .from("problem_testcases")
      .delete()
      .eq("problem_id", problemId);
  } else {
    // problemId가 null이면 새 문제 생성(Insert) 수행
    const { data: newProblem, error: insertError } = await supabaseAdmin
      .from("problems")
      .insert([problemData])
      .select()
      .single();

    // 삽입 실패 시 에러 발생
    if (insertError) throw new Error(`문제 생성 실패: ${insertError.message}`);
    // 새로 생성된 문제의 id를 problemId에 할당하여 이후 예제/테스트케이스 삽입에 사용
    problemId = newProblem.id;
  }

  // 전달받은 예제가 존재하고 길이가 1 이상일 경우 예제 삽입 로직 수행
  if (examples && Array.isArray(examples) && examples.length > 0) {
    // DB에 삽입할 형식으로 예제 데이터 매핑
    const examplesToInsert = examples.map((ex: any, idx: number) => ({
      problem_id: problemId, // 새로 생성되거나 업데이트된 문제의 id
      example_order: idx + 1, // 1부터 시작하는 순서 지정
      input_text: ex.input_text,
      output_text: ex.output_text,
    }));
    // 예제 데이터 일괄 삽입
    const { error: exError } = await supabaseAdmin
      .from("problem_examples")
      .insert(examplesToInsert);
    // 삽입 실패 시 에러 발생
    if (exError) throw new Error(`예제 삽입 실패: ${exError.message}`);
  }

  // 전달받은 테스트케이스가 존재하고 길이가 1 이상일 경우 테스트케이스 삽입 로직 수행
  if (testcases && Array.isArray(testcases) && testcases.length > 0) {
    // DB에 삽입할 형식으로 테스트케이스 데이터 매핑
    const testcasesToInsert = testcases.map((tc: any, idx: number) => ({
      problem_id: problemId, // 새로 생성되거나 업데이트된 문제의 id
      testcase_order: idx + 1, // 1부터 시작하는 순서 지정
      input_text: tc.input_text,
      expected_output: tc.expected_output,
      is_hidden: true, // 관리자에서 생성한 테스트케이스는 기본적으로 숨김 처리
    }));
    // 테스트케이스 데이터 일괄 삽입
    const { error: tcError } = await supabaseAdmin
      .from("problem_testcases")
      .insert(testcasesToInsert);
    // 삽입 실패 시 에러 발생
    if (tcError) throw new Error(`테스트케이스 삽입 실패: ${tcError.message}`);
  }

  // 관리자 문제 목록 페이지 캐시 갱신 (변경사항 반영)
  revalidatePath("/admin/problems");
  // 일반 사용자 문제 목록 페이지 캐시 갱신 (변경사항 반영)
  revalidatePath("/problems");
  // 작업 완료 후 관리자 문제 목록 페이지로 리다이렉트
  redirect("/admin/problems");
}

export async function toggleHidden(id: number, currentHidden: boolean) {
  await requireAdmin();
  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin
    .from("problems")
    .update({ is_hidden: !currentHidden })
    .eq("id", id);

  if (error) {
    throw new Error("상태 변경에 실패했습니다.");
  }

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
}
