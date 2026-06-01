import { NextRequest, NextResponse } from 'next/server'
import { createAuthedClient, supabase, isConfigured } from '@/lib/supabase'

const isValidJwt = (token: string) => token.split('.').length === 3

type ColumnMap = {
  userId: string
  doctorId: string
  referenceNumber: string
}

const COLUMN_MAPS: ColumnMap[] = [
  { userId: 'user_id', doctorId: 'doctor_id', referenceNumber: 'reference_number' },
  { userId: 'userId', doctorId: 'doctorId', referenceNumber: 'referenceNumber' },
  { userId: 'userid', doctorId: 'doctorid', referenceNumber: 'referencenumber' },
]

const isMissingColumnError = (error: any) => {
  const message = String(error?.message || '')
  return (
    error?.code === '42703' ||
    /schema cache/i.test(message) ||
    /column .* does not exist/i.test(message) ||
    /couldn't find.*column/i.test(message)
  )
}

const normalizeBookingRow = (row: any, map: ColumnMap) => {
  if (!row) return row
  const normalized = { ...row }
  const userIdValue = row[map.userId] ?? row.userId
  const doctorIdValue = row[map.doctorId] ?? row.doctorId
  const refValue = row[map.referenceNumber] ?? row.referenceNumber

  if (map.userId !== 'userId') {
    delete normalized[map.userId]
  }
  if (map.doctorId !== 'doctorId') {
    delete normalized[map.doctorId]
  }
  if (map.referenceNumber !== 'referenceNumber') {
    delete normalized[map.referenceNumber]
  }

  return {
    ...normalized,
    userId: userIdValue,
    doctorId: doctorIdValue,
    referenceNumber: refValue,
  }
}

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

    if (!token || !isValidJwt(token)) {
      return NextResponse.json({ error: 'Invalid session. Please sign in again.' }, { status: 401 })
    }

    if (!isConfigured) {
      console.warn('GET /api/bookings: Supabase is not configured, returning empty local array.')
      return NextResponse.json([])
    }

    // Retrieve user's bookings joined with doctor details
    const authed = createAuthedClient(token)
    let lastError: any = null

    for (const map of COLUMN_MAPS) {
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
        .eq(map.userId, userId)
        .order('created_at', { ascending: false })

      if (!error) {
        const normalized = (data || []).map((row) => normalizeBookingRow(row, map))
        return NextResponse.json(normalized)
      }

      lastError = error
      if (!isMissingColumnError(error)) {
        console.error('Error fetching bookings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    console.error('Error fetching bookings:', lastError)
    return NextResponse.json({ error: lastError?.message || 'Failed to fetch bookings' }, { status: 500 })
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

    if (!token || !isValidJwt(token)) {
      return NextResponse.json({ error: 'Invalid session. Please sign in again.' }, { status: 401 })
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

    let lastError: any = null

    for (const map of COLUMN_MAPS) {
      const referenceColumn = map.referenceNumber
      // Generate unique reference number
      let referenceNumber = generateReferenceNumber()
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 5) {
        const { data: existing, error: existingError } = await authed
          .from('bookings')
          .select('id')
          .eq(referenceColumn, referenceNumber)
          .maybeSingle()

        if (existingError) {
          lastError = existingError
          if (isMissingColumnError(existingError)) {
            break
          }
          console.error('Booking uniqueness check error:', existingError)
          return NextResponse.json({ error: existingError.message }, { status: 500 })
        }

        if (!existing) {
          isUnique = true
        } else {
          referenceNumber = generateReferenceNumber()
          attempts++
        }
      }

      if (!isUnique && lastError && isMissingColumnError(lastError)) {
        continue
      }

      // If rescheduling, cancel the old booking!
      if (rescheduleRef) {
        const { error: cancelError } = await authed
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq(referenceColumn, rescheduleRef)

        if (cancelError) {
          lastError = cancelError
          if (isMissingColumnError(cancelError)) {
            continue
          }
          return NextResponse.json({ error: cancelError.message }, { status: 500 })
        }
      }

      // Insert new booking
      const insertPayload: Record<string, any> = {
        [map.userId]: userId,
        [map.doctorId]: resolvedDoctorId,
        date,
        time,
        reason: reason || null,
        status: 'confirmed',
        [referenceColumn]: referenceNumber,
      }

      const { data: bookingData, error: bookingError } = await authed
        .from('bookings')
        .insert(insertPayload)
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
        lastError = bookingError
        if (isMissingColumnError(bookingError)) {
          continue
        }
        console.error('Booking insertion error:', bookingError)
        return NextResponse.json({ error: bookingError.message }, { status: 500 })
      }

      return NextResponse.json(normalizeBookingRow(bookingData, map))
    }

    console.error('Booking insertion error:', lastError)
    return NextResponse.json({ error: lastError?.message || 'Failed to create booking' }, { status: 500 })
  } catch (error: any) {
    console.error('Error in POST /api/bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
