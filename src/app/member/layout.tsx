import { getCurrentUser } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import MemberLayoutClient from './layout-client'

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'member') {
    redirect('/auth/login')
  }

  return <MemberLayoutClient user={user}>{children}</MemberLayoutClient>
}
