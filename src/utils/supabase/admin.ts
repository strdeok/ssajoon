import { createClient } from "@supabase/supabase-js";

// Service Role Key를 사용하는 관리자 전용 Supabase 클라이언트입니다.
// 중요: 이 클라이언트는 RLS(Row Level Security)를 우회합니다.
// 오직 백엔드 서버 로직(API 라우트, 서버 액션, 서버 컴포넌트)에서 관리자 권한 확인 후 제한적으로 사용해야 합니다.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
