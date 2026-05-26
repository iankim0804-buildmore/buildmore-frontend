import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { EnvDebugBadge } from '@/components/EnvDebugBadge'
import './globals.css'

export const metadata: Metadata = {
  title: 'BuildMore | 상업용 부동산 AI Pre-Underwriting',
  description:
    '주소, 실거래, 임대수익, 법규, 금융 조건을 바탕으로 LTV, NOI, DSCR, Bankability Score를 계산하는 상업용 부동산 투자 검토 서비스입니다.',
  generator: 'BuildMore',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a2744',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="bg-background">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NEXT_PUBLIC_SHOW_ENV_BADGE === 'true' && <EnvDebugBadge />}
      </body>
    </html>
  )
}
