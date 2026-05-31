import { NextRequest, NextResponse } from 'next/server'
import { createAuthedClient, supabase, isConfigured } from '@/lib/supabase'

// Helper to generate reference numbers like BM-XXXXX
function generateReferenceNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'BM-'
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!isConfigured) {
      console.warn('GET /api/bookings: Supabase is not configured, returning empty local array.')
      return NextResponse.json([])
    }

    // Retrieve user's bookings joined with doctor details
    const authed = createAuthedClient(token)
    const { data, error } = await authed
      .from('bookings')
      .select(`
        *,
        doctors (
          name,
          specialty,
          image,
          location
        )
      `)
      .eq('userId', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error in GET /api/bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, doctorId, date, time, reason, rescheduleRef } = await request.json()
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!userId || !doctorId || !date || !time) {
      return NextResponse.json(
        { error: 'User ID, Doctor ID, Date, and Time are required' },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!isConfigured) {
      console.warn('POST /api/bookings: Supabase is not configured, returning simulated booking.')
      return NextResponse.json({
        id: 'mock-' + Date.now(),
        userId,
        doctorId,
        date,
        time,
        reason,
        status: 'confirmed',
        referenceNumber: generateReferenceNumber(),
        created_at: new Date().toISOString()
      })
    }

    // Resolve doctorId: if it's a numeric mock ID (like index + 1), let's find the real UUID doctor first
    const authed = createAuthedClient(token)
    let resolvedDoctorId = doctorId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorId)

    if (!isUuid) {
      const { data: doctorsData, error: docsError } = await authed.from('doctors').select('id')
      if (docsError) {
        return NextResponse.json({ error: 'Failed to resolve doctor ID' }, { status: 500 })
      }
      // Match by numeric index (e.g. index = doctorId - 1)
      const index = parseInt(doctorId, 10) - 1
      if (doctorsData && doctorsData[index]) {
        resolvedDoctorId = doctorsData[index].id
      } else if (doctorsData && doctorsData[0]) {
        resolvedDoctorId = doctorsData[0].id // fallback to first doctor
      }
    }

    // Generate unique reference number
    let referenceNumber = generateReferenceNumber()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 5) {
      const { data: existing } = await authed
        .from('bookings')
        .select('id')
        .eq('referenceNumber', referenceNumber)
        .maybeSingle()

      if (!existing) {
        isUnique = true
      } else {
        referenceNumber = generateReferenceNumber()
        attempts++
      }
    }

    // If rescheduling, cancel the old booking!
    if (rescheduleRef) {
      await authed
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('referenceNumber', rescheduleRef)
    }

    // Insert new booking
    const { data: bookingData, error: bookingError } = await authed
      .from('bookings')
      .insert({
        userId,
        doctorId: resolvedDoctorId,
        date,
        time,
        reason: reason || null,
        status: 'confirmed',
        referenceNumber
      })
      .select(`
        *,
        doctors (
          name,
          specialty,
          image,
          location
        )
      `)
      .single()

    if (bookingError) {
      console.error('Booking insertion error:', bookingError)
      return NextResponse.json({ error: bookingError.message }, { status: 500 })
    }

    return NextResponse.json(bookingData)
  } catch (error: any) {
    console.error('Error in POST /api/bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
