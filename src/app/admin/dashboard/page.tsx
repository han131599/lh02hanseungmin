'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  UserCircle,
  Calendar,
  CreditCard,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle2
} from 'lucide-react'

interface DashboardStats {
  totalTrainers: number
  activeTrainers: number
  deletedTrainers: number
  totalMembers: number
  activeMembers: number
  deletedMembers: number
  totalAppointments: number
  completedAppointments: number
  totalMemberships: number
  activeMemberships: number
  totalRevenue: number
  monthlyRevenue: number
}

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  deletedAt: string | null
  createdAt: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentUsers(data.recentUsers)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            관리자 대시보드
          </h1>
          <p className="text-gray-600 mt-2">시스템 전체 현황을 한눈에 확인하세요</p>
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">트레이너</CardTitle>
            <UserCircle className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totalTrainers || 0}
            </div>
            <div className="flex gap-3 text-xs mt-2">
              <span className="text-green-600">활성 {stats?.activeTrainers || 0}</span>
              <span className="text-red-600">탈퇴 {stats?.deletedTrainers || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">회원</CardTitle>
            <Users className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.totalMembers || 0}
            </div>
            <div className="flex gap-3 text-xs mt-2">
              <span className="text-green-600">활성 {stats?.activeMembers || 0}</span>
              <span className="text-red-600">탈퇴 {stats?.deletedMembers || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">전체 일정</CardTitle>
            <Calendar className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats?.totalAppointments || 0}
            </div>
            <div className="flex gap-3 text-xs mt-2">
              <span className="text-green-600">완료 {stats?.completedAppointments || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">활성 수강권</CardTitle>
            <CreditCard className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.activeMemberships || 0}
            </div>
            <div className="flex gap-3 text-xs mt-2">
              <span className="text-gray-600">전체 {stats?.totalMemberships || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 수익 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-emerald-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                이번 달 수익
              </CardTitle>
              <CardDescription>신규 수강권 판매 기준</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-600">
              ₩{(stats?.monthlyRevenue || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-indigo-700 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                총 누적 수익
              </CardTitle>
              <CardDescription>전체 수강권 판매 누적</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-indigo-600">
              ₩{(stats?.totalRevenue || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 가입 사용자 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 가입 사용자</CardTitle>
          <CardDescription>최근 10명의 사용자 목록</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    등록된 사용자가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === 'trainer'
                            ? 'default'
                            : user.role === 'admin'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {user.role === 'trainer' ? '트레이너' : user.role === 'admin' ? '관리자' : '회원'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.deletedAt ? (
                        <Badge variant="destructive">탈퇴</Badge>
                      ) : user.isActive ? (
                        <Badge variant="default" className="bg-green-600">활성</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 빠른 작업 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>자주 사용하는 관리 기능</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => window.location.href = '/admin/trainers'}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  <span className="font-semibold">트레이너 관리</span>
                </div>
                <span className="text-xs text-gray-500">전체 트레이너 조회</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => window.location.href = '/admin/members'}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">회원 관리</span>
                </div>
                <span className="text-xs text-gray-500">전체 회원 조회</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => window.location.href = '/admin/statistics'}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="font-semibold">통계 보기</span>
                </div>
                <span className="text-xs text-gray-500">상세 분석</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => window.location.href = '/admin/settings'}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">시스템 설정</span>
                </div>
                <span className="text-xs text-gray-500">관리자 설정</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
