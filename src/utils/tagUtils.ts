export const TAG_MAP: Record<string, string> = {
  "arrays": "배열",
  "bit": "비트 연산",
  "brute force": "완전 탐색",
  "dfs": "깊이 우선 탐색",
  "divide and conquer": "분할 정복",
  "dp": "동적 계획법",
  "greedy": "그리디",
  "two pointers": "투 포인터"
};

export function getKoreanTag(tag: string | null | undefined): string {
  if (!tag) return "";
  const lowerTag = tag.toLowerCase().trim();
  return TAG_MAP[lowerTag] || tag;
}
