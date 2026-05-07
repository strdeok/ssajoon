"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setupProfile } from "./actions";
import { checkNicknameDuplicate, checkSchoolNumberDuplicate } from "./server-actions";
import { Send, Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function OnboardingPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = use(searchParams);
  const router = useRouter();

  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
  const [schoolNumberStatus, setSchoolNumberStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("nickname, school_number")
        .eq("id", user.id)
        .single();

      if (userData && userData.nickname && userData.school_number) {
        router.push("/");
        return;
      }

      setIsLoading(false);
    };

    checkUserProfile();
  }, [router]);

  const checkNickname = async (nickname: string) => {
    if (!nickname.trim()) return;

    setNicknameStatus('checking');
    try {
      const result = await checkNicknameDuplicate(nickname);

      setNicknameStatus(result.isDuplicate ? 'duplicate' : 'available');
    } catch (error) {
      setNicknameStatus('idle');
    }
  };

  const checkSchoolNumber = async (schoolNumber: string) => {
    if (!schoolNumber.trim()) return;

    setSchoolNumberStatus('checking');
    try {
      const result = await checkSchoolNumberDuplicate(schoolNumber);
      setSchoolNumberStatus(result.isDuplicate ? 'duplicate' : 'available');
    } catch (error) {
      setSchoolNumberStatus('idle');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const isSubmitDisabled = nicknameStatus !== 'available' || schoolNumberStatus !== 'available';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-black min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-sm flex flex-col gap-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl p-8">

        <h1 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-100 mb-2">
          프로필 설정
        </h1>
        <p className="text-sm text-center text-zinc-500">
          구글 로그인이 완료되었습니다. 서비스 이용을 위해 닉네임과 학번을 설정해주세요.
        </p>

        {params.message && (
          <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-500/20 text-center">
            {params.message}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="nickname">
              닉네임
            </label>
            <div className="flex gap-2">
              <input
                id="nickname"
                name="nickname"
                type="text"
                className="bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block flex-1 p-2.5 outline-none transition-all"
                placeholder="닉네임을 입력하세요"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('nickname') as HTMLInputElement;
                  checkNickname(input.value);
                }}
                disabled={nicknameStatus === 'checking'}
                className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nicknameStatus === 'checking' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '중복검사'
                )}
              </button>
            </div>
            {nicknameStatus === 'available' && (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                사용 가능한 닉네임입니다.
              </div>
            )}
            {nicknameStatus === 'duplicate' && (
              <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <X className="w-4 h-4" />
                이미 존재하는 닉네임입니다.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="school_number">
              학번
            </label>
            <div className="flex gap-2">
              <input
                id="school_number"
                name="school_number"
                type="text"
                minLength={7}
                maxLength={7}
                pattern="\d{7}"
                className="bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block flex-1 p-2.5 outline-none transition-all"
                placeholder="학번 7자리를 입력하세요"
                title="학번은 숫자 7자리여야 합니다."
                required
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('school_number') as HTMLInputElement;
                  checkSchoolNumber(input.value);
                }}
                disabled={schoolNumberStatus === 'checking'}
                className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {schoolNumberStatus === 'checking' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '중복검사'
                )}
              </button>
            </div>
            {schoolNumberStatus === 'available' && (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                사용 가능한 학번입니다.
              </div>
            )}
            {schoolNumberStatus === 'duplicate' && (
              <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <X className="w-4 h-4" />
                이미 존재하는 학번입니다.
              </div>
            )}
          </div>

          <button
            formAction={setupProfile}
            disabled={isSubmitDisabled}
            className="w-full mt-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Send className="w-4 h-4" />
            <span>설정 완료</span>
          </button>
        </form>
      </div>
    </div>
  );
}
