import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, User, Trophy, Apple, Clock } from 'lucide-react'

export default async function MemberDashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 회원만 접근 가능
  if (user.role !== 'member') {
    redirect('/dashboard')
  }

  // 회원 정보 및 데이터 조회
  const member = await prisma.member.findUnique({
    where: { id: user.userId },
    include: {
      trainer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      memberships: {
        where: { isActive: true },
        orderBy: { endDate: 'asc' },
      },
      appointments: {
        where: {
          scheduledAt: {
            gte: new Date(),
          },
          status: 'scheduled',
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      },
      recommendedSupplements: {
        where: { isActive: true },
        include: {
          supplement: true,
        },
      },
    },
  })

  const hasTrainer = member?.trainer !== null

  if (!member) {
    redirect('/auth/login')
  }

  // 오늘 예정된 일정
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      memberId: member.id,
      scheduledAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  // 이번 달 완료된 PT 횟수
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const completedThisMonth = await prisma.appointment.count({
    where: {
      memberId: member.id,
      status: 'completed',
      scheduledAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                안녕하세요, {member.name}님!
              </h1>
              {hasTrainer ? (
                <p className="text-gray-600 mt-1">
                  담당 트레이너: {member.trainer?.name}
                </p>
              ) : (
                <p className="text-gray-500 mt-1">
                  아직 담당 트레이너가 배정되지 않았습니다
                </p>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">일반 회원</span>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 일정</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}건</div>
              <p className="text-xs text-muted-foreground">
                예정된 PT 세션
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이번 달 운동</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedThisMonth}회</div>
              <p className="text-xs text-muted-foreground">
                완료한 PT 세션
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">수강권</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{member.memberships.length}개</div>
              <p className="text-xs text-muted-foreground">
                활성 수강권
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">추천 보조제</CardTitle>
              <Apple className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{member.recommendedSupplements.length}개</div>
              <p className="text-xs text-muted-foreground">
                추천받은 보조제
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* 다가오는 일정 */}
          <Card>
            <CardHeader>
              <CardTitle>다가오는 일정</CardTitle>
              <CardDescription>예정된 PT 세션</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {member.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    예정된 일정이 없습니다.
                  </p>
                ) : (
                  member.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {new Date(appointment.scheduledAt).toLocaleDateString('ko-KR', {
                              month: 'long',
                              day: 'numeric',
                              weekday: 'short',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.scheduledAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} ({appointment.duration}분)
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">예정</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 수강권 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>수강권 정보</CardTitle>
              <CardDescription>보유 중인 수강권</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {member.memberships.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    활성 수강권이 없습니다.
                  </p>
                ) : (
                  member.memberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{membership.name}</h3>
                        <Badge variant={membership.isActive ? 'default' : 'secondary'}>
                          {membership.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      {membership.type === 'period' && membership.endDate && (
                        <p className="text-sm text-muted-foreground">
                          만료일: {new Date(membership.endDate).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                      {membership.type === 'session' && (
                        <p className="text-sm text-muted-foreground">
                          남은 횟수: {membership.remainingSessions}회 / {membership.totalSessions}회
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 추천 보조제 */}
        {member.recommendedSupplements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>추천 보조제</CardTitle>
              <CardDescription>트레이너가 추천한 보조제</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {member.recommendedSupplements.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{rec.supplement.name}</h3>
                        {rec.supplement.brand && (
                          <p className="text-sm text-muted-foreground">{rec.supplement.brand}</p>
                        )}
                      </div>
                      <Badge variant="outline">
                        {rec.supplement.category}
                      </Badge>
                    </div>
                    {rec.customDosage && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">용량:</span> {rec.customDosage}
                      </p>
                    )}
                    {rec.customTiming && (
                      <p className="text-sm">
                        <span className="font-medium">섭취시점:</span> {rec.customTiming}
                      </p>
                    )}
                    {rec.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{rec.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 담당 트레이너 정보 */}
        {hasTrainer && (
          <Card>
            <CardHeader>
              <CardTitle>담당 트레이너</CardTitle>
              <CardDescription>나의 퍼스널 트레이너</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {member.trainer?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{member.trainer?.name} 트레이너</h3>
                  <p className="text-sm text-muted-foreground">{member.trainer?.email}</p>
                  {member.trainer?.phone && (
                    <p className="text-sm text-muted-foreground">{member.trainer.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
