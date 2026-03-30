"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Inspiration } from "@/lib/types"

interface BriefModalProps {
  inspirations: Inspiration[]
}

// Parse the streamed text into sections for display
function renderBrief(text: string) {
  if (!text) return null

  // Split on markdown-style headers (## or bold **Section**)
  const lines = text.split("\n")

  return lines.map((line, i) => {
    if (line.startsWith("## ") || line.startsWith("### ")) {
      return (
        <h3 key={i} className="text-white font-semibold text-base mt-6 mb-2 first:mt-0">
          {line.replace(/^#+\s/, "")}
        </h3>
      )
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <h3 key={i} className="text-white font-semibold text-base mt-6 mb-2 first:mt-0">
          {line.replace(/\*\*/g, "")}
        </h3>
      )
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="text-zinc-300 text-sm leading-relaxed ml-4 list-disc">
          {line.replace(/^[-•]\s/, "")}
        </li>
      )
    }
    if (line.trim() === "") {
      return <div key={i} className="h-1" />
    }
    return (
      <p key={i} className="text-zinc-300 text-sm leading-relaxed">
        {line}
      </p>
    )
  })
}

export function BriefModal({ inspirations }: BriefModalProps) {
  const [open, setOpen] = useState(false)
  const [brief, setBrief] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const generateBrief = async () => {
    setBrief("")
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspirations })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error ?? `Server error ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setBrief((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate brief")
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    if (!brief && !loading) generateBrief()
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-5"
      >
        ✦ Generate Creative Brief
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
            <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
              <span>💡</span> Your Creative Brief
            </DialogTitle>
            <p className="text-zinc-500 text-sm mt-1">
              Synthesized from {inspirations.length} saved inspiration
              {inspirations.length !== 1 ? "s" : ""}
            </p>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {loading && !brief && (
              <div className="flex items-center gap-3 text-zinc-400 py-8">
                <div className="flex gap-1">
                  <span
                    className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-sm">Synthesizing your inspirations...</span>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm py-4">{error}</p>
            )}

            {brief && (
              <div className="space-y-1 pb-4">
                {renderBrief(brief)}
                {loading && (
                  <span className="inline-block w-1 h-4 bg-purple-500 animate-pulse ml-1" />
                )}
              </div>
            )}
          </ScrollArea>

          {!loading && (brief || error) && (
            <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
              <Button
                onClick={generateBrief}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-sm"
              >
                Regenerate
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
