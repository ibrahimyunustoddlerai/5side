import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch schedule for a pitch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pitchId = params.id

    // Fetch schedules for this pitch
    const { data: schedules, error: schedulesError } = await supabase
      .from('pitch_schedules')
      .select('*')
      .eq('pitch_id', pitchId)
      .order('day_of_week', { ascending: true })

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError)
      throw schedulesError
    }

    return NextResponse.json({ schedules: schedules || [] }, { status: 200 })
  } catch (error) {
    console.error('GET /api/manager/pitch/[id]/schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

// POST - Create or update schedule for a pitch
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pitchId = params.id
    const body = await request.json()
    const { schedules } = body // Array of schedule objects

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: 'Schedules array is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this pitch
    const { data: pitch, error: pitchError } = await supabase
      .from('pitches')
      .select('id, location_id, locations(organization_id)')
      .eq('id', pitchId)
      .single()

    if (pitchError || !pitch) {
      return NextResponse.json(
        { error: 'Pitch not found' },
        { status: 404 }
      )
    }

    const organizationId = (pitch.locations as { organization_id?: string })?.organization_id

    // Check if user has access to this organization
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this pitch' },
        { status: 403 }
      )
    }

    // Delete existing schedules for this pitch
    await supabase
      .from('pitch_schedules')
      .delete()
      .eq('pitch_id', pitchId)

    // Insert new schedules
    const schedulesToInsert = schedules.map((schedule) => ({
      pitch_id: pitchId,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      valid_from: schedule.valid_from || null,
      valid_until: schedule.valid_until || null,
    }))

    const { data: newSchedules, error: insertError } = await supabase
      .from('pitch_schedules')
      .insert(schedulesToInsert)
      .select()

    if (insertError) {
      console.error('Error creating schedules:', insertError)
      throw insertError
    }

    return NextResponse.json({ schedules: newSchedules }, { status: 201 })
  } catch (error) {
    console.error('POST /api/manager/pitch/[id]/schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to save schedules' },
      { status: 500 }
    )
  }
}
