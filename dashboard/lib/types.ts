export type Category =
  | "Visual Art"
  | "Music"
  | "Motion & Animation"
  | "Lifestyle"
  | "Photography"
  | "Writing"
  | "Other"

export const CATEGORIES: Category[] = [
  "Visual Art",
  "Music",
  "Motion & Animation",
  "Lifestyle",
  "Photography",
  "Writing",
  "Other"
]

export const CATEGORY_COLORS: Record<Category, string> = {
  "Visual Art": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Music: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Motion & Animation": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Lifestyle: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Photography: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Writing: "bg-green-500/20 text-green-300 border-green-500/30",
  Other: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
}

export type Inspiration = {
  id: string
  user_id: string
  url: string
  page_title: string | null
  creator_handle: string | null
  annotation: string
  category: Category
  ai_suggested_category: string | null
  thumbnail_url: string | null
  created_at: string
}

export type Profile = {
  id: string
  email: string
  created_at: string
}
