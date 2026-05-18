import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type CurrentSubmissionRow = {
  id: number;
  problem_id: number;
  language: string | null;
};

type PeerSubmissionCodeRow = {
  source_code: string | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; peerId: string }> },
) {
  const { id, peerId } = await params;
  const submissionId = Number(id);
  const peerSubmissionId = Number(peerId);

  if (
    !Number.isInteger(submissionId) ||
    !Number.isInteger(peerSubmissionId)
  ) {
    return NextResponse.json(
      { error: "Invalid submission id" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: currentSubmission, error: currentError } = await supabase
    .from("submissions")
    .select("id, problem_id, language")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .or("is_deleted.is.false,is_deleted.is.null")
    .maybeSingle();

  if (currentError || !currentSubmission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const current = currentSubmission as CurrentSubmissionRow;

  if (!current.language) {
    return NextResponse.json({ sourceCode: "" });
  }

  const { data: peerSubmission, error: peerError } = await supabase
    .from("submissions")
    .select("source_code")
    .eq("id", peerSubmissionId)
    .eq("problem_id", current.problem_id)
    .eq("language", current.language)
    .in("result", ["AC", "ACCEPTED"])
    .or("is_deleted.is.false,is_deleted.is.null")
    .neq("user_id", user.id)
    .maybeSingle();

  if (peerError) {
    return NextResponse.json({ error: peerError.message }, { status: 500 });
  }

  if (!peerSubmission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    sourceCode:
      (peerSubmission as PeerSubmissionCodeRow | null)?.source_code ?? "",
  });
}
