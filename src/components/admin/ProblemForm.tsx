"use client";

import { useState } from "react";
import { saveProblem } from "@/app/admin/problems/actions";
import { Plus, Trash2, Loader2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Example {
  input_text: string;
  output_text: string;
}

interface Testcase {
  input_text: string;
  expected_output: string;
}

export function ProblemForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    title: initialData?.title || "",
    category: initialData?.category || "",
    difficulty: initialData?.difficulty || "Basic",
    description: initialData?.description || "",
    input_description: initialData?.input_description || "",
    output_description: initialData?.output_description || "",
    time_limit_ms: initialData?.time_limit_ms || 1000,
    memory_limit_mb: initialData?.memory_limit_mb || 256,
  });

  const [examples, setExamples] = useState<Example[]>(
    initialData?.problem_examples?.map((ex: any) => ({
      input_text: ex.input_text,
      output_text: ex.output_text,
    })) || []
  );

  const [testcases, setTestcases] = useState<Testcase[]>(
    initialData?.problem_testcases?.map((tc: any) => ({
      input_text: tc.input_text,
      expected_output: tc.expected_output,
    })) || []
  );

  const handleAddExample = () => {
    setExamples([...examples, { input_text: "", output_text: "" }]);
  };

  const handleRemoveExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index: number, field: keyof Example, value: string) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };

  const handleAddTestcase = () => {
    setTestcases([...testcases, { input_text: "", expected_output: "" }]);
  };

  const handleRemoveTestcase = (index: number) => {
    setTestcases(testcases.filter((_, i) => i !== index));
  };

  const handleTestcaseChange = (index: number, field: keyof Testcase, value: string) => {
    const newTestcases = [...testcases];
    newTestcases[index][field] = value;
    setTestcases(newTestcases);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...(formData.id && formData.id !== "$undefined" ? { id: formData.id } : {}),
        title: formData.title,
        category: formData.category,
        difficulty: formData.difficulty,
        description: formData.description,
        input_description: formData.input_description,
        output_description: formData.output_description,
        time_limit_ms: formData.time_limit_ms,
        memory_limit_mb: formData.memory_limit_mb,
        examples,
        testcases,
      };

      await saveProblem(payload);
      router.push('/admin/problems');
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }

      const userMessage = formData.id
        ? "문제 수정에 실패했습니다. 입력값을 확인해주세요."
        : "문제 생성에 실패했습니다. 입력값을 확인해주세요.";
      setError(userMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/problems"
            className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {formData.id ? "문제 수정" : "새 문제 작성"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-red-500 text-sm font-medium">{error}</span>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장하기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">제목</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="문제 제목을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">카테고리</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: BFS, DP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">난이도</label>
                  <select
                    value={formData.difficulty}
                    onChange={e => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">상세 설명</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">문제 설명</label>
                <textarea
                  required
                  rows={6}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="문제에 대한 자세한 설명을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">입력 설명</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.input_description}
                    onChange={e => setFormData({...formData, input_description: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">출력 설명</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.output_description}
                    onChange={e => setFormData({...formData, output_description: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">예제 (공개 테스트케이스)</h2>
              <button
                type="button"
                onClick={handleAddExample}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-4 h-4" /> 예제 추가
              </button>
            </div>
            {examples.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">등록된 예제가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {examples.map((ex, i) => (
                  <div key={`ex-${i}`} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(i)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-red-500 bg-white dark:bg-zinc-900 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">예제 {i + 1}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">입력 (Input)</label>
                        <textarea
                          required
                          rows={3}
                          value={ex.input_text}
                          onChange={e => handleExampleChange(i, 'input_text', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">출력 (Output)</label>
                        <textarea
                          required
                          rows={3}
                          value={ex.output_text}
                          onChange={e => handleExampleChange(i, 'output_text', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">채점 테스트케이스</h2>
                <p className="text-xs text-zinc-500 mt-1">사용자에게 보이지 않고 실제 채점에만 사용되는 데이터입니다.</p>
              </div>
              <button
                type="button"
                onClick={handleAddTestcase}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-4 h-4" /> 채점 데이터 추가
              </button>
            </div>
            {testcases.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">등록된 채점 데이터가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {testcases.map((tc, i) => (
                  <div key={`tc-${i}`} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-purple-100 dark:border-purple-900/30 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveTestcase(i)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-red-500 bg-white dark:bg-zinc-900 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h3 className="text-xs font-bold text-purple-500 uppercase mb-3">Hidden Case {i + 1}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">입력 (Input)</label>
                        <textarea
                          required
                          rows={3}
                          value={tc.input_text}
                          onChange={e => handleTestcaseChange(i, 'input_text', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">기대 출력 (Expected Output)</label>
                        <textarea
                          required
                          rows={3}
                          value={tc.expected_output}
                          onChange={e => handleTestcaseChange(i, 'expected_output', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="md:col-span-1 space-y-6">
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 sticky top-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">제한 설정</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">시간 제한 (ms)</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="100"
                    step="100"
                    value={formData.time_limit_ms}
                    onChange={e => setFormData({...formData, time_limit_ms: Number(e.target.value)})}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-4 py-2 pr-12 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="absolute right-4 top-2 text-zinc-500 text-sm">ms</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">메모리 제한 (MB)</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="16"
                    step="16"
                    value={formData.memory_limit_mb}
                    onChange={e => setFormData({...formData, memory_limit_mb: Number(e.target.value)})}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-4 py-2 pr-12 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="absolute right-4 top-2 text-zinc-500 text-sm">MB</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
