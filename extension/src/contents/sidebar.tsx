import cssText from "data-text:../style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useEffect, useRef, useState } from "react"

import { suggestCategory, CATEGORY_LIST, type Category } from "../lib/claude"
import { supabase } from "../lib/supabase"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// ── helpers ──────────────────────────────────────────────────────────────────

function detectCreatorHandle(): string {
  const { hostname, pathname } = window.location

  if (hostname.includes("tiktok.com")) {
    const match = pathname.match(/^\/@([^/]+)/)
    if (match) return `@${match[1]}`
  }

  if (hostname.includes("instagram.com")) {
    const match = pathname.match(/^\/([^/]+)/)
    if (match && !["p", "reel", "stories", "explore"].includes(match[1])) {
      return `@${match[1]}`
    }
  }

  if (hostname.includes("youtube.com")) {
    const match = pathname.match(/^\/@([^/]+)/)
    if (match) return `@${match[1]}`
    const channelEl = document.querySelector(
      "#channel-name a, ytd-video-owner-renderer a"
    )
    if (channelEl) return channelEl.textContent?.trim() ?? ""
  }

  return ""
}

const CATEGORY_COLORS: Record<Category, string> = {
  "Visual Art": "#a855f7",
  Music: "#3b82f6",
  "Motion & Animation": "#06b6d4",
  Lifestyle: "#ec4899",
  Photography: "#f59e0b",
  Writing: "#22c55e",
  Other: "#6b7280"
}

const DASHBOARD_URL = "http://localhost:3000/dashboard"

// ── component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [visible, setVisible] = useState(false)
  const [annotation, setAnnotation] = useState("")
  const [creator, setCreator] = useState("")
  const [url] = useState(window.location.href)
  const [pageTitle] = useState(document.title)
  const [suggestedCategory, setSuggestedCategory] = useState<Category | null>(
    null
  )
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle")

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Listen for toggle message from background script
  useEffect(() => {
    const handler = (message: { type: string }) => {
      if (message.type === "TOGGLE_SIDEBAR") {
        setVisible((v) => !v)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  // Auto-detect creator on mount
  useEffect(() => {
    setCreator(detectCreatorHandle())
  }, [])

  // Debounced category suggestion
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (annotation.trim().length < 10) {
      setSuggestedCategory(null)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSuggesting(true)
      try {
        const category = await suggestCategory(annotation)
        setSuggestedCategory(category)
        if (!selectedCategory) setSelectedCategory(category)
      } catch {
        // silently fail — user can pick manually
      } finally {
        setIsSuggesting(false)
      }
    }, 800)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [annotation])

  const handleSave = async () => {
    if (!annotation.trim() || !selectedCategory) return
    setSaveState("saving")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaveState("error")
      return
    }

    const { error } = await supabase.from("inspirations").insert({
      user_id: user.id,
      url,
      page_title: pageTitle,
      creator_handle: creator || null,
      annotation: annotation.trim(),
      category: selectedCategory,
      ai_suggested_category: suggestedCategory,
      thumbnail_url: null
    })

    if (error) {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    } else {
      setSaveState("success")
      setTimeout(() => {
        setSaveState("idle")
        setAnnotation("")
        setSuggestedCategory(null)
        setSelectedCategory(null)
      }, 2000)
    }
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "360px",
        height: "100vh",
        zIndex: 2147483647,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        borderLeft: "1px solid #1f1f1f",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
        overflowY: "auto"
      }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #1f1f1f",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <span
            style={{
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "-0.3px"
            }}>
            Lightbulb
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
            borderRadius: 4
          }}>
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        {/* Annotation */}
        <div>
          <label
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
            What inspires you about this?
          </label>
          <textarea
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
            placeholder="The way they used negative space to create tension..."
            rows={4}
            style={{
              width: "100%",
              background: "#141414",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              color: "#f3f4f6",
              fontSize: 14,
              lineHeight: 1.5,
              padding: "10px 12px",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s"
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "#6b21a8")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "#2a2a2a")
            }
          />
        </div>

        {/* Category chips */}
        <div>
          <label
            style={{
              color: "#9ca3af",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
            Category
            {isSuggesting && (
              <span style={{ color: "#6b21a8", fontSize: 11 }}>
                ✦ thinking...
              </span>
            )}
            {suggestedCategory && !isSuggesting && (
              <span style={{ color: "#a855f7", fontSize: 11 }}>
                ✦ AI suggested
              </span>
            )}
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORY_LIST.map((cat) => {
              const isSelected = selectedCategory === cat
              const isSuggested = suggestedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: isSelected
                      ? CATEGORY_COLORS[cat]
                      : "#141414",
                    border: `1px solid ${isSelected ? CATEGORY_COLORS[cat] : isSuggested ? CATEGORY_COLORS[cat] + "66" : "#2a2a2a"}`,
                    borderRadius: 20,
                    color: isSelected ? "#ffffff" : "#9ca3af",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                    padding: "4px 12px",
                    transition: "all 0.15s"
                  }}>
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Creator */}
        <div>
          <label
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
            Creator
          </label>
          <input
            type="text"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="@username"
            style={{
              width: "100%",
              background: "#141414",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              color: "#f3f4f6",
              fontSize: 14,
              padding: "8px 12px",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* URL (read-only) */}
        <div>
          <label
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
            Source
          </label>
          <div
            style={{
              background: "#141414",
              border: "1px solid #1f1f1f",
              borderRadius: 8,
              color: "#6b7280",
              fontSize: 12,
              padding: "8px 12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
            title={url}>
            {url}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #1f1f1f",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
        {saveState === "success" ? (
          <div
            style={{
              background: "#14532d",
              border: "1px solid #166534",
              borderRadius: 10,
              color: "#86efac",
              fontSize: 14,
              fontWeight: 500,
              padding: "12px 16px",
              textAlign: "center"
            }}>
            ✓ Inspiration saved!
          </div>
        ) : saveState === "error" ? (
          <div
            style={{
              background: "#450a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 14,
              padding: "12px 16px",
              textAlign: "center"
            }}>
            Failed to save. Are you signed in?
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={!annotation.trim() || !selectedCategory || saveState === "saving"}
            style={{
              background:
                !annotation.trim() || !selectedCategory
                  ? "#1f1f1f"
                  : "linear-gradient(135deg, #7c3aed, #6d28d9)",
              border: "none",
              borderRadius: 10,
              color:
                !annotation.trim() || !selectedCategory ? "#4b5563" : "#ffffff",
              cursor:
                !annotation.trim() || !selectedCategory
                  ? "not-allowed"
                  : "pointer",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 16px",
              transition: "all 0.15s",
              width: "100%"
            }}>
            {saveState === "saving" ? "Saving..." : "Save Inspiration"}
          </button>
        )}

        <a
          href={DASHBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#6b7280",
            fontSize: 12,
            textAlign: "center",
            textDecoration: "none"
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.color = "#a855f7")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.color = "#6b7280")
          }>
          Open Dashboard →
        </a>
      </div>
    </div>
  )
}
