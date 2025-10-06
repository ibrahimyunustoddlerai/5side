'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ManagerSignup() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Sign up user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: 'manager',
          },
        },
      })

      if (signUpError) throw signUpError

      // Check if user needs to confirm email
      if (data.user && !data.session) {
        setError('Please check your email to confirm your account before signing in.')
        return
      }

      if (data.user && data.session) {
        // User is signed in, redirect to setup
        router.replace('/manager/dashboard/setup')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            List Your Venue
          </h1>
          <p className="text-xl text-gray-600">
            Join our platform and start accepting bookings today
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <p className="font-semibold text-gray-900">Increase your venue visibility</p>
                    <p className="text-sm text-gray-600">Reach thousands of local players</p>
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
                    <p className="font-semibold text-gray-900">Secure payment processing</p>
                    <p className="text-sm text-gray-600">Safe transactions with Stripe</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 text-2xl mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">Real-time availability</p>
                    <p className="text-sm text-gray-600">Instant updates and confirmations</p>
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
                Create Your Account
              </h2>
              <p className="text-gray-600 mb-6">
                Get started in minutes
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Smith"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    disabled={loading}
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
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 7700 900000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Manager Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/manager/signin" className="text-green-600 hover:text-green-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
