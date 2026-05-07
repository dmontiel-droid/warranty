import type { Metadata } from 'next'
import { DM_Serif_Display, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const display = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})
const mono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Warranty Claims · Kanguro',
  description: 'Daily warranty claim monitoring dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
