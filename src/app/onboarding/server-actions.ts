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
export async function checkSchoolNumberDuplicate(schoolNumber: string) {
  // Supabase 서버 client를 생성한다.
  const supabase = await createClient();

  // 학번 앞뒤 공백을 제거한다.
  const normalizedSchoolNumber = schoolNumber.trim();

  // 학번이 비어 있으면 검사하지 않는다.
  if (!normalizedSchoolNumber) {
    // 빈 값은 중복이 아니라고 반환한다.
    return { isDuplicate: false, error: null };
  }

  // 학번 문자열을 숫자로 변환한다.
  const numericSchoolNumber = Number(normalizedSchoolNumber);

  // 숫자로 변환할 수 없는 값이면 에러를 반환한다.
  if (!Number.isFinite(numericSchoolNumber)) {
    // 학번 형식 에러를 반환한다.
    return { isDuplicate: false, error: "학번은 숫자여야 합니다." };
  }

  // 학번 중복 체크 RPC를 호출한다.
  const { data, error } = await supabase.rpc("check_school_number_duplicate", {
    // 검사할 학번을 전달한다.
    p_school_number: numericSchoolNumber,
  });

  // 디버깅용 로그를 출력한다.
  console.log("school number duplicate rpc result:", {
    // 입력된 학번 문자열을 출력한다.
    normalizedSchoolNumber,

    // 숫자로 변환된 학번을 출력한다.
    numericSchoolNumber,

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