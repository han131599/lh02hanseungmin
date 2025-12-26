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
  likeCount: number
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
  likeCount: number
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
  const [isPostLiked, setIsPostLiked] = useState(false)
  const [postLikeCount, setPostLikeCount] = useState(0)
  const [commentLikes, setCommentLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')

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
      setPostLikeCount(data.likeCount || 0)

      // 댓글 공감 상태 초기화
      const commentLikesMap: Record<string, { isLiked: boolean; count: number }> = {}
      data.comments.forEach((comment: Comment) => {
        commentLikesMap[comment.id] = {
          isLiked: false,
          count: comment.likeCount || 0,
        }
      })
      setCommentLikes(commentLikesMap)

      // 게시글 공감 상태 조회
      if (currentUser) {
        fetchPostLikeStatus()
        fetchCommentLikesStatus(data.comments.map((c: Comment) => c.id))
      }
    } catch (error) {
      console.error('게시글 조회 오류:', error)
      alert('게시글을 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const fetchPostLikeStatus = async () => {
    try {
      const response = await fetch(`/api/community/posts/${resolvedParams.id}/likes`)
      if (response.ok) {
        const data = await response.json()
        setIsPostLiked(data.isLiked)
        setPostLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('공감 상태 조회 오류:', error)
    }
  }

  const fetchCommentLikesStatus = async (commentIds: string[]) => {
    try {
      const results = await Promise.all(
        commentIds.map(id => fetch(`/api/community/comments/${id}/likes`).then(r => r.json()))
      )
      const newCommentLikes: Record<string, { isLiked: boolean; count: number }> = {}
      commentIds.forEach((id, index) => {
        newCommentLikes[id] = {
          isLiked: results[index].isLiked,
          count: results[index].likeCount,
        }
      })
      setCommentLikes(prev => ({ ...prev, ...newCommentLikes }))
    } catch (error) {
      console.error('댓글 공감 상태 조회 오류:', error)
    }
  }

  const handlePostLike = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다')
      return
    }

    try {
      const method = isPostLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/community/posts/${resolvedParams.id}/likes`, {
        method,
      })

      if (!response.ok) {
        throw new Error('공감 처리에 실패했습니다')
      }

      const data = await response.json()
      setIsPostLiked(!isPostLiked)
      setPostLikeCount(data.likeCount)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!currentUser) {
      alert('로그인이 필요합니다')
      return
    }

    try {
      const currentState = commentLikes[commentId]
      const method = currentState?.isLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/community/comments/${commentId}/likes`, {
        method,
      })

      if (!response.ok) {
        throw new Error('공감 처리에 실패했습니다')
      }

      const data = await response.json()
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: {
          isLiked: !currentState?.isLiked,
          count: data.likeCount,
        },
      }))
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleEditPost = () => {
    if (post) {
      setEditTitle(post.title)
      setEditContent(post.content)
      setIsEditing(true)
    }
  }

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/community/posts/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      })

      if (!response.ok) {
        throw new Error('게시글 수정에 실패했습니다')
      }

      setIsEditing(false)
      fetchPost()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingCommentContent(comment.content)
  }

  const handleSaveCommentEdit = async (commentId: string) => {
    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingCommentContent,
        }),
      })

      if (!response.ok) {
        throw new Error('댓글 수정에 실패했습니다')
      }

      setEditingCommentId(null)
      setEditingCommentContent('')
      fetchPost()
    } catch (error: any) {
      alert(error.message)
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

  const canEditPost = () => {
    if (!currentUser || !post) return false
    return currentUser.userId === post.authorId || currentUser.role === 'admin'
  }

  const canDeletePost = () => {
    if (!currentUser || !post) return false
    return currentUser.userId === post.authorId || currentUser.role === 'admin'
  }

  const canEditComment = (comment: Comment) => {
    if (!currentUser) return false
    return currentUser.userId === comment.authorId
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push('/community')}
          className="gap-2 shadow-md hover:shadow-lg transition-all bg-white font-semibold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </Button>

        <Card className="shadow-lg">
          {!isEditing && (
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
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
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-4">{post.title}</CardTitle>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {post.authorName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{post.authorName}</span>
                            {getRoleBadge(post.authorRole)}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {post.viewCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canEditPost() && (
                        <Button variant="outline" size="sm" onClick={handleEditPost} className="gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          수정
                        </Button>
                      )}
                      {canDeletePost() && (
                        <Button variant="destructive" size="sm" onClick={handleDeletePost} className="gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          )}
          {isEditing ? (
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">제목</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    maxLength={200}
                    className="text-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">내용</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="내용을 입력하세요"
                    className="w-full min-h-[300px] p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveEdit} className="gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-6">
              <div className="prose prose-lg max-w-none mb-6">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t">
                <Button
                  variant={isPostLiked ? "default" : "outline"}
                  size="lg"
                  onClick={handlePostLike}
                  className={`gap-2 transition-all ${isPostLiked ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' : 'hover:bg-red-50 hover:text-red-500 hover:border-red-300'}`}
                >
                  <svg className={`w-5 h-5 ${isPostLiked ? 'fill-current' : ''}`} fill={isPostLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-semibold">공감 {postLikeCount}</span>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <CardTitle className="text-xl">댓글 {post.comments.length}개</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  disabled={submitting}
                  maxLength={1000}
                  className="w-full min-h-[100px] p-4 pr-20 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {commentContent.length}/1000
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !commentContent.trim()}
                  className="gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {submitting ? '작성 중...' : '댓글 작성'}
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              {post.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {comment.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{comment.authorName}</span>
                          {getRoleBadge(comment.authorRole)}
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {canEditComment(comment) && editingCommentId !== comment.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComment(comment)}
                              className="h-8 px-2 text-gray-600 hover:text-blue-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                          )}
                          {canDeleteComment(comment) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-8 px-2 text-gray-600 hover:text-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-300">
                          <textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            placeholder="댓글 내용"
                            maxLength={1000}
                            className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveCommentEdit(comment.id)} className="gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              저장
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentContent('')
                              }}
                              className="gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                            {comment.content}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={commentLikes[comment.id]?.isLiked ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleCommentLike(comment.id)}
                              className={`gap-1 transition-all ${
                                commentLikes[comment.id]?.isLiked
                                  ? 'bg-red-500 hover:bg-red-600 text-white'
                                  : 'hover:bg-red-50 hover:text-red-500 hover:border-red-300'
                              }`}
                            >
                              <svg className={`w-4 h-4 ${commentLikes[comment.id]?.isLiked ? 'fill-current' : ''}`} fill={commentLikes[comment.id]?.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="text-sm font-medium">{commentLikes[comment.id]?.count || 0}</span>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {post.comments.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500 font-medium">아직 댓글이 없습니다</p>
                  <p className="text-gray-400 text-sm mt-1">첫 번째 댓글을 작성해보세요!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
