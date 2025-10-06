import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

interface PitchCardProps {
  pitch: {
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
}

export function PitchCard({ pitch }: PitchCardProps) {
  const surfaceLabels: Record<string, string> = {
    GRASS: 'Natural Grass',
    ARTIFICIAL_GRASS: 'Artificial Grass',
    ASTROTURF: 'Astroturf',
    CONCRETE: 'Concrete',
    INDOOR_COURT: 'Indoor Court',
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {pitch.images.length > 0 ? (
          <Image
            src={pitch.images[0]}
            alt={pitch.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {pitch.availableToday && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Available Today
            </span>
          )}
          {pitch.indoor && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Indoor
            </span>
          )}
        </div>

        {/* Price */}
        <div className="absolute top-3 right-3 bg-white rounded-md px-2 py-1 shadow-sm">
          <span className="text-sm font-bold text-gray-900">
            £{pitch.pricePerHour}/hr
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title and Location */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
              {pitch.name}
            </h3>
            <p className="text-sm text-gray-600">{pitch.locationName}</p>
          </div>

          {/* Address and Distance */}
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{pitch.address}</span>
            <span className="ml-2">• {pitch.distance.toFixed(1)} miles</span>
          </div>

          {/* Surface Type */}
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
            </svg>
            <span>{surfaceLabels[pitch.surface] || pitch.surface}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center text-sm">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(pitch.rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-gray-600">
              {pitch.rating.toFixed(1)} ({pitch.reviewCount} reviews)
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex space-x-2 w-full">
          {/* @ts-expect-error - Route not yet implemented */}
          <Link href={`/pitch/${pitch.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          {/* @ts-expect-error - Route not yet implemented */}
          <Link href={`/pitch/${pitch.id}/book`} className="flex-1">
            <Button className="w-full">
              Book Now
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}