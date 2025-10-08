import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch all bookings for manager's venues
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const pitchId = searchParams.get('pitchId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get user's organizations
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)

    if (userOrgsError || !userOrgs || userOrgs.length === 0) {
      return NextResponse.json({ bookings: [] }, { status: 200 })
    }

    const organizationIds = userOrgs.map((uo) => uo.organization_id)

    // Build query
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
          location_id,
          locations (
            id,
            name,
            address,
            city,
            organization_id
          )
        )
      `)
      .order('start_time', { ascending: false })

    // Filter by venue if specified
    if (venueId) {
      query = query.eq('pitches.location_id', venueId)
    }

    // Filter by pitch if specified
    if (pitchId) {
      query = query.eq('pitch_id', pitchId)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by date range if specified
    if (startDate) {
      query = query.gte('start_time', startDate)
    }
    if (endDate) {
      query = query.lte('end_time', endDate)
    }

    const { data: bookings, error: bookingsError } = await query

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw bookingsError
    }

    // Filter to only include bookings for venues in user's organizations
    const filteredBookings = bookings?.filter((booking: { pitches?: { locations?: { organization_id?: string } } }) => {
      const orgId = booking.pitches?.locations?.organization_id
      return orgId && organizationIds.includes(orgId)
    }) || []

    return NextResponse.json({ bookings: filteredBookings }, { status: 200 })
  } catch (error) {
    console.error('GET /api/manager/bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// PUT - Update booking status (confirm, cancel, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, status, cancellationReason } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Booking ID and status are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        pitch_id,
        pitches (
          id,
          location_id,
          locations (
            organization_id
          )
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const organizationId = (booking.pitches as { locations?: { organization_id?: string } })?.locations?.organization_id

    // Check if user has access to this organization
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this booking' },
        { status: 403 }
      )
    }

    // Update booking
    const updateData: { status: string; confirmed_at?: string; cancelled_at?: string; cancellation_reason?: string } = { status }

    if (status === 'CONFIRMED') {
      updateData.confirmed_at = new Date().toISOString()
    }

    if (status === 'CANCELLED') {
      updateData.cancelled_at = new Date().toISOString()
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason
      }
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating booking:', updateError)
      throw updateError
    }

    return NextResponse.json({ booking: updatedBooking }, { status: 200 })
  } catch (error) {
    console.error('PUT /api/manager/bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}
