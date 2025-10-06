'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocationSearch } from './location-search'
import { type LocationCoordinates } from '@/lib/location'

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void
}

export interface SearchFilters {
  location: LocationCoordinates | null
  locationName: string
  distance: number
  surface: string
  indoor: string
  priceRange: string
  availableToday: boolean
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null)
  const [locationName, setLocationName] = useState('')
  const [distance, setDistance] = useState(10)
  const [surface, setSurface] = useState('')
  const [indoor, setIndoor] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [availableToday, setAvailableToday] = useState(false)

  const surfaces = [
    { value: 'GRASS', label: 'Natural Grass' },
    { value: 'ARTIFICIAL_GRASS', label: 'Artificial Grass' },
    { value: 'ASTROTURF', label: 'Astroturf' },
    { value: 'CONCRETE', label: 'Concrete' },
    { value: 'INDOOR_COURT', label: 'Indoor Court' },
  ]

  const priceRanges = [
    { value: '0-30', label: '£0 - £30' },
    { value: '30-50', label: '£30 - £50' },
    { value: '50-80', label: '£50 - £80' },
    { value: '80+', label: '£80+' },
  ]

  // Notify parent component when filters change
  useEffect(() => {
    const filters: SearchFilters = {
      location: userLocation,
      locationName,
      distance,
      surface,
      indoor,
      priceRange,
      availableToday,
    }
    onFiltersChange(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, locationName, distance, surface, indoor, priceRange, availableToday])

  const handleLocationChange = (location: LocationCoordinates, address: string) => {
    setUserLocation(location)
    setLocationName(address)
  }

  const clearFilters = () => {
    setUserLocation(null)
    setLocationName('')
    setDistance(10)
    setSurface('')
    setIndoor('')
    setPriceRange('')
    setAvailableToday(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      </div>

      {/* Location Search */}
      <LocationSearch
        onLocationChange={handleLocationChange}
        initialLocation={locationName}
      />

      {/* Distance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Distance (miles)
        </label>
        <Select value={distance.toString()} onValueChange={(value) => setDistance(Number(value))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select distance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Within 5 miles</SelectItem>
            <SelectItem value="10">Within 10 miles</SelectItem>
            <SelectItem value="20">Within 20 miles</SelectItem>
            <SelectItem value="50">Within 50 miles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Surface Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Surface Type
        </label>
        <div className="space-y-2">
          {surfaces.map((surfaceType) => (
            <label key={surfaceType.value} className="flex items-center">
              <input
                type="radio"
                name="surface"
                value={surfaceType.value}
                checked={surface === surfaceType.value}
                onChange={(e) => setSurface(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">{surfaceType.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Indoor/Outdoor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Indoor/Outdoor
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="indoor"
              value="indoor"
              checked={indoor === 'indoor'}
              onChange={(e) => setIndoor(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Indoor</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="indoor"
              value="outdoor"
              checked={indoor === 'outdoor'}
              onChange={(e) => setIndoor(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Outdoor</span>
          </label>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price per Hour
        </label>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label key={range.value} className="flex items-center">
              <input
                type="radio"
                name="price"
                value={range.value}
                checked={priceRange === range.value}
                onChange={(e) => setPriceRange(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Today
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={availableToday}
            onChange={(e) => setAvailableToday(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Show only available today</span>
        </label>
      </div>

      {/* Clear Filters Button */}
      <div className="pt-4">
        <Button variant="outline" onClick={clearFilters} className="w-full">
          Clear All Filters
        </Button>
      </div>
    </div>
  )
}