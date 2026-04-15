import { NextResponse } from "next/server";
import { problems } from "@/mocks/problems";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const problem = problems.find((p) => p.id === id);

  if (!problem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(problem);
}
