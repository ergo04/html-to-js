import type { Metadata } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import { RippleThemeProvider } from '@/components/ripple-theme-provider'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: 'HTML to JS Converter - DOM Code Generator',
  description: 'Convert HTML fragments to vanilla JavaScript DOM creation code. Transform static HTML/SVG into document.createElement instructions automatically.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <RippleThemeProvider>
          {children}
        </RippleThemeProvider>
      </body>
    </html>
  )
}
