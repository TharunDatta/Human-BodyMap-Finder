import { NextRequest, NextResponse } from 'next/server'
import { supabase, isConfigured } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 })
    }

    if (!isConfigured) {
      console.warn('GET /api/doctors/[id]: Supabase is not configured, returning local mock error.')
      return NextResponse.json({ error: 'Database disconnected' }, { status: 503 })
    }

    // Try to retrieve doctor by ID from Supabase
    // Note: Since ID could be a UUID, we check if it is a valid UUID, otherwise it might be a temporary mock numeric ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    if (!isUuid) {
      // If it is a mock number (like from static list 1-30), let's fetch all doctors and find by index or name
      const { data, error } = await supabase.from('doctors').select('*')
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      // Try to match by index or ID string
      const doc = data?.find((d, idx) => (idx + 1).toString() === id || d.id === id)
      if (!doc) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
      }
      return NextResponse.json(doc)
    }

    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in GET /api/doctors/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
