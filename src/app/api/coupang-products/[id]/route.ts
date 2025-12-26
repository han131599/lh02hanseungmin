import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/coupang-products/[id]
 *
 * 특정 쿠팡 상품의 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.coupangProduct.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error in GET /api/coupang-products/[id]:', error)
    return NextResponse.json(
      { error: '상품 조회 실패' },
      { status: 500 }
    )
  }
}
