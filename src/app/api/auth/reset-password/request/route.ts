import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * POST /api/auth/reset-password/request
 * 비밀번호 재설정 요청 - 이메일로 인증 코드 발송
 */
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    // 입력 검증
    if (!email || !role) {
      return NextResponse.json(
        { error: '이메일과 역할을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (role !== 'trainer' && role !== 'member') {
      return NextResponse.json(
        { error: '올바른 역할을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 사용자 존재 여부 확인
    let user: { name: string } | null = null

    if (role === 'trainer') {
      user = await prisma.trainer.findUnique({
        where: { email },
        select: { name: true },
      })
    } else {
      user = await prisma.member.findUnique({
        where: { email },
        select: { name: true },
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: '해당 이메일로 등록된 계정이 없습니다.' },
        { status: 404 }
      )
    }

    // 6자리 인증 코드 생성
    const code = generateVerificationCode()

    // 만료 시간 설정 (10분)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // 기존 미인증 토큰 삭제 (같은 이메일, 같은 역할)
    await prisma.passwordResetToken.deleteMany({
      where: {
        email,
        role,
        verified: false,
      },
    })

    // 새 토큰 생성
    await prisma.passwordResetToken.create({
      data: {
        email,
        code,
        role,
        expiresAt,
      },
    })

    // 이메일 발송
    const emailSent = await sendVerificationEmail(email, code, user.name)

    if (!emailSent) {
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '인증 코드가 이메일로 발송되었습니다.',
      email,
    })
  } catch (error) {
    console.error('비밀번호 재설정 요청 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
