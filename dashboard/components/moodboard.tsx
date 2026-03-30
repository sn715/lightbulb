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
import { BrandMark } from "@/components/brand-mark"

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-0">
          <BrandMark
            variant="header"
            className="justify-start"
            wordmarkClassName="font-bold text-lg tracking-tight text-foreground"
          />

          <div className="flex items-center gap-3">
            <BriefModal inspirations={inspirations} />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-muted-foreground hover:bg-accent hover:text-foreground text-sm"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="w-60 shrink-0">
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
                <h2 className="font-semibold text-lg text-foreground">
                  {selectedCategory ?? "All Inspirations"}
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {filtered.length} saved{" "}
                  {filtered.length === 1 ? "piece" : "pieces"}
                </p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-[var(--text-tertiary)]">
                <div className="mb-3 flex justify-center opacity-60">
                  <BrandMark variant="empty" showWordmark={false} />
                </div>
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
