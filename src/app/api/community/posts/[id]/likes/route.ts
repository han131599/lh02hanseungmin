import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/jwt'

export const runtime = 'nodejs'

// 게시글 공감 추가
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

    // 이미 공감했는지 확인
    const existingLike = await prisma.communityPostLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.userId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json(
        { error: '이미 공감한 게시글입니다' },
        { status: 400 }
      )
    }

    // 공감 추가
    const like = await prisma.communityPostLike.create({
      data: {
        postId,
        userId: user.userId,
      },
    })

    // 총 공감 수 조회
    const likeCount = await prisma.communityPostLike.count({
      where: { postId },
    })

    return NextResponse.json({
      like,
      likeCount,
      message: '공감했습니다',
    })
  } catch (error) {
    console.error('게시글 공감 추가 오류:', error)
    return NextResponse.json(
      { error: '공감 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 게시글 공감 취소
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

    const { id: postId } = await params

    // 공감 삭제
    const deletedLike = await prisma.communityPostLike.deleteMany({
      where: {
        postId,
        userId: user.userId,
      },
    })

    if (deletedLike.count === 0) {
      return NextResponse.json(
        { error: '공감하지 않은 게시글입니다' },
        { status: 400 }
      )
    }

    // 총 공감 수 조회
    const likeCount = await prisma.communityPostLike.count({
      where: { postId },
    })

    return NextResponse.json({
      likeCount,
      message: '공감을 취소했습니다',
    })
  } catch (error) {
    console.error('게시글 공감 취소 오류:', error)
    return NextResponse.json(
      { error: '공감 취소 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 게시글 공감 상태 및 카운트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const user = await getCurrentUser()

    // 총 공감 수
    const likeCount = await prisma.communityPostLike.count({
      where: { postId },
    })

    // 현재 사용자의 공감 여부
    let isLiked = false
    if (user) {
      const userLike = await prisma.communityPostLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: user.userId,
          },
        },
      })
      isLiked = !!userLike
    }

    return NextResponse.json({
      likeCount,
      isLiked,
    })
  } catch (error) {
    console.error('게시글 공감 조회 오류:', error)
    return NextResponse.json(
      { error: '공감 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
