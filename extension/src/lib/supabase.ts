import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL!.trim()
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY!.trim()

/**
 * Use extension storage so the session is shared between the options page and
 * content scripts. Default localStorage would attach to the host page (e.g.
 * tiktok.com) and never see your dashboard login.
 */
const chromeLocalStorage = {
  getItem: (key: string) =>
    new Promise<string | null>((resolve) => {
      void chrome.storage.local.get(key, (items) => {
        const v = items[key]
        resolve(v !== undefined && v !== null ? String(v) : null)
      })
    }),
  setItem: (key: string, value: string) =>
    new Promise<void>((resolve, reject) => {
      void chrome.storage.local.set({ [key]: value }, () => {
        const err = chrome.runtime.lastError
        err ? reject(err) : resolve()
      })
    }),
  removeItem: (key: string) =>
    new Promise<void>((resolve, reject) => {
      void chrome.storage.local.remove(key, () => {
        const err = chrome.runtime.lastError
        err ? reject(err) : resolve()
      })
    })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: chromeLocalStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

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
