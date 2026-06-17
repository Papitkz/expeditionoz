import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://faaexayuphtmnzhlwhuv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYWV4YXl1cGh0bW56aGx3aHV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2OTcwNzEsImV4cCI6MjA5NjI3MzA3MX0.kyp_tsQDqjgLr-iXf06c3dIqo0DFUkOmxLpgPY9y2Cs'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
