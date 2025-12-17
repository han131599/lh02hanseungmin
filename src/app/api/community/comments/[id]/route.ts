import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'

// 댓글 수정
const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // 댓글 조회
    const comment = await prisma.communityComment.findUnique({
      where: { id },
    })

    if (!comment || comment.deletedAt) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 작성자 본인만 수정 가능
    if (comment.authorId !== user.userId) {
      return NextResponse.json(
        { error: '댓글 수정 권한이 없습니다' },
        { status: 403 }
      )
    }

    const updatedComment = await prisma.communityComment.update({
      where: { id },
      data: { content: validatedData.content },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('댓글 수정 오류:', error)
    return NextResponse.json(
      { error: '댓글 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 댓글 삭제 (소프트 삭제) - 작성자 본인 또는 관리자
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 댓글 조회
    const comment = await prisma.communityComment.findUnique({
      where: { id },
    })

    if (!comment || comment.deletedAt) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 작성자 본인 또는 관리자만 삭제 가능
    if (comment.authorId !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: '댓글 삭제 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 소프트 삭제
    await prisma.communityComment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.userId,
      },
    })

    return NextResponse.json({ message: '댓글이 삭제되었습니다' })
  } catch (error) {
    console.error('댓글 삭제 오류:', error)
    return NextResponse.json(
      { error: '댓글 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
