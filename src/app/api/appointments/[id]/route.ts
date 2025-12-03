import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// PATCH /api/appointments/[id] - 일정 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { scheduledAt, duration, status, notes } = body

    // 일정 소유권 확인
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        trainerId: user.userId
      },
      include: {
        member: {
          include: {
            memberships: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // 상태를 'completed'로 변경하는 경우 수강권 차감
    if (status === 'completed' && existingAppointment.status !== 'completed') {
      const activeMemberships = existingAppointment.member.memberships
      if (activeMemberships.length > 0) {
        const membership = activeMemberships[0]

        // 횟수권인 경우 잔여 횟수 차감
        if (membership.type === 'session' && membership.remainingSessions) {
          await prisma.membership.update({
            where: { id: membership.id },
            data: {
              remainingSessions: {
                decrement: 1
              }
            }
          })
        }
      }
    }

    // 일정 수정
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        duration: duration !== undefined ? duration : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? (notes || null) : undefined
      },
      include: {
        member: true
      }
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

// DELETE /api/appointments/[id] - 일정 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 일정 소유권 확인
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        trainerId: user.userId
      }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // 일정 삭제
    await prisma.appointment.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}
