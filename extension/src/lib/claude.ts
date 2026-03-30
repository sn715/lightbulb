// SECURITY NOTE: The Anthropic API key is bundled into the extension and visible
// to users who inspect the source. This is a known dev/demo limitation.
// In production, proxy this call through a server-side API route.

const ANTHROPIC_API_KEY = process.env.PLASMO_PUBLIC_ANTHROPIC_API_KEY

const CATEGORIES = [
  "Visual Art",
  "Music",
  "Motion & Animation",
  "Lifestyle",
  "Photography",
  "Writing",
  "Other"
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LIST = CATEGORIES

export async function suggestCategory(annotation: string): Promise<Category> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 20,
      system:
        "You are a creative assistant. Given a note about what inspired someone in a piece of content, suggest exactly one category from this list: Visual Art, Music, Motion & Animation, Lifestyle, Photography, Writing, Other. Respond with only the category name, nothing else.",
      messages: [{ role: "user", content: annotation }]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  const suggested = data.content?.[0]?.text?.trim() as Category

  return CATEGORIES.includes(suggested) ? suggested : "Other"
}
