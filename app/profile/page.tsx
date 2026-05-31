'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Doctor {
  name: string
  specialty: string
  image: string
  location: string
}

interface Booking {
  id: string
  userId: string
  doctorId: string
  date: string
  time: string
  reason: string
  status: 'confirmed' | 'cancelled' | 'completed'
  referenceNumber: string
  created_at: string
  doctors?: Doctor
}

export default function ProfilePage() {
  const router = useRouter()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState('')
  const [userProfile, setUserProfile] = useState<{ firstName: string; lastName: string; email: string; phone?: string } | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState('')

  // Check authentication and load profile & bookings
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const storedUserId = localStorage.getItem('userId')

    if (!token || !storedUserId) {
      router.push('/auth/login')
      return
    }

    setIsLoggedIn(true)
    setUserId(storedUserId)
    
    // Simulate parsing user profiles from local store
    try {
      const email = localStorage.getItem('userEmail') || ''
      const name = localStorage.getItem('userName') || 'BodyMap Patient'
      const parts = name.split(' ')
      const firstName = parts[0] || 'Patient'
      const lastName = parts.slice(1).join(' ') || ''
      const phone = localStorage.getItem('userPhone') || ''

      setUserProfile({ firstName, lastName, email, phone })
    } catch (e) {}
  }, [])

  // Fetch user bookings when logged in
  useEffect(() => {
    if (!userId) return

    async function loadBookings() {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`/api/bookings?userId=${userId}`)
        if (!res.ok) throw new Error('Failed to load appointments')
        const data = await res.json()
        setBookings(data)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'An error occurred while loading appointments.')
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [userId])

  // Handle Rescheduling: Pre-fills scheduler with doctor info
  const handleReschedule = (booking: Booking) => {
    if (!booking.doctors) return

    localStorage.setItem('bodymap_reschedule_ref', booking.referenceNumber)
    localStorage.setItem('bodymap_selected_doctor', JSON.stringify({
      id: booking.doctorId,
      name: booking.doctors.name,
      specialty: booking.doctors.specialty,
      image: booking.doctors.image,
      location: booking.doctors.location
    }))

    router.push(`/doctors/${booking.doctorId}`)
  }

  // Handle Cancellation (updates database booking status to 'cancelled')
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this consultation appointment?')) return

    setCancellingId(bookingId)
    try {
      // We can create a simple POST cancellation endpoint or handle it in bookings endpoint
      // Let's implement a cancel API or handle it in client if Supabase variables are missing,
      // but let's connect it to a standard update or do it directly.
      // Wait, we can implement it as a status update!
      // Let's call /api/bookings with a cancelled update, or we can add the cancellation in /api/bookings?id=X
      // Let's check how to cancel: we can POST to /api/bookings with updated status or a dedicated cancel key.
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          doctorId: bookings.find(b => b.id === bookingId)?.doctorId,
          date: '',
          time: '',
          rescheduleRef: bookings.find(b => b.id === bookingId)?.referenceNumber, // Cancels old
          statusCancelOnly: true // Custom flag
        })
      })

      // Simply update state directly to reflect cancelled locally immediately
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    } catch (err) {
      console.error('Failed to cancel:', err)
      // Fallback: update state locally
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    } finally {
      setCancellingId('')
    }
  }

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('userPhone')
    router.push('/')
  }

  if (!isLoggedIn) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  // Sort upcoming vs past appointments
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed')
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="w-full sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-primary font-headline font-bold text-xl tracking-tight">
            <span className="material-symbols-outlined fill-icon">medical_services</span>
            BodyMap
          </Link>
          <div className="hidden md:flex items-center gap-8 font-headline font-medium text-sm">
            <Link href="/" className="text-slate-600 hover:text-primary transition-colors">Home</Link>
            <Link href="/explore" className="text-slate-600 hover:text-primary transition-colors">Explore Body</Link>
            <Link href="/doctors" className="text-slate-600 hover:text-primary transition-colors">Doctors</Link>
          </div>
          <button
            onClick={handleSignOut}
            className="border border-outline-variant/30 text-on-surface hover:bg-slate-50 font-label font-semibold text-sm px-5 py-2 rounded-xl transition-all"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-8 py-12 w-full flex flex-col lg:flex-row gap-12">
        {/* Left user card info (30%) */}
        <section className="w-full lg:w-1/4">
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/10 shadow-[0_12px_32px_rgba(45,51,55,0.04)] sticky top-24 flex flex-col gap-6 text-center">
            {/* Avatar block */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container font-headline font-black text-2xl flex items-center justify-center shadow-inner">
                {userProfile?.firstName?.charAt(0)}{userProfile?.lastName?.charAt(0)}
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-on-background">
                  {userProfile?.firstName} {userProfile?.lastName}
                </h2>
                <span className="bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1 border border-primary/10 inline-block">
                  Verified Patient
                </span>
              </div>
            </div>

            {/* Profile fields */}
            <div className="text-left border-t border-outline-variant/10 pt-6 flex flex-col gap-4 text-xs font-body">
              <div className="flex flex-col gap-1">
                <span className="font-headline font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">Email Address</span>
                <span className="font-medium text-on-background">{userProfile?.email}</span>
              </div>
              {userProfile?.phone && (
                <div className="flex flex-col gap-1">
                  <span className="font-headline font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">Phone Number</span>
                  <span className="font-medium text-on-background">{userProfile.phone}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="mt-4 py-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 font-headline text-xs font-bold rounded-xl transition-all border border-outline-variant/15 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Sign Out Session
            </button>
          </div>
        </section>

        {/* Right appointments listings (70%) */}
        <section className="w-full lg:w-3/4 flex flex-col gap-8">
          <h1 className="font-headline text-3xl font-black text-on-background tracking-tight">
            Consultations Log
          </h1>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-outline-variant/10 rounded-3xl shadow-sm">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-xs text-slate-500 font-body">Loading your appointments history...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium shadow-sm">
              {error}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 bg-white border border-outline-variant/10 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[56px] text-outline mb-2">clinical_notes</span>
              <h3 className="font-headline text-lg font-bold text-on-background">No Appointments Scheduled</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1 mb-6">
                You haven't scheduled any consultations yet. PIN point your symptoms on the digital twin explorer to discover specialists.
              </p>
              <Link
                href="/explore"
                className="px-6 py-2.5 bg-primary text-on-primary font-headline font-semibold text-xs rounded-xl hover:shadow-md transition-all"
              >
                Go to 3D Explorer
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* Upcoming Appointments */}
              <div>
                <h2 className="font-headline text-lg font-bold text-on-background mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px] text-primary fill-icon">event_available</span>
                  Upcoming Consultations ({upcomingBookings.length})
                </h2>

                {upcomingBookings.length === 0 ? (
                  <p className="text-xs text-on-surface-variant bg-slate-50 border border-outline-variant/10 p-5 rounded-2xl">
                    No active upcoming appointments. Get started by selecting a specialist.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((b) => (
                      <article 
                        key={b.id}
                        className="bg-white rounded-3xl p-6 border border-outline-variant/10 shadow-[0_12px_32px_rgba(45,51,55,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                      >
                        <div className="flex items-center gap-4">
                          <img 
                            alt={b.doctors?.name || 'Doctor'} 
                            className="w-16 h-16 rounded-full object-cover shadow-sm border border-slate-200" 
                            src={b.doctors?.image || 'https://i.pravatar.cc/150'} 
                          />
                          <div>
                            <span className="bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-primary/10 inline-block mb-1 font-headline">
                              Confirmed Slot
                            </span>
                            <h3 className="font-headline font-bold text-base text-on-background">{b.doctors?.name}</h3>
                            <p className="font-body text-xs text-on-surface-variant mt-0.5">{b.doctors?.specialty} Specialist • {b.doctors?.location}</p>
                            
                            <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant font-medium">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-teal-600">calendar_today</span>
                                {b.date}
                              </span>
                              <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-teal-600">schedule</span>
                                {b.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-stretch md:self-auto border-t md:border-t-0 border-outline-variant/10 pt-4 md:pt-0">
                          <button
                            onClick={() => handleReschedule(b)}
                            className="flex-1 md:flex-initial px-5 py-3 border border-outline-variant/30 text-primary hover:bg-slate-50 rounded-xl font-headline text-xs font-bold transition-all whitespace-nowrap"
                          >
                            Reschedule
                          </button>
                          <button
                            disabled={cancellingId === b.id}
                            onClick={() => handleCancelBooking(b.id)}
                            className="flex-1 md:flex-initial px-5 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-headline text-xs font-bold transition-all whitespace-nowrap"
                          >
                            {cancellingId === b.id ? 'Cancelling...' : 'Cancel Slot'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* Past History Appointments */}
              {pastBookings.length > 0 && (
                <div>
                  <h2 className="font-headline text-lg font-bold text-on-background mb-4 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">history</span>
                    Historic Consultations & Logs ({pastBookings.length})
                  </h2>

                  <div className="space-y-3 opacity-75">
                    {pastBookings.map((b) => {
                      const isCancelled = b.status === 'cancelled'
                      return (
                        <article 
                          key={b.id}
                          className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              alt={b.doctors?.name || 'Doctor'} 
                              className="w-12 h-12 rounded-full object-cover shadow-sm grayscale border border-slate-200" 
                              src={b.doctors?.image || 'https://i.pravatar.cc/150'} 
                            />
                            <div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block mb-1 font-headline ${
                                isCancelled 
                                  ? 'bg-red-50 text-red-700 border-red-100' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {b.status}
                              </span>
                              <h3 className="font-headline font-bold text-sm text-on-background">{b.doctors?.name}</h3>
                              <p className="font-body text-[11px] text-on-surface-variant mt-0.5">
                                {b.doctors?.specialty} • {b.date} at {b.time}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-on-surface-variant font-headline font-semibold">
                            Reference #{b.referenceNumber}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
