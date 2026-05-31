'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import { useRouter, useParams } from 'next/navigation'
import { 
  getWeekStart, 
  getWeekDates, 
  isDateDisabled, 
  formatDateForDisplay, 
  formatDateISO, 
  createSlot 
} from '@/lib/dateUtils'

interface Doctor {
  id: string | number
  name: string
  specialty: string
  rating: number
  experience: number
  image: string
  location: string
  languages: string
}

export default function DoctorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)

  // Calendar states
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Start at Sunday of current week
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay())
    return start
  })

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'slots' | 'about' | 'reviews'>('slots')

  // Generate 7 days of the current week
  const weekDates = getWeekDates(currentWeekStart)
  const today = new Date()
  today.setHours(0,0,0,0)

  // Fetch doctor on mount/id change
  useEffect(() => {
    async function loadDoctor() {
      try {
        setLoading(true)
        const res = await fetch(`/api/doctors/${id}`)
        if (res.ok) {
          const data = await res.json()
          setDoctor(data)
        } else {
          // Try loading from localStorage if database is offline or not found
          const localDocRaw = localStorage.getItem('bodymap_selected_doctor')
          if (localDocRaw) {
            const localDoc = JSON.parse(localDocRaw)
            if (localDoc.id.toString() === id.toString() || localDoc.name.replace(/\s+/g, '-').toLowerCase().includes(id)) {
              setDoctor(localDoc)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load doctor by API, checking local storage:', err)
        const localDocRaw = localStorage.getItem('bodymap_selected_doctor')
        if (localDocRaw) {
          setDoctor(JSON.parse(localDocRaw))
        }
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadDoctor()
    }
  }, [id])

  // Sync Saved Doctor state
  useEffect(() => {
    if (!doctor) return
    const saved = JSON.parse(localStorage.getItem('bodymap_saved_doctors') || '[]')
    const exists = saved.some((d: any) => d.name === doctor.name)
    setIsSaved(exists)
  }, [doctor])

  // Auto-select first available date on mount
  useEffect(() => {
    if (weekDates.length > 0) {
      const firstAvailable = weekDates.find(d => !isDateDisabled(d))
      if (firstAvailable) {
        setSelectedDate(firstAvailable)
      }
    }
  }, [currentWeekStart])

  // Deterministically generate busy slots based on doctor name & date
  const isSlotBusy = (time: string, date: Date | null) => {
    if (!date || !doctor) return false
    const str = doctor.name + time + date.getDate()
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash) % 4 === 0 // 25% busy rate
  }

  // Handle Save/Favorite Doctor
  const handleSaveDoctor = () => {
    if (!doctor) return
    const saved = JSON.parse(localStorage.getItem('bodymap_saved_doctors') || '[]')
    const exists = saved.some((d: any) => d.name === doctor.name)

    if (exists) {
      const filtered = saved.filter((d: any) => d.name !== doctor.name)
      localStorage.setItem('bodymap_saved_doctors', JSON.stringify(filtered))
      setIsSaved(false)
    } else {
      saved.unshift({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        image: doctor.image,
        savedAt: new Date().toISOString()
      })
      localStorage.setItem('bodymap_saved_doctors', JSON.stringify(saved))
      setIsSaved(true)
    }
  }

  // Handle Week Navigation
  const navigateWeek = (direction: 'next' | 'prev') => {
    const nextStart = new Date(currentWeekStart)
    nextStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))

    // Don't browse to a week that is entirely in the past
    const endOfWeek = new Date(nextStart)
    endOfWeek.setDate(nextStart.getDate() + 6)
    if (endOfWeek < today) return

    setCurrentWeekStart(nextStart)
  }

  // Book action
  const handleBookAppointment = () => {
    if (!doctor || !selectedDate || !selectedTime) return

    const slot = createSlot(selectedDate, selectedTime)
    localStorage.setItem('bodymap_selected_doctor', JSON.stringify(doctor))
    localStorage.setItem('bodymap_selected_slot', JSON.stringify(slot))
    router.push('/booking')
  }

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-body">Loading doctor scheduler...</p>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <span className="material-symbols-outlined text-[64px] text-error mb-4">error</span>
        <h2 className="text-xl font-headline font-bold text-on-background mb-2">Doctor Profile Not Found</h2>
        <Link href="/doctors" className="mt-4 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm">
          Return to Doctors List
        </Link>
      </div>
    )
  }

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
            <Link href="/doctors" className="text-primary font-bold">Doctors</Link>
          </div>
          <AuthButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col pt-8 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto gap-8">
        {/* Doctor profile card */}
        <section className="bg-surface-container-lowest rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row gap-8 items-start relative border border-outline-variant/10 shadow-[0px_12px_32px_rgba(45,51,55,0.04)]">
          <Link 
            href="/doctors" 
            className="absolute top-8 left-8 text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 font-headline font-semibold text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Search
          </Link>

          {/* Photo */}
          <div className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden shrink-0 mt-8 md:mt-0 border-4 border-surface-container-low shadow-inner relative">
            <img 
              alt={doctor.name} 
              className="w-full h-full object-cover" 
              src={doctor.image || 'https://i.pravatar.cc/150'} 
            />
            <div className="absolute bottom-2 right-2 bg-primary text-on-primary p-1 rounded-full border-2 border-surface-container-lowest shadow" title="Verified Specialist">
              <span className="material-symbols-outlined text-[14px] fill-icon font-bold">verified</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-grow flex flex-col gap-4 mt-6 md:mt-0 w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h1 className="font-headline font-bold text-3xl md:text-4xl text-on-surface tracking-tight mb-1">
                  {doctor.name}
                </h1>
                <p className="font-body text-base text-primary font-semibold">
                  {doctor.specialty}, M.D.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-surface-container/70 border border-outline-variant/10 px-3 py-2 rounded-xl self-start">
                <span className="material-symbols-outlined fill-icon text-[#F59E0B] text-[18px]">star</span>
                <span className="font-headline font-bold text-sm text-on-surface">{doctor.rating}</span>
                <span className="font-body text-xs text-on-surface-variant ml-1 font-medium">(138 Reviews)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-1.5 text-xs text-on-surface-variant font-medium">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-teal-600">location_on</span>
                <span>{doctor.location || 'Central Clinic'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-teal-600">work</span>
                <span>{doctor.experience}+ Years Experience</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-teal-600">language</span>
                <span>{doctor.languages || 'English'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
              <div className="flex items-center text-xs font-semibold text-on-surface-variant px-5 py-3 rounded-xl bg-surface-container-low border border-outline-variant/10">
                <span className="material-symbols-outlined text-[18px] text-teal-600 mr-2 flex-shrink-0">calendar_today</span>
                Choose Date & Time below to unlock booking
              </div>

              <button
                onClick={handleSaveDoctor}
                className="w-full sm:w-auto border border-outline-variant/30 text-primary font-headline font-bold text-xs px-6 py-3.5 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSaved ? 'favorite' : 'favorite_border'}
                </span>
                {isSaved ? 'Saved Specialist' : 'Save Specialist'}
              </button>
            </div>
          </div>
        </section>

        {/* Tab options */}
        <div className="flex border-b border-outline-variant/15 w-full mt-4">
          <button 
            onClick={() => setActiveTab('slots')}
            className={`px-6 py-4 font-headline font-bold text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'slots' 
                ? 'text-primary border-primary' 
                : 'text-on-surface-variant hover:text-on-surface border-transparent'
            }`}
          >
            Available Slots
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`px-6 py-4 font-headline font-bold text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'about' 
                ? 'text-primary border-primary' 
                : 'text-on-surface-variant hover:text-on-surface border-transparent'
            }`}
          >
            About
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-4 font-headline font-bold text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'reviews' 
                ? 'text-primary border-primary' 
                : 'text-on-surface-variant hover:text-on-surface border-transparent'
            }`}
          >
            Reviews
          </button>
        </div>

        {/* Available slots tab content */}
        {activeTab === 'slots' && (
          <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 flex flex-col gap-8 border border-outline-variant/10 shadow-sm">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="font-headline font-bold text-2xl text-on-surface">Book a Consultation</h2>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateWeek('prev')}
                  type="button"
                  className="p-2 rounded-xl border border-outline-variant/20 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="font-headline font-semibold text-sm px-3 text-on-surface">
                  {formatDateForDisplay(weekDates[0])} - {formatDateForDisplay(weekDates[6])}
                </span>
                <button
                  onClick={() => navigateWeek('next')}
                  type="button"
                  className="p-2 rounded-xl border border-outline-variant/20 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Weekly Days Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weekDates.map((date, idx) => {
                const isDisabled = isDateDisabled(date)
                const isSelected = selectedDate && formatDateISO(selectedDate) === formatDateISO(date)

                return (
                  <div
                    key={idx}
                    onClick={() => !isDisabled && setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border transition-all ${
                      isDisabled
                        ? 'bg-slate-100/50 text-slate-400 border-slate-100 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary text-on-primary border-transparent'
                        : 'bg-white text-on-surface border-outline-variant/10 cursor-pointer hover:border-primary/50'
                    }`}
                  >
                    <span className={`font-headline text-xs font-bold uppercase tracking-wider ${
                      isSelected ? 'text-primary-container' : 'text-on-surface-variant'
                    }`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="font-headline text-2xl font-black mt-1">
                      {date.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Time slots grid */}
            <div className="flex flex-col gap-8 mt-4 border-t border-outline-variant/10 pt-6">
              {/* Morning */}
              <div>
                <h3 className="font-headline font-bold text-xs text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-500">light_mode</span> Morning Sessions
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'].map((time) => {
                    const busy = isSlotBusy(time, selectedDate)
                    const isSelected = selectedTime === time
                    
                    return (
                      <button
                        key={time}
                        disabled={busy}
                        onClick={() => setSelectedTime(time)}
                        className={`px-5 py-3 rounded-full border text-xs font-headline font-bold transition-all shadow-sm ${
                          busy
                            ? 'border-outline-variant/10 text-on-surface-variant/40 bg-slate-100/60 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-primary border-transparent text-on-primary'
                            : 'border-primary/20 text-primary bg-white hover:bg-primary-container/10'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Afternoon */}
              <div>
                <h3 className="font-headline font-bold text-xs text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">wb_sunny</span> Afternoon Sessions
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'].map((time) => {
                    const busy = isSlotBusy(time, selectedDate)
                    const isSelected = selectedTime === time

                    return (
                      <button
                        key={time}
                        disabled={busy}
                        onClick={() => setSelectedTime(time)}
                        className={`px-5 py-3 rounded-full border text-xs font-headline font-bold transition-all shadow-sm ${
                          busy
                            ? 'border-outline-variant/10 text-on-surface-variant/40 bg-slate-100/60 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-primary border-transparent text-on-primary'
                            : 'border-primary/20 text-primary bg-white hover:bg-primary-container/10'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* About tab content */}
        {activeTab === 'about' && (
          <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-outline-variant/10 shadow-sm max-w-3xl">
            <h2 className="font-headline font-bold text-xl text-on-background">About {doctor.name}</h2>
            <p className="text-on-surface-variant text-sm font-body leading-relaxed">
              {doctor.name} is a board-certified specialist with over {doctor.experience} years of clinical expertise. They are committed to providing premium, personalized healthcare using cutting-edge therapeutic interventions and patient-centric diagnostics.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2 border-t border-outline-variant/10 pt-6 text-sm">
              <div className="flex flex-col gap-2">
                <span className="font-headline font-bold text-on-background">Medical Education</span>
                <span className="text-on-surface-variant">Johns Hopkins School of Medicine</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-headline font-bold text-on-background">Residency / Fellowship</span>
                <span className="text-on-surface-variant">Mayo Clinic Cardiology Fellowship</span>
              </div>
              <div className="flex flex-col gap-2 col-span-full">
                <span className="font-headline font-bold text-on-background">Special Clinical Interests</span>
                <span className="text-on-surface-variant">Preventive health care, therapeutic interventions, anatomical diagnostic mapping.</span>
              </div>
            </div>
          </section>
        )}

        {/* Reviews tab content */}
        {activeTab === 'reviews' && (
          <section className="bg-surface-container-low rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-outline-variant/10 shadow-sm max-w-3xl">
            <h2 className="font-headline font-bold text-xl text-on-background">Patient Reviews</h2>
            
            <div className="space-y-4">
              {[
                { name: "David L.", rating: 5.0, review: "Exceptional physician. Spent adequate time reviewing my medical scans and explained everything clearly.", date: "2 weeks ago" },
                { name: "Maria S.", rating: 4.8, review: "Very professional clinical clinic. The appointment started exactly on schedule, and the consulting was highly satisfactory.", date: "1 month ago" }
              ].map((r, i) => (
                <div key={i} className="p-5 bg-white border border-outline-variant/10 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="font-headline font-bold text-sm text-on-background">{r.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5 text-[#F59E0B]">
                        <span className="material-symbols-outlined text-[16px] fill-icon">star</span>
                        <span className="font-headline font-bold text-xs text-on-background">{r.rating}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-medium">• {r.date}</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-xs font-body leading-relaxed">{r.review}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Bottom Booking Bar */}
      {selectedDate && selectedTime && (
        <div className="fixed bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 z-50 animate-bounce-short">
          <div className="bg-surface-container-lowest rounded-full p-4.5 shadow-[0_16px_40px_rgba(45,51,55,0.08)] border border-outline-variant/15 flex items-center justify-between gap-4">
            <div className="pl-3.5">
              <div className="font-headline font-black text-sm text-on-background">{doctor.name}</div>
              <div className="text-on-surface-variant text-xs font-semibold mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-teal-600">event_available</span>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {selectedTime}
              </div>
            </div>
            <button
              onClick={handleBookAppointment}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold text-xs px-6 py-3.5 rounded-full hover:shadow-md transition-all whitespace-nowrap"
            >
              Continue Booking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
