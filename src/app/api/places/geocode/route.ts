import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Fallback to hardcoded coordinates if no valid API key
  if (!apiKey || apiKey === 'your_google_maps_api_key') {
    console.log('⚠️  No valid API key, using fallback coordinates')
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'london': { lat: 51.5074, lng: -0.1278 },
      'manchester': { lat: 53.4808, lng: -2.2426 },
      'birmingham': { lat: 52.4862, lng: -1.8904 },
      'leeds': { lat: 53.8008, lng: -1.5491 },
      'glasgow': { lat: 55.8642, lng: -4.2518 },
      'liverpool': { lat: 53.4084, lng: -2.9916 },
      'bristol': { lat: 51.4545, lng: -2.5879 },
      'edinburgh': { lat: 55.9533, lng: -3.1883 },
      'cardiff': { lat: 51.4816, lng: -3.1791 },
      'newcastle': { lat: 54.9783, lng: -1.6178 },
      'dewsbury': { lat: 53.6914, lng: -1.6331 },
      'sheffield': { lat: 53.3811, lng: -1.4701 },
      'leicester': { lat: 52.6369, lng: -1.1398 },
      'coventry': { lat: 52.4068, lng: -1.5197 },
      'bradford': { lat: 53.7960, lng: -1.7594 },
      'nottingham': { lat: 52.9548, lng: -1.1581 },
      'brighton': { lat: 50.8225, lng: -0.1372 },
      'southampton': { lat: 50.9097, lng: -1.4044 },
      'reading': { lat: 51.4543, lng: -0.9781 },
      'oxford': { lat: 51.7520, lng: -1.2577 },
      'cambridge': { lat: 52.2053, lng: 0.1218 },
    }

    const normalizedQuery = address.toLowerCase().trim()
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (normalizedQuery.includes(city)) {
        return NextResponse.json({ location: coords, status: 'OK' })
      }
    }

    return NextResponse.json({ error: 'Location not found', status: 'NOT_FOUND' }, { status: 404 })
  }

  try {
    // Use Google Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&components=country:GB&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return NextResponse.json({
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        formatted_address: data.results[0].formatted_address,
        status: 'OK',
      })
    }

    console.error('Geocoding failed with status:', data.status, 'Error:', data.error_message)
    return NextResponse.json(
      { error: data.error_message || 'Location not found', status: data.status },
      { status: 404 }
    )
  } catch (error) {
    console.error('Geocoding API error:', error)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}
