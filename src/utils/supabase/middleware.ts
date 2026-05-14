import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const authRequiredRoutes = [
  '/admin',
  '/generate',
  '/mypage',
  '/onboarding',
  '/rejoin',
  '/submissions',
]

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(url)
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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (!user && matchesRoute(pathname, authRequiredRoutes)) {
    return redirectToLogin(request)
  }

  let dbUser: { role: string | null; is_deleted: boolean | null } | null = null
  if (user) {
    const needsUserRecord = matchesRoute(pathname, authRequiredRoutes)

    if (needsUserRecord) {
      const { data } = await supabase
        .from('users')
        .select('role, is_deleted')
        .eq('id', user.id)
        .single()
      dbUser = data
    }

    if (
      dbUser?.is_deleted &&
      !pathname.startsWith('/rejoin') &&
      !pathname.startsWith('/api/auth/signout')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/rejoin'
      url.search = ''
      return NextResponse.redirect(url)
    }

    if (
      !user.user_metadata?.nickname && 
      !pathname.startsWith('/rejoin') &&
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
