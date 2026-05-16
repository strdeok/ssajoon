import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SubmissionCodeRow = {
  source_code: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("source_code")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    source_code: (data as SubmissionCodeRow | null)?.source_code ?? "",
  });
}
