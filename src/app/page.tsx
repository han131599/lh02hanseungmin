import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar, Users, CreditCard, TrendingUp, CheckCircle, Package } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">💪</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PT Buddy
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/products">
              <Button variant="ghost" className="gap-2">
                <Package className="w-4 h-4" />
                보조제 상품
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                무료로 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              PT 트레이너를 위한
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                올인원 회원 관리 솔루션
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
              일정, 회원, 수강권 관리를 한곳에서 쉽고 빠르게
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 h-auto"
              >
                무료로 시작하기
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto"
              >
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            PT Buddy의 핵심 기능
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-blue-400 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">일정 관리</CardTitle>
                <CardDescription>
                  회원별 PT 일정을 캘린더로 한눈에 관리하세요
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-purple-400 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">회원 관리</CardTitle>
                <CardDescription>
                  회원 정보와 운동 기록을 체계적으로 관리하세요
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-green-400 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">수강권 관리</CardTitle>
                <CardDescription>
                  수강권 만료일과 잔여 횟수를 자동으로 추적하세요
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-orange-400 transition-all hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">통계 분석</CardTitle>
                <CardDescription>
                  수익과 회원 통계를 실시간으로 확인하세요
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-white/50 rounded-3xl my-20">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            왜 PT Buddy를 선택해야 할까요?
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-semibold mb-2">간편한 사용</h4>
                <p className="text-gray-600">
                  복잡한 설정 없이 바로 시작할 수 있는 직관적인 인터페이스
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-semibold mb-2">모바일 최적화</h4>
                <p className="text-gray-600">
                  언제 어디서나 스마트폰으로 회원 관리가 가능합니다
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-semibold mb-2">자동 알림</h4>
                <p className="text-gray-600">
                  수강권 만료일과 예정된 일정을 자동으로 알려드립니다
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-xl font-semibold mb-2">안전한 데이터</h4>
                <p className="text-gray-600">
                  클라우드 백업으로 데이터 손실 걱정 없이 안전하게 관리
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <h3 className="text-3xl md:text-4xl font-bold">
            지금 바로 시작하세요
          </h3>
          <p className="text-xl opacity-90">
            회원 관리에 드는 시간을 줄이고, PT에 더 집중하세요
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto"
            >
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-4">
              <h4 className="font-semibold text-lg mb-2">PT Buddy</h4>
              <p className="text-sm text-gray-600">
                PT 트레이너를 위한 스마트한 회원 관리 솔루션
              </p>
            </div>
            <div className="text-sm text-gray-600 pt-4 border-t">
              <p>© 2025 PT Buddy. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
