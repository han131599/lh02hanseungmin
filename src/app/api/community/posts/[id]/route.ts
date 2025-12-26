import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'

export const runtime = 'nodejs'

// 게시글 상세 조회 (조회수 증가)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 조회수 증가
    const post = await prisma.communityPost.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      include: {
        comments: {
          where: {
            deletedAt: null,
          },
          include: {
            likes: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: true,
      },
    })

    if (post.deletedAt) {
      return NextResponse.json(
        { error: '삭제된 게시글입니다' },
        { status: 404 }
      )
    }

    // 공감 수 포함
    const responsePost = {
      ...post,
      likeCount: post.likes.length,
      comments: post.comments.map(comment => ({
        ...comment,
        likeCount: comment.likes.length,
        likes: undefined,
      })),
      likes: undefined,
    }

    return NextResponse.json(responsePost)
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return NextResponse.json(
      { error: '게시글을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 게시글 수정
const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  isNotice: z.boolean().optional(),
  isPinned: z.boolean().optional(),
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
    const validatedData = updatePostSchema.parse(body)

    // 게시글 조회
    const post = await prisma.communityPost.findUnique({
      where: { id },
    })

    if (!post || post.deletedAt) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 작성자 본인 또는 관리자만 수정 가능
    if (post.authorId !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: '게시글 수정 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 공지사항/고정은 관리자만 수정 가능
    if ((validatedData.isNotice !== undefined || validatedData.isPinned !== undefined) && user.role !== 'admin') {
      return NextResponse.json(
        { error: '공지사항 설정 권한이 없습니다' },
        { status: 403 }
      )
    }

    const updatedPost = await prisma.communityPost.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('게시글 수정 오류:', error)
    return NextResponse.json(
      { error: '게시글 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 게시글 삭제 (소프트 삭제)
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

    // 게시글 조회
    const post = await prisma.communityPost.findUnique({
      where: { id },
    })

    if (!post || post.deletedAt) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 작성자 본인 또는 관리자만 삭제 가능
    if (post.authorId !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: '게시글 삭제 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 소프트 삭제
    await prisma.communityPost.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.userId,
      },
    })

    return NextResponse.json({ message: '게시글이 삭제되었습니다' })
  } catch (error) {
    console.error('게시글 삭제 오류:', error)
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
