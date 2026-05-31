'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        let message = data.error || 'Registration failed'
        if (/supabase is not configured/i.test(message)) {
          message = 'Server configuration error. Please try again after deployment finishes.'
        } else if (/fetch failed/i.test(message)) {
          message = 'Network error. Please check your connection and try again.'
        }
        setError(message)
        return
      }

      if (data.confirmationRequired) {
        setInfo('Email confirmation is required. Check your inbox and confirm your email, then sign in.')
        return
      }

      if (!data.token || !data.userId) {
        setInfo('Account created. Please check your email and sign in once confirmed.')
        return
      }

      // Store auth token
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('userEmail', formData.email)
      localStorage.setItem('userName', `${formData.firstName} ${formData.lastName}`.trim())
      if (formData.phone) {
        localStorage.setItem('userPhone', formData.phone)
      }

      router.push('/profile')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-headline font-bold text-2xl mb-4">
            <span className="material-symbols-outlined fill-icon text-3xl">ecg_heart</span>
            BodyMap
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-background mb-2">Create Account</h1>
          <p className="text-on-surface-variant">Join us to book appointments with specialists</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block font-label font-medium text-sm text-on-background mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body text-sm"
              placeholder="John"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block font-label font-medium text-sm text-on-background mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body text-sm"
              placeholder="Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-label font-medium text-sm text-on-background mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body text-sm"
              placeholder="you@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-label font-medium text-sm text-on-background mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body text-sm"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-label font-medium text-sm text-on-background mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 pr-11 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body text-sm"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-label font-medium text-sm text-on-background mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 pr-11 rounded-lg border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body text-sm"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Info Message */}
          {info && (
            <div className="bg-primary-container/20 border border-primary/30 text-on-primary-container p-3 rounded-lg text-sm font-body">
              {info}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-error-container/20 border border-error/30 text-error-container p-3 rounded-lg text-sm font-body">
              {error}
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-semibold py-3 rounded-lg hover:shadow-[0px_12px_32px_rgba(45,51,55,0.06)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-outline-variant/20"></div>
          <span className="text-xs text-on-surface-variant font-label">Already have an account?</span>
          <div className="flex-1 h-px bg-outline-variant/20"></div>
        </div>

        {/* Login Link */}
        <Link href="/auth/login" className="w-full block border border-outline-variant/30 text-primary font-label font-semibold py-3 rounded-lg text-center hover:bg-surface-container-low transition-colors">
          Sign In
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
