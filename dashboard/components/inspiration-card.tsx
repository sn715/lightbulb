"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { CATEGORY_COLORS, type Inspiration } from "@/lib/types"

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

function getFaviconUrl(url: string) {
  try {
    const origin = new URL(url).origin
    return `${origin}/favicon.ico`
  } catch {
    return null
  }
}

export function InspirationCard({ inspiration }: { inspiration: Inspiration }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const domain = getDomain(inspiration.url)
  const faviconUrl = getFaviconUrl(inspiration.url)
  const colorClass =
    CATEGORY_COLORS[inspiration.category] ?? CATEGORY_COLORS["Other"]

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (
      !window.confirm(
        "Delete this inspiration? This cannot be undone."
      )
    ) {
      return
    }

    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("inspirations")
      .delete()
      .eq("id", inspiration.id)

    setDeleting(false)
    if (error) {
      window.alert(error.message)
      return
    }
    router.refresh()
  }

  return (
    <Card className="group relative border border-border bg-card transition-colors hover:border-[var(--border-focus)]/40">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={deleting}
        onClick={handleDelete}
        className="absolute right-2 top-2 z-10 text-muted-foreground opacity-70 transition-opacity hover:bg-accent hover:text-red-400 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Delete inspiration"
      >
        <Trash2 className="size-4" />
      </Button>

      <CardContent className="flex flex-col gap-3 p-4 pr-12">
        {/* Annotation */}
        <p className="text-sm leading-relaxed text-foreground line-clamp-4">
          {inspiration.annotation}
        </p>

        {/* Category */}
        <Badge
          variant="outline"
          className={`self-start text-xs font-medium border ${colorClass}`}
        >
          {inspiration.category}
        </Badge>

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-border pt-1">
          <div className="flex min-w-0 items-center gap-2">
            {faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl}
                alt=""
                width={12}
                height={12}
                className="shrink-0 opacity-50"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            {inspiration.creator_handle ? (
              <a
                href={inspiration.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs font-medium text-primary hover:brightness-110"
              >
                {inspiration.creator_handle}
              </a>
            ) : (
              <a
                href={inspiration.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-muted-foreground hover:text-foreground"
              >
                {domain}
              </a>
            )}
          </div>
          <span className="ml-2 shrink-0 text-xs text-[var(--text-tertiary)]">
            {formatTimeAgo(inspiration.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
