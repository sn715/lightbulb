import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import type { Inspiration } from "@/lib/types"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const SYSTEM_PROMPT = `You are a creative director and mentor. You will be given a list of inspirations a creative person has saved — each includes their personal note about what inspired them and a category. Synthesize these into a personalized creative brief with four sections:

## What You're Drawn To
## Your Aesthetic Tendencies
## Three Concrete Starting Points
## Creators Worth Exploring Further

Be specific, personal, and encouraging without being generic. Write as if you know this person's creative voice. Use the actual details from their notes — don't speak in abstractions.`

export async function POST(request: Request) {
  // Verify the user is authenticated
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
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

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }]
  })

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    }
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked"
    }
  })
}
