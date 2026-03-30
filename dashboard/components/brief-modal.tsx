"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { brandIcon } from "@/lib/brand-icon"
import type { Inspiration } from "@/lib/types"

interface BriefModalProps {
  inspirations: Inspiration[]
}

type BriefPayload = { summary: string; ideas: string[] }

function inspirationKey(inspirations: Inspiration[]) {
  return [...inspirations]
    .map((i) => i.id)
    .sort()
    .join("|")
}

export function BriefModal({ inspirations }: BriefModalProps) {
  const key = useMemo(() => inspirationKey(inspirations), [inspirations])

  const [open, setOpen] = useState(false)
  const [payload, setPayload] = useState<BriefPayload | null>(null)
  const [lastSyncedKey, setLastSyncedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const inFlightRef = useRef(false)
  /** After a failed fetch for `key`, avoid effect retry loops until Regenerate or key change. */
  const failedKeyRef = useRef<string | null>(null)

  const fetchBrief = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    failedKeyRef.current = null
    setError("")
    setLoading(true)
    try {
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspirations })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : `Server error ${response.status}`
        )
      }

      if (
        typeof data.summary !== "string" ||
        !Array.isArray(data.ideas) ||
        data.ideas.length !== 5
      ) {
        throw new Error("Unexpected response from brief API")
      }

      setPayload({
        summary: data.summary,
        ideas: data.ideas as string[]
      })
      setLastSyncedKey(key)
      failedKeyRef.current = null
    } catch (err: unknown) {
      failedKeyRef.current = key
      setError(err instanceof Error ? err.message : "Failed to generate brief")
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }, [inspirations, key])

  useEffect(() => {
    if (!open) return
    if (failedKeyRef.current === key) return
    if (lastSyncedKey === key && payload !== null) return
    void fetchBrief()
  }, [open, key, lastSyncedKey, payload, fetchBrief])

  const handleOpen = () => setOpen(true)

  const canRegenerate = Boolean(
    error || (lastSyncedKey !== null && lastSyncedKey !== key)
  )

  const handleRegenerate = () => {
    failedKeyRef.current = null
    if (error) {
      void fetchBrief()
      return
    }
    if (lastSyncedKey !== key) {
      void fetchBrief()
    }
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
        <DialogContent className="flex max-h-[92vh] min-h-[min(78vh,44rem)] w-[calc(100%-1.5rem)] max-w-none flex-col border-border bg-card p-0 sm:!max-w-7xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandIcon.src}
                alt=""
                width={brandIcon.width}
                height={brandIcon.height}
                className="max-w-none shrink-0 object-contain"
                style={{ width: 60, height: 60 }}
              />
              Your Creative Brief
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Synthesized from {inspirations.length} saved inspiration
              {inspirations.length !== 1 ? "s" : ""}
            </p>
          </DialogHeader>

          <div className="min-h-0 flex-1 basis-0 overflow-y-auto px-6 py-5">
            {loading && !payload && (
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

            {loading && payload && (
              <p className="mb-4 text-sm text-muted-foreground">
                Updating for your latest saves…
              </p>
            )}

            {error && (
              <p className="py-4 text-sm text-red-400">{error}</p>
            )}

            {payload && (
              <div className="space-y-5 pb-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {payload.summary}
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
                  {payload.ideas.map((idea, i) => (
                    <div
                      key={i}
                      className="flex min-h-[5.5rem] items-start rounded-xl border border-[#FE2C5540] bg-[#FE2C5520] p-4 text-left text-sm font-medium leading-snug text-[#FE2C55] ring-1 ring-[#FE2C55]/10"
                    >
                      {idea}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!loading && (payload || error) && (
            <div className="shrink-0 border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={!canRegenerate}
                title={
                  !canRegenerate && !error
                    ? "Your saves haven’t changed — brief is up to date."
                    : undefined
                }
                onClick={handleRegenerate}
                className="border-border text-sm text-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
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
