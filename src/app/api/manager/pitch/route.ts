import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch pitches for a location
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 })
    }

    // Verify user has access to this location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, organization_id')
      .eq('id', locationId)
      .single()

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this organization
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', location.organization_id)
      .single()

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: 'You do not have permission to access this location' },
        { status: 403 }
      )
    }

    // Fetch pitches for this location
    const { data: pitches, error: pitchesError } = await supabase
      .from('pitches')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (pitchesError) {
      console.error('Error fetching pitches:', pitchesError)
      throw pitchesError
    }

    return NextResponse.json({ pitches }, { status: 200 })
  } catch (error) {
    console.error('GET /api/manager/pitch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pitches' },
      { status: 500 }
    )
  }
}

// POST - Create a new pitch
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      locationId,
      name,
      surface,
      indoor,
      size,
      pricePerHour,
      length,
      width,
      description,
      amenities,
      images,
    } = body

    // Validation
    if (!locationId || !name || !surface || indoor === undefined || !pricePerHour) {
      return NextResponse.json(
        { error: 'Missing required fields: locationId, name, surface, indoor, pricePerHour' },
        { status: 400 }
      )
    }

    // Verify user has access to this location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, organization_id')
      .eq('id', locationId)
      .single()

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this organization
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', location.organization_id)
      .single()

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: 'You do not have permission to access this location' },
        { status: 403 }
      )
    }

    // Create pitch
    const { data: pitch, error: pitchError } = await supabase
      .from('pitches')
      .insert({
        location_id: locationId,
        name,
        surface,
        indoor,
        size: size || null,
        price_per_hour: pricePerHour,
        length: length || null,
        width: width || null,
        description: description || null,
        amenities: amenities || [],
        images: images || [],
        is_active: true,
      })
      .select()
      .single()

    if (pitchError) {
      console.error('Error creating pitch:', pitchError)
      throw pitchError
    }

    return NextResponse.json({ pitch }, { status: 201 })
  } catch (error) {
    console.error('POST /api/manager/pitch error:', error)
    return NextResponse.json(
      { error: 'Failed to create pitch' },
      { status: 500 }
    )
  }
}

// PUT - Update a pitch
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      pitchId,
      name,
      surface,
      indoor,
      size,
      pricePerHour,
      length,
      width,
      description,
      amenities,
      images,
      isActive,
    } = body

    if (!pitchId) {
      return NextResponse.json(
        { error: 'Pitch ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this pitch
    const { data: pitch, error: pitchError } = await supabase
      .from('pitches')
      .select(`
        id,
        location_id,
        locations!inner(
          organization_id,
          user_organizations!inner(user_id, role)
        )
      `)
      .eq('id', pitchId)
      .eq('locations.user_organizations.user_id', user.id)
      .single()

    if (pitchError || !pitch) {
      return NextResponse.json(
        { error: 'You do not have permission to update this pitch' },
        { status: 403 }
      )
    }

    // Update pitch
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (surface !== undefined) updateData.surface = surface
    if (indoor !== undefined) updateData.indoor = indoor
    if (size !== undefined) updateData.size = size
    if (pricePerHour !== undefined) updateData.price_per_hour = pricePerHour
    if (length !== undefined) updateData.length = length
    if (width !== undefined) updateData.width = width
    if (description !== undefined) updateData.description = description
    if (amenities !== undefined) updateData.amenities = amenities
    if (images !== undefined) updateData.images = images
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: updatedPitch, error: updateError } = await supabase
      .from('pitches')
      .update(updateData)
      .eq('id', pitchId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating pitch:', updateError)
      throw updateError
    }

    return NextResponse.json({ pitch: updatedPitch }, { status: 200 })
  } catch (error) {
    console.error('PUT /api/manager/pitch error:', error)
    return NextResponse.json(
      { error: 'Failed to update pitch' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete a pitch (set is_active to false)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pitchId = searchParams.get('pitchId')

    if (!pitchId) {
      return NextResponse.json(
        { error: 'Pitch ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this pitch
    const { data: pitch, error: pitchError } = await supabase
      .from('pitches')
      .select(`
        id,
        location_id,
        locations!inner(
          organization_id,
          user_organizations!inner(user_id, role)
        )
      `)
      .eq('id', pitchId)
      .eq('locations.user_organizations.user_id', user.id)
      .single()

    if (pitchError || !pitch) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this pitch' },
        { status: 403 }
      )
    }

    // Soft delete - set is_active to false
    const { error: deleteError } = await supabase
      .from('pitches')
      .update({ is_active: false })
      .eq('id', pitchId)

    if (deleteError) {
      console.error('Error deleting pitch:', deleteError)
      throw deleteError
    }

    return NextResponse.json(
      { message: 'Pitch deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/manager/pitch error:', error)
    return NextResponse.json(
      { error: 'Failed to delete pitch' },
      { status: 500 }
    )
  }
}
