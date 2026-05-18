"use server";

// 서버용 Supabase client를 가져온다.
import { createClient } from "@/utils/supabase/server";

// 닉네임 중복 여부를 확인하는 서버 액션이다.
export async function checkNicknameDuplicate(nickname: string) {
  // Supabase 서버 client를 생성한다.
  const supabase = await createClient();

  // 닉네임 앞뒤 공백을 제거한다.
  const normalizedNickname = nickname.trim();

  // 닉네임이 비어 있으면 검사하지 않는다.
  if (!normalizedNickname) {
    // 빈 값은 중복이 아니라고 반환한다.
    return { isDuplicate: false, error: null };
  }

  // 닉네임 중복 체크 RPC를 호출한다.
  const { data, error } = await supabase.rpc("check_nickname_duplicate", {
    // 검사할 닉네임을 전달한다.
    p_nickname: normalizedNickname,
  });

  // 디버깅용 로그를 출력한다.
  console.log("nickname duplicate rpc result:", {
    // 검사한 닉네임을 출력한다.
    normalizedNickname,

    // RPC 반환값을 출력한다.
    data,

    // RPC 에러를 출력한다.
    error,
  });

  // RPC 실행 중 에러가 발생한 경우다.
  if (error) {
    // 에러 메시지를 반환한다.
    return { isDuplicate: false, error: error.message };
  }

  // data가 true이면 중복이다.
  return { isDuplicate: data === true, error: null };
}

// 학번 중복 여부를 확인하는 서버 액션이다.
type SchoolNumberCheckStatus = "available" | "duplicate" | "length";
export async function checkSchoolNumberDuplicate(
  schoolNumber: string,
): Promise<{ status: SchoolNumberCheckStatus; error: string | null }> {
  const supabase = await createClient();

  const normalizedSchoolNumber = schoolNumber.trim();

  if (!normalizedSchoolNumber) {
    return {
      status: "length",
      error: "학번은 숫자 7자리여야 합니다.",
    };
  }

  // 학번은 숫자 7자리여야 한다.
  if (!/^\d{7}$/.test(normalizedSchoolNumber)) {
    return {
      status: "length",
      error: "학번은 숫자 7자리여야 합니다.",
    };
  }

  const numericSchoolNumber = Number(normalizedSchoolNumber);

  const { data, error } = await supabase.rpc("check_school_number_duplicate", {
    p_school_number: numericSchoolNumber,
  });

  console.log("school number duplicate rpc result:", {
    normalizedSchoolNumber,
    numericSchoolNumber,
    data,
    error,
  });

  if (error) {
    return {
      status: "length",
      error: error.message,
    };
  }

  return {
    status: data === true ? "duplicate" : "available",
    error: null,
  };
}