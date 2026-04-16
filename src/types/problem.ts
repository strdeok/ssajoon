export interface TestCase {
  input: string;
  output: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  input_desc: string;
  output_desc: string;
  testCases?: TestCase[];
}
