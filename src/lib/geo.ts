export interface Coordinates {
  lat: number
  lng: number
}

export interface GeocodingResult {
  address: string
  coordinates: Coordinates
  city?: string
  postalCode?: string
  country?: string
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!process.env.GOOGLE_MAPS_SERVER_API_KEY) {
    throw new Error('Google Maps Server API key not configured')
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.GOOGLE_MAPS_SERVER_API_KEY}`
    )

    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location

      // Extract address components
      const addressComponents = result.address_components
      let city = ''
      let postalCode = ''
      let country = ''

      for (const component of addressComponents) {
        if (component.types.includes('locality')) {
          city = component.long_name
        } else if (component.types.includes('postal_code')) {
          postalCode = component.long_name
        } else if (component.types.includes('country')) {
          country = component.long_name
        }
      }

      return {
        address: result.formatted_address,
        coordinates: {
          lat: location.lat,
          lng: location.lng,
        },
        city,
        postalCode,
        country,
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}