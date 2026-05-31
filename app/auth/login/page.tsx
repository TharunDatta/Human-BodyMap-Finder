'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        let message = data.error || 'Login failed'
        if (/supabase is not configured/i.test(message)) {
          message = 'Server configuration error. Please try again after deployment finishes.'
        } else if (/fetch failed/i.test(message)) {
          message = 'Network error. Please check your connection and try again.'
        }
        setError(message)
        return
      }

      // Store auth token
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('userEmail', email)

      router.push('/profile')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-headline font-bold text-2xl mb-4">
            <span className="material-symbols-outlined fill-icon text-3xl">ecg_heart</span>
            BodyMap
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-background mb-2">Welcome Back</h1>
          <p className="text-on-surface-variant">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block font-label font-medium text-sm text-on-background mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body text-sm"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-label font-medium text-sm text-on-background mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body text-sm"
              placeholder="Enter your password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error-container/20 border border-error/30 text-error-container p-3 rounded-lg text-sm font-body">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-semibold py-3 rounded-lg hover:shadow-[0px_12px_32px_rgba(45,51,55,0.06)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-outline-variant/20"></div>
          <span className="text-xs text-on-surface-variant font-label">Don't have an account?</span>
          <div className="flex-1 h-px bg-outline-variant/20"></div>
        </div>

        {/* Register Link */}
        <Link href="/auth/register" className="w-full block border border-outline-variant/30 text-primary font-label font-semibold py-3 rounded-lg text-center hover:bg-surface-container-low transition-colors">
          Create New Account
        </Link>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-xs text-on-surface-variant font-body">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
        </div>
      </div>
    </div>
  )
}
