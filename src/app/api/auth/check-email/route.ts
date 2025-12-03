import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const checkEmailSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  role: z.enum(['trainer', 'member'], { message: '역할을 선택해주세요' }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 유효성 검사
    const validatedData = checkEmailSchema.parse(body)

    // 이메일 중복 확인
    let exists = false

    if (validatedData.role === 'trainer') {
      const trainer = await prisma.trainer.findUnique({
        where: { email: validatedData.email },
        select: { id: true },
      })
      exists = !!trainer
    } else {
      const member = await prisma.member.findUnique({
        where: { email: validatedData.email },
        select: { id: true },
      })
      exists = !!member
    }

    if (exists) {
      return NextResponse.json(
        {
          available: false,
          message: '이미 사용 중인 이메일입니다'
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        available: true,
        message: '사용 가능한 이메일입니다'
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

    console.error('Check email error:', error)
    return NextResponse.json(
      { error: '이메일 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
