import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'

// 댓글 작성
const createCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력해주세요').max(1000),
})

export async function POST(
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

    const { id: postId } = await params
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    })

    if (!post || post.deletedAt) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId,
        content: validatedData.content,
        authorId: user.userId,
        authorRole: user.role,
        authorName: user.name,
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('댓글 작성 오류:', error)
    return NextResponse.json(
      { error: '댓글 작성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
