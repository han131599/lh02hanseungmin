'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface WorkoutLog {
  id: string
  date: string
  exerciseType: string
  exerciseName: string
  sets: number
  reps: number
  weight: number
  duration?: number
  distance?: number
  calories?: number
  notes?: string
  createdAt: string
}

const exerciseTypeLabels: Record<string, string> = {
  chest: '가슴',
  back: '등',
  shoulder: '어깨',
  arms: '팔',
  legs: '다리',
  abs: '복근',
  cardio: '유산소',
  other: '기타',
}

export default function WorkoutsPage() {
  const router = useRouter()
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    exerciseType: 'chest',
    exerciseName: '',
    sets: 0,
    reps: 0,
    weight: 0,
    duration: undefined as number | undefined,
    distance: undefined as number | undefined,
    calories: undefined as number | undefined,
    notes: '',
  })

  useEffect(() => {
    fetchWorkoutLogs()
  }, [])

  const fetchWorkoutLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workouts')

      if (!response.ok) {
        throw new Error('운동 기록을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setWorkoutLogs(data)
    } catch (error) {
      console.error('운동 기록 조회 오류:', error)
      alert('운동 기록을 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('운동 기록 추가에 실패했습니다')
      }

      setShowAddForm(false)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        exerciseType: 'chest',
        exerciseName: '',
        sets: 0,
        reps: 0,
        weight: 0,
        duration: undefined,
        distance: undefined,
        calories: undefined,
        notes: '',
      })
      fetchWorkoutLogs()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 운동 기록을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('운동 기록 삭제에 실패했습니다')
      }

      fetchWorkoutLogs()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const filteredLogs = filterType === 'all'
    ? workoutLogs
    : workoutLogs.filter(log => log.exerciseType === filterType)

  // 날짜별로 그룹화
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = format(new Date(log.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(log)
    return acc
  }, {} as Record<string, WorkoutLog[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">운동 기록</CardTitle>
                <CardDescription>나의 운동 기록을 관리하세요</CardDescription>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? '취소' : '운동 기록 추가'}
              </Button>
            </div>
          </CardHeader>

          {showAddForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">날짜</Label>
                    <Input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exerciseType">운동 부위</Label>
                    <Select
                      value={formData.exerciseType}
                      onValueChange={(value) => setFormData({ ...formData, exerciseType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(exerciseTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exerciseName">운동 이름</Label>
                    <Input
                      id="exerciseName"
                      value={formData.exerciseName}
                      onChange={(e) => setFormData({ ...formData, exerciseName: e.target.value })}
                      placeholder="예: 벤치프레스"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sets">세트</Label>
                    <Input
                      type="number"
                      id="sets"
                      value={formData.sets}
                      onChange={(e) => setFormData({ ...formData, sets: Number(e.target.value) })}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reps">반복 횟수</Label>
                    <Input
                      type="number"
                      id="reps"
                      value={formData.reps}
                      onChange={(e) => setFormData({ ...formData, reps: Number(e.target.value) })}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">중량 (kg)</Label>
                    <Input
                      type="number"
                      id="weight"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">시간 (분) - 유산소</Label>
                    <Input
                      type="number"
                      id="duration"
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value ? Number(e.target.value) : undefined })}
                      min="0"
                      placeholder="선택 사항"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distance">거리 (km) - 유산소</Label>
                    <Input
                      type="number"
                      id="distance"
                      value={formData.distance || ''}
                      onChange={(e) => setFormData({ ...formData, distance: e.target.value ? Number(e.target.value) : undefined })}
                      min="0"
                      step="0.1"
                      placeholder="선택 사항"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calories">칼로리</Label>
                    <Input
                      type="number"
                      id="calories"
                      value={formData.calories || ''}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value ? Number(e.target.value) : undefined })}
                      min="0"
                      placeholder="선택 사항"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">메모</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="추가 메모 (선택 사항)"
                    />
                  </div>
                </div>

                <Button type="submit">기록 추가</Button>
              </form>
            </CardContent>
          )}
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            size="sm"
          >
            전체
          </Button>
          {Object.entries(exerciseTypeLabels).map(([value, label]) => (
            <Button
              key={value}
              variant={filterType === value ? 'default' : 'outline'}
              onClick={() => setFilterType(value)}
              size="sm"
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([date, logs]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">{date}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">
                              {exerciseTypeLabels[log.exerciseType]}
                            </span>
                            <span className="font-semibold text-lg">{log.exerciseName}</span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {log.sets > 0 && (
                              <div>
                                <span className="text-gray-500">세트:</span>{' '}
                                <span className="font-semibold">{log.sets}</span>
                              </div>
                            )}
                            {log.reps > 0 && (
                              <div>
                                <span className="text-gray-500">횟수:</span>{' '}
                                <span className="font-semibold">{log.reps}</span>
                              </div>
                            )}
                            {log.weight > 0 && (
                              <div>
                                <span className="text-gray-500">중량:</span>{' '}
                                <span className="font-semibold">{log.weight}kg</span>
                              </div>
                            )}
                            {log.duration && (
                              <div>
                                <span className="text-gray-500">시간:</span>{' '}
                                <span className="font-semibold">{log.duration}분</span>
                              </div>
                            )}
                            {log.distance && (
                              <div>
                                <span className="text-gray-500">거리:</span>{' '}
                                <span className="font-semibold">{log.distance}km</span>
                              </div>
                            )}
                            {log.calories && (
                              <div>
                                <span className="text-gray-500">칼로리:</span>{' '}
                                <span className="font-semibold">{log.calories}kcal</span>
                              </div>
                            )}
                          </div>

                          {log.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="text-gray-500">메모:</span> {log.notes}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredLogs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                아직 운동 기록이 없습니다. 첫 번째 기록을 추가해보세요!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
