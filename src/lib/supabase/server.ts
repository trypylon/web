/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  createServerClient,
  type CookieOptions
} from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServersideClient(
  isServiceLevel?: boolean
) {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = isServiceLevel
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(
        name: string,
        value: string,
        options: CookieOptions
      ) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      }
    }
  })
}

export async function getUser(supabase: any) {
  const {
    data: { user: userData },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) {
    console.error('Error fetching user:', userError)
    return new Response('User authentication failed', {
      status: 400
    })
  }

  const userSupabaseId = userData?.id ?? null

  if (!userSupabaseId) {
    console.error('User ID not found')
    return new Response('User ID not found', {
      status: 400
    })
  }
  return userSupabaseId
}
