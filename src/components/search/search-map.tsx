'use client'

import { Button } from '@/components/ui/button'

export function SearchMap() {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="h-96 bg-gray-100 flex items-center justify-center relative">
        {/* Map Placeholder */}
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-gray-500 text-sm">Interactive Map</p>
          <p className="text-gray-400 text-xs mt-1">
            Map integration with Google Maps coming soon
          </p>
        </div>

        {/* Mock Pin Locations */}
        <div className="absolute top-12 left-16 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        <div className="absolute bottom-20 left-12 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        <div className="absolute bottom-16 right-16 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Map Controls */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <div className="flex items-center mr-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Pitches</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Your Location</span>
            </div>
          </div>
          <Button variant="link">
            View Fullscreen
          </Button>
        </div>
      </div>
    </div>
  )
}