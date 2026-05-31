import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Helper to check if URL is a valid HTTP/HTTPS format
const isValidUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://')
}

export const isConfigured = isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key'

if (!isConfigured) {
  console.warn('Missing or invalid Supabase environment variables. Database features will not work.')
}

const finalUrl = isConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co'
const finalKey = isConfigured ? supabaseAnonKey : 'dummy-anon-key'

export const supabase = createClient(finalUrl, finalKey)

// Create a client scoped to a user session for RLS-protected queries.
export function createAuthedClient(accessToken: string) {
  return createClient(finalUrl, finalKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export type Database = {
  public: {
    Tables: {
      doctors: {
        Row: {
          id: string
          name: string
          specialty: string
          rating: number | null
          experience: number | null
          image: string | null
          location: string | null
          languages: string | null
          created_at: string
        }
        Insert: {
          name: string
          specialty: string
          rating?: number | null
          experience?: number | null
          image?: string | null
          location?: string | null
          languages?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          firstName: string | null
          lastName: string | null
          phone: string | null
          created_at: string
        }
      }
      bookings: {
        Row: {
          id: string
          userId: string
          doctorId: string
          date: string
          time: string
          reason: string | null
          status: string
          referenceNumber: string
          created_at: string
        }
      }
    }
  }
}
