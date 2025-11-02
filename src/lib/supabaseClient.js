import { createClient } from '@supabase/supabase-js'

// Your Project URL from API settings
const supabaseUrl = 'https://brcmqcznjqecnleibtgj.supabase.co' 

// Your anon public key from API settings
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyY21xY3puanFlY25sZWlidGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzAxNjUsImV4cCI6MjA3NzY0NjE2NX0.1VFW5He_nVJPrPgHjlf0-Ax6luxXKG2v4VOm5LmY2_Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)