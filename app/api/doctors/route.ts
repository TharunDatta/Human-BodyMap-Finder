import { NextRequest, NextResponse } from 'next/server'
import { supabase, isConfigured } from '@/lib/supabase'

// 30 high-fidelity mock doctors with proper anatomical keywords and specialties
const MOCK_DOCTORS = [
  {
    name: "Dr. Sarah Jenkins",
    specialty: "Cardiology",
    rating: 4.9,
    experience: 15,
    image: "https://i.pravatar.cc/150?u=1",
    location: "City Central Hospital",
    languages: "English, Spanish"
  },
  {
    name: "Dr. Robert Chen",
    specialty: "Neurology",
    rating: 4.8,
    experience: 12,
    image: "https://i.pravatar.cc/150?u=2",
    location: "Riverside Medical Center",
    languages: "English, Mandarin"
  },
  {
    name: "Dr. Elena Rostova",
    specialty: "Orthopedics",
    rating: 4.7,
    experience: 18,
    image: "https://i.pravatar.cc/150?u=3",
    location: "Green Valley Clinic",
    languages: "English, Russian"
  },
  {
    name: "Dr. Marcus Patel",
    specialty: "Otolaryngology (ENT)",
    rating: 4.6,
    experience: 10,
    image: "https://i.pravatar.cc/150?u=4",
    location: "Lakeside Health Institute",
    languages: "English, Gujarati, Hindi"
  },
  {
    name: "Dr. Sophia Martinez",
    specialty: "Gastroenterology",
    rating: 4.9,
    experience: 14,
    image: "https://i.pravatar.cc/150?u=5",
    location: "Metro Care Hospital",
    languages: "English, Spanish"
  },
  {
    name: "Dr. Oliver Vance",
    specialty: "Dermatology",
    rating: 4.5,
    experience: 8,
    image: "https://i.pravatar.cc/150?u=6",
    location: "City Central Hospital",
    languages: "English"
  },
  {
    name: "Dr. Isabella Gupta",
    specialty: "Ophthalmology",
    rating: 4.8,
    experience: 11,
    image: "https://i.pravatar.cc/150?u=7",
    location: "Riverside Medical Center",
    languages: "English, Hindi"
  },
  {
    name: "Dr. William Reynolds",
    specialty: "Pulmonology",
    rating: 4.7,
    experience: 16,
    image: "https://i.pravatar.cc/150?u=8",
    location: "Green Valley Clinic",
    languages: "English, German"
  },
  {
    name: "Dr. Jane Taylor",
    specialty: "General Medicine",
    rating: 4.6,
    experience: 9,
    image: "https://i.pravatar.cc/150?u=9",
    location: "Lakeside Health Institute",
    languages: "English"
  },
  {
    name: "Dr. Michael Chang",
    specialty: "Cardiology",
    rating: 4.8,
    experience: 20,
    image: "https://i.pravatar.cc/150?u=10",
    location: "Metro Care Hospital",
    languages: "English, Cantonese"
  },
  {
    name: "Dr. Patricia Warren",
    specialty: "Neurology",
    rating: 4.9,
    experience: 22,
    image: "https://i.pravatar.cc/150?u=11",
    location: "City Central Hospital",
    languages: "English"
  },
  {
    name: "Dr. David Kim",
    specialty: "Orthopedics",
    rating: 4.7,
    experience: 13,
    image: "https://i.pravatar.cc/150?u=12",
    location: "Riverside Medical Center",
    languages: "English, Korean"
  },
  {
    name: "Dr. Linda Benson",
    specialty: "Otolaryngology (ENT)",
    rating: 4.5,
    experience: 7,
    image: "https://i.pravatar.cc/150?u=13",
    location: "Green Valley Clinic",
    languages: "English"
  },
  {
    name: "Dr. Richard Diaz",
    specialty: "Gastroenterology",
    rating: 4.6,
    experience: 15,
    image: "https://i.pravatar.cc/150?u=14",
    location: "Lakeside Health Institute",
    languages: "English, Spanish"
  },
  {
    name: "Dr. Jennifer Lodi",
    specialty: "Dermatology",
    rating: 4.8,
    experience: 12,
    image: "https://i.pravatar.cc/150?u=15",
    location: "Metro Care Hospital",
    languages: "English, Italian"
  },
  {
    name: "Dr. Thomas Wright",
    specialty: "Pulmonology",
    rating: 4.7,
    experience: 19,
    image: "https://i.pravatar.cc/150?u=16",
    location: "City Central Hospital",
    languages: "English"
  },
  {
    name: "Dr. Karen Fisher",
    specialty: "General Medicine",
    rating: 4.9,
    experience: 17,
    image: "https://i.pravatar.cc/150?u=17",
    location: "Riverside Medical Center",
    languages: "English"
  },
  {
    name: "Dr. Christopher Lee",
    specialty: "Cardiology",
    rating: 4.6,
    experience: 14,
    image: "https://i.pravatar.cc/150?u=18",
    location: "Green Valley Clinic",
    languages: "English, Mandarin"
  },
  {
    name: "Dr. Nancy Adams",
    specialty: "Neurology",
    rating: 4.7,
    experience: 11,
    image: "https://i.pravatar.cc/150?u=19",
    location: "Lakeside Health Institute",
    languages: "English"
  },
  {
    name: "Dr. Daniel Ross",
    specialty: "Orthopedics",
    rating: 4.8,
    experience: 16,
    image: "https://i.pravatar.cc/150?u=20",
    location: "Metro Care Hospital",
    languages: "English"
  },
  {
    name: "Dr. Lisa Jenkins",
    specialty: "Otolaryngology (ENT)",
    rating: 4.9,
    experience: 13,
    image: "https://i.pravatar.cc/150?u=21",
    location: "City Central Hospital",
    languages: "English"
  },
  {
    name: "Dr. Matthew Vance",
    specialty: "Gastroenterology",
    rating: 4.7,
    experience: 9,
    image: "https://i.pravatar.cc/150?u=22",
    location: "Riverside Medical Center",
    languages: "English"
  },
  {
    name: "Dr. Elena Petrova",
    specialty: "Dermatology",
    rating: 4.6,
    experience: 10,
    image: "https://i.pravatar.cc/150?u=23",
    location: "Green Valley Clinic",
    languages: "English, Russian"
  },
  {
    name: "Dr. James Carter",
    specialty: "Ophthalmology",
    rating: 4.8,
    experience: 15,
    image: "https://i.pravatar.cc/150?u=24",
    location: "Lakeside Health Institute",
    languages: "English"
  },
  {
    name: "Dr. Susan Kelly",
    specialty: "Pulmonology",
    rating: 4.9,
    experience: 21,
    image: "https://i.pravatar.cc/150?u=25",
    location: "Metro Care Hospital",
    languages: "English"
  },
  {
    name: "Dr. Sarah Taylor",
    specialty: "General Medicine",
    rating: 4.7,
    experience: 8,
    image: "https://i.pravatar.cc/150?u=26",
    location: "City Central Hospital",
    languages: "English"
  },
  {
    name: "Dr. Robert Miller",
    specialty: "Cardiology",
    rating: 4.8,
    experience: 17,
    image: "https://i.pravatar.cc/150?u=27",
    location: "Riverside Medical Center",
    languages: "English"
  },
  {
    name: "Dr. William Garcia",
    specialty: "Orthopedics",
    rating: 4.6,
    experience: 12,
    image: "https://i.pravatar.cc/150?u=28",
    location: "Green Valley Clinic",
    languages: "English, Spanish"
  },
  {
    name: "Dr. Mary Smith",
    specialty: "Ophthalmology",
    rating: 4.9,
    experience: 23,
    image: "https://i.pravatar.cc/150?u=29",
    location: "Lakeside Health Institute",
    languages: "English"
  },
  {
    name: "Dr. John Johnson",
    specialty: "General Medicine",
    rating: 4.5,
    experience: 6,
    image: "https://i.pravatar.cc/150?u=30",
    location: "Metro Care Hospital",
    languages: "English"
  }
]

export async function GET(request: NextRequest) {
  try {
    if (!isConfigured) {
      console.warn('GET /api/doctors: Supabase is not configured, returning fallback mock data.')
      return NextResponse.json(MOCK_DOCTORS, {
        headers: { 'x-database-fallback': 'true' }
      })
    }

    // Try to retrieve doctors from database
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Database query error, returning fallback:', error)
      return NextResponse.json(MOCK_DOCTORS, {
        headers: { 'x-database-fallback': 'true', 'x-database-error': error.message }
      })
    }

    // If database is connected but no doctors exist, auto-seed the database!
    if (!data || data.length === 0) {
      console.log('Doctors table is empty. Auto-seeding 30 high-fidelity medical specialists...')
      
      const { data: seededData, error: seedError } = await supabase
        .from('doctors')
        .insert(MOCK_DOCTORS.map(d => ({
          name: d.name,
          specialty: d.specialty,
          rating: d.rating,
          experience: d.experience,
          image: d.image,
          location: d.location,
          languages: d.languages
        })))
        .select('*')

      if (seedError) {
        console.error('Failed to seed doctors table:', seedError)
        return NextResponse.json(MOCK_DOCTORS, {
          headers: { 'x-database-fallback': 'true', 'x-seed-error': seedError.message }
        })
      }

      return NextResponse.json(seededData || MOCK_DOCTORS, {
        headers: { 'x-database-seeded': 'true' }
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Unexpected error in GET /api/doctors:', error)
    return NextResponse.json(MOCK_DOCTORS, {
      headers: { 'x-database-fallback': 'true', 'x-unexpected-error': error.message || 'unknown' }
    })
  }
}
