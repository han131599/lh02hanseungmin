import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // 토큰 검증
  const user = token ? await verifyToken(token) : null

  // 인증이 필요한 페이지 (dashboard, member, admin 경로)
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/member') || pathname.startsWith('/admin')

  // 관리자 전용 경로
  const isAdminRoute = pathname.startsWith('/admin')

  // 인증 페이지 (login, signup 등)
  const isAuthRoute = pathname.startsWith('/auth')

  // 1. 보호된 페이지에 인증되지 않은 사용자 접근 시 로그인 페이지로 리다이렉트
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // 2. 로그인한 사용자가 인증 페이지 접근 시 적절한 대시보드로 리다이렉트
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    if (user.role === 'member') {
      url.pathname = '/member/dashboard'
    } else if (user.role === 'admin') {
      url.pathname = '/admin/dashboard'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // 3. Role 기반 접근 제어
  // 관리자가 아닌 사용자가 관리자 대시보드 접근 시도 시 차단
  if (isAdminRoute && user?.role !== 'admin') {
    const url = request.nextUrl.clone()
    if (user?.role === 'member') {
      url.pathname = '/member/dashboard'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // 일반회원이 트레이너 대시보드 접근 시도 시 차단
  if (pathname.startsWith('/dashboard') && user?.role === 'member') {
    const url = request.nextUrl.clone()
    url.pathname = '/member/dashboard'
    return NextResponse.redirect(url)
  }

  // 일반회원이 관리자 대시보드 접근 시도 시 차단
  if (pathname.startsWith('/dashboard') && user?.role === 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  // 트레이너가 회원 대시보드 접근 시도 시 차단
  if (pathname.startsWith('/member') && user?.role === 'trainer') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 관리자가 일반 대시보드 접근 시도 시 차단
  if (pathname.startsWith('/member') && user?.role === 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
