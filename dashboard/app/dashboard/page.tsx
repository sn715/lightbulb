import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Moodboard } from "@/components/moodboard"
import type { Inspiration } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: inspirations } = await supabase
    .from("inspirations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <Moodboard
      inspirations={(inspirations ?? []) as Inspiration[]}
      userEmail={user.email ?? ""}
    />
  )
}
