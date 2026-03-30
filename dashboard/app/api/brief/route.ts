import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import type { Inspiration } from "@/lib/types"

const SYSTEM_PROMPT = `You are a creative director and mentor. You will be given a list of inspirations a creative person has saved — each includes their personal note about what inspired them and a category. Synthesize these into a personalized creative brief with four sections:

## What You're Drawn To
## Your Aesthetic Tendencies
## Three Concrete Starting Points
## Creators Worth Exploring Further

Be specific, personal, and encouraging without being generic. Write as if you know this person's creative voice. Use the actual details from their notes — don't speak in abstractions.`

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((b) => b.text)
    .join("")
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Creative brief needs ANTHROPIC_API_KEY in the dashboard environment (e.g. .env.local)."
      },
      { status: 503 }
    )
  }

  let inspirations: Inspiration[]
  try {
    const body = await request.json()
    inspirations = body.inspirations
    if (!Array.isArray(inspirations) || inspirations.length === 0) {
      return Response.json(
        { error: "No inspirations provided" },
        { status: 400 }
      )
    }
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const userMessage = JSON.stringify(
    inspirations.map((ins) => ({
      category: ins.category,
      annotation: ins.annotation,
      creator: ins.creator_handle,
      source: ins.page_title ?? ins.url
    })),
    null,
    2
  )

  const anthropic = new Anthropic({ apiKey })

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    })

    const text = extractText(message).trim()
    if (!text) {
      return Response.json(
        { error: "The model returned no text. Try again or check the API model." },
        { status: 502 }
      )
    }

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate creative brief"
    return Response.json({ error: message }, { status: 502 })
  }
}
