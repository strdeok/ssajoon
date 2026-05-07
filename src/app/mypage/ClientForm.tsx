"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, UserX, Check, X } from "lucide-react";
import {
  checkProfileNicknameDuplicate,
  checkProfileSchoolNumberDuplicate,
  updateProfile,
  withdrawAccount,
} from "./actions";
import { useRouter } from "next/navigation";

interface ClientFormProps {
  initialNickname: string;
  initialSchoolNumber: string;
  userEmail: string;
}

type CheckStatus = "idle" | "checking" | "available" | "duplicate" | "error";

export default function ClientForm({ initialNickname, initialSchoolNumber, userEmail }: ClientFormProps) {
  const router = useRouter();
  const [savedNickname, setSavedNickname] = useState(initialNickname.trim());
  const [savedSchoolNumber, setSavedSchoolNumber] = useState(String(initialSchoolNumber || "").trim());
  const [nickname, setNickname] = useState(initialNickname.trim());
  const [schoolNumber, setSchoolNumber] = useState(String(initialSchoolNumber || ""));
  const [nicknameStatus, setNicknameStatus] = useState<CheckStatus>("idle");
  const [schoolNumberStatus, setSchoolNumberStatus] = useState<CheckStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  // 탈퇴 처리 결과 메시지 (별도 상태로 관리)
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const normalizedNickname = nickname.trim();
  const normalizedSchoolNumber = schoolNumber.trim();
  const isNicknameChanged = normalizedNickname !== savedNickname;
  const isSchoolNumberChanged = normalizedSchoolNumber !== savedSchoolNumber;
  const hasChanges = isNicknameChanged || isSchoolNumberChanged;
  const isNicknameReady = !isNicknameChanged || nicknameStatus === "available";
  const isSchoolNumberReady = !isSchoolNumberChanged || schoolNumberStatus === "available";
  const isSchoolNumberInvalid = Boolean(normalizedSchoolNumber) && !/^\d{7}$/.test(normalizedSchoolNumber);
  const isSaveDisabled =
    isSaving ||
    !hasChanges ||
    normalizedNickname === "" ||
    normalizedSchoolNumber === "" ||
    isSchoolNumberInvalid ||
    !isNicknameReady ||
    !isSchoolNumberReady;

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setMessage(null);
    setNicknameStatus(value.trim() === savedNickname ? "available" : "idle");
  };

  const handleSchoolNumberChange = (value: string) => {
    setSchoolNumber(value);
    setMessage(null);
    setSchoolNumberStatus(value.trim() === savedSchoolNumber ? "available" : "idle");
  };

  const checkNickname = async () => {
    if (!normalizedNickname) {
      setNicknameStatus("idle");
      setMessage({ type: "error", text: "닉네임을 입력해주세요." });
      return;
    }

    if (!isNicknameChanged) {
      setNicknameStatus("available");
      setMessage({ type: "success", text: "현재 사용 중인 닉네임입니다." });
      return;
    }

    setNicknameStatus("checking");
    setMessage(null);

    try {
      const result = await checkProfileNicknameDuplicate(normalizedNickname);

      if (result.error) {
        setNicknameStatus("error");
        setMessage({ type: "error", text: result.error });
        return;
      }

      setNicknameStatus(result.isDuplicate ? "duplicate" : "available");
    } catch {
      setNicknameStatus("error");
      setMessage({ type: "error", text: "닉네임 중복 확인 중 오류가 발생했습니다." });
    }
  };

  const checkSchoolNumber = async () => {
    if (!normalizedSchoolNumber) {
      setSchoolNumberStatus("idle");
      setMessage({ type: "error", text: "학번을 입력해주세요." });
      return;
    }

    if (!/^\d{7}$/.test(normalizedSchoolNumber)) {
      setSchoolNumberStatus("error");
      setMessage({ type: "error", text: "학번은 숫자 7자리여야 합니다." });
      return;
    }

    if (!isSchoolNumberChanged) {
      setSchoolNumberStatus("available");
      setMessage({ type: "success", text: "현재 사용 중인 학번입니다." });
      return;
    }

    setSchoolNumberStatus("checking");
    setMessage(null);

    try {
      const result = await checkProfileSchoolNumberDuplicate(normalizedSchoolNumber);

      if (result.error) {
        setSchoolNumberStatus("error");
        setMessage({ type: "error", text: result.error });
        return;
      }

      setSchoolNumberStatus(result.isDuplicate ? "duplicate" : "available");
    } catch {
      setSchoolNumberStatus("error");
      setMessage({ type: "error", text: "학번 중복 확인 중 오류가 발생했습니다." });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSaveDisabled) {
      if (hasChanges && (!isNicknameReady || !isSchoolNumberReady)) {
        const fields = [
          isNicknameChanged && !isNicknameReady ? "닉네임" : null,
          isSchoolNumberChanged && !isSchoolNumberReady ? "학번" : null,
        ].filter(Boolean).join(", ");

        setMessage({ type: "error", text: `${fields} 중복 확인이 필요합니다.` });
      }
      return;
    }

    setIsSaving(true);
    setMessage(null);

    if (normalizedSchoolNumber && !/^\d{7}$/.test(normalizedSchoolNumber)) {
      setMessage({ type: "error", text: "학번은 숫자 7자리여야 합니다." });
      setIsSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append("nickname", normalizedNickname);
    formData.append("school_number", normalizedSchoolNumber);

    const result = await updateProfile(formData);

    if (result.success) {
      setSavedNickname(normalizedNickname);
      setSavedSchoolNumber(normalizedSchoolNumber);
      setNickname(normalizedNickname);
      setSchoolNumber(normalizedSchoolNumber);
      setNicknameStatus("available");
      setSchoolNumberStatus("available");
      setMessage({ type: "success", text: result.message });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.message });
    }

    setIsSaving(false);
  };

  const handleWithdraw = async () => {
    // 탈퇴 확인 다이얼로그
    if (!window.confirm("정말 탈퇴하시겠습니까? 계정과 제출 내역이 숨김 처리되며, 같은 계정으로 다시 로그인하면 복구할 수 있습니다.")) {
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
      const error = err as { digest?: string };

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
            <div className="flex gap-2">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="사용할 닉네임을 입력하세요"
                required
                maxLength={20}
                className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 outline-none transition-all"
              />
              <button
                type="button"
                onClick={checkNickname}
                disabled={nicknameStatus === "checking" || normalizedNickname === ""}
                className="shrink-0 px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nicknameStatus === "checking" ? <Loader2 className="w-4 h-4 animate-spin" /> : "중복확인"}
              </button>
            </div>
            {isNicknameChanged && nicknameStatus === "idle" && (
              <div className="mt-2 flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                저장 전 닉네임 중복 확인이 필요합니다.
              </div>
            )}
            {nicknameStatus === "available" && (
              <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                {isNicknameChanged ? "사용 가능한 닉네임입니다." : "현재 저장된 닉네임입니다."}
              </div>
            )}
            {nicknameStatus === "duplicate" && (
              <div className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <X className="w-4 h-4" />
                이미 사용 중인 닉네임입니다.
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="schoolNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              학번
            </label>
            <div className="flex gap-2">
              <input
                id="schoolNumber"
                type="text"
                value={schoolNumber}
                onChange={(e) => handleSchoolNumberChange(e.target.value)}
                minLength={7}
                maxLength={7}
                pattern="\d{7}"
                placeholder="학번 7자리를 입력하세요"
                className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 outline-none transition-all"
                title="학번은 숫자 7자리여야 합니다."
                required
              />
              <button
                type="button"
                onClick={checkSchoolNumber}
                disabled={schoolNumberStatus === "checking" || normalizedSchoolNumber === ""}
                className="shrink-0 px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {schoolNumberStatus === "checking" ? <Loader2 className="w-4 h-4 animate-spin" /> : "중복확인"}
              </button>
            </div>
            {isSchoolNumberInvalid && (
              <div className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                학번은 숫자 7자리여야 합니다.
              </div>
            )}
            {isSchoolNumberChanged && !isSchoolNumberInvalid && schoolNumberStatus === "idle" && (
              <div className="mt-2 flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                저장 전 학번 중복 확인이 필요합니다.
              </div>
            )}
            {schoolNumberStatus === "available" && (
              <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                {isSchoolNumberChanged ? "사용 가능한 학번입니다." : "현재 저장된 학번입니다."}
              </div>
            )}
            {schoolNumberStatus === "duplicate" && (
              <div className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <X className="w-4 h-4" />
                이미 사용 중인 학번입니다.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSaveDisabled}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{hasChanges ? "저장하기" : "저장됨"}</span>
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
          회원 탈퇴 시 계정과 제출 내역이 숨김 처리되며 모든 세션이 로그아웃됩니다. 같은 계정으로 다시 로그인하면 복구 여부를 선택할 수 있습니다.
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
