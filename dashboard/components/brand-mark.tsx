import { brandIcon } from "@/lib/brand-icon"

type BrandMarkProps = {
  /** Header / nav row */
  variant?: "header" | "hero" | "inline" | "empty"
  showWordmark?: boolean
  className?: string
  wordmarkClassName?: string
}

const dimensions = {
  header: 80,
  hero: 40,
  inline: 28,
  empty: 80
} as const

export function BrandMark({
  variant = "header",
  showWordmark = false,
  className = "",
  wordmarkClassName = ""
}: BrandMarkProps) {
  const px = dimensions[variant]
  const alt = showWordmark ? "" : "Lightbulb"
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* Native img: same SSR/CSR markup; avoids next/image hydration quirks on static imports */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandIcon.src}
        alt={alt}
        width={brandIcon.width}
        height={brandIcon.height}
        className="max-w-none shrink-0 object-contain"
        style={{ width: px, height: px }}
        fetchPriority={variant === "hero" ? "high" : undefined}
      />
      {showWordmark ? (
        <span className={wordmarkClassName}>Lightbulb</span>
      ) : null}
    </div>
  )
}
