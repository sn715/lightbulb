"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError("Check your email to confirm your account.")
        setLoading(false)
        return
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">💡</span>
            <span className="text-white font-bold text-2xl tracking-tight">
              Lightbulb
            </span>
          </div>
          <p className="text-zinc-500 text-sm">
            Your creative inspiration board
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h1 className="text-white font-semibold text-lg mb-6">
            {isSignUp ? "Create account" : "Sign in"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-400 text-xs uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-400 text-xs uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>

            {error && (
              <p className={`text-sm ${error.includes("Check your email") ? "text-green-400" : "text-red-400"}`}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError("") }}
              className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
