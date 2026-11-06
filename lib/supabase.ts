import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

// This checks if the variables are actually loaded
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Environment Variables! Check your .env.local file.")
}

// Must be the cookie-based browser client: sign-in happens server-side and the
// session lives in cookies. A plain supabase-js client only reads localStorage,
// so it would run as `anon` and RLS would silently return zero rows.
export const supabase = createBrowserClient(supabaseUrl as string, supabaseKey as string)
