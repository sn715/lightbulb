"use client"

import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/types"

interface CategoryFilterProps {
  selected: Category | null
  onChange: (category: Category | null) => void
  counts: Record<string, number>
}

export function CategoryFilter({ selected, onChange, counts }: CategoryFilterProps) {
  return (
    <div className="space-y-1">
      <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium mb-3">
        Filter by category
      </p>

      <button
        onClick={() => onChange(null)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
          selected === null
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
        }`}
      >
        <span>All</span>
        <span className="text-xs text-zinc-500">
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
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              isSelected
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${colorClass}`}
              >
                {cat}
              </span>
            </div>
            <span className="text-xs text-zinc-500">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
