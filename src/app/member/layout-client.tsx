'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Calendar, User, LogOut, MessageSquare, Dumbbell } from 'lucide-react'
import { JWTPayload } from '@/lib/auth/jwt'

export default function MemberLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode
  user: JWTPayload
}) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PT Buddy
              </h1>
              <span className="text-sm text-gray-500">회원</span>
            </div>

            <nav className="hidden md:flex items-center gap-4">
              <Link href="/member/dashboard">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  홈
                </Button>
              </Link>
              <Link href="/member/workouts">
                <Button variant="ghost" size="sm">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  운동 기록
                </Button>
              </Link>
              <Link href="/community">
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  커뮤니티
                </Button>
              </Link>
              <Link href="/member/settings">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  설정
                </Button>
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 hidden sm:inline">
                {user.name}님
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main>{children}</main>
    </div>
  )
}
