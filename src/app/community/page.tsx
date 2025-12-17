'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Post {
  id: string
  title: string
  content: string
  authorName: string
  authorRole: string
  viewCount: number
  commentCount: number
  isNotice: boolean
  isPinned: boolean
  createdAt: string
}

export default function CommunityPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchPosts()
  }, [currentPage])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/community/posts?page=${currentPage}&limit=20`)

      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setPosts(data.posts)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('게시글 조회 오류:', error)
      alert('게시글을 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-700">관리자</span>
      case 'trainer':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700">트레이너</span>
      case 'member':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">회원</span>
      default:
        return null
    }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">커뮤니티</CardTitle>
                <CardDescription>PT Buddy 회원들의 소통 공간</CardDescription>
              </div>
              <Button onClick={() => router.push('/community/new')}>
                게시글 작성
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-3">
          {posts.map((post) => (
            <Card
              key={post.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                post.isPinned ? 'border-2 border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => router.push(`/community/${post.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isNotice && (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-700">
                          공지
                        </span>
                      )}
                      {post.isPinned && (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-blue-100 text-blue-700">
                          고정
                        </span>
                      )}
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>{post.authorName}</span>
                        {getRoleBadge(post.authorRole)}
                      </div>
                      <span>•</span>
                      <span>조회 {post.viewCount}</span>
                      <span>•</span>
                      <span>댓글 {post.commentCount}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {posts.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              아직 게시글이 없습니다. 첫 번째 게시글을 작성해보세요!
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              이전
            </Button>
            <span className="flex items-center px-4">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
