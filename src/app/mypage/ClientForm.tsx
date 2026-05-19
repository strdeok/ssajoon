"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  UserX,
  X,
} from "lucide-react";
import {
  checkProfileNicknameDuplicate,
  updateProfile,
  withdrawAccount,
} from "./actions";
import { useRouter } from "next/navigation";

interface ClientFormProps {
  initialNickname: string;
  initialPreferredLanguage: string;
  initialShowAlgorithm: boolean;
  userEmail: string;
}

type CheckStatus = "idle" | "checking" | "available" | "duplicate" | "error";

export default function ClientForm({
  initialNickname,
  initialPreferredLanguage,
  initialShowAlgorithm,
  userEmail,
}: ClientFormProps) {
  const router = useRouter();
  const [savedNickname, setSavedNickname] = useState(initialNickname.trim());
  const [savedPreferredLanguage, setSavedPreferredLanguage] = useState(
    initialPreferredLanguage || "",
  );
  const [savedShowAlgorithm, setSavedShowAlgorithm] =
    useState(initialShowAlgorithm);
  const [nickname, setNickname] = useState(initialNickname.trim());
  const [preferredLanguage, setPreferredLanguage] = useState(
    initialPreferredLanguage || "",
  );
  const [showAlgorithm, setShowAlgorithm] = useState(initialShowAlgorithm);
  const [nicknameStatus, setNicknameStatus] = useState<CheckStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [withdrawMessage, setWithdrawMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const normalizedNickname = nickname.trim();
  const isNicknameChanged = normalizedNickname !== savedNickname;
  const isPreferredLanguageChanged =
    preferredLanguage !== savedPreferredLanguage;
  const isShowAlgorithmChanged = showAlgorithm !== savedShowAlgorithm;
  const hasChanges =
    isNicknameChanged || isPreferredLanguageChanged || isShowAlgorithmChanged;
  const isNicknameReady = !isNicknameChanged || nicknameStatus === "available";
  const isSaveDisabled =
    isSaving || !hasChanges || normalizedNickname === "" || !isNicknameReady;

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setMessage(null);
    setNicknameStatus(value.trim() === savedNickname ? "available" : "idle");
  };

  const handlePreferredLanguageChange = (value: string) => {
    setPreferredLanguage(value);
    setMessage(null);
  };

  const handleShowAlgorithmChange = (value: boolean) => {
    setShowAlgorithm(value);
    setMessage(null);
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
      setMessage({
        type: "error",
        text: "닉네임 중복 확인 중 오류가 발생했습니다.",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaveDisabled) {
      if (hasChanges && !isNicknameReady) {
        setMessage({
          type: "error",
          text: "닉네임 중복 확인이 필요합니다.",
        });
      }
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("nickname", normalizedNickname);
    formData.append("preferred_language", preferredLanguage);
    formData.append("show_algorithm", String(showAlgorithm));

    const result = await updateProfile(formData);

    if (result.success) {
      setSavedNickname(normalizedNickname);
      setSavedPreferredLanguage(preferredLanguage);
      setSavedShowAlgorithm(showAlgorithm);
      setNickname(normalizedNickname);
      setPreferredLanguage(preferredLanguage);
      setNicknameStatus("available");
      setMessage({ type: "success", text: result.message });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.message });
    }

    setIsSaving(false);
  };

  const handleWithdraw = async () => {
    if (
      !window.confirm(
        "정말 탈퇴하시겠습니까? 계정과 제출 이력이 숨김 처리되며, 같은 계정으로 다시 로그인하면 복구할 수 있습니다.",
      )
    ) {
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

      router.push("/");
      router.refresh();
    } catch (err) {
      const error = err as { digest?: string };

      if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }

      setWithdrawMessage({
        type: "error",
        text: "탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8">
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
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
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
                disabled={
                  nicknameStatus === "checking" || normalizedNickname === ""
                }
                className="shrink-0 px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nicknameStatus === "checking" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "중복확인"
                )}
              </button>
            </div>
            {isNicknameChanged && nicknameStatus === "idle" && (
              <div className="mt-2 flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                저장하려면 닉네임 중복 확인이 필요합니다.
              </div>
            )}
            {nicknameStatus === "available" && (
              <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                {isNicknameChanged
                  ? "사용 가능한 닉네임입니다."
                  : "현재 저장된 닉네임입니다."}
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
            <label
              htmlFor="preferredLanguage"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              선호 언어
            </label>
            <select
              id="preferredLanguage"
              value={preferredLanguage}
              onChange={(e) => handlePreferredLanguageChange(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 outline-none transition-all"
            >
              <option value="">선택 안 함</option>
              <option value="JAVA">JAVA 17</option>
              <option value="PYTHON">PYTHON 3.11</option>
              <option value="C++">C++</option>
            </select>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  알고리즘 표시 설정
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  문제를 풀기 전에 알고리즘 유형을 미리 볼지 선택할 수 있습니다.
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => handleShowAlgorithmChange(true)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    showAlgorithm
                      ? "bg-blue-600 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  알고리즘 보기
                </button>
                <button
                  type="button"
                  onClick={() => handleShowAlgorithmChange(false)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    !showAlgorithm
                      ? "bg-blue-600 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  알고리즘 숨기기
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              disabled={isSaveDisabled}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{hasChanges ? "저장하기" : "저장됨"}</span>
            </button>

            {message && (
              <div
                className={`flex items-center space-x-2 text-sm font-medium ${
                  message.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{message.text}</span>
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-xl border border-red-200 dark:border-red-900/50">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center">
          <UserX className="w-5 h-5 mr-2" />
          Danger Zone
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">
          회원 탈퇴 시 계정과 제출 이력이 숨김 처리되며 모든 세션이 로그아웃됩니다.
          같은 계정으로 다시 로그인하면 복구 여부를 선택할 수 있습니다.
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

        {withdrawMessage && (
          <div
            className={`mt-4 flex items-center space-x-2 text-sm font-medium ${
              withdrawMessage.type === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>{withdrawMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
