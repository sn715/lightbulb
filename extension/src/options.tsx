import { useEffect, useState } from "react"

import brandIcon from "../assets/icon.png"
import "./options.css"
import { supabase } from "./lib/supabase"

const DASHBOARD_URL = "http://localhost:3000/login"

function IndexOptions() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const refreshUser = () => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email ?? null)
    })
  }

  useEffect(() => {
    refreshUser()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshUser()
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    setLoading(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage("Signed in. Close this tab and save from the sidebar on any site.")
    setPassword("")
  }

  const handleSignOut = async () => {
    setMessage("")
    await supabase.auth.signOut()
    setUserEmail(null)
    setMessage("Signed out.")
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#111",
        maxWidth: 480
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img
          src={brandIcon}
          alt=""
          width={32}
          height={32}
          style={{ objectFit: "contain", display: "block", flexShrink: 0 }}
        />
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Lightbulb</h1>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#444" }}>
        Sign in here with the <strong>same email and password</strong> you use on
        the web dashboard. The extension keeps its own session in extension
        storage (logging in on localhost does not log in the extension).
      </p>

      {userEmail ? (
        <div
          style={{
            padding: 14,
            background: "#ecfdf5",
            border: "1px solid #6ee7b7",
            borderRadius: 10,
            fontSize: 14
          }}>
          <strong>Signed in as</strong> {userEmail}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            style={{
              display: "block",
              marginTop: 10,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13
            }}>
            Sign out
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => void handleSignIn(e)}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 14
            }}
          />
          <label style={{ fontSize: 13, fontWeight: 600 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 14
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "12px 14px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer"
            }}>
            {loading ? "Signing in…" : "Sign in to extension"}
          </button>
        </form>
      )}

      {message ? (
        <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{message}</p>
      ) : null}

      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: 14 }}>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>
          No account yet? Create one on the dashboard first.
        </p>
        <a
          href={DASHBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 10,
            background: "#f4f4f5",
            color: "#3f3f46",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none"
          }}>
          Open dashboard (sign up / login)
        </a>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
        Supabase URL and anon key come from <code>.env</code> in the extension
        folder. Reload the extension after changing them.
      </p>
    </div>
  )
}

export default IndexOptions
