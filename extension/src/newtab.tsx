import brandIcon from "../assets/icon.png"
import "./newtab.css"
import "./style.css"

function IndexNewtab() {
  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 16,
        minHeight: "100vh",
        boxSizing: "border-box"
      }}>
      <div
        className="new-tab-card"
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={brandIcon}
            alt=""
            width={36}
            height={36}
            style={{ objectFit: "contain", display: "block", flexShrink: 0 }}
          />
          <h1 style={{ margin: 0, fontSize: 22 }}>Lightbulb</h1>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
          New tab page — browse anywhere, then use the extension toolbar icon to
          capture inspiration in the sidebar.
        </p>
      </div>
    </div>
  )
}

export default IndexNewtab
