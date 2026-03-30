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

/** TikTok-aligned category chips (background / text / border) */
export const CATEGORY_COLORS: Record<Category, string> = {
  "Visual Art":
    "bg-[#FE2C5520] text-[#FE2C55] border-[#FE2C5540]",
  Music: "bg-[#25F4EE20] text-[#25F4EE] border-[#25F4EE40]",
  "Motion & Animation":
    "bg-[#7B2FFF20] text-[#9B5FFF] border-[#9B5FFF40]",
  Lifestyle: "bg-[#FF6B2B20] text-[#FF6B2B] border-[#FF6B2B40]",
  Photography: "bg-[#FFD60020] text-[#FFD600] border-[#FFD60045]",
  Writing: "bg-[#00C85220] text-[#00C852] border-[#00C85240]",
  Other: "bg-[#FFFFFF15] text-[#A0A0A0] border-[#FFFFFF25]"
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
