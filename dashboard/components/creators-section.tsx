import type { Inspiration } from "@/lib/types"

interface Creator {
  handle: string
  url: string
  count: number
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

export function CreatorsSection({ inspirations }: { inspirations: Inspiration[] }) {
  // Deduplicate creators: keep first URL seen per handle, count appearances
  const creatorsMap = new Map<string, Creator>()

  for (const ins of inspirations) {
    if (!ins.creator_handle) continue
    if (!creatorsMap.has(ins.creator_handle)) {
      creatorsMap.set(ins.creator_handle, {
        handle: ins.creator_handle,
        url: ins.url,
        count: 1
      })
    } else {
      creatorsMap.get(ins.creator_handle)!.count++
    }
  }

  const creators = Array.from(creatorsMap.values()).sort(
    (a, b) => b.count - a.count
  )

  if (creators.length === 0) return null

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-semibold text-lg text-foreground">
          Your Inspiration Sources
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Creators whose work moves you
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {creators.map((creator) => (
          <a
            key={creator.handle}
            href={creator.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 transition-colors hover:border-primary/50 hover:bg-accent"
          >
            <span className="text-sm font-medium text-primary group-hover:brightness-110">
              {creator.handle}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {creator.count}×
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {getDomain(creator.url)}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
