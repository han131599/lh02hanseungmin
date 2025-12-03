'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AddAppointmentDialog from '@/components/calendar/add-appointment-dialog'

type Appointment = {
  id: string
  trainerId: string
  memberId: string
  membershipId: string | null
  scheduledAt: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  reminderSent: boolean
  createdAt: string
  updatedAt: string
  member?: {
    name: string
  }
}

const locales = {
  ko: ko,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ko }),
  getDay,
  locales,
})

export default function CalendarPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const queryClient = useQueryClient()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments')
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }
      return response.json() as Promise<Appointment[]>
    },
  })

  const events = useMemo(
    () =>
      appointments?.map((appointment) => ({
        id: appointment.id,
        title: appointment.member?.name || '회원 정보 없음',
        start: new Date(appointment.scheduledAt),
        end: new Date(new Date(appointment.scheduledAt).getTime() + appointment.duration * 60000),
        resource: appointment,
      })) || [],
    [appointments]
  )

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedDate(slotInfo.start)
    setIsAddDialogOpen(true)
  }

  const eventStyleGetter = (event: { resource: Appointment }) => {
    let backgroundColor = '#3b82f6'
    if (event.resource.status === 'completed') {
      backgroundColor = '#10b981'
    } else if (event.resource.status === 'cancelled') {
      backgroundColor = '#ef4444'
    } else if (event.resource.status === 'no_show') {
      backgroundColor = '#f59e0b'
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">일정 관리</h1>
          <p className="text-gray-600 mt-1">PT 일정을 확인하고 관리합니다</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          일정 추가
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            messages={{
              next: '다음',
              previous: '이전',
              today: '오늘',
              month: '월',
              week: '주',
              day: '일',
              agenda: '일정',
              date: '날짜',
              time: '시간',
              event: '일정',
              noEventsInRange: '이 범위에는 일정이 없습니다',
              showMore: (total) => `+${total} 더보기`,
            }}
            selectable
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            defaultView="week"
          />
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-medium mb-2">상태 표시</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>예정</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>완료</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>취소</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span>노쇼</span>
          </div>
        </div>
      </div>

      <AddAppointmentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        defaultDate={selectedDate}
      />
    </div>
  )
}
