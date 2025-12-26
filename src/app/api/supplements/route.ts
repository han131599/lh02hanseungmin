import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// GET - 보조제 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supplements = await prisma.supplement.findMany({
      where: {
        trainerId: user.userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(supplements)
  } catch (error) {
    console.error('Error fetching supplements:', error)
    return NextResponse.json(
      { error: '보조제 목록 조회 실패' },
      { status: 500 }
    )
  }
}

// POST - 새 보조제 추가
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

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
    } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: '제품명과 카테고리는 필수입니다' },
        { status: 400 }
      )
    }

    const supplement = await prisma.supplement.create({
      data: {
        trainerId: user.userId,
        name,
        brand: brand || null,
        category,
        dosage: dosage || null,
        timing: timing || null,
        description: description || null,
        productUrl: productUrl || null,
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json(supplement, { status: 201 })
  } catch (error) {
    console.error('Error creating supplement:', error)
    return NextResponse.json(
      { error: '보조제 추가 실패' },
      { status: 500 }
    )
  }
}
