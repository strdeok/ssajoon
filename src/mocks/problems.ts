import { Problem } from "@/types/problem";

export const problems: Problem[] = [
  {
    id: "1",
    title: "A + B",
    description: "두 수를 입력받아 합을 출력하시오.",
    input_desc: "첫째 줄에 A와 B가 주어진다.",
    output_desc: "A+B를 출력한다.",
    testCases: [
      { input: "1 2", output: "3" },
      { input: "4 7", output: "11" },
    ],
  },
  {
    id: "2",
    title: "Hello World",
    description: "'Hello World!'를 화면에 출력하시오.",
    input_desc: "입력은 없습니다.",
    output_desc: "'Hello World!'를 출력한다.",
    testCases: [
      { input: "", output: "Hello World!" },
    ],
  },
];
