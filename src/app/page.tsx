'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setManagerDropdownOpen(false)
      }
    }

    if (managerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [managerDropdownOpen])

  return (
    <main className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-green-600">5-a-Side</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-4">
              <Link href="/search">
                <Button variant="ghost">Find Pitches</Button>
              </Link>

              {/* For Managers Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="outline"
                  onClick={() => setManagerDropdownOpen(!managerDropdownOpen)}
                  className="flex items-center gap-2"
                >
                  For Managers
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                {managerDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <Link
                        href="/manager/signup"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                        onClick={() => setManagerDropdownOpen(false)}
                      >
                        <div className="font-semibold">Sign Up</div>
                        <div className="text-xs text-gray-500">Create a new manager account</div>
                      </Link>
                      <Link
                        href="/manager/signin"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                        onClick={() => setManagerDropdownOpen(false)}
                      >
                        <div className="font-semibold">Sign In</div>
                        <div className="text-xs text-gray-500">Access your dashboard</div>
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link
                        href="/manager/dashboard"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                        onClick={() => setManagerDropdownOpen(false)}
                      >
                        <div className="font-semibold">Dashboard</div>
                        <div className="text-xs text-gray-500">Manage your venues</div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/login">
                <Button>Player Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-green-600"> 5-a-Side</span> Pitch
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover and book premium 5-a-side football pitches in your area.
            Simple booking, secure payments, instant confirmation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="text-lg px-8 py-3">
                Find Pitches Near Me
              </Button>
            </Link>
            <Link href="/manager/signup">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                List Your Venue
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Nearby Pitches</h3>
            <p className="text-gray-600">
              Search and filter pitches by location, surface type, indoor/outdoor, and more.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
            <p className="text-gray-600">
              Book your slot in seconds with real-time availability and instant confirmation.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
            <p className="text-gray-600">
              Safe and secure payments with Stripe. Get email confirmations and calendar invites.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}