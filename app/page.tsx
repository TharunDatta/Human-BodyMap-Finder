'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'

const stats = [
  { label: 'Verified Doctors', target: 500, suffix: '+' },
  { label: 'Specializations', target: 20, suffix: '+' },
  { label: 'Successful Bookings', target: 10000, suffix: 'k+' },
]

export default function Home() {
  useEffect(() => {
    const statNodes = Array.from(document.querySelectorAll<HTMLElement>('.stat-counter'))
    if (statNodes.length === 0) return

    const animateValue = (node: HTMLElement, start: number, end: number, duration: number) => {
      let startTimestamp: number | null = null
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)
        const current = Math.floor(progress * (end - start) + start)
        const suffix = node.dataset.suffix || ''
        node.textContent = `${current}${suffix}`
        if (progress < 1) {
          window.requestAnimationFrame(step)
        }
      }
      window.requestAnimationFrame(step)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement
          if (entry.isIntersecting && !target.dataset.animated) {
            const value = parseInt(target.dataset.target || '0', 10)
            animateValue(target, 0, value, 2000)
            target.dataset.animated = 'true'
          }
        })
      },
      { threshold: 0.5 }
    )

    statNodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* TopNavBar */}
      <nav className="w-full sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md bg-slate-50/50 dark:bg-slate-800/50 transition-colors duration-200">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xl tracking-tight font-headline hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined" data-weight="fill">accessibility_new</span>
            BodyMap
          </Link>
          <div className="hidden md:flex gap-8 items-center">
            <Link className="text-teal-700 dark:text-teal-300 font-bold border-b-2 border-teal-600 pb-1 font-['Manrope'] font-medium text-sm hover:text-teal-500 transition-colors duration-200 scale-95 active:transition-all" href="/">
              Home
            </Link>
            <Link className="text-slate-600 dark:text-slate-400 font-['Manrope'] font-medium text-sm hover:text-teal-500 transition-colors duration-200 scale-95 active:transition-all" href="/explore">
              Explore Body
            </Link>
            <Link className="text-slate-600 dark:text-slate-400 font-['Manrope'] font-medium text-sm hover:text-teal-500 transition-colors duration-200 scale-95 active:transition-all" href="/doctors">
              Doctors
            </Link>
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="relative w-full max-w-7xl mx-auto px-8 py-24 md:py-32 flex flex-col md:flex-row items-center gap-16 overflow-hidden">
          <div className="w-full md:w-1/2 flex flex-col items-start gap-8 z-10 relative">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-on-background tracking-tight leading-[1.1]">
              Find the Right Doctor, Starting From Your Body
            </h1>
            <p className="font-body text-lg text-on-surface-variant leading-relaxed max-w-lg">
              Navigate our interactive 3D human model to pinpoint your symptoms and match instantly with specialized medical professionals in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <Link href="/explore" className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-semibold text-base px-8 py-4 rounded-xl shadow-[0px_12px_32px_rgba(45,51,55,0.06)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                Explore 3D Body
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </Link>
              <Link href="/doctors" className="bg-transparent border border-outline-variant border-opacity-15 text-primary font-label font-semibold text-base px-8 py-4 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center">
                View Doctors
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative flex justify-center items-center h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-surface to-surface-container-low rounded-full opacity-50 blur-3xl scale-150"></div>
            <div className="relative w-64 h-96 border-2 border-primary-container rounded-[100px] opacity-40 flex items-center justify-center animate-pulse">
              <div className="w-48 h-80 border-2 border-primary rounded-[80px] opacity-60"></div>
              <div className="absolute w-32 h-64 border-2 border-primary rounded-[60px] opacity-80"></div>
              <span className="material-symbols-outlined absolute text-9xl text-primary opacity-50 font-light">accessibility</span>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="w-full bg-surface-container-low py-24">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface-container-lowest rounded-full p-8 flex flex-col gap-6 shadow-[0px_12px_32px_rgba(45,51,55,0.06)] group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-16 h-16 rounded-2xl bg-tertiary-container flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl" data-weight="fill">view_in_ar</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-background">3D Body Mapping</h3>
                <p className="font-body text-on-surface-variant text-base leading-relaxed">
                  Interact with our detailed anatomical model to identify pain points and symptoms with clinical precision.
                </p>
              </div>
              <div className="bg-surface-container-lowest rounded-full p-8 flex flex-col gap-6 shadow-[0px_12px_32px_rgba(45,51,55,0.06)] group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-16 h-16 rounded-2xl bg-tertiary-container flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl" data-weight="fill">event_available</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-background">Book Appointments</h3>
                <p className="font-body text-on-surface-variant text-base leading-relaxed">
                  Schedule consultations instantly with verified specialists who match your specific anatomical needs.
                </p>
              </div>
              <div className="bg-surface-container-lowest rounded-full p-8 flex flex-col gap-6 shadow-[0px_12px_32px_rgba(45,51,55,0.06)] group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-16 h-16 rounded-2xl bg-tertiary-container flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl" data-weight="fill">history_edu</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-background">Health History</h3>
                <p className="font-body text-on-surface-variant text-base leading-relaxed">
                  Maintain a secure, visual record of your symptoms and treatments mapped directly to your digital twin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full max-w-7xl mx-auto px-8 py-32">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background text-center mb-20 tracking-tight">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-between relative gap-12 md:gap-4">
            <div className="connecting-line hidden md:block" aria-hidden="true"></div>

            {[
              { step: 1, icon: 'touch_app', title: 'Click', desc: 'Select the specific area on the 3D model where you are experiencing symptoms.' },
              { step: 2, icon: 'visibility', title: 'View', desc: 'Review potential conditions and relevant medical specialties for that region.' },
              { step: 3, icon: 'join_inner', title: 'Match', desc: 'Get intelligently matched with top-rated doctors specializing in your needs.' },
              { step: 4, icon: 'calendar_clock', title: 'Book', desc: 'Secure your appointment instantly through our seamless booking platform.' },
            ].map((item) => (
              <div key={item.step} className="how-it-works-step flex flex-col items-center text-center relative z-10 flex-1">
                <div className="step-number w-20 h-20 rounded-full bg-surface-container-lowest border-4 border-surface shadow-[0px_12px_32px_rgba(45,51,55,0.06)] flex items-center justify-center text-primary font-headline text-2xl font-bold mb-6">
                  {item.step}
                </div>
                <span className="material-symbols-outlined text-4xl text-outline mb-4">{item.icon}</span>
                <h4 className="font-headline text-xl font-bold text-on-background mb-2">{item.title}</h4>
                <p className="font-body text-on-surface-variant text-sm px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full bg-surface-container-low py-24 mb-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gradient-to-br from-primary to-primary-container p-10 rounded-full flex flex-col items-center justify-center text-center shadow-[0px_12px_32px_rgba(45,51,55,0.06)] hover:scale-105 transition-transform duration-500"
                >
                  <span
                    className="font-headline text-5xl font-extrabold text-on-primary mb-2 tracking-tight stat-counter"
                    data-target={stat.target}
                    data-suffix={stat.suffix}
                  >
                    0{stat.suffix}
                  </span>
                  <span className="font-body text-on-primary opacity-90 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-slate-50 dark:bg-slate-950 bg-surface-container-low">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 max-w-7xl mx-auto gap-6">
          <Link href="/" className="text-teal-700 dark:text-teal-400 font-bold text-lg font-headline hover:opacity-80 transition-opacity">
            BodyMap
          </Link>
          <div className="flex gap-6">
            <Link className="text-slate-500 font-['Inter'] text-xs hover:text-teal-600 dark:hover:text-teal-300 transition-colors opacity-80 hover:opacity-100" href="/about">About</Link>
            <Link className="text-slate-500 font-['Inter'] text-xs hover:text-teal-600 dark:hover:text-teal-300 transition-colors opacity-80 hover:opacity-100" href="/privacy">Privacy</Link>
            <Link className="text-slate-500 font-['Inter'] text-xs hover:text-teal-600 dark:hover:text-teal-300 transition-colors opacity-80 hover:opacity-100" href="/contact">Contact</Link>
          </div>
          <div className="font-['Inter'] text-xs text-slate-500">© 2024 BodyMap. All rights reserved.</div>
        </div>
      </footer>
    </>
  )
}
