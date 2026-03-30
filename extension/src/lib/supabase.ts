import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Inspiration = {
  id?: string
  user_id?: string
  url: string
  page_title: string
  creator_handle: string | null
  annotation: string
  category: string
  ai_suggested_category: string | null
  thumbnail_url: string | null
  created_at?: string
}
