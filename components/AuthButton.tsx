'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const LOGIN_LABEL = 'Login'
const PROFILE_LABEL = 'Profile'

function isValidJwt(token: string) {
  return token.split('.').length === 3
}

export default function AuthButton() {
  const [label, setLabel] = useState(LOGIN_LABEL)
  const [href, setHref] = useState('/auth/login')

  useEffect(() => {
    const token = localStorage.getItem('authToken') || ''
    const userId = localStorage.getItem('userId') || ''

    if (token && userId && isValidJwt(token)) {
      setLabel(PROFILE_LABEL)
      setHref('/profile')
      return
    }

    if (token || userId) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      localStorage.removeItem('userPhone')
    }
  }, [])

  return (
    <Link
      href={href}
      className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-semibold text-sm px-6 py-2.5 rounded-full hover:shadow-[0px_12px_32px_rgba(45,51,55,0.06)] transition-all"
    >
      {label}
    </Link>
  )
}
