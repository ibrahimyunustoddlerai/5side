'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/manager/dashboard-layout'
import { Button } from '@/components/ui/button'
import { PitchCard } from '@/components/manager/pitch-card'
import { PitchForm } from '@/components/manager/pitch-form'
import { PitchScheduleForm } from '@/components/manager/pitch-schedule-form'
import { PitchClosureForm } from '@/components/manager/pitch-closure-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
  is_active: boolean
}

interface Venue {
  id: string
  name: string
  address: string
  city: string
  postal_code: string | null
  phone: string | null
  email: string | null
}

export default function VenueDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPitch, setEditingPitch] = useState<Pitch | null>(null)
  const [managingSchedulePitchId, setManagingSchedulePitchId] = useState<string | null>(null)
  const [blockingTimePitchId, setBlockingTimePitchId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    fetchVenue()
    fetchPitches()
  }, [params.id])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/manager/signin')
    }
  }

  const fetchVenue = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setVenue(data)
    } catch (error) {
      console.error('Error fetching venue:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPitches = async () => {
    try {
      const response = await fetch(`/api/manager/pitch?locationId=${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setPitches(data.pitches || [])
      }
    } catch (error) {
      console.error('Error fetching pitches:', error)
    }
  }

  const handlePitchSuccess = () => {
    setShowAddForm(false)
    setEditingPitch(null)
    fetchPitches()
  }

  const handleScheduleSuccess = () => {
    setManagingSchedulePitchId(null)
    alert('Schedule saved successfully!')
  }

  const handleEdit = (pitch: Pitch) => {
    setEditingPitch(pitch)
    setShowAddForm(true)
  }

  const handleDelete = async (pitchId: string) => {
    if (!confirm('Are you sure you want to delete this pitch?')) {
      return
    }

    try {
      const response = await fetch(`/api/manager/pitch?pitchId=${pitchId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete pitch')
      }

      fetchPitches()
    } catch (error) {
      console.error('Error deleting pitch:', error)
      alert('Failed to delete pitch')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!venue) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
          <Link href="/manager/dashboard/venues">
            <Button variant="outline">← Back to Venues</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/manager/dashboard/venues">
            <Button variant="ghost" className="mb-4">
              ← Back to Venues
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
              <p className="text-gray-600">
                {venue.address}, {venue.city}
                {venue.postal_code && ` ${venue.postal_code}`}
              </p>
            </div>
            <Button onClick={() => {
              setEditingPitch(null)
              setShowAddForm(!showAddForm)
            }}>
              {showAddForm ? 'Cancel' : '+ Add Pitch'}
            </Button>
          </div>
        </div>

        {/* Add/Edit Pitch Form */}
        {showAddForm && (
          <div className="mb-8">
            <PitchForm
              locationId={params.id}
              pitch={editingPitch || undefined}
              onSuccess={handlePitchSuccess}
              onCancel={() => {
                setShowAddForm(false)
                setEditingPitch(null)
              }}
            />
          </div>
        )}

        {/* Manage Schedule Form */}
        {managingSchedulePitchId && (
          <div className="mb-8">
            <PitchScheduleForm
              pitchId={managingSchedulePitchId}
              onSuccess={handleScheduleSuccess}
              onCancel={() => setManagingSchedulePitchId(null)}
            />
          </div>
        )}

        {/* Block Time Form */}
        {blockingTimePitchId && (
          <div className="mb-8">
            <PitchClosureForm
              pitchId={blockingTimePitchId}
              onSuccess={() => alert('Time blocked successfully!')}
              onCancel={() => setBlockingTimePitchId(null)}
            />
          </div>
        )}

        {/* Pitches List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pitches ({pitches.length})
            </h2>
          </div>

          {pitches.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pitches</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first pitch to this venue.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowAddForm(true)}>
                  + Add Pitch
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pitches.map((pitch) => (
                <PitchCard
                  key={pitch.id}
                  pitch={pitch}
                  onEdit={() => handleEdit(pitch)}
                  onDelete={() => handleDelete(pitch.id)}
                  onManageSchedule={() => setManagingSchedulePitchId(pitch.id)}
                  onBlockTime={() => setBlockingTimePitchId(pitch.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
