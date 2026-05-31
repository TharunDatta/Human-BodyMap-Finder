import { NextRequest, NextResponse } from 'next/server'
import { createAuthedClient, isConfigured, supabase, supabaseUrl } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured) {
      console.error('Supabase env missing for auth/register:', { url: supabaseUrl })
      return NextResponse.json(
        { error: 'Supabase is not configured for this deployment. Add env vars and redeploy.' },
        { status: 500 }
      )
    }

    const { firstName, lastName, email, phone, password } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      )
    }

    if (authData.session?.access_token) {
      const authed = createAuthedClient(authData.session.access_token)
      const { error: userError } = await authed
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          firstName,
          lastName,
          phone: phone || null,
        })

      if (userError) {
        console.error('User creation error:', userError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
