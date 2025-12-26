import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'
import { ExerciseType } from '@prisma/client'

export const runtime = 'nodejs'

// 운동 기록 수정
const updateWorkoutSchema = z.object({
  date: z.string().optional(),
  exerciseType: z.nativeEnum(ExerciseType).optional(),
  exerciseName: z.string().min(1).optional(),
  sets: z.number().min(0).optional(),
  reps: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateWorkoutSchema.parse(body)

    // 운동 기록 조회
    const workoutLog = await prisma.workoutLog.findUnique({
      where: { id },
    })

    if (!workoutLog) {
      return NextResponse.json(
        { error: '운동 기록을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 본인 기록만 수정 가능 (트레이너/관리자는 모든 기록 수정 가능)
    if (workoutLog.memberId !== user.userId && user.role !== 'trainer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: '운동 기록 수정 권한이 없습니다' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (validatedData.date) updateData.date = new Date(validatedData.date)
    if (validatedData.exerciseType) updateData.exerciseType = validatedData.exerciseType
    if (validatedData.exerciseName) updateData.exerciseName = validatedData.exerciseName
    if (validatedData.sets !== undefined) updateData.sets = validatedData.sets
    if (validatedData.reps !== undefined) updateData.reps = validatedData.reps
    if (validatedData.weight !== undefined) updateData.weight = validatedData.weight
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration
    if (validatedData.distance !== undefined) updateData.distance = validatedData.distance
    if (validatedData.calories !== undefined) updateData.calories = validatedData.calories
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    const updatedWorkoutLog = await prisma.workoutLog.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedWorkoutLog)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('운동 기록 수정 오류:', error)
    return NextResponse.json(
      { error: '운동 기록 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 운동 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 운동 기록 조회
    const workoutLog = await prisma.workoutLog.findUnique({
      where: { id },
    })

    if (!workoutLog) {
      return NextResponse.json(
        { error: '운동 기록을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 본인 기록만 삭제 가능 (트레이너/관리자는 모든 기록 삭제 가능)
    if (workoutLog.memberId !== user.userId && user.role !== 'trainer' && user.role !== 'admin') {
      return NextResponse.json(
        { error: '운동 기록 삭제 권한이 없습니다' },
        { status: 403 }
      )
    }

    await prisma.workoutLog.delete({
      where: { id },
    })

    return NextResponse.json({ message: '운동 기록이 삭제되었습니다' })
  } catch (error) {
    console.error('운동 기록 삭제 오류:', error)
    return NextResponse.json(
      { error: '운동 기록 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
