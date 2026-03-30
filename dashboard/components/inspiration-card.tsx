import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const domain = getDomain(inspiration.url)
  const faviconUrl = getFaviconUrl(inspiration.url)
  const colorClass =
    CATEGORY_COLORS[inspiration.category] ?? CATEGORY_COLORS["Other"]

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors group">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Annotation */}
        <p className="text-zinc-100 text-sm leading-relaxed line-clamp-4">
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
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
          <div className="flex items-center gap-2 min-w-0">
            {faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl}
                alt=""
                width={12}
                height={12}
                className="opacity-50 shrink-0"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            {inspiration.creator_handle ? (
              <a
                href={inspiration.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 text-xs hover:text-purple-300 truncate font-medium"
              >
                {inspiration.creator_handle}
              </a>
            ) : (
              <a
                href={inspiration.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 text-xs hover:text-zinc-400 truncate"
              >
                {domain}
              </a>
            )}
          </div>
          <span className="text-zinc-600 text-xs shrink-0 ml-2">
            {formatTimeAgo(inspiration.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
