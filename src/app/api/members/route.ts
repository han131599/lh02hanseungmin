import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { hashPassword } from '@/lib/auth/password'
import prisma from '@/lib/prisma'

// GET /api/members - 회원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const members = await prisma.member.findMany({
      where: {
        trainerId: user.userId
      },
      include: {
        memberships: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            appointments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// POST /api/members - 회원 추가
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, email, birthDate, gender, notes } = body

    // 필수 필드 검증
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // 전화번호 중복 확인
    const existingMember = await prisma.member.findFirst({
      where: {
        trainerId: user.userId,
        phone: phone
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      )
    }

    // 임시 비밀번호 생성 (회원이 나중에 비밀번호 재설정으로 변경 가능)
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase()
    const hashedPassword = await hashPassword(tempPassword)

    // 회원 생성
    const member = await prisma.member.create({
      data: {
        trainerId: user.userId,
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        notes: notes || null
      },
      include: {
        memberships: true
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
