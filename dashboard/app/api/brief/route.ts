import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import type { Inspiration } from "@/lib/types"

const SYSTEM_PROMPT = `You are a creative director. The user will send JSON: an array of saved inspirations (category, annotation, creator, source).

Respond with ONLY a single JSON object (no markdown fences, no other text) matching this exact shape:
{
  "summary": "<one paragraph only: synthesize what they're drawn to across their notes — specific, personal, grounded in what they wrote>",
  "ideas": [ "<string>", "<string>", "<string>", "<string>", "<string>" ]
}

Rules:
- "summary": exactly one paragraph (no line breaks, no bullet list inside it).
- "ideas": exactly 5 strings. Each must be a concrete, action-oriented next step (start with verbs like Try, Record, Paint, Create, Draft, Build, Study, Remix, etc.).
- Each idea must clearly tie to something in their annotations (paraphrase or allude — don't invent unrelated topics).
- If there are fewer than 5 saved items, still output 5 distinct ideas inspired by the combined set of notes.
- Output valid JSON only.`

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((b) => b.text)
    .join("")
}

function parseBriefJson(raw: string): { summary: string; ideas: string[] } {
  let t = raw.trim()
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
  }
  const parsed = JSON.parse(t) as unknown
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON shape")
  }
  const obj = parsed as Record<string, unknown>
  const summary =
    typeof obj.summary === "string" ? obj.summary.trim() : ""
  const ideasRaw = obj.ideas
  if (!Array.isArray(ideasRaw)) {
    throw new Error("Missing ideas array")
  }
  const ideas = ideasRaw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)

  if (!summary) {
    throw new Error("Empty summary")
  }
  if (ideas.length < 5) {
    throw new Error(`Expected 5 ideas, got ${ideas.length}`)
  }
  return { summary, ideas: ideas.slice(0, 5) }
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
      max_tokens: 1600,
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

    let brief: { summary: string; ideas: string[] }
    try {
      brief = parseBriefJson(text)
    } catch {
      return Response.json(
        {
          error:
            "Could not parse brief JSON from the model. Try Regenerate, or try again in a moment."
        },
        { status: 502 }
      )
    }

    return Response.json(brief, {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate creative brief"
    return Response.json({ error: message }, { status: 502 })
  }
}
