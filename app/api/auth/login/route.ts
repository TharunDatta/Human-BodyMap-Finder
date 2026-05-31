import { NextRequest, NextResponse } from 'next/server'
import { createAuthedClient, isConfigured, supabase, supabaseUrl } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured) {
      console.error('Supabase env missing for auth/login:', { url: supabaseUrl })
      return NextResponse.json(
        { error: 'Supabase is not configured for this deployment. Add env vars and redeploy.' },
        { status: 500 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    if (authData.session?.access_token) {
      const authed = createAuthedClient(authData.session.access_token)
      const { error: userError } = await authed
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (userError && userError.code === 'PGRST116') {
        const { error: insertError } = await authed
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
          })

        if (insertError) {
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          )
        }
      } else if (userError) {
        return NextResponse.json(
          { error: 'Failed to fetch user profile' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      token: authData.session?.access_token,
      userId: authData.user.id,
      email: authData.user.email,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
