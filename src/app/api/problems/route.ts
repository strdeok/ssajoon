import { NextResponse } from "next/server";
import { problems } from "@/mocks/problems";

export async function GET() {
  return NextResponse.json(problems);
}
