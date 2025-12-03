import { getCurrentUser } from '@/lib/auth/jwt'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // 관리자가 아니면 로그인 페이지로 리다이렉트
  if (!user || user.role !== 'admin') {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                PT Buddy Admin
              </h1>
              <p className="text-xs text-gray-600">{user.name} (관리자)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <NavLink href="/admin/dashboard" icon={LayoutDashboard}>
              대시보드
            </NavLink>
            <NavLink href="/admin/trainers" icon={UserCircle}>
              트레이너 관리
            </NavLink>
            <NavLink href="/admin/members" icon={Users}>
              회원 관리
            </NavLink>
            <NavLink href="/admin/statistics" icon={BarChart3}>
              통계
            </NavLink>
            <NavLink href="/admin/settings" icon={Settings}>
              설정
            </NavLink>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main>{children}</main>
    </div>
  )
}

function NavLink({
  href,
  icon: Icon,
  children
}: {
  href: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-b-2 border-transparent hover:border-purple-600 transition-colors"
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  )
}
