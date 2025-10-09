import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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
      filteredPitches = filteredPitches.filter((pitch: unknown) => {
        const p = pitch as { locations?: unknown[] }
        const locations = p.locations as unknown as { city?: string }
        return locations?.city?.toLowerCase().includes(city.toLowerCase())
      })
    }

    // Transform pitches to include location data for the UI
    const pitchResults = filteredPitches.map((pitch: unknown) => {
      const p = pitch as {
        id: string;
        name: string;
        surface: string;
        indoor: boolean;
        price_per_hour: number;
        size: string;
        description: string;
        images: string[];
        locations?: {
          id: string;
          name: string;
          address: string;
          city: string;
          latitude: number;
          longitude: number;
          images: string[];
        };
      }

      return {
        id: p.id,
        name: p.name,
        locationName: p.locations?.name || 'Unknown Location',
        address: p.locations?.address || '',
        distance: 0, // TODO: Calculate actual distance based on lat/lng
        pricePerHour: p.price_per_hour,
        surface: p.surface,
        indoor: p.indoor,
        images: p.images || [],
        rating: 4.5, // TODO: Implement actual ratings
        reviewCount: 0, // TODO: Implement actual review count
        availableToday: true, // TODO: Check actual availability
      }
    })

    return NextResponse.json({
      pitches: pitchResults,
      total: pitchResults.length,
      page: 1,
      limit: pitchResults.length,
    }, { status: 200 })
  } catch (error) {
    console.error('GET /api/search error:', error)
    return NextResponse.json(
      { error: 'Failed to search pitches' },
      { status: 500 }
    )
  }
}
