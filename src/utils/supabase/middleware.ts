import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const authRequiredRoutes = [
  '/admin',
  '/mypage',
  '/onboarding',
  '/rejoin',
  '/submissions',
]

const deletedUserAllowedRoutes = [
  '/rejoin',
  '/api/auth/signout',
]

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(url)
}

function redirectToRejoin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/rejoin'
  url.search = ''
  return NextResponse.redirect(url)
}

function shouldSkipDeletedUserRedirect(pathname: string) {
  return (
    matchesRoute(pathname, deletedUserAllowedRoutes) ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (!user && matchesRoute(pathname, authRequiredRoutes)) {
    return redirectToLogin(request)
  }

  let dbUser: { role: string | null; is_deleted: boolean | null } | null = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('role, is_deleted')
      .eq('id', user.id)
      .maybeSingle()

    dbUser = data ?? null

    /**
     * 탈퇴 회원 처리
     *
     * soft delete 회원은 어떤 일반 페이지에 접근하더라도 /rejoin으로 보낸다.
     * 단, /rejoin 자체와 auth/api 관련 경로는 제외한다.
     */
    if (
      dbUser?.is_deleted &&
      !shouldSkipDeletedUserRedirect(pathname)
    ) {
      return redirectToRejoin(request)
    }

    /**
     * 닉네임이 없는 신규 회원 온보딩 처리
     *
     * 탈퇴 회원은 위에서 먼저 /rejoin으로 빠지므로,
     * 여기서는 일반 활성 회원만 온보딩 검사한다.
     */
    if (
      !dbUser?.is_deleted &&
      !user.user_metadata?.nickname &&
      !pathname.startsWith('/onboarding') &&
      !pathname.startsWith('/api') &&
      !pathname.startsWith('/auth') &&
      !pathname.startsWith('/login')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (
      !dbUser?.is_deleted &&
      user.user_metadata?.nickname &&
      pathname.startsWith('/onboarding')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return redirectToLogin(request)
    }

    if (dbUser?.role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}