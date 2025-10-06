'use client'

import { useState } from 'react'
import { SearchFilters, type SearchFilters as SearchFiltersType } from '@/components/search/search-filters'
import { SearchResultsEnhanced } from '@/components/search/search-results-enhanced'
import { SearchMap } from '@/components/search/search-map'

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filters, setFilters] = useState<SearchFiltersType>({
    location: null,
    locationName: '',
    distance: 10,
    surface: '',
    indoor: '',
    priceRange: '',
    availableToday: false,
  })

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters)
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Find 5-a-Side Pitches</h1>
              <p className="mt-1 text-sm text-gray-500">
                Discover and book premium football pitches in your area
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center text-sm text-gray-500">
                <span>Showing results for your area</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <SearchFilters onFiltersChange={handleFiltersChange} />
            </div>
          </div>

          {/* Results and Map */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Toggle View Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      viewMode === 'list'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      viewMode === 'map'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Map View
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {filters.location ? `Searching near ${filters.locationName}` : 'Enter location to search'}
                </div>
              </div>

              {/* Search Results */}
              {viewMode === 'list' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="xl:col-span-1">
                    <SearchResultsEnhanced filters={filters} />
                  </div>
                  <div className="xl:col-span-1 hidden xl:block">
                    <div className="sticky top-8">
                      <SearchMap />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[600px]">
                  <SearchMap />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}