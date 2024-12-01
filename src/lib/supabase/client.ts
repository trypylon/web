/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createBrowserClient } from '@supabase/ssr'

export function createNewBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
