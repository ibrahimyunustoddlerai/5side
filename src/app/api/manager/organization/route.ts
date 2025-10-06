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
    const { name, email, phone, description } = body

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 }
      )
    }

    // Create organization using Supabase
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        email,
        phone,
        description: description || null,
      })
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      throw orgError
    }

    // Link user to organization as OWNER
    const { error: linkError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: user.id,
        organization_id: organization.id,
        role: 'OWNER',
      })

    if (linkError) {
      console.error('User-organization link error:', linkError)
      throw linkError
    }

    return NextResponse.json({ organization }, { status: 201 })
  } catch (error) {
    console.error('Organization creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
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

    // Get user's organizations with locations using Supabase
    const { data: userOrganizations, error: fetchError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organization:organizations (
          id,
          name,
          email,
          phone,
          description,
          created_at,
          locations (
            id,
            name
          )
        )
      `)
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Fetch organizations error:', fetchError)
      throw fetchError
    }

    const organizations = userOrganizations?.map((uo: any) => ({
      ...uo.organization,
      role: uo.role,
    })) || []

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('Fetch organizations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}
