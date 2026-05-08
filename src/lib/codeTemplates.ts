export const CODE_TEMPLATES: Record<string, string> = {
    python: `# 여기에 파이썬 코드를 작성해주세요.`,
    java: `// 여기에 자바 코드를 작성해주세요.
public class Main{
    public static void main(String args[]){

    }
}`,
    cpp: `// 여기에 c++ 코드를 작성해주세요.
#include <iostream>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    
    return 0;
}`,
};

export const preferredLanguageToEditorLanguage = {
    JAVA: "java",
    PYTHON: "python",
    "C++": "cpp",
} as const;

export const editorLanguageToPreferredLanguage = {
    java: "JAVA",
    python: "PYTHON",
    cpp: "C++",
} as const;

export type PreferredLanguage = keyof typeof preferredLanguageToEditorLanguage;

export function normalizeLanguage(language: string | undefined | null) {
    const normalized = (language ?? "python").trim().toLowerCase();

    if (normalized === "c++") return "cpp";
    if (normalized === "cpp") return "cpp";
    if (normalized === "python3") return "python";
    if (normalized === "py") return "python";
    if (normalized === "java") return "java";

    return normalized;
}

export function getDefaultCodeTemplate(language: string | undefined | null) {
    const normalizedLanguage = normalizeLanguage(language);

    return CODE_TEMPLATES[normalizedLanguage] ?? "";
}

export function getLanguageQueryValues(language: string | undefined | null) {
    const normalizedLanguage = normalizeLanguage(language);

    if (normalizedLanguage === "python") return ["python", "python3", "py", "Python", "Python3", "PYTHON", "PYTHON3"];

    if (normalizedLanguage === "java") return ["java", "Java", "JAVA"];

    if (normalizedLanguage === "cpp") return ["cpp", "c++", "C++", "CPP", "Cpp"];

    return [normalizedLanguage];
}