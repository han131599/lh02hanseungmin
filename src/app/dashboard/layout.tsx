import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/jwt'
import DashboardNav from '@/components/dashboard/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="container mx-auto py-6 px-4">{children}</main>
    </div>
  )
}
