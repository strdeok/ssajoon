export const TAG_MAP: Record<string, string> = {
  "arrays": "배열",
  "backtracking": "백트래킹",
  "binary search": "이진 탐색",
  "bit": "비트 연산",
  "bitmasking": "비트마스킹",
  "brute force": "완전 탐색",
  "dfs": "깊이 우선 탐색",
  "dijkstra": "다익스트라",
  "divide and conquer": "분할 정복",
  "dynamic programming": "동적 계획법",
  "floyd-warshall": "플로이드-워셜",
  "greedy": "그리디",
  "hash table": "해시 테이블",
  "heap": "힙",
  "implementation": "구현",
  "kruskal": "크루스칼",
  "linked list": "연결 리스트",
  "parametric search": "매개 변수 탐색",
  "segment tree": "세그먼트 트리",
  "sliding window": "슬라이딩 윈도우",
  "topological sort": "위상 정렬",
  "two pointers": "투 포인터",
  "union-find": "유니온 파인드",
};

export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Medium-Hard", "Hard", "Very-Hard"];

export const DIFFICULTY_ORDER: Record<string, number> = {
  "Easy": 1,
  "Medium": 2,
  "Medium-Hard": 3,
  "Hard": 4,
  "Very-Hard": 5,
};

export function getKoreanTag(tag: string | null | undefined): string {
  if (!tag) return "";
  const lowerTag = tag.toLowerCase().trim();
  return TAG_MAP[lowerTag] || tag;
}
