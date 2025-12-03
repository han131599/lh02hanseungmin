'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database } from '@/types/database'

type Member = Database['public']['Tables']['members']['Row']

interface AddMembershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddMembershipDialog({
  open,
  onOpenChange,
}: AddMembershipDialogProps) {
  const [formData, setFormData] = useState({
    member_id: '',
    type: 'session' as 'session' | 'period',
    total_sessions: '10',
    start_date: '',
    end_date: '',
    price: '',
    notes: '',
  })

  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('trainer_id', user.id)
        .eq('is_active', true) as { data: Member[] | null; error: unknown }

      if (error) throw error
      return data
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('memberships').insert({
        member_id: data.member_id,
        type: data.type,
        total_sessions: data.type === 'session' ? parseInt(data.total_sessions) : null,
        remaining_sessions:
          data.type === 'session' ? parseInt(data.total_sessions) : null,
        start_date: data.start_date,
        end_date: data.type === 'period' ? data.end_date : null,
        price: parseInt(data.price),
        notes: data.notes || null,
      } as never)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] })
      onOpenChange(false)
      setFormData({
        member_id: '',
        type: 'session',
        total_sessions: '10',
        start_date: '',
        end_date: '',
        price: '',
        notes: '',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>수강권 추가</DialogTitle>
          <DialogDescription>새로운 수강권을 등록합니다</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member_id">회원 *</Label>
            <Select
              value={formData.member_id}
              onValueChange={(value) => setFormData({ ...formData, member_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="회원 선택" />
              </SelectTrigger>
              <SelectContent>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">수강권 유형 *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'session' | 'period') =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="session">횟수권</SelectItem>
                <SelectItem value="period">기간권</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.type === 'session' ? (
            <div className="space-y-2">
              <Label htmlFor="total_sessions">총 횟수 *</Label>
              <Select
                value={formData.total_sessions}
                onValueChange={(value) =>
                  setFormData({ ...formData, total_sessions: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10회</SelectItem>
                  <SelectItem value="20">20회</SelectItem>
                  <SelectItem value="30">30회</SelectItem>
                  <SelectItem value="50">50회</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">시작일 *</Label>
                <Input
                  id="start_date"
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">종료일 *</Label>
                <Input
                  id="end_date"
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          {formData.type === 'session' && (
            <div className="space-y-2">
              <Label htmlFor="start_date">시작일 *</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="price">가격 (원) *</Label>
            <Input
              id="price"
              type="number"
              required
              placeholder="300000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Input
              id="notes"
              placeholder="참고사항"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? '추가 중...' : '추가'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
