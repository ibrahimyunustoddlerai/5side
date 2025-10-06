import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      pitchId,
      startTime,
      endTime,
      organizerName,
      organizerEmail,
      notes,
    } = body

    // Validation
    if (!pitchId || !startTime || !endTime || !organizerName || !organizerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get pitch details including price
    const { data: pitch, error: pitchError } = await supabase
      .from('pitches')
      .select('id, price_per_hour, is_active')
      .eq('id', pitchId)
      .single()

    if (pitchError || !pitch) {
      return NextResponse.json(
        { error: 'Pitch not found' },
        { status: 404 }
      )
    }

    if (!pitch.is_active) {
      return NextResponse.json(
        { error: 'This pitch is not available for booking' },
        { status: 400 }
      )
    }

    // Check for overlapping bookings
    const { data: overlapping, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('pitch_id', pitchId)
      .in('status', ['PENDING', 'CONFIRMED'])
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)
      .limit(1)

    if (overlapError) {
      console.error('Error checking overlapping bookings:', overlapError)
      throw overlapError
    }

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      )
    }

    // Calculate duration in hours
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    const totalAmountPence = Math.round(pitch.price_per_hour * durationHours)

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        pitch_id: pitchId,
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
        status: 'PENDING',
        source: 'ONLINE',
        total_amount_pence: totalAmountPence,
        currency: 'gbp',
        notes: notes || null,
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      throw bookingError
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('POST /api/bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

// GET - Fetch bookings for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        pitches (
          id,
          name,
          surface,
          indoor,
          price_per_hour,
          locations (
            id,
            name,
            address,
            city
          )
        )
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error: bookingsError } = await query

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw bookingsError
    }

    return NextResponse.json({ bookings: bookings || [] }, { status: 200 })
  } catch (error) {
    console.error('GET /api/bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
