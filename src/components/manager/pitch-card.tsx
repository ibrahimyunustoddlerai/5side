'use client'

import { Button } from '@/components/ui/button'

interface PitchCardProps {
  pitch: {
    id: string
    name: string
    surface: string
    indoor: boolean
    size: string | null
    price_per_hour: number
    length: number | null
    width: number | null
    description: string | null
  }
  onEdit: () => void
  onDelete: () => void
  onManageSchedule?: () => void
  onBlockTime?: () => void
}

const SURFACE_LABELS: Record<string, string> = {
  GRASS: 'Natural Grass',
  ARTIFICIAL_GRASS: 'Artificial Grass',
  ASTROTURF: 'Astroturf',
  CONCRETE: 'Concrete',
  INDOOR_COURT: 'Indoor Court',
}

const SIZE_LABELS: Record<string, string> = {
  '5_ASIDE': '5-a-Side',
  '7_ASIDE': '7-a-Side',
  '11_ASIDE': '11-a-Side',
  FUTSAL: 'Futsal',
}

export function PitchCard({ pitch, onEdit, onDelete, onManageSchedule, onBlockTime }: PitchCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{pitch.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              pitch.indoor ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {pitch.indoor ? 'Indoor' : 'Outdoor'}
            </span>
            {pitch.size && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {SIZE_LABELS[pitch.size] || pitch.size}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">£{pitch.price_per_hour}</p>
          <p className="text-sm text-gray-500">per hour</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span className="text-gray-700">
            {SURFACE_LABELS[pitch.surface] || pitch.surface}
          </span>
        </div>

        {pitch.length && pitch.width && (
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="text-gray-700">
              {pitch.length}m × {pitch.width}m
            </span>
          </div>
        )}

        {pitch.description && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
            {pitch.description}
          </p>
        )}
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          {onManageSchedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageSchedule}
              className="w-full"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule
            </Button>
          )}
          {onBlockTime && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBlockTime}
              className="w-full"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Block Time
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
