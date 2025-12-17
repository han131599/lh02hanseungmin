'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar, Users, CreditCard, BarChart3, LogOut, Pill, MessageSquare } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: BarChart3 },
  { href: '/dashboard/calendar', label: '일정', icon: Calendar },
  { href: '/dashboard/members', label: '회원 관리', icon: Users },
  { href: '/dashboard/memberships', label: '수강권', icon: CreditCard },
  { href: '/dashboard/supplements', label: '보조제 관리', icon: Pill },
  { href: '/community', label: '커뮤니티', icon: MessageSquare },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
    })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              PT Buddy
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </div>
    </nav>
  )
}
