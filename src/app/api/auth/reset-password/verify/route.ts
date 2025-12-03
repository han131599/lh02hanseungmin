import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/auth/reset-password/verify
 * 인증 코드 확인
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code, role } = await request.json()

    // 입력 검증
    if (!email || !code || !role) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (role !== 'trainer' && role !== 'member') {
      return NextResponse.json(
        { error: '올바른 역할을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 인증 코드 길이 검증
    if (code.length !== 6) {
      return NextResponse.json(
        { error: '인증 코드는 6자리여야 합니다.' },
        { status: 400 }
      )
    }

    // 토큰 조회
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        code,
        role,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!token) {
      return NextResponse.json(
        { error: '잘못된 인증 코드입니다.' },
        { status: 400 }
      )
    }

    // 만료 확인
    if (new Date() > token.expiresAt) {
      return NextResponse.json(
        { error: '인증 코드가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 }
      )
    }

    // 토큰 인증 완료 표시
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { verified: true },
    })

    return NextResponse.json({
      message: '인증이 완료되었습니다.',
      verified: true,
      tokenId: token.id,
    })
  } catch (error) {
    console.error('인증 코드 확인 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
