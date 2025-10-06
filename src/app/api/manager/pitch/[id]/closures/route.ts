import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch closures for a pitch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const pitchId = params.id

    const { data: closures, error: closuresError } = await supabase
      .from('pitch_closures')
      .select('*')
      .eq('pitch_id', pitchId)
      .order('start_date', { ascending: true })

    if (closuresError) {
      console.error('Error fetching closures:', closuresError)
      throw closuresError
    }

    return NextResponse.json({ closures: closures || [] }, { status: 200 })
  } catch (error) {
    console.error('GET /api/manager/pitch/[id]/closures error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch closures' },
      { status: 500 }
    )
  }
}

// POST - Create a new closure
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
    const { title, description, startDate, endDate } = body

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Title, start date, and end date are required' },
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

    // Create closure
    const { data: closure, error: closureError } = await supabase
      .from('pitch_closures')
      .insert({
        pitch_id: pitchId,
        title,
        description: description || null,
        start_date: startDate,
        end_date: endDate,
      })
      .select()
      .single()

    if (closureError) {
      console.error('Error creating closure:', closureError)
      throw closureError
    }

    return NextResponse.json({ closure }, { status: 201 })
  } catch (error) {
    console.error('POST /api/manager/pitch/[id]/closures error:', error)
    return NextResponse.json(
      { error: 'Failed to create closure' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a closure
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const closureId = searchParams.get('closureId')

    if (!closureId) {
      return NextResponse.json(
        { error: 'Closure ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this closure
    const { data: closure, error: closureError } = await supabase
      .from('pitch_closures')
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
      .eq('id', closureId)
      .single()

    if (closureError || !closure) {
      return NextResponse.json(
        { error: 'Closure not found' },
        { status: 404 }
      )
    }

    const organizationId = (closure.pitches as { locations?: { organization_id?: string } })?.locations?.organization_id

    // Check if user has access to this organization
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this closure' },
        { status: 403 }
      )
    }

    // Delete closure
    const { error: deleteError } = await supabase
      .from('pitch_closures')
      .delete()
      .eq('id', closureId)

    if (deleteError) {
      console.error('Error deleting closure:', deleteError)
      throw deleteError
    }

    return NextResponse.json(
      { message: 'Closure deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/manager/pitch/[id]/closures error:', error)
    return NextResponse.json(
      { error: 'Failed to delete closure' },
      { status: 500 }
    )
  }
}
