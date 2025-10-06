'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Closure {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
}

interface PitchClosureFormProps {
  pitchId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PitchClosureForm({ pitchId, onSuccess, onCancel }: PitchClosureFormProps) {
  const [loading, setLoading] = useState(false)
  const [closures, setClosures] = useState<Closure[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchClosures()
  }, [pitchId])

  const fetchClosures = async () => {
    try {
      const response = await fetch(`/api/manager/pitch/${pitchId}/closures`)
      const data = await response.json()

      if (response.ok) {
        setClosures(data.closures || [])
      }
    } catch (error) {
      console.error('Error fetching closures:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/manager/pitch/${pitchId}/closures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create closure')
      }

      // Reset form
      setFormData({ title: '', description: '', startDate: '', endDate: '' })
      setShowForm(false)
      fetchClosures()

      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create closure')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (closureId: string) => {
    if (!confirm('Are you sure you want to remove this blocked time?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/manager/pitch/${pitchId}/closures?closureId=${closureId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete closure')
      }

      fetchClosures()
    } catch (error) {
      console.error('Error deleting closure:', error)
      alert('Failed to delete closure')
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Blocked Time Slots
        </h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Block Time'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Add Closure Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Private Event, Maintenance, Birthday Party"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add any additional details..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Block Time'}
            </Button>
          </div>
        </form>
      )}

      {/* Closures List */}
      {closures.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No blocked time slots. Click "Block Time" to add one.
        </p>
      ) : (
        <div className="space-y-3">
          {closures.map((closure) => (
            <div
              key={closure.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{closure.title}</h4>
                  {closure.description && (
                    <p className="text-sm text-gray-600 mt-1">{closure.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDateTime(closure.start_date)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDateTime(closure.end_date)}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(closure.id)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 ml-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {onCancel && (
        <div className="mt-6">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full">
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
