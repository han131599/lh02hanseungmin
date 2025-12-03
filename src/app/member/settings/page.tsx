'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function MemberSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const handleDeleteAccount = async () => {
    if (!deletePassword || deleteConfirmation !== '회원탈퇴') {
      setError('비밀번호와 확인 문구를 정확히 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '계정 삭제에 실패했습니다')
      }

      setSuccess('계정이 성공적으로 삭제되었습니다. 그동안 이용해주셔서 감사합니다.')

      setTimeout(() => {
        router.push('/auth/login')
        router.refresh()
      }, 2000)
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('계정 삭제 중 오류가 발생했습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">계정 설정</h1>
        <p className="text-gray-600 mt-2">회원님의 계정 정보를 관리하세요</p>
      </div>

      {/* 프로필 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>기본 계정 정보를 확인하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            프로필 정보 수정이 필요한 경우 담당 트레이너에게 문의해주세요.
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>계정 보안을 위해 주기적으로 비밀번호를 변경하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push('/auth/reset-password')}>
            비밀번호 변경하기
          </Button>
        </CardContent>
      </Card>

      {/* 위험한 작업 카드 */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">위험한 작업</CardTitle>
          <CardDescription>이 작업은 되돌릴 수 없습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">회원 탈퇴</h3>
            <p className="text-sm text-gray-600">
              계정을 삭제하면 다음 데이터가 비활성화됩니다:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>프로필 정보 및 계정 데이터</li>
              <li>PT 일정 및 수강권 정보</li>
              <li>보조제 섭취 기록</li>
              <li>모든 활동 내역</li>
            </ul>
          </div>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                회원 탈퇴
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-red-600">정말 탈퇴하시겠습니까?</DialogTitle>
                <DialogDescription className="space-y-2">
                  <p>이 작업은 되돌릴 수 없습니다.</p>
                  <p className="font-semibold">계정이 비활성화되며, 모든 데이터에 접근할 수 없게 됩니다.</p>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-password">비밀번호 확인</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="현재 비밀번호를 입력하세요"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation">
                    확인을 위해 <span className="font-bold text-red-600">회원탈퇴</span>를 입력하세요
                  </Label>
                  <Input
                    id="delete-confirmation"
                    type="text"
                    placeholder="회원탈퇴"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false)
                    setDeletePassword('')
                    setDeleteConfirmation('')
                    setError('')
                  }}
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={loading || !deletePassword || deleteConfirmation !== '회원탈퇴'}
                >
                  {loading ? '처리 중...' : '탈퇴하기'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
