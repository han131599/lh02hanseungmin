import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const verifyCodeSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  code: z.string().length(6, '인증 코드는 6자리입니다'),
  role: z.enum(['trainer', 'member'], { message: '역할을 선택해주세요' }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 유효성 검사
    const validatedData = verifyCodeSchema.parse(body)

    // 인증 토큰 조회
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        email: validatedData.email,
        code: validatedData.code,
        role: validatedData.role,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!token) {
      return NextResponse.json(
        { error: '인증 코드가 올바르지 않습니다' },
        { status: 400 }
      )
    }

    // 만료 여부 확인
    if (new Date() > token.expiresAt) {
      // 만료된 토큰 삭제
      await prisma.passwordResetToken.delete({
        where: { id: token.id },
      })

      return NextResponse.json(
        { error: '인증 코드가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 }
      )
    }

    // 이미 사용된 토큰인지 확인
    if (token.verified) {
      return NextResponse.json(
        { error: '이미 사용된 인증 코드입니다' },
        { status: 400 }
      )
    }

    // 토큰을 검증 완료 상태로 업데이트
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { verified: true },
    })

    return NextResponse.json(
      {
        message: '인증이 완료되었습니다',
        tokenId: token.id,
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

    console.error('Verify reset code error:', error)
    return NextResponse.json(
      { error: '인증 코드 검증 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
