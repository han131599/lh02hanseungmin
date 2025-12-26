import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateVerificationCode, sendVerificationEmail, isValidEmail } from '@/lib/email'
import { z } from 'zod'

export const runtime = 'nodejs'

const sendCodeSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  role: z.enum(['trainer', 'member'], { message: '역할을 선택해주세요' }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 유효성 검사
    const validatedData = sendCodeSchema.parse(body)

    // 이메일 검증
    if (!isValidEmail(validatedData.email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다' },
        { status: 400 }
      )
    }

    // 해당 이메일로 가입된 사용자 확인
    let user: { name: string } | null = null

    if (validatedData.role === 'trainer') {
      user = await prisma.trainer.findUnique({
        where: { email: validatedData.email },
        select: { name: true },
      })
    } else {
      user = await prisma.member.findUnique({
        where: { email: validatedData.email },
        select: { name: true },
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: '해당 이메일로 가입된 계정을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 기존 인증 코드 삭제 (재발송 시)
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: validatedData.email,
        role: validatedData.role,
      },
    })

    // 6자리 인증 코드 생성
    const code = generateVerificationCode()

    // 만료 시간 설정 (10분)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // 인증 코드 저장
    await prisma.passwordResetToken.create({
      data: {
        email: validatedData.email,
        code,
        role: validatedData.role,
        verified: false,
        expiresAt,
      },
    })

    // 이메일 발송
    const emailSent = await sendVerificationEmail(
      validatedData.email,
      code,
      user.name
    )

    if (!emailSent) {
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: '인증 코드가 이메일로 발송되었습니다',
        email: validatedData.email,
        expiresIn: 600, // 10분 (초 단위)
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Send reset code error:', error)
    return NextResponse.json(
      { error: '인증 코드 발송 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
