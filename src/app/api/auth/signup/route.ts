import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signupSchema } from '@/lib/validations/auth'
import { ZodError } from 'zod'
import { hashPassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 유효성 검사
    const validatedData = signupSchema.parse(body)

    // 1. 이메일 중복 확인 (트레이너 및 회원 모두 확인)
    const [existingTrainer, existingMember] = await Promise.all([
      prisma.trainer.findUnique({
        where: { email: validatedData.email },
      }),
      prisma.member.findUnique({
        where: { email: validatedData.email },
      }),
    ])

    if (existingTrainer || existingMember) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다' },
        { status: 400 }
      )
    }

    // 2. 비밀번호 해시
    const hashedPassword = await hashPassword(validatedData.password)

    let user
    let userId: string
    let userName: string

    // 3. role에 따라 트레이너 또는 회원 생성
    if (validatedData.role === 'trainer') {
      const trainer = await prisma.trainer.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          phone: validatedData.phone,
        },
      })
      user = trainer
      userId = trainer.id
      userName = trainer.name
    } else {
      // 일반회원 생성
      const member = await prisma.member.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          phone: validatedData.phone,
        },
      })
      user = member
      userId = member.id
      userName = member.name
    }

    // 4. JWT 토큰 생성
    const token = await generateToken({
      userId,
      email: validatedData.email,
      role: validatedData.role,
      name: userName,
    })

    // 5. 응답 생성
    const response = NextResponse.json(
      {
        message: '회원가입이 완료되었습니다',
        user: {
          id: userId,
          email: validatedData.email,
          name: userName,
          role: validatedData.role,
        },
      },
      { status: 201 }
    )

    // 6. JWT 토큰을 HTTP-only 쿠키에 설정
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
