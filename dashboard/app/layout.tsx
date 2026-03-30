import type { Metadata } from "next"
import { TikTok_Sans } from "next/font/google"
import "./globals.css"

/** UI / headings — wired to `--font-sans` in globals.css. */
const tiktokSans = TikTok_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-tiktok-sans",
  display: "swap"
})

export const metadata: Metadata = {
  title: "Lightbulb",
  description:
    "Capture and act on creative inspiration from anywhere on the web."
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${tiktokSans.variable} h-full antialiased dark`}
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
