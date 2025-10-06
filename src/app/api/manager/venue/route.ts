import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      organizationId,
      name,
      address,
      city,
      postalCode,
      latitude,
      longitude,
      phone,
      email,
      website,
      description,
    } = body

    // Validate required fields
    if (!organizationId || !name || !address || !city || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access to this organization using Supabase
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: 'You do not have permission to add venues to this organization' },
        { status: 403 }
      )
    }

    // Create venue/location using Supabase
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        organization_id: organizationId,
        name,
        address,
        city,
        postal_code: postalCode || null,
        country: 'UK',
        latitude,
        longitude,
        phone: phone || null,
        email: email || null,
        website: website || null,
        description: description || null,
        amenities: [],
        images: [],
      })
      .select()
      .single()

    if (locationError) {
      console.error('Location creation error:', locationError)
      throw locationError
    }

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('Venue creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create venue' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this organization using Supabase
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: 'You do not have permission to view venues for this organization' },
        { status: 403 }
      )
    }

    // Get all venues for this organization using Supabase
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select(`
        *,
        pitches (
          id,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (locationsError) {
      console.error('Fetch locations error:', locationsError)
      throw locationsError
    }

    return NextResponse.json({ locations: locations || [] })
  } catch (error) {
    console.error('Fetch venues error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    )
  }
}
