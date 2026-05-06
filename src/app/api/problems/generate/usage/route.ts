import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const DAILY_PROBLEM_CREATE_LIMIT = 3;

function getKstDateKey() {
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return kstNow.toISOString().slice(0, 10);
}

export async function GET() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { success: false, message: "로그인이 필요합니다." },
            { status: 401 },
        );
    }

    const today = getKstDateKey();

    const { data: userRow, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, daily_problem_create_count, problem_create_count_date")
        .eq("id", user.id)
        .maybeSingle();

    if (userError) {
        console.error("문제 생성 사용량 user 조회 실패:", userError);

        return NextResponse.json(
            { success: false, message: "생성 횟수를 조회하지 못했습니다." },
            { status: 500 },
        );
    }

    if (!userRow) {
        const { data: insertedUser, error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
                id: user.id,
                nickname: user.email?.split("@")[0] ?? "사용자",
                role: "USER",
                daily_problem_create_count: 0,
                problem_create_count_date: today,
                is_deleted: false,
            })
            .select("id, daily_problem_create_count, problem_create_count_date")
            .single();

        if (insertError) {
            console.error("문제 생성 사용량 user 생성 실패:", insertError);

            return NextResponse.json(
                { success: false, message: "생성 횟수 정보를 생성하지 못했습니다." },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            dailyLimit: DAILY_PROBLEM_CREATE_LIMIT,
            usedCount: Number(insertedUser.daily_problem_create_count ?? 0),
            remainingCount: DAILY_PROBLEM_CREATE_LIMIT,
            date: today,
        });
    }

    const storedDate = userRow.problem_create_count_date
        ? String(userRow.problem_create_count_date).slice(0, 10)
        : null;

    const shouldReset = storedDate !== today;

    if (shouldReset) {
        const { error: resetError } = await supabaseAdmin
            .from("users")
            .update({
                daily_problem_create_count: 0,
                problem_create_count_date: today,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (resetError) {
            console.error("문제 생성 사용량 초기화 실패:", resetError);

            return NextResponse.json(
                { success: false, message: "생성 횟수를 초기화하지 못했습니다." },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            dailyLimit: DAILY_PROBLEM_CREATE_LIMIT,
            usedCount: 0,
            remainingCount: DAILY_PROBLEM_CREATE_LIMIT,
            date: today,
        });
    }

    const usedCount = Number(userRow.daily_problem_create_count ?? 0);

    const remainingCount = Math.max(
        0,
        DAILY_PROBLEM_CREATE_LIMIT - usedCount,
    );

    return NextResponse.json({
        success: true,
        dailyLimit: DAILY_PROBLEM_CREATE_LIMIT,
        usedCount,
        remainingCount,
        date: today,
    });
}
