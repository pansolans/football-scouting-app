import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Football Scouting App',
  description: 'Professional football player scouting and analysis platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
