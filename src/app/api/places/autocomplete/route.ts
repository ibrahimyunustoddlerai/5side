import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Return empty if no valid API key
  if (!apiKey || apiKey === 'your_google_maps_api_key') {
    // Return fallback UK cities for autocomplete
    const ukCities = [
      'London, UK',
      'Manchester, UK',
      'Birmingham, UK',
      'Leeds, UK',
      'Glasgow, UK',
      'Liverpool, UK',
      'Bristol, UK',
      'Edinburgh, UK',
      'Cardiff, UK',
      'Newcastle, UK',
      'Sheffield, UK',
      'Leicester, UK',
      'Coventry, UK',
      'Bradford, UK',
      'Nottingham, UK',
      'Brighton, UK',
      'Southampton, UK',
      'Reading, UK',
      'Oxford, UK',
      'Cambridge, UK',
    ]

    const filtered = ukCities.filter((city) =>
      city.toLowerCase().includes(input.toLowerCase())
    )

    return NextResponse.json({
      predictions: filtered.map((city, index) => ({
        description: city,
        place_id: `fallback_${index}`,
      })),
    })
  }

  try {
    // Use the NEW Places API (Text Search)
    const url = `https://places.googleapis.com/v1/places:autocomplete`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: input,
        locationBias: {
          circle: {
            center: {
              latitude: 54.0,
              longitude: -2.0,
            },
            radius: 50000.0, // 50km radius (max allowed)
          },
        },
        includedRegionCodes: ['GB'],
      }),
    })

    const data = await response.json()

    if (data.suggestions) {
      const predictions = data.suggestions.map((s: any) => ({
        description: s.placePrediction?.text?.text || s.placePrediction?.structuredFormat?.mainText?.text || '',
        place_id: s.placePrediction?.placeId || '',
      }))
      return NextResponse.json({ predictions })
    }

    if (data.error) {
      console.error('❌ Google Places API error:', data.error.message)
    }

    return NextResponse.json({ predictions: [] })
  } catch (error) {
    console.error('❌ Places Autocomplete API error:', error)
    return NextResponse.json({ predictions: [] }, { status: 500 })
  }
}
