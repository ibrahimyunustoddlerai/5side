import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export const getUser = cache(async () => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
})

export const requireAuth = async () => {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export const getSession = cache(async () => {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
})