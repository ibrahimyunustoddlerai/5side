'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Pitch {
  id: string
  name: string
  surface: string
  indoor: boolean
  price_per_hour: number
  size: string | null
  description: string | null
  images: string[]
}

interface Location {
  id: string
  name: string
  address: string
  city: string
  postal_code: string | null
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
}

export default function VenueDetailPage({ params }: { params: { id: string } }) {
  const [location, setLocation] = useState<Location | null>(null)
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVenueData = async () => {
    try {
      // Fetch location details
      const response = await fetch(`/api/search`)
      const data = await response.json()

      if (response.ok) {
        const venue = data.locations?.find((loc: { id: string }) => loc.id === params.id)
        if (venue) {
          setLocation({
            id: venue.id,
            name: venue.name,
            address: venue.address,
            city: venue.city,
            postal_code: venue.postal_code,
            description: venue.description,
            phone: venue.phone,
            email: venue.email,
            website: venue.website,
          })
          setPitches(venue.pitches || [])
        }
      }
    } catch (error) {
      console.error('Error fetching venue data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVenueData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const getSurfaceLabel = (surface: string) => {
    const labels: Record<string, string> = {
      GRASS: 'Natural Grass',
      ARTIFICIAL_GRASS: 'Artificial Grass',
      ASTROTURF: 'Astroturf',
      CONCRETE: 'Concrete',
      INDOOR_COURT: 'Indoor Court',
    }
    return labels[surface] || surface
  }

  const getSizeLabel = (size: string | null) => {
    if (!size) return null
    const labels: Record<string, string> = {
      '5_ASIDE': '5-a-Side',
      '7_ASIDE': '7-a-Side',
      '11_ASIDE': '11-a-Side',
      FUTSAL: 'Futsal',
    }
    return labels[size] || size
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venue...</p>
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/search" className="flex items-center text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Search
            </Link>
            <Link href="/" className="text-2xl font-bold text-green-600">5-a-Side</Link>
          </div>
        </div>
      </header>

      {/* Venue Hero */}
      <div className="bg-gradient-to-br from-green-400 to-blue-500 h-64"></div>

      {/* Venue Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{location.name}</h1>
          <p className="text-lg text-gray-600 mb-4">
            {location.address}, {location.city} {location.postal_code}
          </p>

          {location.description && (
            <p className="text-gray-700 mb-6">{location.description}</p>
          )}

          <div className="flex flex-wrap gap-6 text-sm">
            {location.phone && (
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {location.phone}
              </div>
            )}
            {location.email && (
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {location.email}
              </div>
            )}
            {location.website && (
              <a href={location.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-green-600 hover:text-green-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Visit Website
              </a>
            )}
          </div>
        </div>

        {/* Pitches */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Pitches</h2>

          {pitches.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No pitches available at this venue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pitches.map((pitch) => (
                <div key={pitch.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500"></div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pitch.name}</h3>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pitch.indoor ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {pitch.indoor ? 'Indoor' : 'Outdoor'}
                      </span>
                      {pitch.size && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {getSizeLabel(pitch.size)}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getSurfaceLabel(pitch.surface)}
                      </span>
                    </div>

                    {pitch.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pitch.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-green-600">£{pitch.price_per_hour}</span>
                        <span className="text-sm text-gray-500">/hour</span>
                      </div>
                    </div>

                    <Link href={`/pitches/${pitch.id}/book`}>
                      <Button className="w-full">
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
