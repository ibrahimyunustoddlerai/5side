'use client'

import { useState, useEffect } from 'react'
import { PitchCard } from './pitch-card'
import { type SearchFilters } from './search-filters'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SearchResultsEnhancedProps {
  filters: SearchFilters
}

interface PitchResult {
  id: string
  name: string
  locationName: string
  address: string
  distance: number
  pricePerHour: number
  surface: string
  indoor: boolean
  images: string[]
  rating: number
  reviewCount: number
  availableToday: boolean
}

interface SearchResponse {
  pitches: PitchResult[]
  total: number
  page: number
  limit: number
}

export function SearchResultsEnhanced({ filters }: SearchResultsEnhancedProps) {
  const [pitches, setPitches] = useState<PitchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('distance')

  useEffect(() => {
    searchPitches()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const searchPitches = async () => {
    if (!filters.location) {
      // If no location is set, don't search yet
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams({
        lat: filters.location.lat.toString(),
        lng: filters.location.lng.toString(),
        maxDistance: filters.distance.toString(),
      })

      if (filters.surface) params.append('surface', filters.surface)
      if (filters.indoor) params.append('indoor', filters.indoor === 'indoor' ? 'true' : 'false')
      if (filters.availableToday) params.append('availableToday', 'true')

      // Parse price range
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-')
        if (min) params.append('minPrice', min)
        if (max && max !== '+') params.append('maxPrice', max)
        if (max === '+') params.append('minPrice', min) // For "80+" case
      }

      const response = await fetch(`/api/search?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: SearchResponse = await response.json()
      setPitches(Array.isArray(data.pitches) ? data.pitches : [])
    } catch (err) {
      setError('Failed to search pitches. Please try again.')
      setPitches([]) // Reset to empty array on error
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const sortedPitches = [...pitches].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return a.distance - b.distance
      case 'price-low':
        return a.pricePerHour - b.pricePerHour
      case 'price-high':
        return b.pricePerHour - a.pricePerHour
      case 'rating':
        return b.rating - a.rating
      case 'availability':
        return (b.availableToday ? 1 : 0) - (a.availableToday ? 1 : 0)
      default:
        return 0
    }
  })

  if (!filters.location) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Enter a location to start searching</h3>
        <p className="text-gray-500">Use the search bar to find pitches in your area</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Searching for pitches...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">{error}</p>
        </div>
        <Button onClick={searchPitches}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {sortedPitches.length} pitches found near {filters.locationName}
        </h2>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Sort by Distance</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Sort by Rating</SelectItem>
            <SelectItem value="availability">Available First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedPitches.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pitches found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or searching a different area</p>
          <Button
            variant="link"
            onClick={() => window.location.reload()}
          >
            Reset search
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {sortedPitches.map((pitch) => (
            <PitchCard key={pitch.id} pitch={pitch} />
          ))}
        </div>
      )}

      {/* Load More Button - if implementing pagination */}
      {sortedPitches.length > 0 && sortedPitches.length >= 10 && (
        <div className="text-center pt-6">
          <Button variant="secondary" size="lg">
            Load More Pitches
          </Button>
        </div>
      )}
    </div>
  )
}