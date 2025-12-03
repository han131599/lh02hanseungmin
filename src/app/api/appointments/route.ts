import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/appointments - 일정 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const appointments = await prisma.appointment.findMany({
      where: {
        trainerId: user.userId,
        ...(startDate && endDate ? {
          scheduledAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {})
      },
      include: {
        member: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST /api/appointments - 일정 추가
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { memberId, scheduledAt, duration, notes } = body

    // 필수 필드 검증
    if (!memberId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Member ID and scheduled time are required' },
        { status: 400 }
      )
    }

    // 회원 소유권 확인
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        trainerId: user.userId
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // 일정 생성
    const appointment = await prisma.appointment.create({
      data: {
        trainerId: user.userId,
        memberId,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        notes: notes || null
      },
      include: {
        member: true
      }
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
