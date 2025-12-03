import crypto from 'crypto'

interface CoupangConfig {
  accessKey: string
  secretKey: string
  partnerId: string
}

interface ProductSearchParams {
  keyword: string
  limit?: number
  categoryId?: string
}

interface ProductSearchResponse {
  data: CoupangProduct[]
  totalCount: number
}

export interface CoupangProduct {
  productId: string
  productName: string
  productUrl: string
  productImage: string
  productPrice: number
  originalPrice: number
  discountRate: number
  isRocketDelivery: boolean
  isFreeShipping: boolean
  rating: number
  reviewCount: number
  salesCount?: number
  brand?: string
  categoryName: string
  updatedAt: string
}

export class CoupangPartnersAPI {
  private config: CoupangConfig
  private baseUrl = 'https://api-gateway.coupang.com'

  constructor(config: CoupangConfig) {
    this.config = config
  }

  /**
   * HMAC 서명 생성
   */
  private generateHmac(method: string, path: string, datetime: string): string {
    const message = `${datetime.slice(0, -5)}${method}${path}`
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(message)
      .digest('hex')
  }

  /**
   * API 요청 헤더 생성
   */
  private getHeaders(method: string, path: string): Record<string, string> {
    const datetime = new Date().toISOString()
    const authorization = this.generateHmac(method, path, datetime)

    return {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: `HMAC-SHA256 accesskey=${this.config.accessKey}, datetime=${datetime.slice(0, -5)}, signature=${authorization}`,
    }
  }

  /**
   * 상품 검색
   */
  async searchProducts(params: ProductSearchParams): Promise<ProductSearchResponse> {
    const { keyword, limit = 100, categoryId } = params
    const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search'

    const queryParams = new URLSearchParams({
      keyword,
      limit: limit.toString(),
      ...(categoryId && { categoryId }),
    })

    try {
      const response = await fetch(`${this.baseUrl}${path}?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders('GET', `${path}?${queryParams}`),
      })

      if (!response.ok) {
        throw new Error(`Coupang API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformSearchResponse(data)
    } catch (error) {
      console.error('Coupang API searchProducts error:', error)
      throw error
    }
  }

  /**
   * 딥링크 생성
   */
  async generateDeepLink(productUrl: string): Promise<string> {
    const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink'

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders('POST', path),
        body: JSON.stringify({
          coupangUrls: [productUrl],
        }),
      })

      if (!response.ok) {
        throw new Error(`Coupang API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.data[0]?.shortenUrl || productUrl
    } catch (error) {
      console.error('Coupang API generateDeepLink error:', error)
      return productUrl
    }
  }

  /**
   * 응답 데이터 변환
   */
  private transformSearchResponse(apiResponse: any): ProductSearchResponse {
    const products = apiResponse.data?.productData || []

    return {
      data: products.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        productUrl: item.productUrl,
        productImage: item.productImage,
        productPrice: item.productPrice,
        originalPrice: item.originalPrice || item.productPrice,
        discountRate: this.calculateDiscountRate(item.originalPrice, item.productPrice),
        isRocketDelivery: item.isRocket || false,
        isFreeShipping: item.isFreeShipping || false,
        rating: item.rating || 0,
        reviewCount: item.reviewCount || 0,
        salesCount: item.salesCount || 0,
        brand: item.vendorName || '',
        categoryName: item.categoryName || '',
        updatedAt: new Date().toISOString(),
      })),
      totalCount: apiResponse.data?.totalCount || 0,
    }
  }

  /**
   * 할인율 계산
   */
  private calculateDiscountRate(originalPrice: number, salePrice: number): number {
    if (!originalPrice || originalPrice === salePrice) return 0
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  }
}

/**
 * 쿠팡 파트너스 API 클라이언트 인스턴스 생성
 */
export function getCoupangAPIClient(): CoupangPartnersAPI {
  const config: CoupangConfig = {
    accessKey: process.env.COUPANG_ACCESS_KEY || '',
    secretKey: process.env.COUPANG_SECRET_KEY || '',
    partnerId: process.env.COUPANG_PARTNER_ID || '',
  }

  if (!config.accessKey || !config.secretKey || !config.partnerId) {
    throw new Error('Coupang API credentials are not configured')
  }

  return new CoupangPartnersAPI(config)
}

/**
 * 카테고리 ID 맵핑 (쿠팡 실제 카테고리 ID로 교체 필요)
 */
export const SUPPLEMENT_CATEGORIES = {
  protein: '194176',      // 단백질 보충제
  omega3: '194984',       // 오메가3
  creatine: '194177',     // 크레아틴
  bcaa: '194178',         // BCAA
  vitamin: '393760',      // 비타민
  preworkout: '194179',   // 프리워크아웃
} as const

export type SupplementCategoryKey = keyof typeof SUPPLEMENT_CATEGORIES
