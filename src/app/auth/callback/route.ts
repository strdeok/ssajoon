import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  const requestedNext = searchParams.get('next')
  const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('is_deleted')
          .eq('id', user.id)
          .maybeSingle()

        if (userData?.is_deleted) {
          return NextResponse.redirect(`${origin}/rejoin`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=Auth%20Callback%20Failed`)
}
