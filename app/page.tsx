'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className="w-full sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-primary font-headline font-bold text-xl tracking-tight">
            <span className="material-symbols-outlined fill-icon">ecg_heart</span>
            BodyMap
          </div>
          <div className="hidden md:flex items-center gap-8 font-headline font-medium text-sm">
            <Link href="/" className="text-primary font-bold">Home</Link>
            <Link href="/explore" className="text-slate-600 hover:text-primary transition-colors">Explore Body</Link>
            <Link href="/doctors" className="text-slate-600 hover:text-primary transition-colors">Doctors</Link>
          </div>
          <Link href="/auth/login" className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-semibold text-sm px-6 py-2.5 rounded-xl hover:shadow-[0px_12px_32px_rgba(45,51,55,0.06)] transition-all">
            Login
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-12 lg:py-20">
        {/* Hero */}
        <div className="mb-20">
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-on-background tracking-tight mb-6">
            Find the Right Doctor, Starting From Your Body
          </h1>
          <p className="font-body text-lg text-on-surface-variant max-w-2xl mb-8">
            Navigate our interactive 3D human model to pinpoint your symptoms and match instantly with specialized medical professionals in your area.
          </p>
          <div className="flex gap-4">
            <Link href="/explore" className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-semibold text-base px-8 py-4 rounded-xl hover:shadow-[0px_12px_32px_rgba(45,51,55,0.06)] transition-all flex items-center gap-2">
              Explore 3D Body
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link href="/doctors" className="border border-outline-variant/30 text-primary font-label font-semibold text-base px-8 py-4 rounded-xl hover:bg-surface-container-low transition-colors">
              View Doctors
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">view_in_ar</span>
            </div>
            <h3 className="font-headline text-xl font-bold">3D Body Mapping</h3>
            <p className="text-on-surface-variant">Interact with our detailed anatomical model to identify pain points and symptoms with clinical precision.</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">event_available</span>
            </div>
            <h3 className="font-headline text-xl font-bold">Book Appointments</h3>
            <p className="text-on-surface-variant">Schedule consultations instantly with verified specialists who match your specific anatomical needs.</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">history_edu</span>
            </div>
            <h3 className="font-headline text-xl font-bold">Health History</h3>
            <p className="text-on-surface-variant">Maintain a secure, visual record of your symptoms and treatments mapped directly to your digital twin.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-slate-50 dark:bg-slate-950 flex justify-between items-center px-8 py-12 max-w-7xl mx-auto border-t border-outline-variant/10">
        <div className="text-teal-700 dark:text-teal-400 font-bold text-lg font-headline">BodyMap</div>
        <div className="font-body text-xs text-slate-500">© 2026 BodyMap. All rights reserved.</div>
        <div className="flex gap-4 font-body text-xs text-slate-500">
          <Link href="/about" className="hover:text-teal-600 dark:hover:text-teal-300 transition-colors">About</Link>
          <Link href="/privacy" className="hover:text-teal-600 dark:hover:text-teal-300 transition-colors">Privacy</Link>
        </div>
      </footer>
    </>
  )
}
