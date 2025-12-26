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
  likeCount: number
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6 shadow-xl border-0 bg-gradient-to-r from-blue-500 to-purple-600">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  💬 커뮤니티
                </CardTitle>
                <CardDescription className="text-blue-100">
                  PT Buddy 회원들의 소통 공간
                </CardDescription>
              </div>
              <Button
                onClick={() => router.push('/community/new')}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                게시글 작성
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className={`hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1 ${
                post.isPinned ? 'border-2 border-blue-400 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50' : 'shadow-md'
              }`}
              onClick={() => router.push(`/community/${post.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {post.authorName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isNotice && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-500 text-white shadow-sm">
                          📢 공지
                        </span>
                      )}
                      {post.isPinned && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500 text-white shadow-sm">
                          📌 고정
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">{post.authorName}</span>
                        {getRoleBadge(post.authorRole)}
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.commentCount}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.likeCount}
                        </span>
                        <span className="text-gray-500">
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {posts.length === 0 && !loading && (
          <Card className="shadow-lg">
            <CardContent className="p-16 text-center">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-semibold text-lg mb-2">아직 게시글이 없습니다</p>
              <p className="text-gray-400 mb-6">첫 번째 게시글을 작성해보세요!</p>
              <Button
                onClick={() => router.push('/community/new')}
                className="gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                게시글 작성하기
              </Button>
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              이전
            </Button>
            <div className="px-6 py-2 bg-white rounded-lg shadow-md font-semibold text-gray-700">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-2 shadow-sm"
            >
              다음
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
