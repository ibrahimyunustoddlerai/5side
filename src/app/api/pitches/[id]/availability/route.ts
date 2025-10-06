import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const pitchId = params.id
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // YYYY-MM-DD format

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const requestedDate = new Date(dateParam)
    const dayOfWeek = requestedDate.getDay()

    // Get pitch details
    const { data: pitch, error: pitchError } = await supabase
      .from('pitches')
      .select('id, name, price_per_hour, is_active')
      .eq('id', pitchId)
      .single()

    if (pitchError || !pitch) {
      return NextResponse.json(
        { error: 'Pitch not found' },
        { status: 404 }
      )
    }

    if (!pitch.is_active) {
      return NextResponse.json({ slots: [] }, { status: 200 })
    }

    // Get pitch schedule for this day
    const { data: schedule, error: scheduleError } = await supabase
      .from('pitch_schedules')
      .select('*')
      .eq('pitch_id', pitchId)
      .eq('day_of_week', dayOfWeek)
      .single()

    if (scheduleError || !schedule) {
      // No schedule for this day
      return NextResponse.json({ slots: [] }, { status: 200 })
    }

    // Get start and end of day in UTC
    const startOfDay = new Date(requestedDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(requestedDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Check for pitch closures
    const { data: closures, error: closuresError } = await supabase
      .from('pitch_closures')
      .select('*')
      .eq('pitch_id', pitchId)
      .lte('start_date', endOfDay.toISOString())
      .gte('end_date', startOfDay.toISOString())

    // Get existing bookings for this day
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('pitch_id', pitchId)
      .in('status', ['PENDING', 'CONFIRMED'])
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())

    // Generate time slots
    const slots = []
    const [startHour, startMinute] = schedule.start_time.split(':').map(Number)
    const [endHour, endMinute] = schedule.end_time.split(':').map(Number)

    const currentSlot = new Date(requestedDate)
    currentSlot.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(requestedDate)
    endTime.setHours(endHour, endMinute, 0, 0)

    while (currentSlot < endTime) {
      const slotStart = new Date(currentSlot)
      const slotEnd = new Date(currentSlot.getTime() + 60 * 60 * 1000) // 1 hour slots

      if (slotEnd <= endTime) {
        // Check if slot is in the past
        const now = new Date()
        const isPast = slotEnd <= now

        // Check if slot overlaps with any booking
        const isBooked = bookings?.some((booking: any) => {
          const bookingStart = new Date(booking.start_time)
          const bookingEnd = new Date(booking.end_time)
          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          )
        }) || false

        // Check if slot overlaps with any closure
        const isClosed = closures?.some((closure: any) => {
          const closureStart = new Date(closure.start_date)
          const closureEnd = new Date(closure.end_date)
          return (
            (slotStart >= closureStart && slotStart < closureEnd) ||
            (slotEnd > closureStart && slotEnd <= closureEnd) ||
            (slotStart <= closureStart && slotEnd >= closureEnd)
          )
        }) || false

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: !isPast && !isBooked && !isClosed,
          price: pitch.price_per_hour,
        })
      }

      currentSlot.setHours(currentSlot.getHours() + 1)
    }

    return NextResponse.json({ slots }, { status: 200 })
  } catch (error) {
    console.error('GET /api/pitches/[id]/availability error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
