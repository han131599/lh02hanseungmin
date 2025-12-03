'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Pencil, Trash2, Phone, Mail, Target } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import AddMemberDialog from '@/components/members/add-member-dialog'

type Membership = {
  id: string
  type: 'session' | 'period'
  remainingSessions: number | null
  endDate: Date | null
  isActive: boolean
}

type Member = {
  id: string
  name: string
  phone: string
  email: string | null
  birthDate: Date | null
  gender: 'male' | 'female' | 'other' | null
  goal: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  memberships: Membership[]
  _count: {
    appointments: number
  }
}

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await fetch('/api/members')
      if (!response.ok) throw new Error('Failed to fetch members')
      return response.json() as Promise<Member[]>
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete member')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  const filteredMembers = members?.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-gray-600 mt-1">PT 회원을 관리합니다</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          회원 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>전체 회원 ({filteredMembers?.length || 0}명)</CardTitle>
              <CardDescription>등록된 회원 목록</CardDescription>
            </div>
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="이름 또는 전화번호 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : !filteredMembers || filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => {
                const activeMembership = member.memberships[0]
                return (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* 이름 및 상태 */}
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{member.name}</h3>
                            {!member.isActive && (
                              <Badge variant="secondary">비활성</Badge>
                            )}
                            {activeMembership && (
                              <Badge variant={
                                activeMembership.type === 'session' ? 'default' : 'outline'
                              }>
                                {activeMembership.type === 'session'
                                  ? `횟수권 ${activeMembership.remainingSessions}회 남음`
                                  : `기간권`
                                }
                              </Badge>
                            )}
                          </div>

                          {/* 연락처 정보 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{member.phone}</span>
                            </div>
                            {member.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{member.email}</span>
                              </div>
                            )}
                          </div>

                          {/* 목표 */}
                          {member.goal && (
                            <div className="flex items-start gap-2 text-sm">
                              <Target className="w-4 h-4 mt-0.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{member.goal}</span>
                            </div>
                          )}

                          {/* 통계 */}
                          <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                            <span>총 {member._count.appointments}회 수업</span>
                            <span>등록일: {new Date(member.createdAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(
                                  `${member.name} 회원을 삭제하시겠습니까?\n관련된 모든 일정, 수강권, 운동일지가 함께 삭제됩니다.`
                                )
                              ) {
                                deleteMutation.mutate(member.id)
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddMemberDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  )
}
