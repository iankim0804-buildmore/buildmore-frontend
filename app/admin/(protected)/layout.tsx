import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('buildmore_admin_token')?.value
  const expectedToken = process.env.ADMIN_TOKEN

  // If no token or token mismatch, redirect to login
  if (!adminToken || adminToken !== expectedToken) {
    redirect('/admin/login')
  }

  return <>{children}</>
}
