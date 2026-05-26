import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { EnvDebugBadge } from '@/components/EnvDebugBadge'
import './globals.css'

export const metadata: Metadata = {
  title: 'BuildMore | 부동산 매매·개발 AI Deal Solution',
  description:
    '상업용 부동산과 꼬마빌딩 매매·개발 후보를 주소 기반으로 분석해 추천 용도, 공사 시나리오, ROE, 최대 매입가, 리스크, 리포트까지 연결하는 AI 솔루션입니다.',
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
