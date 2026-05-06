"use client"; // 이 hook은 클라이언트에서 실행되도록 지정한다.

import { useCallback, useEffect, useRef, useState } from "react"; // React hook들을 가져온다.
import { createClient } from "@/utils/supabase/client"; // 브라우저용 Supabase 클라이언트를 가져온다.
import { getDefaultCodeTemplate, normalizeLanguage } from "@/lib/codeTemplates"; // 기본 코드 템플릿과 언어 정규화 유틸을 가져온다.

type UseProblemStarterCodeParams = { // hook이 받을 파라미터 타입을 정의한다.
    problemId: number | string; // 현재 문제 id를 의미한다.
    userId?: string | null; // 현재 로그인한 유저 id를 의미한다.
    language: string; // 현재 선택된 언어를 의미한다.
}; // UseProblemStarterCodeParams 타입 정의를 종료한다.

type LatestSubmissionCodeRow = { // submissions에서 가져올 row 타입을 정의한다.
    source_code: string | null; // 제출한 소스 코드를 의미한다.
    language: string | null; // 제출 언어를 의미한다.
    submitted_at: string | null; // 제출 시간을 의미한다.
}; // LatestSubmissionCodeRow 타입 정의를 종료한다.

function canonicalLanguage(language: string | null | undefined) { // DB와 UI의 언어 표기를 하나의 기준값으로 정규화한다.
    const value = (language ?? "").trim().toLowerCase(); // null을 빈 문자열로 바꾸고 공백 제거 후 소문자로 변환한다.

    if (value === "python" || value === "python3" || value === "py") return "python"; // Python 계열 표기를 python으로 통일한다.

    if (value === "java" || value === "java17" || value === "java 17") return "java"; // Java 계열 표기를 java로 통일한다.

    if ( // C++ 계열 표기인지 확인한다.
        value === "cpp" || // cpp 표기인지 확인한다.
        value === "c++" || // c++ 표기인지 확인한다.
        value === "cplusplus" || // cplusplus 표기인지 확인한다.
        value === "g++" || // g++ 표기인지 확인한다.
        value === "cpp17" || // cpp17 표기인지 확인한다.
        value === "c++17" || // c++17 표기인지 확인한다.
        value === "gnu c++17" // GNU C++17 표기인지 확인한다.
    ) { // C++ 계열 조건문을 시작한다.
        return "cpp"; // C++ 계열은 cpp로 통일한다.
    } // C++ 계열 조건문을 종료한다.

    return normalizeLanguage(value); // 그 외 값은 기존 normalizeLanguage 결과를 사용한다.
} // canonicalLanguage 함수를 종료한다.

function getLanguageAliases(language: string) { // Supabase 조회에 사용할 언어 후보 목록을 만든다.
    const canonical = canonicalLanguage(language); // 현재 선택 언어를 기준값으로 정규화한다.

    if (canonical === "python") { // Python 선택 상태인지 확인한다.
        return ["python", "python3", "py", "Python", "Python3", "PYTHON"]; // Python 후보만 반환한다.
    } // Python 후보 반환 조건문을 종료한다.

    if (canonical === "java") { // Java 선택 상태인지 확인한다.
        return ["java", "java17", "java 17", "Java", "Java 17", "JAVA"]; // Java 후보만 반환한다.
    } // Java 후보 반환 조건문을 종료한다.

    if (canonical === "cpp") { // C++ 선택 상태인지 확인한다.
        return ["cpp", "c++", "C++", "CPP", "cplusplus", "g++", "cpp17", "c++17", "C++17", "GNU C++17"]; // C++ 후보만 반환한다.
    } // C++ 후보 반환 조건문을 종료한다.

    return [canonical]; // 기타 언어는 정규화된 값 하나만 반환한다.
} // getLanguageAliases 함수를 종료한다.

function isSameLanguage(selectedLanguage: string, rowLanguage: string | null | undefined) { // 선택 언어와 DB row 언어가 같은 계열인지 확인한다.
    return canonicalLanguage(selectedLanguage) === canonicalLanguage(rowLanguage); // 양쪽을 같은 기준으로 정규화해서 비교한다.
} // isSameLanguage 함수를 종료한다.

export function useProblemStarterCode({ problemId, userId, language }: UseProblemStarterCodeParams) { // 문제별 시작 코드를 관리하는 hook을 정의한다.
    const requestIdRef = useRef(0); // 비동기 요청 순서를 구분하기 위한 ref를 만든다.
    const userEditedRef = useRef(false); // 사용자가 직접 코드를 수정했는지 저장하는 ref를 만든다.

    const [code, setCode] = useState(""); // 에디터에 표시할 코드 상태를 정의한다.
    const [isCodeLoading, setIsCodeLoading] = useState(false); // 코드 로딩 상태를 정의한다.

    const handleCodeChange = useCallback((nextCode: string | undefined) => { // 에디터 코드 변경 핸들러를 정의한다.
        userEditedRef.current = true; // 사용자가 직접 코드를 수정했다고 표시한다.
        setCode(nextCode ?? ""); // undefined가 들어오면 빈 문자열로 처리한다.
    }, []); // 외부 의존성이 없으므로 빈 배열을 사용한다.

    const loadStarterCode = useCallback(async () => { // 현재 문제와 언어에 맞는 시작 코드를 불러오는 함수를 정의한다.
        const currentRequestId = requestIdRef.current + 1; // 새 요청 id를 만든다.
        requestIdRef.current = currentRequestId; // 현재 요청 id를 ref에 저장한다.

        const selectedLanguage = canonicalLanguage(language); // 현재 선택 언어를 정규화한다.
        const defaultTemplate = getDefaultCodeTemplate(selectedLanguage); // 현재 언어의 기본 템플릿을 가져온다.

        userEditedRef.current = false; // 새 언어 로딩 시 사용자 수정 여부를 초기화한다.
        setCode(defaultTemplate); // 이전 언어 코드가 보이지 않도록 먼저 기본 템플릿을 넣는다.
        setIsCodeLoading(true); // 코드 로딩 상태를 시작한다.

        if (!userId) { // 로그인 유저가 없는지 확인한다.
            setIsCodeLoading(false); // 로딩 상태를 종료한다.
            return; // 비로그인 상태에서는 기본 템플릿만 사용한다.
        } // 비로그인 조건문을 종료한다.

        const supabase = createClient(); // 요청 시점에 Supabase 클라이언트를 생성한다.

        const languageAliases = getLanguageAliases(selectedLanguage); // 현재 선택 언어에 해당하는 DB 언어 후보만 만든다.

        const { data, error } = await supabase // Supabase에서 최신 제출 코드를 조회한다.
            .from("submissions") // submissions 테이블을 조회한다.
            .select("source_code, language, submitted_at") // 코드, 언어, 제출 시간을 가져온다.
            .eq("problem_id", problemId) // 현재 문제에 해당하는 제출만 조회한다.
            .eq("user_id", userId) // 현재 유저의 제출만 조회한다.
            .eq("is_deleted", false) // 삭제되지 않은 제출만 조회한다.
            .eq("result", "AC")
            .in("language", languageAliases) // 현재 선택 언어 계열만 조회한다.
            .order("submitted_at", { ascending: false }) // 가장 최근 제출이 먼저 오게 정렬한다.
            .limit(5); // 혹시 섞인 값이 있을 수 있으므로 몇 개만 받아서 한 번 더 검증한다.

        if (requestIdRef.current !== currentRequestId) { // 더 최신 요청이 이미 시작되었는지 확인한다.
            return; // 오래된 요청 결과는 무시한다.
        } // 요청 id 검사를 종료한다.

        if (userEditedRef.current) { // 요청 중 사용자가 코드를 수정했는지 확인한다.
            setIsCodeLoading(false); // 로딩 상태만 종료한다.
            return; // 사용자가 작성한 코드를 덮어쓰지 않는다.
        } // 사용자 수정 여부 검사를 종료한다.

        if (error) { // Supabase 조회 에러가 있는지 확인한다.
            console.error("최신 제출 코드 조회 실패:", error); // 에러를 콘솔에 출력한다.
            setCode(defaultTemplate); // 실패 시 현재 언어의 기본 템플릿을 사용한다.
            setIsCodeLoading(false); // 로딩 상태를 종료한다.
            return; // 함수 실행을 종료한다.
        } // 에러 처리를 종료한다.

        const matchedSubmission = (data ?? []).find((row) => { // 조회된 제출 중 현재 언어와 정확히 같은 계열만 찾는다.
            return isSameLanguage(selectedLanguage, row.language); // 선택 언어와 row 언어를 정규화해서 비교한다.
        }); // matching row 검색을 종료한다.

        const latestSourceCode = matchedSubmission?.source_code?.trim() // 매칭된 제출 코드가 실제로 있는지 확인한다.
            ? matchedSubmission.source_code // 코드가 있으면 해당 코드를 사용한다.
            : null; // 코드가 없으면 null로 처리한다.

        if (!matchedSubmission) { // 현재 선택 언어 제출이 없는 경우를 확인한다.
            console.log(`[useProblemStarterCode] ${selectedLanguage} 제출 없음. 기본 템플릿 사용.`); // 선택 언어 제출이 없음을 로그로 남긴다.
            setCode(defaultTemplate); // 현재 언어 기본 템플릿을 사용한다.
            setIsCodeLoading(false); // 로딩 상태를 종료한다.
            return; // 함수 실행을 종료한다.
        } // 제출 없음 조건문을 종료한다.

        setCode(latestSourceCode ?? defaultTemplate); // 현재 언어 제출 코드가 있으면 사용하고 없으면 기본 템플릿을 사용한다.
        setIsCodeLoading(false); // 로딩 상태를 종료한다.
    }, [language, problemId, userId]); // 언어, 문제 id, 유저 id가 바뀔 때 함수를 다시 만든다.

    useEffect(() => { // 문제 id, 유저 id, 언어가 바뀔 때 시작 코드를 다시 로드한다.
        void loadStarterCode(); // 시작 코드 로딩 함수를 실행한다.
    }, [loadStarterCode]); // loadStarterCode가 바뀔 때 실행한다.

    return { // hook에서 사용할 값을 반환한다.
        code, // 에디터에 표시할 코드 값을 반환한다.
        setCode, // 외부에서 직접 코드를 설정할 수 있도록 setCode를 반환한다.
        isCodeLoading, // 코드 로딩 상태를 반환한다.
        handleCodeChange, // 에디터 onChange에 연결할 핸들러를 반환한다.
        reloadStarterCode: loadStarterCode, // 수동 재로딩 함수를 반환한다.
    }; // 반환 객체 정의를 종료한다.
} // useProblemStarterCode hook을 종료한다.