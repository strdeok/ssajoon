"use client";

import { use } from "react";
import { setupNickname } from "./actions";
import { Send } from "lucide-react";

export default function OnboardingPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = use(searchParams);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-black min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-sm flex flex-col gap-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl p-8">
        
        <h1 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-100 mb-2">
          닉네임 설정
        </h1>
        <p className="text-sm text-center text-zinc-500">
          구글 로그인이 완료되었습니다. 프로필에 사용할 고유한 닉네임을 설정해주세요.
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
            <input
              id="nickname"
              name="nickname"
              type="text"
              className="bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none transition-all"
              placeholder="Developer"
              required
            />
          </div>

          <button
            formAction={setupNickname}
            className="w-full mt-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            <Send className="w-4 h-4" />
            <span>설정 완료</span>
          </button>
        </form>
      </div>
    </div>
  );
}
