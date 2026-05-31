import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BodyMap - Find the Right Doctor',
  description: 'Interactive 3D body mapping for finding specialized medical professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-background font-body min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
        {children}
      </body>
    </html>
  )
}
