"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { brandIcon } from "@/lib/brand-icon"
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
        <h3 key={i} className="font-semibold text-base text-foreground mt-6 mb-2 first:mt-0">
          {line.replace(/^#+\s/, "")}
        </h3>
      )
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <h3 key={i} className="font-semibold text-base text-foreground mt-6 mb-2 first:mt-0">
          {line.replace(/\*\*/g, "")}
        </h3>
      )
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="text-muted-foreground text-sm leading-relaxed ml-4 list-disc">
          {line.replace(/^[-•]\s/, "")}
        </li>
      )
    }
    if (line.trim() === "") {
      return <div key={i} className="h-1" />
    }
    return (
      <p key={i} className="text-muted-foreground text-sm leading-relaxed">
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

      const contentType = response.headers.get("content-type") ?? ""

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error ?? `Server error ${response.status}`)
      }

      if (contentType.includes("application/json")) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          typeof data.error === "string" ? data.error : "Unexpected JSON response"
        )
      }

      const text = await response.text()
      setBrief(text.trim())
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
        className="bg-primary px-5 font-medium text-primary-foreground hover:brightness-95"
      >
        ✦ Generate Creative Brief
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[80vh] min-h-[min(50vh,24rem)] w-full max-w-2xl flex-col border-border bg-card p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandIcon.src}
                alt=""
                width={brandIcon.width}
                height={brandIcon.height}
                className="max-w-none shrink-0 object-contain"
                style={{ width: 100, height: 100 }}
              />
              Your Creative Brief
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Synthesized from {inspirations.length} saved inspiration
              {inspirations.length !== 1 ? "s" : ""}
            </p>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1 basis-0 px-6 py-4">
            {loading && !brief && (
              <div className="flex items-center gap-3 py-8 text-muted-foreground">
                <div className="flex gap-1">
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-primary"
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
                  <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-primary" />
                )}
              </div>
            )}
          </ScrollArea>

          {!loading && (brief || error) && (
            <div className="shrink-0 border-t border-border px-6 py-4">
              <Button
                onClick={generateBrief}
                variant="outline"
                className="border-border text-sm text-foreground hover:bg-accent hover:text-foreground"
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
