'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { Database } from '@/types/database'

type Member = Database['public']['Tables']['members']['Row']

interface AddAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: Date | null
}

export default function AddAppointmentDialog({
  open,
  onOpenChange,
  defaultDate,
}: AddAppointmentDialogProps) {
  const [formData, setFormData] = useState({
    member_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration: '60',
    notes: '',
  })

  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    if (defaultDate) {
      setFormData((prev) => ({
        ...prev,
        scheduled_date: format(defaultDate, 'yyyy-MM-dd'),
        scheduled_time: format(defaultDate, 'HH:mm'),
      }))
    }
  }, [defaultDate])

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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const scheduledAt = new Date(`${data.scheduled_date}T${data.scheduled_time}:00`)

      const { error } = await supabase.from('appointments').insert({
        trainer_id: user.id,
        member_id: data.member_id,
        scheduled_at: scheduledAt.toISOString(),
        duration: parseInt(data.duration),
        notes: data.notes || null,
      } as never)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      onOpenChange(false)
      setFormData({
        member_id: '',
        scheduled_date: '',
        scheduled_time: '',
        duration: '60',
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
          <DialogTitle>일정 추가</DialogTitle>
          <DialogDescription>새로운 PT 일정을 등록합니다</DialogDescription>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">날짜 *</Label>
              <Input
                id="scheduled_date"
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">시간 *</Label>
              <Input
                id="scheduled_time"
                type="time"
                required
                value={formData.scheduled_time}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_time: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">운동 시간 (분)</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30분</SelectItem>
                <SelectItem value="60">60분</SelectItem>
                <SelectItem value="90">90분</SelectItem>
                <SelectItem value="120">120분</SelectItem>
              </SelectContent>
            </Select>
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
