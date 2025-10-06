import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/ui/navigation'
import { getUser } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FiveSide - 5-a-side Football Pitch Booking',
  description: 'Discover and book 5-a-side football pitches in your area',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation user={user} />
        {children}
      </body>
    </html>
  )
}