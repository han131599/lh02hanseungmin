import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'
import { ExerciseType } from '@prisma/client'

// 운동 기록 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const exerciseType = searchParams.get('exerciseType')

    // 회원은 자신의 기록만, 트레이너/관리자는 memberId로 조회
    let targetMemberId = user.userId
    if (user.role === 'trainer' || user.role === 'admin') {
      targetMemberId = memberId || user.userId
    }

    const where: any = {
      memberId: targetMemberId,
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (exerciseType) {
      where.exerciseType = exerciseType
    }

    const workoutLogs = await prisma.workoutLog.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      include: {
        member: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(workoutLogs)
  } catch (error) {
    console.error('운동 기록 조회 오류:', error)
    return NextResponse.json(
      { error: '운동 기록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 운동 기록 추가
const createWorkoutSchema = z.object({
  date: z.string(),
  exerciseType: z.nativeEnum(ExerciseType),
  exerciseName: z.string().min(1, '운동 이름을 입력해주세요'),
  sets: z.number().min(0, '세트 수는 0 이상이어야 합니다').default(0),
  reps: z.number().min(0, '반복 횟수는 0 이상이어야 합니다').default(0),
  weight: z.number().min(0, '중량은 0 이상이어야 합니다').default(0),
  duration: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  notes: z.string().optional(),
  memberId: z.string().optional(), // 트레이너가 회원 운동 기록 추가 시
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createWorkoutSchema.parse(body)

    // 회원은 자신의 기록만, 트레이너/관리자는 memberId 지정 가능
    let targetMemberId = user.userId
    if (validatedData.memberId && (user.role === 'trainer' || user.role === 'admin')) {
      targetMemberId = validatedData.memberId
    }

    // Member만 운동 기록 가능
    if (user.role === 'member' || validatedData.memberId) {
      const workoutLog = await prisma.workoutLog.create({
        data: {
          memberId: targetMemberId,
          date: new Date(validatedData.date),
          exerciseType: validatedData.exerciseType,
          exerciseName: validatedData.exerciseName,
          sets: validatedData.sets,
          reps: validatedData.reps,
          weight: validatedData.weight,
          duration: validatedData.duration,
          distance: validatedData.distance,
          calories: validatedData.calories,
          notes: validatedData.notes,
        },
      })

      return NextResponse.json(workoutLog, { status: 201 })
    } else {
      return NextResponse.json(
        { error: '회원만 운동 기록을 추가할 수 있습니다' },
        { status: 403 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('운동 기록 추가 오류:', error)
    return NextResponse.json(
      { error: '운동 기록 추가 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
