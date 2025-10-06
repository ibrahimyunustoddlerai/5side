'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ManagerSetup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Organization data
  const [orgData, setOrgData] = useState({
    name: '',
    phone: '',
    email: '',
    description: '',
  })

  // Venue data
  const [venueData, setVenueData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    description: '',
  })

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOrgData({
      ...orgData,
      [e.target.name]: e.target.value,
    })
  }

  const handleVenueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVenueData({
      ...venueData,
      [e.target.name]: e.target.value,
    })
  }

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/manager/signin')
      } else {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create organization
      const orgResponse = await fetch('/api/manager/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      })

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json()
        console.error('Organization creation failed:', errorData)
        throw new Error(errorData.error || 'Failed to create organization')
      }

      const { organization } = await orgResponse.json()

      // Geocode the address to get coordinates
      const fullAddress = `${venueData.address}, ${venueData.city}${venueData.postalCode ? ', ' + venueData.postalCode : ''}, UK`
      const geocodeResponse = await fetch(`/api/places/geocode?address=${encodeURIComponent(fullAddress)}`)
      const geocodeData = await geocodeResponse.json()

      if (!geocodeData.location) {
        throw new Error('Could not find coordinates for the provided address. Please check the address and try again.')
      }

      // Create venue with geocoded coordinates
      const venueResponse = await fetch('/api/manager/venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...venueData,
          organizationId: organization.id,
          latitude: geocodeData.location.lat,
          longitude: geocodeData.location.lng,
        }),
      })

      if (!venueResponse.ok) {
        const errorData = await venueResponse.json()
        console.error('Venue creation failed:', errorData)
        throw new Error(errorData.error || 'Failed to create venue')
      }

      // Redirect to dashboard
      router.push('/manager/dashboard/venues')
    } catch (error) {
      console.error('Setup error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete setup'
      alert(`${errorMessage}. Please check the console for details.`)
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Progress Steps */}
        <div className="pt-8 pb-4 px-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Organization</span>
            </div>
            <div className={`w-24 h-1 mx-4 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`} />
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">First Venue</span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 pb-12">
          {step === 1 && (
            <>
              {/* Left Column - Benefits */}
              <div className="lg:pr-8 flex flex-col justify-center">
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8 lg:p-12 transform rotate-[-2deg] hover:rotate-0 transition-transform">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8">The Old Way</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="text-red-500 text-2xl mr-3">⚠</span>
                      <p className="text-gray-700">Manual booking management</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-red-500 text-2xl mr-3">⚠</span>
                      <p className="text-gray-700">Phone calls and emails only</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-red-500 text-2xl mr-3">⚠</span>
                      <p className="text-gray-700">Limited visibility</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-red-500 text-2xl mr-3">⚠</span>
                      <p className="text-gray-700">No payment protection</p>
                    </div>
                    <div className="flex items-start">
                      <span className="text-red-500 text-2xl mr-3">⚠</span>
                      <p className="text-gray-700">Time-consuming admin work</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 lg:p-12 transform rotate-[2deg] hover:rotate-0 transition-transform">
                  <h3 className="text-2xl font-bold text-green-600 mb-8">The New Way</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="text-green-500 text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-semibold text-gray-900">Build your venue profile in under 10 minutes</p>
                        <p className="text-sm text-gray-600">Quick and easy setup</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-500 text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-semibold text-gray-900">Go live in 5 days or less</p>
                        <p className="text-sm text-gray-600">Start accepting bookings fast</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-500 text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-semibold text-gray-900">Automated booking system</p>
                        <p className="text-sm text-gray-600">24/7 online bookings</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-500 text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-semibold text-gray-900">Reach thousands of players</p>
                        <p className="text-sm text-gray-600">Get discovered by local teams</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-500 text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-semibold text-gray-900">24/7 support</p>
                        <p className="text-sm text-gray-600">We&apos;re here to help</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="flex items-center">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tell us about your organization
                  </h2>
                  <p className="text-gray-600 mb-6">
                    This will be the parent company for all your venues
                  </p>

                  <form onSubmit={handleOrgSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        required
                        value={orgData.name}
                        onChange={handleOrgChange}
                        placeholder="e.g., Manchester Sports Centers Ltd"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={orgData.email}
                          onChange={handleOrgChange}
                          placeholder="info@example.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          value={orgData.phone}
                          onChange={handleOrgChange}
                          placeholder="+44 7700 900000"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={orgData.description}
                        onChange={handleOrgChange}
                        placeholder="Brief description of your organization..."
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      Continue to Venue Details
                    </Button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Venue Details */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="mb-4"
              >
                ← Back
              </Button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Add your first venue
              </h2>
              <p className="text-gray-600">
                Provide details about your venue location
              </p>
            </div>

            <form onSubmit={handleVenueSubmit} className="space-y-6">
              <div>
                <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <Input
                  id="venueName"
                  name="name"
                  required
                  value={venueData.name}
                  onChange={handleVenueChange}
                  placeholder="e.g., City Sports Complex"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <Input
                  id="address"
                  name="address"
                  required
                  value={venueData.address}
                  onChange={handleVenueChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <Input
                    id="city"
                    name="city"
                    required
                    value={venueData.city}
                    onChange={handleVenueChange}
                    placeholder="Manchester"
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={venueData.postalCode}
                    onChange={handleVenueChange}
                    placeholder="M1 1AA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="venuePhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Phone
                  </label>
                  <Input
                    id="venuePhone"
                    name="phone"
                    type="tel"
                    value={venueData.phone}
                    onChange={handleVenueChange}
                    placeholder="+44 7700 900000"
                  />
                </div>

                <div>
                  <label htmlFor="venueEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Email
                  </label>
                  <Input
                    id="venueEmail"
                    name="email"
                    type="email"
                    value={venueData.email}
                    onChange={handleVenueChange}
                    placeholder="venue@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website (Optional)
                </label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={venueData.website}
                  onChange={handleVenueChange}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label htmlFor="venueDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Description
                </label>
                <Textarea
                  id="venueDescription"
                  name="description"
                  rows={4}
                  value={venueData.description}
                  onChange={handleVenueChange}
                  placeholder="Describe your venue, facilities, and amenities..."
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Complete Setup'}
              </Button>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
