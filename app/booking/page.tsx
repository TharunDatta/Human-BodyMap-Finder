'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Doctor {
  id: string | number
  name: string
  specialty: string
  image: string
  location: string
}

interface Slot {
  date: string
  time: string
  iso: string
}

const isValidJwt = (token: string) => token.split('.').length === 3

export default function BookingPage() {
  const router = useRouter()

  // State elements
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [authToken, setAuthToken] = useState('')

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')

  // Flow step control: 1 = Form details, 2 = Confirmation done
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [rescheduleRefText, setRescheduleRefText] = useState('')

  // Check auth and initial booking selections
  useEffect(() => {
    // 1. Get chosen doctor and slot
    const savedDoctor = localStorage.getItem('bodymap_selected_doctor')
    const savedSlot = localStorage.getItem('bodymap_selected_slot')

    if (!savedDoctor || !savedSlot) {
      router.push('/explore')
      return
    }

    try {
      setDoctor(JSON.parse(savedDoctor))
      setSlot(JSON.parse(savedSlot))
    } catch (e) {
      router.push('/explore')
      return
    }

    // 2. Check if logged in
    const storedToken = localStorage.getItem('authToken') || ''
    const storedUserId = localStorage.getItem('userId') || ''
    const hasValidSession = storedToken && storedUserId && isValidJwt(storedToken)

    if (hasValidSession) {
      setIsLoggedIn(true)
      setUserId(storedUserId)
      setAuthToken(storedToken)

      // Pre-populate details from local storage or context if they exist
      // Since users register through auth/register, we might have their name stored
      // Try parsing standard user profiles
      try {
        const storedEmail = localStorage.getItem('userEmail') || ''
        if (storedEmail) setEmail(storedEmail)
        setUserEmail(storedEmail)
      } catch (err) {}
    } else if (storedToken || storedUserId) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      localStorage.removeItem('userPhone')
    }

    // 3. Check for rescheduling
    const rRef = localStorage.getItem('bodymap_reschedule_ref')
    if (rRef) {
      setRescheduleRefText(rRef)
    }
  }, [])

  // Handle form submission (API write)
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctor || !slot || !userId) return

    setLoading(true)
    setError('')

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken && isValidJwt(authToken)) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          doctorId: doctor.id,
          date: slot.date,
          time: slot.time,
          reason,
          rescheduleRef: rescheduleRefText || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        const message = data.error || 'Failed to complete booking'
        if (/jwt|token|auth/i.test(message)) {
          setError('Your session expired. Please sign in again and retry your booking.')
          return
        }
        throw new Error(message)
      }

      // Success - Save reference number and transition to step 3 (done)
      setBookingRef(data.referenceNumber || 'BM-CONFIRMED')
      setStep(3)

      // Clean local storage states
      localStorage.removeItem('bodymap_selected_slot')
      localStorage.removeItem('bodymap_reschedule_ref')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // If not logged in, show a beautiful lock screen prompting auth
  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#f8f9fb]">
        <header className="w-full px-8 py-6 max-w-7xl mx-auto flex items-center justify-between border-b border-outline-variant/10">
          <div className="flex items-center gap-2 text-primary font-headline font-bold text-xl tracking-tight">
            <span className="material-symbols-outlined fill-icon">medical_services</span>
            BodyMap
          </div>
          <Link className="text-xs font-headline font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" href="/doctors">
            Cancel Booking
            <span className="material-symbols-outlined text-[16px]">close</span>
          </Link>
        </header>

        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_16px_48px_rgba(0,0,0,0.06)] border border-outline-variant/10 text-center">
            <span className="material-symbols-outlined text-[56px] text-primary fill-icon mb-4">lock</span>
            <h2 className="font-headline text-2xl font-black text-on-background mb-3">Authentication Required</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
              Please sign in or register a new account to secure your consultation slot and complete this booking.
            </p>
            
            <div className="flex flex-col gap-3">
              <Link 
                href="/auth/login" 
                className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-headline font-semibold text-sm hover:shadow-md transition-all block text-center"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register" 
                className="w-full py-4 border border-outline-variant/30 text-primary hover:bg-slate-50 rounded-xl font-headline font-semibold text-sm transition-all block text-center"
              >
                Register New Account
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <header className="w-full px-8 py-6 max-w-7xl mx-auto flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-2 text-primary font-headline font-bold text-xl tracking-tight">
          <span className="material-symbols-outlined fill-icon">medical_services</span>
          BodyMap
        </Link>
        <Link className="text-xs font-headline font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5" href="/doctors">
          Cancel Booking
          <span className="material-symbols-outlined text-[18px]">close</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8 lg:py-12 flex flex-col">
        {step !== 3 && (
          <div className="mb-12">
            <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-extrabold text-on-background tracking-tight mb-3">
              Complete your booking.
            </h1>
            <p className="font-body text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Please review your scheduling slot and provide patient clinical intake details to finalize your hospital appointment.
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Step Panels */}
          {step !== 3 ? (
            <>
              {/* Left intake form */}
              <div className="w-full lg:w-3/5 flex flex-col gap-6">
                {/* Step indicator */}
                <div className="flex items-center gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold shadow">1</div>
                    <span className="font-headline text-xs font-bold text-primary">Patient Intake</span>
                  </div>
                  <div className="w-8 h-px bg-outline-variant/30 shrink-0"></div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant text-xs font-semibold">2</div>
                    <span className="font-headline text-xs text-on-surface-variant font-semibold">Confirmation</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleConfirmBooking} className="flex flex-col gap-6 bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-[0_12px_32px_rgba(45,51,55,0.04)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="font-headline text-xs font-bold text-on-surface">First Name</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-full border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary-container/20 text-sm outline-none transition-all font-body bg-slate-50/50"
                        placeholder="John"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-headline text-xs font-bold text-on-surface">Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-full border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary-container/20 text-sm outline-none transition-all font-body bg-slate-50/50"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="font-headline text-xs font-bold text-on-surface">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-full border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary-container/20 text-sm outline-none transition-all font-body bg-slate-50/50"
                        placeholder="john.doe@example.com"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-headline text-xs font-bold text-on-surface">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-full border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary-container/20 text-sm outline-none transition-all font-body bg-slate-50/50"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-headline text-xs font-bold text-on-surface">Reason for Visit</label>
                    <textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="w-full px-5 py-4 rounded-2xl border border-outline-variant/30 focus:border-primary focus:ring-4 focus:ring-primary-container/20 text-sm outline-none transition-all font-body resize-none bg-slate-50/50"
                      placeholder="Describe symptoms, pain duration, or reason for booking this consultation..."
                    ></textarea>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium">
                      {error}
                    </div>
                  )}

                  {rescheduleRefText && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                      Rescheduling Appointment: Old Reference #{rescheduleRefText} will be cancelled.
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold text-sm rounded-full hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? 'Confirming slot...' : 'Continue to Confirm'}
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right summary sidebar */}
              <div className="w-full lg:w-2/5">
                <div className="sticky top-24 bg-white rounded-3xl p-8 shadow-[0_12px_40px_rgba(45,51,55,0.04)] border border-outline-variant/10 flex flex-col gap-6 relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <h2 className="font-headline text-xl font-bold text-on-background">Appointment Summary</h2>

                  {/* Doctor Profile info */}
                  {doctor && (
                    <div className="bg-[#f8f9fb] rounded-2xl p-4 flex items-center gap-4 border border-outline-variant/5">
                      <img 
                        alt={doctor.name} 
                        className="w-14 h-14 rounded-full object-cover shadow-sm border border-slate-200" 
                        src={doctor.image || 'https://i.pravatar.cc/150'} 
                      />
                      <div>
                        <h3 className="font-headline font-bold text-sm text-on-background">{doctor.name}</h3>
                        <p className="font-body text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">psychiatry</span>
                          {doctor.specialty} Specialist
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Slot Details */}
                  {slot && (
                    <div className="flex flex-col gap-4 py-2 border-t border-b border-outline-variant/10">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-on-surface-variant flex-shrink-0">
                          <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        </div>
                        <div>
                          <span className="font-headline text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Scheduled Time</span>
                          <span className="font-headline font-black text-sm text-on-background mt-0.5 block">{slot.date}</span>
                          <span className="font-body text-xs text-on-surface-variant mt-0.5 block">{slot.time}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-on-surface-variant flex-shrink-0">
                          <span className="material-symbols-outlined text-[20px]">location_on</span>
                        </div>
                        <div>
                          <span className="font-headline text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Clinic Location</span>
                          <span className="font-headline font-black text-sm text-[#2d3337] mt-0.5 block">{doctor?.location || 'Central Clinic'}</span>
                          <span className="font-body text-xs text-on-surface-variant mt-0.5 block">Room 402, 4th Floor</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fees Breakdown */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-outline-variant/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-on-surface-variant">Consultation Fee</span>
                      <span className="font-bold text-on-background">Rs. 150.00</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-on-surface-variant">Service Charge</span>
                      <span className="font-bold text-on-background">Rs. 5.00</span>
                    </div>
                    <div className="h-px bg-outline-variant/15 my-1"></div>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="font-headline text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Cost</span>
                        <span className="text-[10px] text-on-surface-variant font-medium">Includes tax</span>
                      </div>
                      <span className="font-headline text-xl font-black text-primary tracking-tight">Rs. 155.00</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 justify-center text-on-surface-variant text-[11px] font-medium opacity-80 mt-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    <span>Secure, encrypted slot locking</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Step 3: Success Confirmation */
            <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-[0_16px_48px_rgba(0,0,0,0.04)] border border-outline-variant/10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-primary mb-6 animate-pulse">
                <span className="material-symbols-outlined text-[36px] fill-icon font-bold">check_circle</span>
              </div>

              <span className="font-headline text-[11px] font-bold text-primary uppercase tracking-widest block mb-2">Slot Locked Successfully</span>
              <h2 className="font-headline text-3xl font-black text-on-background tracking-tight mb-4">Your Appointment is Confirmed!</h2>
              
              <div className="bg-[#f8f9fb] border border-outline-variant/10 rounded-2xl p-5 mb-8 max-w-md w-full text-left flex flex-col gap-3 shadow-inner">
                <div className="flex justify-between text-xs border-b border-outline-variant/15 pb-2.5">
                  <span className="text-on-surface-variant font-medium">Reference Number</span>
                  <span className="font-headline font-bold text-primary tracking-wide">#{bookingRef}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">Patient Name</span>
                  <span className="font-headline font-bold text-on-background">{firstName} {lastName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">Specialist Doctor</span>
                  <span className="font-headline font-bold text-on-background">{doctor?.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">Date & Time</span>
                  <span className="font-headline font-bold text-on-background">{slot?.date} at {slot?.time}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link
                  href="/profile"
                  className="px-8 py-3.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-headline font-bold text-xs hover:shadow-md transition-all text-center"
                >
                  View Appointments Log
                </Link>
                <Link
                  href="/explore"
                  className="px-8 py-3.5 border border-outline-variant/30 text-primary hover:bg-slate-50 rounded-xl font-headline font-bold text-xs transition-all text-center"
                >
                  Back to Body Explorer
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
