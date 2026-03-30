"use client"

import { useState } from "react"
import { CategoryFilter } from "./category-filter"
import { InspirationCard } from "./inspiration-card"
import { CreatorsSection } from "./creators-section"
import { BriefModal } from "./brief-modal"
import { CATEGORIES, type Category, type Inspiration } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface MoodboardProps {
  inspirations: Inspiration[]
  userEmail: string
}

export function Moodboard({ inspirations, userEmail }: MoodboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const router = useRouter()

  const counts = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = inspirations.filter((i) => i.category === cat).length
      return acc
    },
    {} as Record<string, number>
  )

  const filtered = selectedCategory
    ? inspirations.filter((i) => i.category === selectedCategory)
    : inspirations

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <span className="font-bold text-lg tracking-tight">Lightbulb</span>
          </div>

          <div className="flex items-center gap-3">
            <BriefModal inspirations={inspirations} />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-zinc-400 hover:text-white text-sm"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar filter */}
        <aside className="w-52 shrink-0">
          <CategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
            counts={counts}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-10">
          {/* Moodboard grid */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-lg">
                  {selectedCategory ?? "All Inspirations"}
                </h2>
                <p className="text-zinc-500 text-sm mt-0.5">
                  {filtered.length} saved{" "}
                  {filtered.length === 1 ? "piece" : "pieces"}
                </p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-zinc-600">
                <p className="text-4xl mb-3">💡</p>
                <p className="text-sm">
                  No inspirations yet. Install the extension and start saving!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((ins) => (
                  <InspirationCard key={ins.id} inspiration={ins} />
                ))}
              </div>
            )}
          </section>

          {/* Creators section */}
          <CreatorsSection inspirations={inspirations} />
        </main>
      </div>
    </div>
  )
}
