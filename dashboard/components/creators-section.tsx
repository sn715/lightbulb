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
        <h2 className="text-white font-semibold text-lg">
          Your Inspiration Sources
        </h2>
        <p className="text-zinc-500 text-sm mt-0.5">
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
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800 rounded-full px-4 py-2 transition-colors group"
          >
            <span className="text-purple-400 font-medium text-sm group-hover:text-purple-300">
              {creator.handle}
            </span>
            <span className="text-zinc-600 text-xs">
              {creator.count}×
            </span>
            <span className="text-zinc-600 text-xs">
              {getDomain(creator.url)}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
