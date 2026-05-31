'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface Doctor {
  id: string | number
  name: string
  specialty: string
  rating: number
  experience: number
  image: string
  location: string
  languages: string
  available?: boolean
}

// Specializations map matching the database structure
const specializations: Record<string, { keywords: string[]; procedures: string[] }> = {
  "Cardiology": { 
    keywords: ["chest", "heart", "cardio", "pain", "palpitations", "angina", "heartburn", "acid reflux"], 
    procedures: ["Heart Rhythm", "Echocardiography"] 
  },
  "Neurology": { 
    keywords: ["head", "brain", "migraine", "headache", "nerve", "dizzy", "stroke", "forehead", "backhead", "neuralgia", "tension"], 
    procedures: ["EEG", "Brain Mapping"] 
  },
  "Orthopedics": { 
    keywords: ["bone", "joint", "knee", "arm", "leg", "spine", "back", "fracture", "arthritis", "shoulder", "foot", "hand", "calf", "thigh", "muscle", "strain", "cramp", "sciatic", "sciatica", "fasciitis", "sprain", "posture", "herniated", "disc", "rotator cuff", "frozen shoulder", "tennis elbow", "carpal tunnel"], 
    procedures: ["Joint Replacement", "Spinal Fusion"] 
  },
  "Otolaryngology (ENT)": { 
    keywords: ["ear", "nose", "throat", "hearing", "tinnitus", "sinus", "cold", "earwax", "swimmer", "infection"], 
    procedures: ["Audiometry", "Sinus Surgery"] 
  },
  "Gastroenterology": { 
    keywords: ["abdomen", "stomach", "gut", "digestion", "ulcer", "acid", "bowel", "torso", "indigestion", "flu", "poisoning", "appendicitis", "reflux", "heartburn"], 
    procedures: ["Endoscopy", "Colonoscopy"] 
  },
  "Dermatology": { 
    keywords: ["skin", "rash", "acne", "melanoma", "mole", "blister", "burn", "blisters"], 
    procedures: ["Skin Biopsy", "Laser Therapy"] 
  },
  "Ophthalmology": { 
    keywords: ["eye", "vision", "cataract", "glaucoma", "blindness"], 
    procedures: ["LASIK", "Cataract Surgery"] 
  },
  "General Medicine": { 
    keywords: ["general", "fever", "fatigue", "cold", "flu", "weakness"], 
    procedures: ["Checkup", "Blood Test"] 
  },
  "Pulmonology": { 
    keywords: ["lung", "breath", "asthma", "cough", "chest", "bronchitis", "pneumonia"], 
    procedures: ["Spirometry", "Bronchoscopy"] 
  }
}

function DoctorsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryParam = searchParams.get('query') || 'All Specialists'
  const partParam = searchParams.get('part') || queryParam

  const [allDoctors, setAllDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  const [activeFilter, setActiveFilter] = useState('All')
  const [searchText, setSearchText] = useState('')
  const [isDbOffline, setIsDbOffline] = useState(false)

  // Load doctors from API on mount
  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoading(true)
        const res = await fetch('/api/doctors')
        if (!res.ok) throw new Error('API request failed')
        const data = await res.json()
        setAllDoctors(data)
        
        // Check if database fallback is used
        if (res.headers.get('x-database-fallback') === 'true') {
          setIsDbOffline(true)
        }
      } catch (err) {
        console.error('Failed to load doctors, using static fallback:', err)
        setIsDbOffline(true)
      } finally {
        setLoading(false)
      }
    }
    loadDoctors()
  }, [])

  // anatomical filter logic
  useEffect(() => {
    if (allDoctors.length === 0) return

    let current = [...allDoctors]

    // 1. Apply anatomical filter buttons
    if (activeFilter !== 'All') {
      const targetFilter = activeFilter.toLowerCase()
      // Map region names to match keywords (e.g. Feet -> foot, Legs -> leg)
      let baseFilter = targetFilter
      if (baseFilter.endsWith('s') && baseFilter !== 'specialists') {
        baseFilter = baseFilter.slice(0, -1)
      }
      if (targetFilter === 'feet') baseFilter = 'foot'

      // Check which specialties match the anatomical region
      const matchedSpecs: string[] = []
      for (const [spec, data] of Object.entries(specializations)) {
        if (data.keywords.some(k => k === baseFilter || k.includes(baseFilter))) {
          matchedSpecs.push(spec)
        }
      }
      current = current.filter(d => matchedSpecs.includes(d.specialty))
    }

    // 2. Apply URL parameter (symptom search query)
    const q = queryParam.toLowerCase()
    if (q && queryParam !== 'All Specialists' && activeFilter === 'All') {
      const qWords = q.split(/[\s/()]+/).filter(w => w.length > 2)

      const matchedSpecs: string[] = []
      for (const [spec, data] of Object.entries(specializations)) {
        const matches = data.keywords.some(k => q.includes(k) || qWords.includes(k)) || q.includes(spec.toLowerCase())
        if (matches) {
          matchedSpecs.push(spec)
        }
      }

      if (matchedSpecs.length > 0) {
        current = current.filter(d => matchedSpecs.includes(d.specialty))
      }
    }

    // 3. Apply manual name search input
    if (searchText) {
      current = current.filter(d => d.name.toLowerCase().includes(searchText.toLowerCase()))
    }

    setFilteredDoctors(current)
  }, [allDoctors, activeFilter, queryParam, searchText])

  // Sync active filter button with URL query param
  useEffect(() => {
    const p = partParam.toLowerCase()
    if (p.includes('head')) {
      setActiveFilter('Head')
    } else if (p.includes('chest')) {
      setActiveFilter('Chest')
    } else if (p.includes('torso') || p.includes('abdomen')) {
      setActiveFilter('Torso')
    } else if (p.includes('arm')) {
      setActiveFilter('Arms')
    } else if (p.includes('hand')) {
      setActiveFilter('Hands')
    } else if (p.includes('leg')) {
      setActiveFilter('Legs')
    } else if (p.includes('foot') || p.includes('feet')) {
      setActiveFilter('Feet')
    } else {
      setActiveFilter('All')
    }
  }, [partParam])

  // Select doctor and navigate to their scheduling profile
  const handleSelectDoctor = (doc: Doctor) => {
    localStorage.setItem('bodymap_selected_doctor', JSON.stringify(doc))
    router.push(`/doctors/${doc.id}`)
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
            <Link href="/doctors" className="text-primary font-bold border-b-2 border-primary pb-1">Doctors</Link>
          </div>
          <Link href="/auth/login" className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-semibold text-sm px-6 py-2.5 rounded-xl hover:shadow-[0px_12px_32px_rgba(45,51,55,0.06)] transition-all">
            Login
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-8 py-12 w-full flex flex-col gap-12">
        {/* Header */}
        <header className="flex flex-col gap-4 max-w-3xl">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight">Our Specialists</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-body text-base text-on-surface-variant flex items-center">
              Recommended specialists for: 
              <span className="bg-tertiary-container/60 text-on-tertiary-container px-4 py-1.5 rounded-xl text-sm font-semibold ml-2.5 font-headline shadow-sm">
                {queryParam}
              </span>
            </p>

            {isDbOffline && (
              <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">offline_bolt</span>
                Local Mode
              </span>
            )}
          </div>
        </header>

        {/* Filter and Search */}
        <section className="bg-surface-container-low p-4 rounded-3xl md:rounded-full flex flex-col md:flex-row gap-4 items-center justify-between border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-2.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
            {['All', 'Head', 'Chest', 'Torso', 'Arms', 'Hands', 'Legs', 'Feet'].map((filterName) => {
              const isActive = activeFilter === filterName
              return (
                <button
                  key={filterName}
                  onClick={() => {
                    setActiveFilter(filterName)
                    // Clear query parameter from displaying when manual anatomical filter is chosen
                    if (filterName !== 'All') {
                      router.push('/doctors', { scroll: false })
                    }
                  }}
                  className={`px-5 py-2.5 rounded-full text-xs font-headline font-semibold transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-surface-container-lowest text-primary border-primary/20 shadow-[0_12px_32px_rgba(45,51,55,0.06)]'
                      : 'bg-transparent text-on-surface-variant hover:bg-surface-container-high/60 border-transparent'
                  }`}
                >
                  {filterName}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant font-medium whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px] text-teal-600 fill-icon">check_circle</span>
              <span>Available Today</span>
            </div>

            <div className="relative flex-grow md:w-64 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/35 rounded-full py-2.5 pl-10 pr-4 text-xs focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all text-on-surface placeholder:text-outline outline-none"
                placeholder="Search by name..."
              />
            </div>
          </div>
        </section>

        {/* Doctor Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-slate-500 font-body">Fetching medical professionals...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-8 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-outline mb-2">clinical_notes</span>
            <h3 className="font-headline text-lg font-bold text-on-background">No Specialists Matched</h3>
            <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1 mb-6">We couldn't find any specialists matching your filter. Showing general medicine practitioners.</p>
            <button
              onClick={() => {
                setActiveFilter('All')
                setSearchText('')
                router.push('/doctors')
              }}
              className="px-6 py-2.5 bg-primary text-on-primary font-headline font-semibold text-xs rounded-xl hover:shadow-md transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.slice(0, 15).map((doc) => {
              const isAvailable = doc.available !== false // Default to true if not specified
              const statusColor = isAvailable ? '#10B981' : '#F59E0B'

              // Resolve procedures
              const specData = specializations[doc.specialty] || { procedures: ["Consultation", "Checkup"] }
              const proc1 = specData.procedures[0] || "Consultation"
              const proc2 = specData.procedures[1] || "Clinical Exam"

              return (
                <article
                  key={doc.id}
                  className="bg-surface-container-lowest rounded-[1.5rem] p-6 flex flex-col gap-6 group hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] transition-all duration-300 border border-outline-variant/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        alt={`${doc.name} profile`}
                        className="w-20 h-20 rounded-full object-cover border-2 border-surface-container-low shadow-sm"
                        src={doc.image || 'https://i.pravatar.cc/150'}
                      />
                      <div
                        className="absolute bottom-0 right-0 w-4.5 h-4.5 border-2 border-surface-container-lowest rounded-full shadow-sm"
                        style={{ backgroundColor: statusColor }}
                        title={isAvailable ? 'Available' : 'Busy'}
                      ></div>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-headline text-lg font-bold text-on-background group-hover:text-primary transition-colors">
                        {doc.name}
                      </h3>
                      <p className="font-body text-primary text-sm font-semibold">{doc.specialty}</p>
                      
                      <div className="flex items-center gap-2.5 mt-1 text-xs text-on-surface-variant font-medium">
                        <span className="flex items-center gap-1 font-bold text-on-background">
                          <span className="material-symbols-outlined text-[16px] text-[#F59E0B] fill-icon">star</span>
                          {doc.rating}
                        </span>
                        <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                        <span>{doc.experience} years experience</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="bg-surface-container-low text-on-surface-variant text-[11px] px-3.5 py-1.5 rounded-lg font-semibold border border-outline-variant/10">
                      {proc1}
                    </span>
                    <span className="bg-surface-container-low text-on-surface-variant text-[11px] px-3.5 py-1.5 rounded-lg font-semibold border border-outline-variant/10">
                      {proc2}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectDoctor(doc)}
                    className="mt-auto w-full py-3.5 bg-surface-container-low hover:bg-primary hover:text-on-primary text-primary font-headline text-xs font-bold rounded-xl transition-all"
                  >
                    View Scheduling Profile
                  </button>
                </article>
              )
            })}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-slate-50 border-t border-outline-variant/10">
        <div className="flex justify-between items-center px-8 py-12 max-w-7xl mx-auto flex-col md:flex-row gap-6">
          <div className="text-primary font-bold text-lg font-headline">BodyMap</div>
          <div className="flex gap-6 font-body text-xs text-slate-500 font-medium">
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
          <div className="font-body text-xs text-slate-400 font-medium">
            © 2026 BodyMap. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-body">Loading doctor lists...</p>
      </div>
    }>
      <DoctorsPageContent />
    </Suspense>
  )
}
