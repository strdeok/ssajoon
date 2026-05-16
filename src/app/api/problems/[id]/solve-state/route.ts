import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getDefaultCodeTemplate,
  getLanguageQueryValues,
  normalizeLanguage,
  preferredLanguageToEditorLanguage,
  type PreferredLanguage,
} from "@/lib/codeTemplates";

type PublicTestcase = {
  id: string;
  input_text: string;
  expected_output: string;
  testcase_order: number;
};

type UserSettingsRow = {
  role: string | null;
  preferred_language: string | null;
};

type SourceCodeRow = {
  source_code: string | null;
};

type LanguageRow = {
  language: string | null;
};

function getEditorLanguage(preferredLanguage: string | null | undefined) {
  if (!preferredLanguage) return null;

  return (
    preferredLanguageToEditorLanguage[preferredLanguage as PreferredLanguage] ??
    normalizeLanguage(preferredLanguage)
  );
}

async function getInitialLanguage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  problemId: string,
  userId: string,
  preferredLanguage: string | null,
) {
  const preferredEditorLanguage = getEditorLanguage(preferredLanguage);

  if (preferredEditorLanguage) {
    return preferredEditorLanguage;
  }

  const { data: latestSubmission } = await supabase
    .from("submissions")
    .select("language")
    .eq("problem_id", problemId)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return normalizeLanguage((latestSubmission as LanguageRow | null)?.language);
}

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicTestcasesQuery = supabase
    .from("problem_testcases")
    .select("id, input_text, expected_output, testcase_order")
    .eq("problem_id", id)
    .eq("is_hidden", false)
    .eq("is_deleted", false)
    .order("testcase_order", { ascending: true });

  if (!user) {
    const { data: publicTestcases } = await publicTestcasesQuery;
    const initialLanguage = "python";

    return NextResponse.json({
      authenticated: false,
      role: "USER",
      preferredLanguage: null,
      initialLanguage,
      initialSourceCode: getDefaultCodeTemplate(initialLanguage),
      hasAcceptedSubmission: false,
      publicTestcases: (publicTestcases ?? []) as PublicTestcase[],
    });
  }

  const [{ data: userSettings }, { data: publicTestcases }] =
    await Promise.all([
      supabase
        .from("users")
        .select("role, preferred_language")
        .eq("id", user.id)
        .maybeSingle(),
      publicTestcasesQuery,
    ]);

  const settings = userSettings as UserSettingsRow | null;
  const initialLanguage = await getInitialLanguage(
    supabase,
    id,
    user.id,
    settings?.preferred_language ?? null,
  );
  const savedCode = await getSavedCodeForLanguage(
    supabase,
    id,
    user.id,
    initialLanguage,
  );

  return NextResponse.json({
    authenticated: true,
    role: settings?.role ?? "USER",
    preferredLanguage: settings?.preferred_language ?? null,
    initialLanguage,
    initialSourceCode: savedCode.sourceCode,
    hasAcceptedSubmission: savedCode.hasAcceptedSubmission,
    publicTestcases: (publicTestcases ?? []) as PublicTestcase[],
  });
}
