import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard | BuildMore',
  description: 'BuildMore 관리자 대시보드',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      {children}
    </div>
  )
}
