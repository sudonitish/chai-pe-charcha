import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Chai Pe Charcha",
  description: "Fair tea making rotation for your flat",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
