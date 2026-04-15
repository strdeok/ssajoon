import { NextResponse } from "next/server";
import { submissions } from "@/mocks/submissions";

export async function GET() {
  // Return sorted by mostly recently created
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json(sorted);
}
