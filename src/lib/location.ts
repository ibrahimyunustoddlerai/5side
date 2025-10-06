export interface LocationCoordinates {
  lat: number
  lng: number
}

export interface LocationInfo {
  coordinates: LocationCoordinates
  address: string
  city: string
  country: string
}

// Get user's current location using browser geolocation
export function getCurrentLocation(): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('User denied the request for geolocation'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable'))
            break
          case error.TIMEOUT:
            reject(new Error('The request to get user location timed out'))
            break
          default:
            reject(new Error('An unknown error occurred while retrieving location'))
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  })
}

// Fallback to IP-based location (approximate)
export async function getLocationFromIP(): Promise<LocationCoordinates> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()

    if (data.latitude && data.longitude) {
      return {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude),
      }
    }

    // Default to London if IP location fails
    return { lat: 51.5074, lng: -0.1278 }
  } catch (error) {
    console.error('IP location failed:', error)
    // Default to London
    return { lat: 51.5074, lng: -0.1278 }
  }
}

// Get user location with fallback chain
export async function getUserLocation(): Promise<LocationCoordinates> {
  try {
    // Try browser geolocation first
    return await getCurrentLocation()
  } catch (error) {
    console.warn('Geolocation failed, falling back to IP location:', error)

    try {
      // Fallback to IP-based location
      return await getLocationFromIP()
    } catch (ipError) {
      console.warn('IP location failed, using default location:', ipError)
      // Final fallback to London
      return { lat: 51.5074, lng: -0.1278 }
    }
  }
}

// Search for a location using Google Geocoding API
export async function searchLocation(query: string): Promise<LocationCoordinates | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Fallback to hardcoded coordinates if no API key
  if (!apiKey || apiKey === 'your_google_maps_api_key') {
    const cityCoordinates: Record<string, LocationCoordinates> = {
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
    }

    const normalizedQuery = query.toLowerCase().trim()
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (normalizedQuery.includes(city)) {
        return coords
      }
    }
    return null
  }

  try {
    // Use Google Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:GB&key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng,
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Get place predictions using Google Places Autocomplete API
export async function getPlacePredictions(input: string): Promise<Array<{ description: string; place_id: string }>> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey || apiKey === 'your_google_maps_api_key' || input.length < 2) {
    return []
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:gb&types=(cities)&key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.predictions) {
      return data.predictions.map((p: { description: string; place_id: string }) => ({
        description: p.description,
        place_id: p.place_id,
      }))
    }

    return []
  } catch (error) {
    console.error('Places Autocomplete error:', error)
    return []
  }
}

// Calculate distance between two coordinates (in miles)
export function calculateDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLng = toRadians(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}