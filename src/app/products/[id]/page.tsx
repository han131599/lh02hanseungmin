'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface CoupangProduct {
  id: string
  productId: string
  productName: string
  productUrl: string
  affiliateUrl: string | null
  productImage: string
  productPrice: number
  originalPrice: number
  discountRate: number
  isRocketDelivery: boolean
  isFreeShipping: boolean
  rating: number
  reviewCount: number
  salesCount: number
  brand: string | null
  category: string
  categoryName: string | null
  month: string
  createdAt: string
  updatedAt: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<CoupangProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/coupang-products/${productId}`)
      if (!response.ok) {
        throw new Error('상품 정보를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
          <p className="text-red-600 font-medium mb-4">
            {error || '상품을 찾을 수 없습니다.'}
          </p>
          <Link
            href="/products"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const discountedPrice = product.productPrice
  const hasDiscount = product.discountRate > 0
  const savingsAmount = product.originalPrice - product.productPrice

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/products"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* 상품 이미지 */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.productImage}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-lg font-bold px-4 py-2 rounded-lg">
                  {product.discountRate}% 할인
                </div>
              )}
              {product.isRocketDelivery && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white text-sm font-bold px-3 py-2 rounded-lg">
                  🚀 로켓배송
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div className="flex flex-col">
              {/* 브랜드 */}
              {product.brand && (
                <div className="mb-2">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {product.brand}
                  </span>
                </div>
              )}

              {/* 카테고리 */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {getCategoryLabel(product.category)}
                </span>
              </div>

              {/* 상품명 */}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                {product.productName}
              </h1>

              {/* 평점 & 리뷰 */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="flex items-center">
                  <div className="flex text-yellow-400 text-xl">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>
                        {i < Math.floor(product.rating) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-lg font-medium text-gray-900">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">
                  리뷰 <span className="font-medium">{product.reviewCount.toLocaleString()}</span>개
                </span>
                {product.salesCount > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">
                      판매 <span className="font-medium">{product.salesCount.toLocaleString()}</span>+
                    </span>
                  </>
                )}
              </div>

              {/* 가격 정보 */}
              <div className="mb-6">
                {hasDiscount && (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl text-gray-400 line-through">
                        {product.originalPrice.toLocaleString()}원
                      </span>
                      <span className="text-2xl font-bold text-red-500">
                        {product.discountRate}%
                      </span>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {discountedPrice.toLocaleString()}원
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      {savingsAmount.toLocaleString()}원 할인
                    </div>
                  </>
                )}
                {!hasDiscount && (
                  <div className="text-4xl font-bold text-gray-900">
                    {discountedPrice.toLocaleString()}원
                  </div>
                )}
              </div>

              {/* 배송 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">배송 정보</h3>
                <div className="space-y-2 text-sm">
                  {product.isRocketDelivery && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🚀</span>
                      <span className="text-gray-700">로켓배송 가능</span>
                    </div>
                  )}
                  {product.isFreeShipping && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">📦</span>
                      <span className="text-gray-700">무료배송</span>
                    </div>
                  )}
                  {!product.isRocketDelivery && !product.isFreeShipping && (
                    <div className="text-gray-600">일반배송</div>
                  )}
                </div>
              </div>

              {/* 구매 버튼 */}
              <div className="space-y-3 mt-auto">
                <a
                  href={product.affiliateUrl || product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-4 rounded-lg transition-colors"
                >
                  쿠팡에서 구매하기
                </a>
                <p className="text-xs text-gray-500 text-center">
                  이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="border-t p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">상품 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">카테고리</span>
                <span className="font-medium text-gray-900">
                  {product.categoryName || getCategoryLabel(product.category)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">브랜드</span>
                <span className="font-medium text-gray-900">
                  {product.brand || '-'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">데이터 기준월</span>
                <span className="font-medium text-gray-900">{product.month}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">상품 ID</span>
                <span className="font-medium text-gray-900">{product.productId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    protein: '단백질',
    omega3: '오메가3',
    creatine: '크레아틴',
    bcaa: 'BCAA',
    vitamin: '비타민',
    preworkout: '프리워크아웃',
  }
  return labels[category] || category
}
