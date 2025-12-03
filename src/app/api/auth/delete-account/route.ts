import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { comparePassword } from '@/lib/auth/password'
import { z } from 'zod'

const deleteAccountSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요'),
  confirmation: z.literal('회원탈퇴', { message: '확인 문구를 정확히 입력해주세요' }),
})

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // 유효성 검사
    const validatedData = deleteAccountSchema.parse(body)

    // 비밀번호 확인
    let currentPassword: string | null = null

    if (user.role === 'trainer') {
      const trainer = await prisma.trainer.findUnique({
        where: { id: user.userId },
        select: { password: true },
      })

      if (!trainer) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      currentPassword = trainer.password
    } else {
      const member = await prisma.member.findUnique({
        where: { id: user.userId },
        select: { password: true },
      })

      if (!member) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      currentPassword = member.password
    }

    // 비밀번호 검증
    const isPasswordValid = await comparePassword(
      validatedData.password,
      currentPassword
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다' },
        { status: 400 }
      )
    }

    // 계정 소프트 삭제 (데이터는 보존하되 비활성화)
    const deletedAt = new Date()

    if (user.role === 'trainer') {
      await prisma.trainer.update({
        where: { id: user.userId },
        data: {
          isActive: false,
          deletedAt: deletedAt,
        },
      })
    } else {
      await prisma.member.update({
        where: { id: user.userId },
        data: {
          isActive: false,
          deletedAt: deletedAt,
        },
      })
    }

    // 응답 생성
    const response = NextResponse.json(
      {
        message: '계정이 성공적으로 삭제되었습니다',
      },
      { status: 200 }
    )

    // 쿠키 삭제
    response.cookies.delete('token')

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: '계정 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
