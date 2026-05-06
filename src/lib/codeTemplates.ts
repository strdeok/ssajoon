export const CODE_TEMPLATES: Record<string, string> = { // 언어별 기본 코드 템플릿을 정의한다.
    python: `# 여기에 파이썬 코드를 작성해주세요.`, // Python 기본 템플릿을 정의한다.
    java: `// 여기에 자바 코드를 작성해주세요.
public class Main{
    public static void main(String args[]){

    }
}`, // Java 기본 템플릿을 정의한다.
    cpp: `// 여기에 c++ 코드를 작성해주세요.
#include <iostream>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    
    return 0;
}`, // C++ 기본 템플릿을 정의한다.
}; // CODE_TEMPLATES 정의를 종료한다.

export function normalizeLanguage(language: string | undefined | null) { // 언어 값을 프로젝트 내부 기준으로 정규화하는 함수를 정의한다.
    const normalized = (language ?? "python").trim().toLowerCase(); // 값이 없으면 python으로 처리하고 소문자로 변환한다.

    if (normalized === "c++") return "cpp"; // C++ 표기를 cpp로 통일한다.
    if (normalized === "cpp") return "cpp"; // cpp는 그대로 사용한다.
    if (normalized === "python3") return "python"; // python3를 python으로 통일한다.
    if (normalized === "py") return "python"; // py를 python으로 통일한다.
    if (normalized === "java") return "java"; // java는 그대로 사용한다.

    return normalized; // 그 외 언어는 정규화된 값을 그대로 반환한다.
} // normalizeLanguage 함수를 종료한다.

export function getDefaultCodeTemplate(language: string | undefined | null) { // 언어에 맞는 기본 템플릿을 반환하는 함수를 정의한다.
    const normalizedLanguage = normalizeLanguage(language); // 언어 값을 정규화한다.

    return CODE_TEMPLATES[normalizedLanguage] ?? ""; // 해당 언어 템플릿이 있으면 반환하고 없으면 빈 문자열을 반환한다.
} // getDefaultCodeTemplate 함수를 종료한다.

export function getLanguageQueryValues(language: string | undefined | null) { // DB에 저장된 언어 표기 차이를 고려한 조회 후보를 만드는 함수를 정의한다.
    const normalizedLanguage = normalizeLanguage(language); // 언어 값을 정규화한다.

    if (normalizedLanguage === "python") return ["python", "python3", "py", "Python", "Python3"]; // Python 계열 저장값 후보를 반환한다.

    if (normalizedLanguage === "java") return ["java", "Java"]; // Java 계열 저장값 후보를 반환한다.

    if (normalizedLanguage === "cpp") return ["cpp", "c++", "C++", "CPP"]; // C++ 계열 저장값 후보를 반환한다.

    return [normalizedLanguage]; // 그 외 언어는 정규화된 값 하나만 후보로 반환한다.
} // getLanguageQueryValues 함수를 종료한다.