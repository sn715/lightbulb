"use client"

import { cn } from "@/lib/utils"
import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/types"

interface CategoryFilterProps {
  selected: Category | null
  onChange: (category: Category | null) => void
  counts: Record<string, number>
  className?: string
}

const rowBtn =
  "w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl text-base transition-colors min-h-[2.75rem]"

/** Space between each filter row — use Tailwind gap-* (e.g. gap-1, gap-2, gap-3, gap-4). */
const FILTER_ROW_GAP = "gap-2"

export function CategoryFilter({
  selected,
  onChange,
  counts,
  className
}: CategoryFilterProps) {
  return (
    <div className={className}>
      <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Filter by category
      </p>

      <div className={cn("flex flex-col", FILTER_ROW_GAP)}>
        <button
          onClick={() => onChange(null)}
          className={cn(
            rowBtn,
            selected === null
              ? "bg-bg-surface text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <span className="font-medium">All</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {Object.values(counts).reduce((a, b) => a + b, 0)}
          </span>
        </button>

        {CATEGORIES.map((cat) => {
          const colorClass = CATEGORY_COLORS[cat]
          const isSelected = selected === cat
          const count = counts[cat] ?? 0

          return (
            <button
              key={cat}
              onClick={() => onChange(isSelected ? null : cat)}
              className={cn(
                rowBtn,
                isSelected
                  ? "bg-bg-surface text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex max-w-full items-center rounded-md border px-2 py-1 text-sm",
                    colorClass
                  )}
                >
                  {cat}
                </span>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
