"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, UserX } from "lucide-react";
import { updateProfile, withdrawAccount } from "./actions";

interface ClientFormProps {
  initialNickname: string;
  userEmail: string;
}

export default function ClientForm({ initialNickname, userEmail }: ClientFormProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("nickname", nickname);

    const result = await updateProfile(formData);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
    } else {
      setMessage({ type: "error", text: result.message });
    }

    setIsSaving(false);
  };

  const handleWithdraw = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없으며 제출한 모든 내역의 식별이 불가능해집니다.")) {
      return;
    }

    setIsWithdrawing(true);
    await withdrawAccount();
    // 성공 시 redirect 되므로 false 처리가 필요 없음
    setIsWithdrawing(false);
  };

  return (
    <div className="space-y-8">
      {/* 정보 수정 폼 */}
      <div className="bg-white dark:bg-[#09090b] p-6 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              이메일 (수정 불가)
            </label>
            <input
              type="text"
              disabled
              value={userEmail}
              className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg px-4 py-2.5 outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="사용할 닉네임을 입력하세요"
              required
              maxLength={20}
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSaving || nickname === initialNickname || nickname.trim() === ""}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>저장하기</span>
            </button>

            {message && (
              <div className={`flex items-center space-x-2 text-sm font-medium ${message.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{message.text}</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-xl border border-red-200 dark:border-red-900/50">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center">
          <UserX className="w-5 h-5 mr-2" />
          Danger Zone
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">
          회원 탈퇴 시 모든 세션이 로그아웃되며, 게시한 질문이나 제출 코드 등의 정보는 '탈퇴한 사용자'로 변경되어 식별할 수 없게 됩니다.
        </p>
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
        >
          {isWithdrawing && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>회원 탈퇴</span>
        </button>
      </div>
    </div>
  );
}
