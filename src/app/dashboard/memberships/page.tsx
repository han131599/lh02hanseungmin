'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import AddMembershipDialog from '@/components/memberships/add-membership-dialog'
import { Database } from '@/types/database'
import { format } from 'date-fns'

type Membership = Database['public']['Tables']['memberships']['Row'] & {
  members?: {
    name: string
    phone: string
  }
}

export default function MembershipsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: memberships, isLoading } = useQuery({
    queryKey: ['memberships'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          members (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Membership[]
    },
  })

  const activeMemberships = memberships?.filter((m) => m.isActive)
  const inactiveMemberships = memberships?.filter((m) => !m.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">수강권 관리</h1>
          <p className="text-gray-600 mt-1">회원의 수강권을 관리합니다</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          수강권 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              활성 수강권
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeMemberships?.length || 0}개
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              만료된 수강권
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inactiveMemberships?.length || 0}개
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                memberships?.reduce((sum, m) => sum + Number(m.price), 0) || 0
              ).toLocaleString()}원
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>활성 수강권</CardTitle>
          <CardDescription>현재 사용 중인 수강권 목록</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : !activeMemberships || activeMemberships.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              활성 수강권이 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {activeMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">
                          {membership.members?.name || '회원 정보 없음'}
                        </h3>
                        <Badge variant="default">
                          {membership.type === 'session' ? '횟수권' : '기간권'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {membership.members?.phone}
                      </p>
                      <div className="mt-3 flex gap-4 text-sm">
                        {membership.type === 'session' ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>
                              {membership.remainingSessions || 0} /{' '}
                              {membership.totalSessions || 0}회 남음
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>
                              {format(new Date(membership.startDate), 'yyyy-MM-dd')} ~{' '}
                              {membership.endDate
                                ? format(new Date(membership.endDate), 'yyyy-MM-dd')
                                : '무제한'}
                            </span>
                          </div>
                        )}
                        <span className="text-gray-600">
                          {Number(membership.price).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactiveMemberships && inactiveMemberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>만료된 수강권</CardTitle>
            <CardDescription>사용 완료 또는 만료된 수강권</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="p-4 bg-gray-50 rounded-lg opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {membership.members?.name || '회원 정보 없음'}
                        </h3>
                        <Badge variant="secondary">
                          {membership.type === 'session' ? '횟수권' : '기간권'}
                        </Badge>
                        <Badge variant="outline">만료</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {Number(membership.price).toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AddMembershipDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}
