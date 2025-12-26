import { NextRequest, NextResponse } from 'next/server'
import { getCoupangAPIClient, SUPPLEMENT_CATEGORIES, type SupplementCategoryKey } from '@/lib/coupang-api'
import prisma from '@/lib/prisma'
import { SupplementCategory } from '@prisma/client'

export const runtime = 'nodejs'

type SortBy = 'latest' | 'sales' | 'reviews'

/**
 * GET /api/coupang-products
 *
 * 쿠팡 상품을 월별로 조회
 * - DB에 캐시된 데이터가 있으면 반환
 * - 없으면 쿠팡 API 호출 후 DB에 저장
 *
 * Query Parameters:
 * - category: protein | omega3 | creatine | bcaa | vitamin | preworkout (필수)
 * - month: YYYY-MM (선택, 기본값: 현재 월)
 * - sortBy: latest | sales | reviews (선택, 기본값: latest)
 * - limit: number (선택, 기본값: 20)
 * - offset: number (선택, 기본값: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as SupplementCategoryKey | null
    const month = searchParams.get('month') || getCurrentMonth()
    const sortBy = (searchParams.get('sortBy') || 'latest') as SortBy
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 카테고리 검증
    if (!category || !SUPPLEMENT_CATEGORIES[category]) {
      return NextResponse.json(
        { error: '유효한 카테고리를 선택해주세요 (protein, omega3, creatine, bcaa, vitamin, preworkout)' },
        { status: 400 }
      )
    }

    // 월 형식 검증 (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: '월 형식이 올바르지 않습니다. YYYY-MM 형식을 사용하세요.' },
        { status: 400 }
      )
    }

    // DB에서 해당 월의 데이터 조회
    let products = await getProductsFromDB(category, month, sortBy, limit, offset)

    // 데이터가 없으면 쿠팡 API에서 가져오기
    if (products.length === 0) {
      console.log(`Fetching products from Coupang API: category=${category}, month=${month}`)
      await fetchAndSaveProducts(category, month)
      products = await getProductsFromDB(category, month, sortBy, limit, offset)
    }

    // 총 개수 조회
    const totalCount = await prisma.coupangProduct.count({
      where: {
        category: categoryToEnum(category),
        month,
      },
    })

    return NextResponse.json({
      data: products,
      totalCount,
      month,
      category,
      sortBy,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in GET /api/coupang-products:', error)

    // API 자격 증명 오류 처리
    if (error instanceof Error && error.message.includes('credentials')) {
      return NextResponse.json(
        { error: '쿠팡 API 설정이 필요합니다. 환경 변수를 확인하세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '상품 목록 조회 실패' },
      { status: 500 }
    )
  }
}

/**
 * DB에서 상품 조회
 */
async function getProductsFromDB(
  category: SupplementCategoryKey,
  month: string,
  sortBy: SortBy,
  limit: number,
  offset: number
) {
  const orderBy = getOrderBy(sortBy)

  return await prisma.coupangProduct.findMany({
    where: {
      category: categoryToEnum(category),
      month,
    },
    orderBy,
    take: limit,
    skip: offset,
  })
}

/**
 * 쿠팡 API에서 상품을 가져와서 DB에 저장
 */
async function fetchAndSaveProducts(category: SupplementCategoryKey, month: string) {
  const coupangClient = getCoupangAPIClient()
  const categoryId = SUPPLEMENT_CATEGORIES[category]

  // 카테고리별 검색 키워드 매핑
  const keywords: Record<SupplementCategoryKey, string> = {
    protein: '단백질 보충제',
    omega3: '오메가3',
    creatine: '크레아틴',
    bcaa: 'BCAA',
    vitamin: '종합비타민',
    preworkout: '프리워크아웃',
  }

  // 쿠팡 API 호출
  const response = await coupangClient.searchProducts({
    keyword: keywords[category],
    limit: 100,
    categoryId,
  })

  // 딥링크 생성 및 DB 저장
  const productsToSave = await Promise.all(
    response.data.map(async (product) => {
      const affiliateUrl = await coupangClient.generateDeepLink(product.productUrl)

      return {
        productId: product.productId,
        productName: product.productName,
        productUrl: product.productUrl,
        affiliateUrl,
        productImage: product.productImage,
        productPrice: product.productPrice,
        originalPrice: product.originalPrice,
        discountRate: product.discountRate,
        isRocketDelivery: product.isRocketDelivery,
        isFreeShipping: product.isFreeShipping,
        rating: product.rating,
        reviewCount: product.reviewCount,
        salesCount: product.salesCount || 0,
        brand: product.brand,
        category: categoryToEnum(category),
        categoryName: product.categoryName,
        month,
      }
    })
  )

  // Upsert 처리 (중복 방지)
  await Promise.all(
    productsToSave.map((product) =>
      prisma.coupangProduct.upsert({
        where: {
          productId_month: {
            productId: product.productId,
            month: product.month,
          },
        },
        update: product,
        create: product,
      })
    )
  )

  console.log(`Saved ${productsToSave.length} products for ${category} - ${month}`)
}

/**
 * 정렬 기준 변환
 */
function getOrderBy(sortBy: SortBy) {
  switch (sortBy) {
    case 'sales':
      return [{ salesCount: 'desc' as const }, { createdAt: 'desc' as const }]
    case 'reviews':
      return [{ reviewCount: 'desc' as const }, { rating: 'desc' as const }]
    case 'latest':
    default:
      return [{ createdAt: 'desc' as const }]
  }
}

/**
 * 카테고리 문자열을 Enum으로 변환
 */
function categoryToEnum(category: SupplementCategoryKey): SupplementCategory {
  return category as SupplementCategory
}

/**
 * 현재 월 가져오기 (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
