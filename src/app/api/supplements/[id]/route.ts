import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - 보조제 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    const supplement = await prisma.supplement.findUnique({
      where: { id },
      include: {
        memberSupplements: {
          where: { isActive: true },
          include: {
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            supplementLogs: true,
            memberSupplements: true,
          },
        },
      },
    })

    if (!supplement) {
      return NextResponse.json(
        { error: '보조제를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 권한 확인
    if (supplement.trainerId !== user.userId) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    return NextResponse.json(supplement)
  } catch (error) {
    console.error('Error fetching supplement:', error)
    return NextResponse.json(
      { error: '보조제 조회 실패' },
      { status: 500 }
    )
  }
}

// PATCH - 보조제 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      brand,
      category,
      dosage,
      timing,
      description,
      productUrl,
      imageUrl,
      isActive,
    } = body

    // 권한 확인
    const existing = await prisma.supplement.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: '보조제를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (existing.trainerId !== user.userId) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 수정
    const updated = await prisma.supplement.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        brand: brand !== undefined ? brand : undefined,
        category: category !== undefined ? category : undefined,
        dosage: dosage !== undefined ? dosage : undefined,
        timing: timing !== undefined ? timing : undefined,
        description: description !== undefined ? description : undefined,
        productUrl: productUrl !== undefined ? productUrl : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating supplement:', error)
    return NextResponse.json(
      { error: '보조제 수정 실패' },
      { status: 500 }
    )
  }
}

// DELETE - 보조제 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params

    // 권한 확인
    const existing = await prisma.supplement.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: '보조제를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (existing.trainerId !== user.userId) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 실제 삭제 대신 비활성화
    await prisma.supplement.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: '보조제가 삭제되었습니다' })
  } catch (error) {
    console.error('Error deleting supplement:', error)
    return NextResponse.json(
      { error: '보조제 삭제 실패' },
      { status: 500 }
    )
  }
}
