import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'

/**
 * POST /api/auth/reset-password/update
 * 비밀번호 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code, role, newPassword } = await request.json()

    // 입력 검증
    if (!email || !code || !role || !newPassword) {
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

    // 비밀번호 유효성 검사
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 인증 완료된 토큰 조회
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        code,
        role,
        verified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!token) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다. 처음부터 다시 시도해주세요.' },
        { status: 400 }
      )
    }

    // 만료 확인 (인증 후 30분 이내에만 비밀번호 변경 가능)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    if (token.createdAt < thirtyMinutesAgo) {
      return NextResponse.json(
        { error: '인증 시간이 만료되었습니다. 처음부터 다시 시도해주세요.' },
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(newPassword)

    // 사용자 비밀번호 업데이트
    if (role === 'trainer') {
      await prisma.trainer.update({
        where: { email },
        data: { password: hashedPassword },
      })
    } else {
      await prisma.member.update({
        where: { email },
        data: { password: hashedPassword },
      })
    }

    // 사용된 토큰 삭제 (보안)
    await prisma.passwordResetToken.deleteMany({
      where: {
        email,
        role,
      },
    })

    return NextResponse.json({
      message: '비밀번호가 성공적으로 변경되었습니다.',
      success: true,
    })
  } catch (error) {
    console.error('비밀번호 업데이트 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
