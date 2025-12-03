import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, CreditCard, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 트레이너만 접근 가능
  if (user.role !== 'trainer') {
    redirect('/member/dashboard')
  }

  // 트레이너 정보 및 통계 조회 (Prisma 사용)
  const trainer = await prisma.trainer.findUnique({
    where: { id: user.userId },
    include: {
      members: {
        where: { isActive: true },
        include: {
          memberships: {
            where: { isActive: true },
            orderBy: { endDate: 'asc' }
          }
        }
      },
      appointments: {
        where: {
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        },
        include: {
          member: true
        },
        orderBy: { scheduledAt: 'asc' }
      }
    }
  })

  if (!trainer) {
    redirect('/auth/login')
  }

  // 통계 계산
  const totalActiveMembers = trainer.members.length
  const todayAppointments = trainer.appointments
  const completedToday = todayAppointments.filter(a => a.status === 'completed').length
  const upcomingToday = todayAppointments.filter(a => a.status === 'scheduled').length

  // 만료 임박 수강권 (7일 이내)
  const expiringMemberships = trainer.members
    .flatMap(m => m.memberships)
    .filter(ms => {
      if (ms.type === 'period' && ms.endDate) {
        const daysUntilExpiry = Math.ceil((ms.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
      }
      if (ms.type === 'session' && ms.remainingSessions) {
        return ms.remainingSessions <= 3
      }
      return false
    })
    .length

  // 이번 주 수익 계산
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const thisWeekRevenue = await prisma.membership.aggregate({
    where: {
      member: {
        trainerId: trainer.id
      },
      createdAt: {
        gte: weekStart
      }
    },
    _sum: {
      price: true
    }
  })

  const revenue = Number(thisWeekRevenue._sum.price || 0)

  // 다가오는 일정 (최근 5개)
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      trainerId: trainer.id,
      scheduledAt: {
        gte: new Date()
      },
      status: 'scheduled'
    },
    include: {
      member: true
    },
    orderBy: {
      scheduledAt: 'asc'
    },
    take: 5
  })

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          안녕하세요, {trainer.name}님! 오늘도 화이팅입니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 회원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveMembers}명</div>
            <p className="text-xs text-muted-foreground">
              최대 {trainer.maxMembers}명까지 관리 가능
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 일정</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}건</div>
            <p className="text-xs text-muted-foreground">
              완료 {completedToday}건 / 예정 {upcomingToday}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 주 수익</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue.toLocaleString()}원
            </div>
            <p className="text-xs text-muted-foreground">
              신규 수강권 판매 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">만료 임박</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringMemberships}건</div>
            <p className="text-xs text-muted-foreground">
              7일 이내 또는 3회 이하 남음
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 오늘의 일정 */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>오늘의 일정</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </CardDescription>
            </div>
            <Link href="/dashboard/calendar">
              <Button variant="outline" size="sm">전체 보기</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  오늘 예정된 일정이 없습니다.
                </p>
              ) : (
                todayAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{appointment.member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.scheduledAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} ({appointment.duration}분)
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      appointment.status === 'completed' ? 'default' :
                      appointment.status === 'scheduled' ? 'secondary' :
                      appointment.status === 'cancelled' ? 'destructive' :
                      'outline'
                    }>
                      {appointment.status === 'completed' ? '완료' :
                       appointment.status === 'scheduled' ? '예정' :
                       appointment.status === 'cancelled' ? '취소' :
                       '노쇼'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 최근 회원 및 다가오는 일정 */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>다가오는 일정</CardTitle>
              <CardDescription>예정된 PT 세션</CardDescription>
            </div>
            <Link href="/dashboard/calendar">
              <Button variant="outline" size="sm">전체 보기</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  예정된 일정이 없습니다.
                </p>
              ) : (
                upcomingAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{appointment.member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.scheduledAt).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {appointment.duration}분
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 시작</CardTitle>
          <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/members">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                회원 관리
              </Button>
            </Link>
            <Link href="/dashboard/calendar">
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                일정 관리
              </Button>
            </Link>
            <Link href="/dashboard/memberships">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                수강권 관리
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                통계 보기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
