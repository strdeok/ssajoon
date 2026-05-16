import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getDefaultCodeTemplate,
  getLanguageQueryValues,
  normalizeLanguage,
} from "@/lib/codeTemplates";

type SourceCodeRow = {
  source_code: string | null;
};

async function getSavedCodeForLanguage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  problemId: string,
  userId: string,
  language: string,
) {
  const languageAliases = getLanguageQueryValues(language);

  const { data: acceptedSubmission } = await supabase
    .from("submissions")
    .select("source_code")
    .eq("problem_id", problemId)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .eq("result", "AC")
    .in("language", languageAliases)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const acceptedCode = (acceptedSubmission as SourceCodeRow | null)
    ?.source_code;

  if (acceptedCode) {
    return {
      sourceCode: acceptedCode,
      hasAcceptedSubmission: true,
    };
  }

  const { data: latestSubmission } = await supabase
    .from("submissions")
    .select("source_code")
    .eq("problem_id", problemId)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .in("language", languageAliases)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    sourceCode:
      (latestSubmission as SourceCodeRow | null)?.source_code ??
      getDefaultCodeTemplate(language),
    hasAcceptedSubmission: false,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const language = normalizeLanguage(
    request.nextUrl.searchParams.get("language") ?? "python",
  );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      sourceCode: getDefaultCodeTemplate(language),
      hasAcceptedSubmission: false,
    });
  }

  const savedCode = await getSavedCodeForLanguage(
    supabase,
    id,
    user.id,
    language,
  );

  return NextResponse.json(savedCode);
}
