import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { z } from 'zod'

export const runtime = 'nodejs'

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
  role: z.enum(['trainer', 'member', 'admin']),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 로그인 API 호출됨')
    const body = await request.json()
    console.log('📦 받은 데이터:', { email: body.email, role: body.role })

    // 유효성 검사
    const validatedData = loginSchema.parse(body)
    console.log('✅ 유효성 검사 통과')

    let user: { id: string; email: string; password: string; name: string; role: string } | null = null
    let userData = null

    // 1. 로그인 유형에 따라 사용자 조회
    console.log('🔎 사용자 조회 시작, 역할:', validatedData.role)
    if (validatedData.role === 'trainer' || validatedData.role === 'admin') {
      console.log('👨‍💼 트레이너/관리자 테이블 조회')
      const trainer = await prisma.trainer.findUnique({
        where: { email: validatedData.email },
      })
      console.log('📊 조회 결과:', trainer ? '사용자 발견' : '사용자 없음')

      // 관리자 로그인 시 role이 admin인지 확인
      if (trainer && validatedData.role === 'admin' && trainer.role !== 'admin') {
        return NextResponse.json(
          { error: '관리자 권한이 없습니다' },
          { status: 403 }
        )
      }

      // 일반 트레이너 로그인 시 admin 계정으로 로그인 방지
      if (trainer && validatedData.role === 'trainer' && trainer.role === 'admin') {
        return NextResponse.json(
          { error: '관리자 계정은 관리자 로그인을 사용해주세요' },
          { status: 403 }
        )
      }

      // 삭제된 계정 체크
      if (trainer && (!trainer.isActive || trainer.deletedAt)) {
        return NextResponse.json(
          { error: '비활성화되거나 삭제된 계정입니다' },
          { status: 403 }
        )
      }

      if (trainer) {
        user = {
          id: trainer.id,
          email: trainer.email,
          password: trainer.password,
          name: trainer.name,
          role: trainer.role,
        }
        userData = {
          id: trainer.id,
          email: trainer.email,
          name: trainer.name,
          role: trainer.role,
        }
      }
    } else if (validatedData.role === 'member') {
      console.log('👤 회원 테이블 조회')
      const member = await prisma.member.findUnique({
        where: { email: validatedData.email },
        include: {
          trainer: {
            select: {
              name: true,
            },
          },
        },
      })
      console.log('📊 조회 결과:', member ? '회원 발견' : '회원 없음')

      // 삭제된 계정 체크
      if (member && (!member.isActive || member.deletedAt)) {
        return NextResponse.json(
          { error: '비활성화되거나 삭제된 계정입니다' },
          { status: 403 }
        )
      }

      if (member && member.password) {
        user = {
          id: member.id,
          email: member.email,
          password: member.password,
          name: member.name,
          role: 'member',
        }
        userData = {
          id: member.id,
          email: member.email,
          name: member.name,
          role: 'member',
          trainerName: member.trainer?.name || null,
        }
      } else if (member && !member.password) {
        return NextResponse.json(
          { error: '비밀번호가 설정되지 않은 회원입니다. 트레이너에게 문의하세요.' },
          { status: 401 }
        )
      }
    }

    if (!user) {
      console.log('❌ 사용자를 찾을 수 없음')
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // 2. 비밀번호 확인
    console.log('🔑 비밀번호 확인 시작')
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password
    )
    console.log('🔐 비밀번호 확인 결과:', isPasswordValid ? '일치' : '불일치')

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // 3. JWT 토큰 생성
    console.log('🎫 JWT 토큰 생성 시작')
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'trainer' | 'member' | 'admin',
      name: user.name,
    })
    console.log('✅ JWT 토큰 생성 완료')

    // 4. 응답 생성
    const response = NextResponse.json(
      {
        message: '로그인에 성공했습니다',
        user: userData,
      },
      { status: 200 }
    )

    // 5. JWT 토큰을 HTTP-only 쿠키에 설정
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Zod 유효성 검사 실패:', error.issues)
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('💥 로그인 에러 발생:', error)
    console.error('에러 타입:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('에러 메시지:', error instanceof Error ? error.message : String(error))
    console.error('스택 트레이스:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
