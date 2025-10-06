'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getUserLocation, type LocationCoordinates } from '@/lib/location'

interface LocationSearchProps {
  onLocationChange: (location: LocationCoordinates, address: string) => void
  initialLocation?: string
}

export function LocationSearch({ onLocationChange, initialLocation = '' }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialLocation)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 2) {
        try {
          const response = await fetch(
            `/api/places/autocomplete?input=${encodeURIComponent(searchQuery)}`
          )
          const data = await response.json()

          if (data.predictions && data.predictions.length > 0) {
            setSuggestions(
              data.predictions.slice(0, 5).map((p: { description: string }) => p.description)
            )
            setShowSuggestions(true)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error)
          setSuggestions([])
          setShowSuggestions(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return

    try {
      const response = await fetch(`/api/places/geocode?address=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.status === 'OK' && data.location) {
        onLocationChange(data.location, query)
        setShowSuggestions(false)
      } else {
        const errorMsg = data.error || data.status || 'Location not found'
        console.error('Geocoding failed:', errorMsg)
        alert(`Unable to find location &quot;${query}&quot;. ${errorMsg}. Please check your Google Maps API key has Geocoding API enabled.`)
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Error searching for location. Please try again.')
    }
  }

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true)
    try {
      const location = await getUserLocation()
      onLocationChange(location, 'Your current location')
      setSearchQuery('Your current location')
    } catch (error) {
      console.error('Location detection error:', error)
      alert('Could not detect your location. Please enter a location manually.')
    } finally {
      setIsDetectingLocation(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion)
    handleSearch(suggestion)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Location
      </label>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Enter city or postcode"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start rounded-none first:rounded-t-md last:rounded-b-md h-auto py-2"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSearch()}
          className="px-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Button>
      </div>

      <Button
        variant="link"
        onClick={handleDetectLocation}
        disabled={isDetectingLocation}
        className="mt-2 text-sm px-0 h-auto"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {isDetectingLocation ? 'Detecting location...' : 'Use my current location'}
      </Button>
    </div>
  )
}