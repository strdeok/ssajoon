import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname.startsWith('/submissions') // protect specific routes
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  let dbUser = null
  if (user) {
    // Check user role and deleted status in DB
    const { data } = await supabase
      .from('users')
      .select('role, is_deleted')
      .eq('id', user.id)
      .single()
    dbUser = data

    if (dbUser?.is_deleted && !request.nextUrl.pathname.startsWith('/api/auth/signout')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', '탈퇴한 회원입니다.')
      return NextResponse.redirect(url)
    }

    if (
      !user.user_metadata?.nickname && 
      !request.nextUrl.pathname.startsWith('/onboarding') &&
      !request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/login')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (
      user.user_metadata?.nickname && 
      request.nextUrl.pathname.startsWith('/onboarding')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user || dbUser?.role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
