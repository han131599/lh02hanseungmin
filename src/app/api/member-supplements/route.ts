import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET - 회원별 추천된 보조제 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const memberId = searchParams.get('memberId')

    // 트레이너인 경우: 특정 회원 또는 전체 회원의 추천 내역 조회
    // 회원인 경우: 자신의 추천 내역만 조회
    const where: any = {
      isActive: true,
    }

    if (memberId) {
      // 특정 회원의 추천 내역 조회
      where.memberId = memberId

      // 권한 확인: 해당 회원의 트레이너인지 확인
      const member = await prisma.member.findFirst({
        where: {
          id: memberId,
          trainerId: user.userId,
        },
      })

      if (!member) {
        return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
      }
    }

    const recommendations = await prisma.memberSupplement.findMany({
      where,
      include: {
        supplement: true,
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json(
      { error: '추천 목록 조회 실패' },
      { status: 500 }
    )
  }
}

// POST - 회원에게 보조제 추천
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const {
      memberId,
      supplementId,
      startDate,
      endDate,
      customDosage,
      customTiming,
      notes,
    } = body

    if (!memberId || !supplementId) {
      return NextResponse.json(
        { error: '회원과 보조제 정보는 필수입니다' },
        { status: 400 }
      )
    }

    // 회원 소유권 확인
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        trainerId: user.userId,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 보조제 소유권 확인
    const supplement = await prisma.supplement.findFirst({
      where: {
        id: supplementId,
        trainerId: user.userId,
      },
    })

    if (!supplement) {
      return NextResponse.json(
        { error: '보조제를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 이미 추천된 보조제인지 확인
    const existing = await prisma.memberSupplement.findUnique({
      where: {
        memberId_supplementId: {
          memberId,
          supplementId,
        },
      },
    })

    if (existing) {
      // 이미 있으면 업데이트
      const updated = await prisma.memberSupplement.update({
        where: {
          memberId_supplementId: {
            memberId,
            supplementId,
          },
        },
        data: {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          customDosage: customDosage || null,
          customTiming: customTiming || null,
          notes: notes || null,
          isActive: true,
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

    // 새로 추천
    const recommendation = await prisma.memberSupplement.create({
      data: {
        memberId,
        supplementId,
        recommendedBy: user.userId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        customDosage: customDosage || null,
        customTiming: customTiming || null,
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

    return NextResponse.json(recommendation, { status: 201 })
  } catch (error) {
    console.error('Error creating recommendation:', error)
    return NextResponse.json(
      { error: '보조제 추천 실패' },
      { status: 500 }
    )
  }
}

// DELETE - 추천 취소
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '추천 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 권한 확인
    const recommendation = await prisma.memberSupplement.findUnique({
      where: { id },
      include: {
        member: true,
      },
    })

    if (!recommendation) {
      return NextResponse.json(
        { error: '추천을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (recommendation.member.trainerId !== user.userId) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 삭제 대신 비활성화
    await prisma.memberSupplement.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: '추천이 취소되었습니다' })
  } catch (error) {
    console.error('Error deleting recommendation:', error)
    return NextResponse.json(
      { error: '추천 취소 실패' },
      { status: 500 }
    )
  }
}
