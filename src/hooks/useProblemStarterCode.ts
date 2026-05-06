"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getDefaultCodeTemplate, normalizeLanguage } from "@/lib/codeTemplates";

type UseProblemStarterCodeParams = {
    problemId: number | string;
    userId?: string | null;
    language: string;
};

type LatestSubmissionCodeRow = {
    source_code: string | null;
    language: string | null;
    submitted_at: string | null;
};

function canonicalLanguage(language: string | null | undefined) {
    const value = (language ?? "").trim().toLowerCase();

    if (value === "python" || value === "python3" || value === "py") return "python";

    if (value === "java" || value === "java17" || value === "java 17") return "java";

    if (
        value === "cpp" ||
        value === "c++" ||
        value === "cplusplus" ||
        value === "g++" ||
        value === "cpp17" ||
        value === "c++17" ||
        value === "gnu c++17"
    ) {
        return "cpp";
    }

    return normalizeLanguage(value);
}

function getLanguageAliases(language: string) {
    const canonical = canonicalLanguage(language);

    if (canonical === "python") {
        return ["python", "python3", "py", "Python", "Python3", "PYTHON"];
    }

    if (canonical === "java") {
        return ["java", "java17", "java 17", "Java", "Java 17", "JAVA"];
    }

    if (canonical === "cpp") {
        return ["cpp", "c++", "C++", "CPP", "cplusplus", "g++", "cpp17", "c++17", "C++17", "GNU C++17"];
    }

    return [canonical];
}

function isSameLanguage(selectedLanguage: string, rowLanguage: string | null | undefined) {
    return canonicalLanguage(selectedLanguage) === canonicalLanguage(rowLanguage);
}

export function useProblemStarterCode({ problemId, userId, language }: UseProblemStarterCodeParams) {
    const requestIdRef = useRef(0);
    const userEditedRef = useRef(false);

    const [code, setCode] = useState("");
    const [isCodeLoading, setIsCodeLoading] = useState(false);

    const handleCodeChange = useCallback((nextCode: string | undefined) => {
        userEditedRef.current = true;
        setCode(nextCode ?? "");
    }, []);

    const loadStarterCode = useCallback(async () => {
        const currentRequestId = requestIdRef.current + 1;
        requestIdRef.current = currentRequestId;

        const selectedLanguage = canonicalLanguage(language);
        const defaultTemplate = getDefaultCodeTemplate(selectedLanguage);

        userEditedRef.current = false;
        setCode(defaultTemplate);
        setIsCodeLoading(true);

        if (!userId) {
            setIsCodeLoading(false);
            return;
        }

        const supabase = createClient();

        const languageAliases = getLanguageAliases(selectedLanguage);

        const { data, error } = await supabase
            .from("submissions")
            .select("source_code, language, submitted_at")
            .eq("problem_id", problemId)
            .eq("user_id", userId)
            .eq("is_deleted", false)
            .eq("result", "AC")
            .in("language", languageAliases)
            .order("submitted_at", { ascending: false })
            .limit(5);

        if (requestIdRef.current !== currentRequestId) {
            return;
        }

        if (userEditedRef.current) {
            setIsCodeLoading(false);
            return;
        }

        if (error) {
            setCode(defaultTemplate);
            setIsCodeLoading(false);
            return;
        }

        const matchedSubmission = (data ?? []).find((row) => {
            return isSameLanguage(selectedLanguage, row.language);
        });

        const latestSourceCode = matchedSubmission?.source_code?.trim()
            ? matchedSubmission.source_code
            : null;

        if (!matchedSubmission) {
            setCode(defaultTemplate);
            setIsCodeLoading(false);
            return;
        }

        setCode(latestSourceCode ?? defaultTemplate);
        setIsCodeLoading(false);
    }, [language, problemId, userId]);

    useEffect(() => {
        void loadStarterCode();
    }, [loadStarterCode]);

    return {
        code,
        setCode,
        isCodeLoading,
        handleCodeChange,
        reloadStarterCode: loadStarterCode,
    };
}