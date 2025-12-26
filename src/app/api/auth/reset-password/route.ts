import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { z } from 'zod'

export const runtime = 'nodejs'

const resetPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  code: z.string().length(6, '인증 코드는 6자리입니다'),
  role: z.enum(['trainer', 'member'], { message: '역할을 선택해주세요' }),
  newPassword: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(100, '비밀번호는 최대 100자까지 가능합니다'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 유효성 검사
    const validatedData = resetPasswordSchema.parse(body)

    // 인증 토큰 확인
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        email: validatedData.email,
        code: validatedData.code,
        role: validatedData.role,
        verified: true, // 검증 완료된 토큰만 사용 가능
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!token) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 코드입니다. 먼저 인증을 완료해주세요.' },
        { status: 400 }
      )
    }

    // 만료 여부 확인 (10분 + 5분 여유: 인증 후 비밀번호 변경까지의 시간)
    const extendedExpiresAt = new Date(token.expiresAt.getTime() + 5 * 60 * 1000)
    if (new Date() > extendedExpiresAt) {
      // 만료된 토큰 삭제
      await prisma.passwordResetToken.delete({
        where: { id: token.id },
      })

      return NextResponse.json(
        { error: '인증이 만료되었습니다. 처음부터 다시 시도해주세요.' },
        { status: 400 }
      )
    }

    // 새 비밀번호 해싱
    const hashedPassword = await hashPassword(validatedData.newPassword)

    // 비밀번호 업데이트
    if (validatedData.role === 'trainer') {
      await prisma.trainer.update({
        where: { email: validatedData.email },
        data: { password: hashedPassword },
      })
    } else {
      await prisma.member.update({
        where: { email: validatedData.email },
        data: { password: hashedPassword },
      })
    }

    // 사용된 토큰 삭제
    await prisma.passwordResetToken.delete({
      where: { id: token.id },
    })

    // 해당 이메일의 모든 다른 토큰도 삭제
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: validatedData.email,
        role: validatedData.role,
      },
    })

    return NextResponse.json(
      {
        message: '비밀번호가 성공적으로 변경되었습니다',
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

    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
