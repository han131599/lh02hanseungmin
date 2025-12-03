'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type SupplementCategory = 'protein' | 'omega3' | 'creatine' | 'bcaa' | 'vitamin' | 'preworkout'
type SortBy = 'latest' | 'sales' | 'reviews'

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
  categoryName: string | null
  month: string
}

interface ProductsResponse {
  data: CoupangProduct[]
  totalCount: number
  month: string
  category: string
  sortBy: string
  limit: number
  offset: number
}

const CATEGORIES: { key: SupplementCategory; label: string }[] = [
  { key: 'protein', label: '단백질' },
  { key: 'omega3', label: '오메가3' },
  { key: 'creatine', label: '크레아틴' },
  { key: 'bcaa', label: 'BCAA' },
  { key: 'vitamin', label: '비타민' },
  { key: 'preworkout', label: '프리워크아웃' },
]

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'sales', label: '판매순' },
  { key: 'reviews', label: '리뷰순' },
]

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [category, setCategory] = useState<SupplementCategory>(
    (searchParams.get('category') as SupplementCategory) || 'protein'
  )
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get('sortBy') as SortBy) || 'latest'
  )
  const [month, setMonth] = useState<string>(
    searchParams.get('month') || getCurrentMonth()
  )

  const [products, setProducts] = useState<CoupangProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 상품 데이터 로드
  useEffect(() => {
    fetchProducts()
  }, [category, sortBy, month])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        category,
        sortBy,
        month,
        limit: '20',
        offset: '0',
      })

      const response = await fetch(`/api/coupang-products?${params}`)
      if (!response.ok) {
        throw new Error('상품 목록을 불러오는데 실패했습니다.')
      }

      const data: ProductsResponse = await response.json()
      setProducts(data.data)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (newCategory: SupplementCategory) => {
    setCategory(newCategory)
    updateURL({ category: newCategory })
  }

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort)
    updateURL({ sortBy: newSort })
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(e.target.value)
    updateURL({ month: e.target.value })
  }

  const updateURL = (params: Partial<{ category: string; sortBy: string; month: string }>) => {
    const current = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      current.set(key, value)
    })
    router.push(`/products?${current.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">보조제 상품 목록</h1>
              <p className="mt-2 text-sm text-gray-600">
                쿠팡 파트너스를 통해 제공되는 월별 보조제 상품 정보
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                메인으로
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      category === cat.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 정렬 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬
              </label>
              <div className="flex gap-2">
                {SORT_OPTIONS.map((sort) => (
                  <button
                    key={sort.key}
                    onClick={() => handleSortChange(sort.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === sort.key
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 월 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                조회 월
              </label>
              <input
                type="month"
                value={month}
                onChange={handleMonthChange}
                max={getCurrentMonth()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 결과 개수 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{totalCount}</span>개의 상품
            </p>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">오류가 발생했습니다</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* 상품 그리드 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* 상품 없음 */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">해당 조건의 상품이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">
              다른 카테고리나 월을 선택해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: CoupangProduct }) {
  const discountedPrice = product.productPrice
  const hasDiscount = product.discountRate > 0

  return (
    <a
      href={product.affiliateUrl || product.productUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      {/* 상품 이미지 */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.productImage}
          alt={product.productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {product.discountRate}%
          </div>
        )}
        {product.isRocketDelivery && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
            🚀 로켓배송
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="p-4">
        {/* 브랜드 */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
        )}

        {/* 상품명 */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[40px]">
          {product.productName}
        </h3>

        {/* 가격 */}
        <div className="mb-2">
          {hasDiscount && (
            <p className="text-xs text-gray-400 line-through">
              {product.originalPrice.toLocaleString()}원
            </p>
          )}
          <p className="text-lg font-bold text-gray-900">
            {discountedPrice.toLocaleString()}원
          </p>
        </div>

        {/* 평점 & 리뷰 */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="ml-1">{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-gray-300">|</span>
          <span>리뷰 {product.reviewCount.toLocaleString()}</span>
        </div>

        {/* 판매량 */}
        {product.salesCount > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            판매 {product.salesCount.toLocaleString()}+
          </div>
        )}

        {/* 무료배송 */}
        {product.isFreeShipping && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            무료배송
          </div>
        )}
      </div>
    </a>
  )
}

function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
