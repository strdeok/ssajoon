"use client"; // 이 hook은 클라이언트에서 실행되도록 설정한다.

import { useCallback, useEffect, useRef, useState } from "react"; // React hook들을 가져온다.
import { createClient } from "@/utils/supabase/client"; // 브라우저용 Supabase 클라이언트를 가져온다.
import { getDefaultCodeTemplate, getLanguageQueryValues, normalizeLanguage } from "@/lib/codeTemplates"; // 코드 템플릿 관련 유틸 함수를 가져온다.

type UseProblemStarterCodeParams = { // hook이 받을 파라미터 타입을 정의한다.
    problemId: number | string; // 현재 문제 id를 의미한다.
    userId?: string | null; // 현재 로그인한 유저 id를 의미한다.
    language: string; // 현재 선택된 언어를 의미한다.
}; // UseProblemStarterCodeParams 타입 정의를 종료한다.

type LatestSubmissionCodeRow = { // submissions에서 가져올 최신 코드 row 타입을 정의한다.
    source_code: string | null; // 제출한 소스 코드를 의미한다.
}; // LatestSubmissionCodeRow 타입 정의를 종료한다.

export function useProblemStarterCode({ problemId, userId, language }: UseProblemStarterCodeParams) { // 문제별 에디터 초기 코드를 관리하는 hook을 정의한다.
    const supabase = createClient(); // 브라우저용 Supabase 클라이언트를 생성한다.

    const requestIdRef = useRef(0); // 비동기 요청 순서를 구분하기 위한 ref를 만든다.
    const userEditedRef = useRef(false); // 사용자가 현재 코드에 직접 입력했는지 저장하는 ref를 만든다.

    const [code, setCode] = useState(""); // 에디터에 표시할 코드 상태를 정의한다.
    const [isCodeLoading, setIsCodeLoading] = useState(false); // 최신 제출 코드 조회 로딩 상태를 정의한다.

    const handleCodeChange = useCallback((nextCode: string | undefined) => { // 에디터 코드 변경 핸들러를 정의한다.
        userEditedRef.current = true; // 사용자가 직접 코드를 수정했음을 표시한다.
        setCode(nextCode ?? ""); // undefined가 들어오면 빈 문자열로 처리해서 코드 상태를 갱신한다.
    }, []); // 외부 의존성이 없으므로 빈 배열을 사용한다.

    const loadStarterCode = useCallback(async () => { // 현재 문제와 언어에 맞는 시작 코드를 로드하는 함수를 정의한다.
        const currentRequestId = requestIdRef.current + 1; // 새 요청 id를 계산한다.
        requestIdRef.current = currentRequestId; // 현재 요청 id를 ref에 저장한다.

        const normalizedLanguage = normalizeLanguage(language); // 선택된 언어를 정규화한다.
        const defaultTemplate = getDefaultCodeTemplate(normalizedLanguage); // 선택된 언어의 기본 템플릿을 가져온다.

        userEditedRef.current = false; // 언어가 바뀌며 새 코드를 불러오는 시점에는 사용자 수정 여부를 초기화한다.
        setIsCodeLoading(true); // 코드 로딩 상태를 시작한다.

        if (!userId) { // 로그인한 유저가 없는지 확인한다.
            setCode(defaultTemplate); // 비로그인 유저에게는 기본 템플릿을 보여준다.
            setIsCodeLoading(false); // 코드 로딩 상태를 종료한다.
            return; // 함수 실행을 종료한다.
        }

        const { data, error } = await supabase // Supabase에서 최신 제출 코드를 조회한다.
            .from("submissions") // submissions 테이블을 조회한다.
            .select("source_code") // 필요한 source_code 컬럼만 가져온다.
            .eq("problem_id", problemId) // 현재 문제에 대한 제출만 조회한다.
            .eq("user_id", userId) // 현재 로그인한 유저의 제출만 조회한다.
            .eq("is_deleted", false) // 삭제되지 않은 제출만 조회한다.
            .in("language", getLanguageQueryValues(normalizedLanguage)) // 선택된 언어와 같은 계열의 제출만 조회한다.
            .order("submitted_at", { ascending: false }) // 가장 최근 제출이 먼저 오게 정렬한다.
            .limit(1) // 최신 제출 하나만 가져온다.
            .maybeSingle<LatestSubmissionCodeRow>(); // 제출이 없을 수도 있으므로 maybeSingle을 사용한다.

        if (requestIdRef.current !== currentRequestId) { // 더 최신 요청이 이미 시작되었는지 확인한다.
            return; // 오래된 요청 결과는 무시한다.
        }

        if (userEditedRef.current) { // 요청 중 사용자가 코드를 입력했는지 확인한다.
            setIsCodeLoading(false); // 로딩 상태만 종료한다.
            return; // 사용자가 쓴 코드를 덮어쓰지 않는다.
        }

        if (error) { // 최신 제출 코드 조회 중 에러가 발생했는지 확인한다.
            console.error("최신 제출 코드 조회 실패:", error); // 에러를 콘솔에 출력한다.
            setCode(defaultTemplate); // 실패 시 기본 템플릿을 보여준다.
            setIsCodeLoading(false); // 코드 로딩 상태를 종료한다.
            return; // 함수 실행을 종료한다.
        }

        const latestSourceCode = data?.source_code?.trim() ? data.source_code : null; // 최신 제출 코드가 실제로 있는지 확인한다.

        setCode(latestSourceCode ?? defaultTemplate); // 최신 제출 코드가 있으면 사용하고 없으면 기본 템플릿을 사용한다.
        setIsCodeLoading(false); // 코드 로딩 상태를 종료한다.
    }, [language, problemId, supabase, userId]); // 문제 id, 유저 id, 언어가 바뀌면 함수를 다시 만든다.

    useEffect(() => { // 문제 id, 유저 id, 언어가 바뀔 때 시작 코드를 다시 로드한다.
        void loadStarterCode(); // 최신 제출 코드 또는 기본 템플릿 로드를 실행한다.
    }, [loadStarterCode]); // loadStarterCode가 바뀔 때 실행한다.

    return { // hook에서 사용할 값을 반환한다.
        code, // 에디터에 표시할 코드 값을 반환한다.
        setCode, // 외부에서 코드를 직접 설정할 수 있도록 setCode를 반환한다.
        isCodeLoading, // 코드 로딩 상태를 반환한다.
        handleCodeChange, // 에디터 onChange에 연결할 핸들러를 반환한다.
        reloadStarterCode: loadStarterCode, // 필요 시 수동으로 다시 불러올 수 있는 함수를 반환한다.
    }; // 반환 객체 정의를 종료한다.
} // useProblemStarterCode hook을 종료한다.