import cssText from "data-text:../style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

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
    const at = pathname.match(/^\/@([^/]+)/)
    if (at) return `@${at[1]}`
    // e.g. /toriheiserman5/video/7123456789012345678
    const vid = pathname.match(/^\/([^/@]+)\/video\/\d+/i)
    if (vid) {
      const seg = vid[1]
      const reserved = new Set([
        "explore",
        "following",
        "foryou",
        "live",
        "discover",
        "search",
        "upload",
        "tiktokstudio",
        "messages",
        "setting"
      ])
      if (!reserved.has(seg.toLowerCase())) {
        return seg.startsWith("@") ? seg : `@${seg}`
      }
    }
    const unique = document.querySelector(
      "[data-e2e='video-author-uniqueid'], [data-e2e='browse-username']"
    )
    const fromDom = unique?.textContent?.trim()
    if (fromDom) return fromDom.startsWith("@") ? fromDom : `@${fromDom}`
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

const SIDEBAR_WIDTH_KEY = "lightbulb_sidebar_width"
const SIDEBAR_MIN_W = 280
const SIDEBAR_MAX_W = 720
const SIDEBAR_DEFAULT_W = 360

/** Used with composedPath() so we detect events inside the panel (incl. open shadow roots). */
const PANEL_ATTR = "data-lightbulb-panel"

function isLightbulbInComposedPath(e: Event): boolean {
  const path = e.composedPath?.() ?? []
  for (const n of path) {
    if (n instanceof Element && n.hasAttribute(PANEL_ATTR)) return true
  }
  return false
}

// ── component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [panelWidth, setPanelWidth] = useState(SIDEBAR_DEFAULT_W)
  const [resizing, setResizing] = useState(false)
  const panelWidthRef = useRef(panelWidth)
  const [visible, setVisible] = useState(false)
  const [annotation, setAnnotation] = useState("")
  const [creator, setCreator] = useState("")
  const [url, setUrl] = useState(() => window.location.href)
  const [pageTitle, setPageTitle] = useState(() => document.title)
  const [suggestedCategory, setSuggestedCategory] = useState<Category | null>(
    null
  )
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRootRef = useRef<HTMLDivElement | null>(null)
  const annotationRef = useRef<HTMLTextAreaElement | null>(null)
  const visibleRef = useRef(false)

  panelWidthRef.current = panelWidth
  visibleRef.current = visible

  useEffect(() => {
    const blockPageInput = (e: Event) => {
      if (!visibleRef.current) return
      if (isLightbulbInComposedPath(e)) return
      e.preventDefault()
      e.stopPropagation()
    }
    const keyOpts: AddEventListenerOptions = { capture: true }
    const wheelOpts: AddEventListenerOptions = { capture: true, passive: false }
    window.addEventListener("keydown", blockPageInput, keyOpts)
    window.addEventListener("keyup", blockPageInput, keyOpts)
    window.addEventListener("keypress", blockPageInput, keyOpts)
    window.addEventListener("wheel", blockPageInput, wheelOpts)
    return () => {
      window.removeEventListener("keydown", blockPageInput, keyOpts)
      window.removeEventListener("keyup", blockPageInput, keyOpts)
      window.removeEventListener("keypress", blockPageInput, keyOpts)
      window.removeEventListener("wheel", blockPageInput, wheelOpts)
    }
  }, [])

  useLayoutEffect(() => {
    if (!visible) return
    const rootEl = panelRootRef.current
    if (!rootEl) return

    const focusId = window.requestAnimationFrame(() => {
      annotationRef.current?.focus({ preventScroll: true })
    })

    const stopBubbleToPage = (e: Event) => {
      e.stopPropagation()
    }

    const rootNode = rootEl.getRootNode()
    const attachTarget: EventTarget =
      rootNode instanceof ShadowRoot ? rootNode : rootEl

    const wheelLocal: AddEventListenerOptions = { passive: false }
    attachTarget.addEventListener("keydown", stopBubbleToPage)
    attachTarget.addEventListener("keyup", stopBubbleToPage)
    attachTarget.addEventListener("keypress", stopBubbleToPage)
    attachTarget.addEventListener("wheel", stopBubbleToPage, wheelLocal)

    return () => {
      window.cancelAnimationFrame(focusId)
      attachTarget.removeEventListener("keydown", stopBubbleToPage)
      attachTarget.removeEventListener("keyup", stopBubbleToPage)
      attachTarget.removeEventListener("keypress", stopBubbleToPage)
      attachTarget.removeEventListener("wheel", stopBubbleToPage, wheelLocal)
    }
  }, [visible])

  useEffect(() => {
    void chrome.storage.local.get([SIDEBAR_WIDTH_KEY]).then((r) => {
      const w = r[SIDEBAR_WIDTH_KEY]
      if (typeof w === "number" && w >= SIDEBAR_MIN_W && w <= SIDEBAR_MAX_W) {
        setPanelWidth(w)
      }
    })
  }, [])

  useEffect(() => {
    if (!resizing) return
    const clamp = (v: number) => {
      const max = Math.min(SIDEBAR_MAX_W, window.innerWidth - 80)
      return Math.round(Math.min(max, Math.max(SIDEBAR_MIN_W, v)))
    }
    const onMove = (e: MouseEvent) => {
      setPanelWidth(clamp(window.innerWidth - e.clientX))
    }
    const onUp = () => {
      setResizing(false)
      void chrome.storage.local.set({
        [SIDEBAR_WIDTH_KEY]: panelWidthRef.current
      })
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [resizing])

  const syncAuthSession = () => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email ?? null)
    })
  }

  useEffect(() => {
    syncAuthSession()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      syncAuthSession()
    })
    const onStorage: Parameters<
      typeof chrome.storage.onChanged.addListener
    >[0] = (changes, area) => {
      if (area !== "local") return
      if (Object.keys(changes).some((k) => k.startsWith("sb-"))) {
        syncAuthSession()
      }
    }
    chrome.storage.onChanged.addListener(onStorage)
    return () => {
      sub.subscription.unsubscribe()
      chrome.storage.onChanged.removeListener(onStorage)
    }
  }, [])

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

  useEffect(() => {
    if (visible) syncAuthSession()
  }, [visible])

  const syncPageMetadata = useCallback(() => {
    setUrl(window.location.href)
    setPageTitle(document.title)
    setCreator(detectCreatorHandle())
  }, [])

  useLayoutEffect(() => {
    if (!visible) return
    syncPageMetadata()
  }, [visible, syncPageMetadata])

  useEffect(() => {
    if (!visible) return
    const onPopState = () => {
      syncPageMetadata()
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [visible, syncPageMetadata])

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

  const openExtensionSignIn = () => {
    void chrome.runtime.openOptionsPage()
  }

  const handleSave = async () => {
    if (!annotation.trim() || !selectedCategory) return
    setSaveState("saving")
    setSaveErrorDetail(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaveState("error")
      setSaveErrorDetail(
        "Sign in under Extension options (same account as the dashboard)."
      )
      setTimeout(() => {
        setSaveState("idle")
        setSaveErrorDetail(null)
      }, 5000)
      return
    }

    const { error: profileErr } = await supabase.from("profiles").upsert(
      { id: user.id, email: user.email ?? "" },
      { onConflict: "id" }
    )
    if (profileErr) {
      setSaveState("error")
      setSaveErrorDetail(
        profileErr.message ||
          "Could not create your profile row. Run the latest supabase/schema.sql in the SQL Editor (includes profile insert policy + backfill)."
      )
      setTimeout(() => {
        setSaveState("idle")
        setSaveErrorDetail(null)
      }, 5000)
      return
    }

    const resolvedUrl = window.location.href
    const resolvedTitle = document.title
    const detectedCreator = detectCreatorHandle()
    const resolvedCreator =
      creator.trim() || (detectedCreator ? detectedCreator : null)

    setUrl(resolvedUrl)
    setPageTitle(resolvedTitle)

    const { error } = await supabase.from("inspirations").insert({
      user_id: user.id,
      url: resolvedUrl,
      page_title: resolvedTitle,
      creator_handle: resolvedCreator,
      annotation: annotation.trim(),
      category: selectedCategory,
      ai_suggested_category: suggestedCategory,
      thumbnail_url: null
    })

    if (error) {
      setSaveState("error")
      setSaveErrorDetail(error.message || "Could not save")
      setTimeout(() => {
        setSaveState("idle")
        setSaveErrorDetail(null)
      }, 5000)
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
      ref={panelRootRef}
      data-lightbulb-panel=""
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: panelWidth,
        height: "100vh",
        zIndex: 2147483647,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        borderLeft: "1px solid #1f1f1f",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
        overflowY: "auto",
        boxSizing: "border-box",
        overscrollBehavior: "contain"
      }}>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Drag to resize sidebar"
        onMouseDown={(e) => {
          e.preventDefault()
          setResizing(true)
        }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: "ew-resize",
          zIndex: 20,
          background:
            "linear-gradient(90deg, rgba(124,58,237,0.45), transparent)"
        }}
      />
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
      {userEmail ? (
        <div
          style={{
            padding: "8px 20px 0",
            fontSize: 11,
            color: "#6b7280"
          }}>
          Signed in as {userEmail}
        </div>
      ) : (
        <div
          style={{
            padding: "10px 20px 0",
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}>
          <span style={{ fontSize: 12, color: "#fbbf24" }}>
            Not signed in — saves will fail until you sign in via extension
            options.
          </span>
          <button
            type="button"
            onClick={openExtensionSignIn}
            style={{
              alignSelf: "flex-start",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #6b21a8",
              background: "#1f1035",
              color: "#e9d5ff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}>
            Open sign-in (extension options)
          </button>
        </div>
      )}

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
            ref={annotationRef}
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
              fontSize: 13,
              padding: "12px 16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 10
            }}>
            <span>{saveErrorDetail ?? "Could not save."}</span>
            <button
              type="button"
              onClick={openExtensionSignIn}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #fca5a5",
                background: "transparent",
                color: "#fecaca",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}>
              Extension sign-in…
            </button>
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
