import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://omuopaupndqxwsuyvtoy.supabase.co'
const ANON_KEY = 'sb_publishable_BLHChJRx8gdjb9-jaI2WBA_zClJtSqy'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdW9wYXVwbmRxeHdzdXl2dG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcxMDc5OCwiZXhwIjoyMDkwMjg2Nzk4fQ.H54Nj_uncgRW24opwVDAloTRQ2VCmrRypLVqSctdghA'

// Public client — auth + reading data (uses anon key)
export const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Admin client — photo uploads to Storage + org creation (uses service role key)
// persistSession: false prevents browser from overriding service_role key with user JWT
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
})
