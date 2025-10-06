'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/manager/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { LocationSearch } from '@/components/search/location-search'
import { type LocationCoordinates } from '@/lib/location'

interface Venue {
  id: string
  name: string
  address: string
  city: string
  postal_code: string | null
  latitude: number
  longitude: number
  pitches: Array<{
    id: string
    name: string
  }>
}

interface Organization {
  id: string
  name: string
}

export default function VenuesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [venueData, setVenueData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    location: null as LocationCoordinates | null,
    locationName: '',
    phone: '',
    email: '',
    website: '',
    description: '',
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      fetchVenues()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrg])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/manager/organization')
      const data = await response.json()

      if (data.organizations && data.organizations.length > 0) {
        setOrganizations(data.organizations)
        setSelectedOrg(data.organizations[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVenues = async () => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/manager/venue?organizationId=${selectedOrg}`)
      const data = await response.json()

      if (data.locations) {
        setVenues(data.locations)
      }
    } catch (error) {
      console.error('Failed to fetch venues:', error)
    }
  }

  const handleVenueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVenueData({
      ...venueData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLocationChange = (location: LocationCoordinates, address: string) => {
    setVenueData({
      ...venueData,
      location,
      locationName: address,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!venueData.location) {
      alert('Please select a location')
      return
    }

    try {
      const response = await fetch('/api/manager/venue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          name: venueData.name,
          address: venueData.address,
          city: venueData.city,
          postalCode: venueData.postalCode,
          latitude: venueData.location.lat,
          longitude: venueData.location.lng,
          phone: venueData.phone,
          email: venueData.email,
          website: venueData.website,
          description: venueData.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create venue')
      }

      // Reset form and refresh venues
      setVenueData({
        name: '',
        address: '',
        city: '',
        postalCode: '',
        location: null,
        locationName: '',
        phone: '',
        email: '',
        website: '',
        description: '',
      })
      setShowAddForm(false)
      fetchVenues()
    } catch (error) {
      console.error('Error creating venue:', error)
      alert('Failed to create venue')
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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Venues</h1>
            <p className="text-gray-600">Manage your venue locations</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Venue'}
          </Button>
        </div>

        {/* Organization Selector */}
        {organizations.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Organization
            </label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Add Venue Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Add New Venue</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={venueData.name}
                  onChange={handleVenueChange}
                  placeholder="e.g., City Sports Complex"
                />
              </div>

              <LocationSearch
                onLocationChange={handleLocationChange}
                initialLocation={venueData.locationName}
              />

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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={venueData.phone}
                    onChange={handleVenueChange}
                    placeholder="+44 7700 900000"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
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
                  Website
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={venueData.description}
                  onChange={handleVenueChange}
                  placeholder="Describe your venue..."
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={!venueData.location}>
                  Create Venue
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Venues List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Venues ({venues.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {venues.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No venues</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first venue.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowAddForm(true)}>
                    + Add Venue
                  </Button>
                </div>
              </div>
            ) : (
              venues.map((venue) => (
                <div key={venue.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {venue.address}, {venue.city}
                        {venue.postal_code && ` ${venue.postal_code}`}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {venue.pitches.length} pitch{venue.pitches.length !== 1 ? 'es' : ''}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link href={`/manager/dashboard/venues/${venue.id}`}>
                        <Button variant="outline">Manage</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
