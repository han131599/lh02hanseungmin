import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'
import { z } from 'zod'

export const runtime = 'nodejs'

// 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 삭제되지 않은 게시글만 조회
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          comments: {
            where: {
              deletedAt: null,
            },
          },
          likes: true,
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.communityPost.count({
        where: {
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      posts: posts.map(post => ({
        ...post,
        commentCount: post.comments.length,
        likeCount: post.likes.length,
        comments: undefined,
        likes: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('게시글 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '게시글을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 게시글 작성
const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(1, '내용을 입력해주세요'),
  isNotice: z.boolean().optional(),
  isPinned: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    // 공지사항/고정은 관리자만 가능
    if ((validatedData.isNotice || validatedData.isPinned) && user.role !== 'admin') {
      return NextResponse.json(
        { error: '공지사항 작성 권한이 없습니다' },
        { status: 403 }
      )
    }

    const post = await prisma.communityPost.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        authorId: user.userId,
        authorRole: user.role,
        authorName: user.name,
        isNotice: validatedData.isNotice || false,
        isPinned: validatedData.isPinned || false,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.issues },
        { status: 400 }
      )
    }

    console.error('게시글 작성 오류:', error)
    return NextResponse.json(
      { error: '게시글 작성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
