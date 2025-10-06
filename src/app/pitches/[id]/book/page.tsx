'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface TimeSlot {
  start: string
  end: string
  available: boolean
  price: number
}

interface Pitch {
  id: string
  name: string
  surface: string
  indoor: boolean
  price_per_hour: number
  size: string | null
  locations: {
    id: string
    name: string
    address: string
    city: string
  }
}

export default function BookPitchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [pitch, setPitch] = useState<Pitch | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    checkAuth()
    fetchPitchDetails()
    // Set default date to today
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }, [params.id])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability()
    }
  }, [selectedDate])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchPitchDetails = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pitches')
        .select(`
          id,
          name,
          surface,
          indoor,
          price_per_hour,
          size,
          locations (
            id,
            name,
            address,
            city
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setPitch(data)
    } catch (error) {
      console.error('Error fetching pitch:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async () => {
    setLoadingSlots(true)
    setSelectedSlot(null)
    try {
      const response = await fetch(`/api/pitches/${params.id}/availability?date=${selectedDate}`)
      const data = await response.json()

      if (response.ok) {
        setTimeSlots(data.slots || [])
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleBooking = async () => {
    if (!user) {
      alert('Please sign in to book a pitch')
      router.push('/login')
      return
    }

    if (!selectedSlot) {
      alert('Please select a time slot')
      return
    }

    setBooking(true)
    try {
      // Step 1: Create booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pitchId: params.id,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          organizerName: user.email || 'Guest',
          organizerEmail: user.email,
          notes,
        }),
      })

      if (!bookingResponse.ok) {
        const data = await bookingResponse.json()
        throw new Error(data.error || 'Failed to create booking')
      }

      const { booking: createdBooking } = await bookingResponse.json()

      // Step 2: Create Stripe checkout session
      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: createdBooking.id,
        }),
      })

      if (!checkoutResponse.ok) {
        const data = await checkoutResponse.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const { url } = await checkoutResponse.json()

      // Step 3: Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert(error instanceof Error ? error.message : 'Failed to create booking')
      setBooking(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30) // 30 days ahead
    return maxDate.toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!pitch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pitch Not Found</h1>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/venues/${pitch.locations.id}`} className="flex items-center text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Venue
            </Link>
            <Link href="/" className="text-2xl font-bold text-green-600">5-a-Side</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book {pitch.name}</h1>
              <p className="text-gray-600 mb-6">
                at {pitch.locations.name} • {pitch.locations.city}
              </p>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="max-w-xs"
                />
                {selectedDate && (
                  <p className="mt-2 text-sm text-gray-600">
                    {formatDate(selectedDate)}
                  </p>
                )}
              </div>

              {/* Time Slots */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Time Slot
                </label>

                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading availability...</p>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">No time slots available for this date</p>
                    <p className="text-sm text-gray-500">Try selecting a different date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => slot.available && setSelectedSlot(slot)}
                        disabled={!slot.available}
                        className={`
                          p-3 rounded-lg border-2 text-sm font-medium transition-all
                          ${!slot.available
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : selectedSlot === slot
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900 hover:border-green-600'
                          }
                        `}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements or notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pitch</span>
                  <span className="font-medium text-gray-900">{pitch.name}</span>
                </div>

                {selectedDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}

                {selectedSlot && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time</span>
                      <span className="font-medium text-gray-900">
                        {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium text-gray-900">1 hour</span>
                    </div>
                  </>
                )}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-green-600">
                      £{selectedSlot ? selectedSlot.price : pitch.price_per_hour}
                    </span>
                  </div>
                </div>
              </div>

              {!user && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Please <Link href="/login" className="font-medium underline">sign in</Link> to complete your booking
                  </p>
                </div>
              )}

              <Button
                onClick={handleBooking}
                disabled={!selectedSlot || booking || !user}
                className="w-full"
                size="lg"
              >
                {booking ? 'Processing...' : 'Confirm Booking'}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By booking, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
