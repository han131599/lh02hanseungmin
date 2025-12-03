'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SignupSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">
            회원가입이 완료되었습니다!
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            PT Buddy에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900 text-sm">
              이제 다음 기능을 사용하실 수 있습니다:
            </h3>
            <ul className="space-y-1.5 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>회원 등록 및 관리 (최대 5명)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>PT 일정 예약 및 관리</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>수강권 발급 및 추적</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>운동 일지 작성</span>
              </li>
            </ul>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              5초 후 자동으로 대시보드로 이동합니다
            </p>
            <Link href="/dashboard">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                대시보드로 이동
              </Button>
            </Link>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-center text-gray-500">
              더 많은 회원을 관리하고 싶으신가요?{' '}
              <Link
                href="/dashboard/subscription"
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                프리미엄 플랜 보기
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
