import { createServersideClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServersideClient()

  // Sign out the user
  await supabase.auth.signOut()

  // Redirect to home page
  return NextResponse.redirect(
    new URL(
      '/',
      process.env.NEXT_PUBLIC_ENV === 'LOCAL'
        ? 'http://localhost:3000'
        : 'https://app.modelflowai.com'
    )
  )
}
