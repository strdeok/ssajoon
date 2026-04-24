import { createClient } from "@/utils/supabase/server";

/**
 * 서버 컴포넌트, 서버 액션, API Route 등에서 관리자 여부를 확인하는 유틸 함수
 */
export async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data) return false;
  
  return data.role === 'ADMIN';
}

/**
 * 관리자가 아닐 경우 에러를 던지는 유틸 (Server Action 용)
 */
export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
}
