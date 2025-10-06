import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const surface = searchParams.get('surface')
    const indoor = searchParams.get('indoor')
    const city = searchParams.get('city')
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000')

    // Build query
    let query = supabase
      .from('pitches')
      .select(`
        id,
        name,
        surface,
        indoor,
        price_per_hour,
        size,
        description,
        images,
        location_id,
        locations (
          id,
          name,
          address,
          city,
          postal_code,
          latitude,
          longitude,
          description,
          images
        )
      `)
      .eq('is_active', true)

    // Apply filters
    if (surface) {
      query = query.eq('surface', surface)
    }

    if (indoor === 'true') {
      query = query.eq('indoor', true)
    } else if (indoor === 'false') {
      query = query.eq('indoor', false)
    }

    if (minPrice > 0 || maxPrice < 1000) {
      query = query
        .gte('price_per_hour', minPrice)
        .lte('price_per_hour', maxPrice)
    }

    const { data: pitches, error: pitchesError } = await query

    if (pitchesError) {
      console.error('Error fetching pitches:', pitchesError)
      throw pitchesError
    }

    // Filter by city if specified
    let filteredPitches = pitches || []
    if (city) {
      filteredPitches = filteredPitches.filter((pitch: any) =>
        pitch.locations?.city?.toLowerCase().includes(city.toLowerCase())
      )
    }

    // Group pitches by location
    const locationsMap = new Map()
    filteredPitches.forEach((pitch: any) => {
      const location = pitch.locations
      if (!location) return

      if (!locationsMap.has(location.id)) {
        locationsMap.set(location.id, {
          ...location,
          pitches: [],
        })
      }

      locationsMap.get(location.id).pitches.push({
        id: pitch.id,
        name: pitch.name,
        surface: pitch.surface,
        indoor: pitch.indoor,
        price_per_hour: pitch.price_per_hour,
        size: pitch.size,
        description: pitch.description,
        images: pitch.images,
      })
    })

    const locations = Array.from(locationsMap.values())

    return NextResponse.json({
      locations,
      total: locations.length,
    }, { status: 200 })
  } catch (error) {
    console.error('GET /api/search error:', error)
    return NextResponse.json(
      { error: 'Failed to search pitches' },
      { status: 500 }
    )
  }
}
