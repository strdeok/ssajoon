"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, UserX } from "lucide-react";
import { updateProfile, withdrawAccount } from "./actions";
import { useRouter } from "next/navigation";

interface ClientFormProps {
  initialNickname: string;
  initialSchoolNumber: string;
  userEmail: string;
}

export default function ClientForm({ initialNickname, initialSchoolNumber, userEmail }: ClientFormProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [schoolNumber, setSchoolNumber] = useState(initialSchoolNumber);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  // 탈퇴 처리 결과 메시지 (별도 상태로 관리)
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    if (schoolNumber && !/^\d{7}$/.test(schoolNumber)) {
      setMessage({ type: "error", text: "학번은 숫자 7자리여야 합니다." });
      setIsSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append("nickname", nickname);
    formData.append("school_number", schoolNumber);

    const result = await updateProfile(formData);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
    } else {
      setMessage({ type: "error", text: result.message });
    }

    setIsSaving(false);
  };

  const handleWithdraw = async () => {
    // 탈퇴 확인 다이얼로그
    if (!window.confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없으며 제출한 모든 내역의 식별이 불가능해집니다.")) {
      return;
    }

    setIsWithdrawing(true);
    setWithdrawMessage(null);

    try {
      const result = await withdrawAccount();

      if (result && !result.success) {
        setWithdrawMessage({ type: "error", text: result.message });
        setIsWithdrawing(false);
        return;
      }

      // redirect()가 throw되지 않고 결과가 반환된 경우의 fallback
      router.push("/");
      router.refresh();
    } catch (err) {
      const error = err as any;

      // NEXT_REDIRECT는 Next.js redirect()가 throw하는 정상적인 신호
      // 반드시 rethrow 해야 프레임워크가 실제 리다이렉트를 처리함
      if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }

      // 그 외 실제 에러만 처리
      setWithdrawMessage({ type: "error", text: "탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요." });
      setIsWithdrawing(false);
    }
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
            />
          </div>
          
          <div>
            <label htmlFor="schoolNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              학번
            </label>
            <input
              id="schoolNumber"
              type="text"
              value={schoolNumber}
              onChange={(e) => setSchoolNumber(e.target.value)}
              minLength={7}
              maxLength={7}
              pattern="\d{7}"
              placeholder="학번 7자리를 입력하세요"
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 outline-none transition-all"
              title="학번은 숫자 7자리여야 합니다."
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={
                isSaving || 
                (nickname === initialNickname && schoolNumber === initialSchoolNumber) || 
                nickname.trim() === ""
              }
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
          type="button"
          onClick={handleWithdraw}
          disabled={isWithdrawing}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
        >
          {isWithdrawing && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isWithdrawing ? "탈퇴 처리 중..." : "회원 탈퇴"}</span>
        </button>

        {/* 탈퇴 처리 결과 메시지 표시 */}
        {withdrawMessage && (
          <div className={`mt-4 flex items-center space-x-2 text-sm font-medium ${
            withdrawMessage.type === 'error' 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            <AlertCircle className="w-4 h-4" />
            <span>{withdrawMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
