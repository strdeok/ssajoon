import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    deprecated: true,
    message: "사용하지 않는 API입니다. /api/problems/recommend를 사용해주세요.",
  });
}
