import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RJL — Respaldo Jurídico Laboral',
  description: 'Certeza Jurídica en la Palma de su Mano. Calcula tus derechos laborales y guarda evidencias.',
  keywords: ['derechos laborales', 'liquidación', 'LFT', 'México', 'asesoría laboral'],
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-navy text-cream font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
