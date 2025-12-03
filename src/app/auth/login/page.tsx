'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'trainer' | 'member' | 'admin'>('trainer')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'trainer',
    },
  })

  const onSubmit = async (data: LoginInput) => {
    console.log('🚀 로그인 시작:', { email: data.email, role: data.role })
    setLoading(true)
    setError('')

    try {
      console.log('📡 API 요청 시작...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('📥 응답 받음:', response.status, response.ok)
      const result = await response.json()
      console.log('📦 응답 데이터:', result)

      if (!response.ok) {
        console.error('❌ 로그인 실패:', result.error)
        throw new Error(result.error || '로그인에 실패했습니다')
      }

      console.log('✅ 로그인 성공, 리다이렉트 준비...')

      // 쿠키가 브라우저에 적용될 시간을 주기 위해 약간의 지연 후 리다이렉트
      await new Promise(resolve => setTimeout(resolve, 100))

      // 역할에 따라 다른 페이지로 리다이렉트
      if (result.user.role === 'member') {
        console.log('👤 회원 대시보드로 이동')
        window.location.href = '/member/dashboard'
      } else if (result.user.role === 'admin') {
        console.log('👨‍💼 관리자 대시보드로 이동')
        window.location.href = '/admin/dashboard'
      } else {
        console.log('💼 트레이너 대시보드로 이동')
        window.location.href = '/dashboard'
      }
    } catch (error: unknown) {
      console.error('💥 에러 발생:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('로그인에 실패했습니다')
      }
    } finally {
      setLoading(false)
      console.log('🏁 로그인 프로세스 종료')
    }
  }

  const handleRoleChange = (role: 'trainer' | 'member' | 'admin') => {
    setSelectedRole(role)
    setValue('role', role)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PT Buddy
          </CardTitle>
          <CardDescription className="text-center text-base">
            트레이너를 위한 스마트 일정 관리
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 로그인 유형 선택 */}
            <div className="space-y-2">
              <Label>로그인 유형</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('trainer')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedRole === 'trainer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  트레이너
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('member')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedRole === 'member'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  일반 회원
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedRole === 'admin'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  관리자
                </button>
              </div>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="trainer@example.com"
                autoComplete="email"
                {...register('email')}
                disabled={loading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                <Link
                  href="/auth/reset-password"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                disabled={loading}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md flex items-start gap-2">
                <span className="text-red-500 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-600">
            계정이 없으신가요?{' '}
            <Link
              href="/auth/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              무료로 시작하기
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
