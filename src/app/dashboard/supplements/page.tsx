import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pill, Plus, Package, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function SupplementsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 트레이너 정보 조회
  const trainer = await prisma.trainer.findUnique({
    where: { id: user.userId },
    include: {
      members: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          supplementLogs: {
            include: {
              supplement: true
            },
            orderBy: {
              date: 'desc'
            },
            take: 5
          }
        }
      }
    }
  })

  if (!trainer) {
    redirect('/auth/login')
  }

  // 트레이너가 등록한 보조제 목록
  const supplements = await prisma.supplement.findMany({
    where: {
      trainerId: trainer.id,
      isActive: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // 통계 계산
  const totalSupplements = supplements.length
  const totalMembers = trainer.members.length

  // 카테고리별 보조제 수
  const categoryCount = supplements.reduce((acc: any, sup) => {
    acc[sup.category] = (acc[sup.category] || 0) + 1
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    protein: '단백질',
    omega3: '오메가3',
    creatine: '크레아틴',
    bcaa: 'BCAA',
    vitamin: '비타민',
    preworkout: '프리워크아웃',
    other: '기타'
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">보조제 관리</h1>
          <p className="text-muted-foreground">
            회원들에게 추천할 보조제를 관리하고 섭취 기록을 추적하세요
          </p>
        </div>
        <Link href="/dashboard/supplements/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            보조제 추가
          </Button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">등록된 보조제</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSupplements}개</div>
            <p className="text-xs text-muted-foreground">
              현재 관리 중인 보조제
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 회원</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}명</div>
            <p className="text-xs text-muted-foreground">
              보조제 추천 가능
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">인기 카테고리</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(categoryCount).length > 0
                ? categoryLabels[Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a])[0]]
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              가장 많이 등록된 종류
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">섭취 기록</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainer.members.reduce((sum, m) => sum + m.supplementLogs.length, 0)}건
            </div>
            <p className="text-xs text-muted-foreground">
              최근 기록된 섭취 내역
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 등록된 보조제 목록 */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>등록된 보조제</CardTitle>
              <CardDescription>트레이너가 관리하는 보조제 목록</CardDescription>
            </div>
            <Link href="/dashboard/supplements/list">
              <Button variant="outline" size="sm">전체 보기</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supplements.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    아직 등록된 보조제가 없습니다
                  </p>
                  <Link href="/dashboard/supplements/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      첫 보조제 추가하기
                    </Button>
                  </Link>
                </div>
              ) : (
                supplements.slice(0, 5).map((supplement: any) => (
                  <div
                    key={supplement.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Pill className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{supplement.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {supplement.brand || '브랜드 미등록'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {categoryLabels[supplement.category]}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 최근 섭취 기록 */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>최근 섭취 기록</CardTitle>
              <CardDescription>회원들의 보조제 섭취 내역</CardDescription>
            </div>
            <Link href="/dashboard/supplements/logs">
              <Button variant="outline" size="sm">전체 보기</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainer.members.every((m) => m.supplementLogs.length === 0) ? (
                <div className="text-center py-8">
                  <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    아직 섭취 기록이 없습니다
                  </p>
                </div>
              ) : (
                trainer.members
                  .flatMap((member) =>
                    member.supplementLogs.map((log) => ({
                      ...log,
                      memberName: member.name
                    }))
                  )
                  .slice(0, 5)
                  .map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{log.memberName}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.supplement.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={log.taken ? 'default' : 'outline'}>
                          {log.taken ? '복용 완료' : '미복용'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.date).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
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
          <CardDescription>보조제 관리 주요 기능</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/supplements/new">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Plus className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">새 보조제 추가</div>
                  <div className="text-xs text-muted-foreground">추천할 보조제 등록</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/supplements/recommend">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Users className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">회원에게 추천</div>
                  <div className="text-xs text-muted-foreground">보조제 섭취 기록 생성</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/supplements/list">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Package className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">보조제 목록</div>
                  <div className="text-xs text-muted-foreground">전체 보조제 관리</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
