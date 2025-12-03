import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
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

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 이번 달 시작일
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // 통계 데이터 조회
    const [
      totalTrainers,
      activeTrainers,
      deletedTrainers,
      totalMembers,
      activeMembers,
      deletedMembers,
      totalAppointments,
      completedAppointments,
      totalMemberships,
      activeMemberships,
      totalRevenueResult,
      monthlyRevenueResult,
    ] = await Promise.all([
      prisma.trainer.count(),
      prisma.trainer.count({ where: { isActive: true, deletedAt: null, role: 'trainer' } }),
      prisma.trainer.count({ where: { deletedAt: { not: null } } }),
      prisma.member.count(),
      prisma.member.count({ where: { isActive: true, deletedAt: null } }),
      prisma.member.count({ where: { deletedAt: { not: null } } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'completed' } }),
      prisma.membership.count(),
      prisma.membership.count({ where: { isActive: true } }),
      prisma.membership.aggregate({
        _sum: {
          price: true,
        },
      }),
      prisma.membership.aggregate({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
        _sum: {
          price: true,
        },
      }),
    ])

    const totalRevenue = Number(totalRevenueResult._sum.price || 0)
    const monthlyRevenue = Number(monthlyRevenueResult._sum.price || 0)

    // 최근 가입 사용자 (트레이너 + 회원 합쳐서 최근 10명)
    const recentTrainers = await prisma.trainer.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const recentMembers = await prisma.member.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // 트레이너와 회원을 합쳐서 날짜순 정렬
    const recentUsers = [...recentTrainers, ...recentMembers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return NextResponse.json({
      stats: {
        totalTrainers,
        activeTrainers,
        deletedTrainers,
        totalMembers,
        activeMembers,
        deletedMembers,
        totalAppointments,
        completedAppointments,
        totalMemberships,
        activeMemberships,
        totalRevenue,
        monthlyRevenue,
      },
      recentUsers,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: '대시보드 데이터를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
