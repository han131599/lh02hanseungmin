import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET - 섭취 기록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (memberId) {
      where.memberId = memberId
    }

    if (startDate) {
      where.date = {
        ...where.date,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate),
      }
    }

    const logs = await prisma.supplementLog.findMany({
      where,
      include: {
        supplement: {
          select: {
            id: true,
            name: true,
            brand: true,
            category: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: '섭취 기록 조회 실패' },
      { status: 500 }
    )
  }
}

// POST - 섭취 기록 추가/수정
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { memberId, supplementId, date, taken, notes } = body

    if (!memberId || !supplementId || !date) {
      return NextResponse.json(
        { error: '회원, 보조제, 날짜 정보는 필수입니다' },
        { status: 400 }
      )
    }

    // 기존 기록 확인
    const existing = await prisma.supplementLog.findUnique({
      where: {
        memberId_supplementId_date: {
          memberId,
          supplementId,
          date: new Date(date),
        },
      },
    })

    if (existing) {
      // 업데이트
      const updated = await prisma.supplementLog.update({
        where: {
          memberId_supplementId_date: {
            memberId,
            supplementId,
            date: new Date(date),
          },
        },
        data: {
          taken: taken !== undefined ? taken : existing.taken,
          notes: notes !== undefined ? notes : existing.notes,
        },
        include: {
          supplement: true,
          member: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return NextResponse.json(updated)
    }

    // 새로 생성
    const log = await prisma.supplementLog.create({
      data: {
        memberId,
        supplementId,
        date: new Date(date),
        taken: taken || false,
        notes: notes || null,
      },
      include: {
        supplement: true,
        member: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Error creating log:', error)
    return NextResponse.json(
      { error: '섭취 기록 추가 실패' },
      { status: 500 }
    )
  }
}

// PATCH - 섭취 기록 수정 (taken 토글)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { memberId, supplementId, date, taken } = body

    if (!memberId || !supplementId || !date) {
      return NextResponse.json(
        { error: '회원, 보조제, 날짜 정보는 필수입니다' },
        { status: 400 }
      )
    }

    const log = await prisma.supplementLog.upsert({
      where: {
        memberId_supplementId_date: {
          memberId,
          supplementId,
          date: new Date(date),
        },
      },
      update: {
        taken: taken !== undefined ? taken : true,
      },
      create: {
        memberId,
        supplementId,
        date: new Date(date),
        taken: taken !== undefined ? taken : true,
      },
      include: {
        supplement: true,
        member: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error updating log:', error)
    return NextResponse.json(
      { error: '섭취 기록 수정 실패' },
      { status: 500 }
    )
  }
}
