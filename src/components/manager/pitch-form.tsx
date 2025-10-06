'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PitchFormProps {
  locationId: string
  pitch?: Pitch
  onSuccess: () => void
  onCancel: () => void
}

interface Pitch {
  id: string
  name: string
  surface: string
  indoor: boolean
  size: string | null
  price_per_hour: number
  length: number | null
  width: number | null
  description: string | null
  amenities: string[]
  images: string[]
  is_active: boolean
}

const SURFACE_TYPES = [
  { value: 'GRASS', label: 'Natural Grass' },
  { value: 'ARTIFICIAL_GRASS', label: 'Artificial Grass' },
  { value: 'ASTROTURF', label: 'Astroturf' },
  { value: 'CONCRETE', label: 'Concrete' },
  { value: 'INDOOR_COURT', label: 'Indoor Court' },
]

const PITCH_SIZES = [
  { value: '5_ASIDE', label: '5-a-Side' },
  { value: '7_ASIDE', label: '7-a-Side' },
  { value: '11_ASIDE', label: '11-a-Side' },
  { value: 'FUTSAL', label: 'Futsal' },
]

export function PitchForm({ locationId, pitch, onSuccess, onCancel }: PitchFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: pitch?.name || '',
    surface: pitch?.surface || '',
    indoor: pitch?.indoor ? 'indoor' : 'outdoor',
    size: pitch?.size || '',
    pricePerHour: pitch?.price_per_hour?.toString() || '',
    length: pitch?.length?.toString() || '',
    width: pitch?.width?.toString() || '',
    description: pitch?.description || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!formData.name || !formData.surface || !formData.pricePerHour) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      const price = parseFloat(formData.pricePerHour)
      if (isNaN(price) || price <= 0) {
        setError('Price must be a positive number')
        setLoading(false)
        return
      }

      const payload = {
        locationId,
        name: formData.name,
        surface: formData.surface,
        indoor: formData.indoor === 'indoor',
        size: formData.size || null,
        pricePerHour: price,
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        description: formData.description || null,
        amenities: [],
        images: [],
      }

      const url = pitch
        ? '/api/manager/pitch'
        : '/api/manager/pitch'

      const method = pitch ? 'PUT' : 'POST'

      const body = pitch
        ? { ...payload, pitchId: pitch.id }
        : payload

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save pitch')
      }

      onSuccess()
    } catch (err) {
      console.error('Pitch form error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save pitch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {pitch ? 'Edit Pitch' : 'Add New Pitch'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pitch Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Pitch Name *
          </label>
          <Input
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Pitch 1, Court A"
            disabled={loading}
          />
        </div>

        {/* Surface Type */}
        <div>
          <label htmlFor="surface" className="block text-sm font-medium text-gray-700 mb-2">
            Surface Type *
          </label>
          <Select
            value={formData.surface}
            onValueChange={(value) => setFormData({ ...formData, surface: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select surface type" />
            </SelectTrigger>
            <SelectContent>
              {SURFACE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Indoor/Outdoor */}
        <div>
          <label htmlFor="indoor" className="block text-sm font-medium text-gray-700 mb-2">
            Location Type *
          </label>
          <Select
            value={formData.indoor}
            onValueChange={(value) => setFormData({ ...formData, indoor: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indoor">Indoor</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pitch Size */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
            Pitch Size
          </label>
          <Select
            value={formData.size}
            onValueChange={(value) => setFormData({ ...formData, size: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pitch size (optional)" />
            </SelectTrigger>
            <SelectContent>
              {PITCH_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Per Hour */}
        <div>
          <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-2">
            Price Per Hour (£) *
          </label>
          <Input
            id="pricePerHour"
            name="pricePerHour"
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.pricePerHour}
            onChange={handleChange}
            placeholder="e.g., 50.00"
            disabled={loading}
          />
        </div>

        {/* Dimensions (Optional) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
              Length (meters)
            </label>
            <Input
              id="length"
              name="length"
              type="number"
              step="0.1"
              min="0"
              value={formData.length}
              onChange={handleChange}
              placeholder="e.g., 40"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
              Width (meters)
            </label>
            <Input
              id="width"
              name="width"
              type="number"
              step="0.1"
              min="0"
              value={formData.width}
              onChange={handleChange}
              placeholder="e.g., 20"
              disabled={loading}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Add any additional details about this pitch..."
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Saving...' : pitch ? 'Update Pitch' : 'Create Pitch'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
