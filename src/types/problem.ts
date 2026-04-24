export interface ProblemExample {
  id: string; // uuid
  problem_id: string; // uuid
  example_order: number;
  input_text: string;
  output_text: string;
}

export interface ProblemTestcase {
  id: string; // uuid
  problem_id: string; // uuid
  testcase_order: number;
  input_text: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface Problem {
  id: number; // bigint auto increment
  problem_no?: number;
  title: string;
  category?: string; // 추가된 카테고리
  description: string;
  input_description: string;
  output_description: string;
  difficulty?: string;
  time_limit_ms?: number;
  memory_limit_mb?: number;
  created_at?: string;
  updated_at?: string;
  problem_examples?: ProblemExample[];
}
