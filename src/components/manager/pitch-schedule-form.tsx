'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Schedule {
  day_of_week: number
  start_time: string
  end_time: string
}

interface PitchScheduleFormProps {
  pitchId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

export function PitchScheduleForm({ pitchId, onSuccess, onCancel }: PitchScheduleFormProps) {
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSchedules()
  }, [pitchId])

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`/api/manager/pitch/${pitchId}/schedule`)
      const data = await response.json()

      if (response.ok) {
        setSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  const getScheduleForDay = (dayOfWeek: number) => {
    return schedules.find((s) => s.day_of_week === dayOfWeek)
  }

  const updateSchedule = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedules((prev) => {
      const existing = prev.find((s) => s.day_of_week === dayOfWeek)

      if (existing) {
        return prev.map((s) =>
          s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
        )
      } else {
        return [...prev, {
          day_of_week: dayOfWeek,
          start_time: field === 'start_time' ? value : '09:00',
          end_time: field === 'end_time' ? value : '22:00',
        }]
      }
    })
  }

  const removeSchedule = (dayOfWeek: number) => {
    setSchedules((prev) => prev.filter((s) => s.day_of_week !== dayOfWeek))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Filter out incomplete schedules
      const validSchedules = schedules.filter(
        (s) => s.start_time && s.end_time
      )

      const response = await fetch(`/api/manager/pitch/${pitchId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: validSchedules }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save schedules')
      }

      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedules')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Operating Hours
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {DAYS.map((day) => {
          const schedule = getScheduleForDay(day.value)
          const isEnabled = !!schedule

          return (
            <div key={day.value} className="flex items-center gap-4">
              <div className="w-32">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateSchedule(day.value, 'start_time', '09:00')
                      } else {
                        removeSchedule(day.value)
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="font-medium text-gray-700">{day.label}</span>
                </label>
              </div>

              {isEnabled && (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={schedule?.start_time || '09:00'}
                      onChange={(e) => updateSchedule(day.value, 'start_time', e.target.value)}
                      required
                      className="w-32"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={schedule?.end_time || '22:00'}
                      onChange={(e) => updateSchedule(day.value, 'end_time', e.target.value)}
                      required
                      className="w-32"
                    />
                  </div>
                </>
              )}

              {!isEnabled && (
                <span className="text-gray-400 text-sm">Closed</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Schedule'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
