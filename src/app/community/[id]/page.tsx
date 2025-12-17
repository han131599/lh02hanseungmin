'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  authorRole: string
  createdAt: string
  deletedAt: string | null
}

interface Post {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  authorRole: string
  viewCount: number
  isNotice: boolean
  isPinned: boolean
  createdAt: string
  comments: Comment[]
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchPost()
    fetchCurrentUser()
  }, [resolvedParams.id])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)
      }
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error)
    }
  }

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/community/posts/${resolvedParams.id}`)

      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setPost(data)
    } catch (error) {
      console.error('게시글 조회 오류:', error)
      alert('게시글을 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${resolvedParams.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentContent,
        }),
      })

      if (!response.ok) {
        throw new Error('댓글 작성에 실패했습니다')
      }

      setCommentContent('')
      fetchPost()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/community/posts/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('게시글 삭제에 실패했습니다')
      }

      alert('게시글이 삭제되었습니다')
      router.push('/community')
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('댓글 삭제에 실패했습니다')
      }

      fetchPost()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const canDeletePost = () => {
    if (!currentUser || !post) return false
    return currentUser.userId === post.authorId || currentUser.role === 'admin'
  }

  const canDeleteComment = (comment: Comment) => {
    if (!currentUser) return false
    return currentUser.userId === comment.authorId || currentUser.role === 'admin'
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

  if (loading || !post) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => router.push('/community')}>
          ← 목록으로
        </Button>

        <Card>
          <CardHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
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
              </div>
              <CardTitle className="text-2xl">{post.title}</CardTitle>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span>{post.authorName}</span>
                    {getRoleBadge(post.authorRole)}
                  </div>
                  <span>•</span>
                  <span>조회 {post.viewCount}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
                {canDeletePost() && (
                  <Button variant="destructive" size="sm" onClick={handleDeletePost}>
                    삭제
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none whitespace-pre-wrap">
              {post.content}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>댓글 {post.comments.length}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCommentSubmit} className="space-y-2">
              <Input
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 입력하세요"
                disabled={submitting}
                maxLength={1000}
              />
              <Button type="submit" disabled={submitting || !commentContent.trim()}>
                {submitting ? '작성 중...' : '댓글 작성'}
              </Button>
            </form>

            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{comment.authorName}</span>
                      {getRoleBadge(comment.authorRole)}
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap">{comment.content}</div>
                </div>
              ))}

              {post.comments.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
