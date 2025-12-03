# 쿠팡 파트너스 API 연동 가이드

## 개요

PT Buddy에 쿠팡 파트너스 API를 연동하여 보조제 상품을 월별로 자동 수집하고, 최신순/판매순/리뷰순으로 정렬하여 표시하는 기능을 구현했습니다.

## 주요 기능

### 1. 월별 상품 데이터 관리
- 매월 쿠팡에서 보조제 상품 데이터를 가져와 DB에 저장
- 월별로 데이터를 분리하여 관리 (YYYY-MM 형식)
- 동일 상품의 월별 가격 변동 추적 가능

### 2. 카테고리별 분류
지원하는 보조제 카테고리:
- **단백질** (protein)
- **오메가3** (omega3)
- **크레아틴** (creatine)
- **BCAA** (bcaa)
- **비타민** (vitamin)
- **프리워크아웃** (preworkout)

### 3. 다양한 정렬 옵션
- **최신순**: 데이터 수집 시간 기준 최신 상품
- **판매순**: 판매량이 많은 순서
- **리뷰순**: 리뷰 개수가 많은 순서

### 4. 상품 정보
각 상품은 다음 정보를 포함합니다:
- 상품명, 브랜드, 카테고리
- 가격 (정가, 판매가, 할인율)
- 평점 및 리뷰 수
- 판매량
- 배송 정보 (로켓배송, 무료배송)
- 쿠팡 파트너스 딥링크

## 설치 및 설정

### 1. 쿠팡 파트너스 가입

1. [쿠팡 파트너스](https://partners.coupang.com) 접속
2. 회원가입 및 승인 대기
3. 승인 후 API 액세스 키 발급

### 2. 환경 변수 설정

`.env` 파일에 다음 정보를 추가하세요:

```env
# 쿠팡 파트너스 API
COUPANG_ACCESS_KEY=your-coupang-access-key
COUPANG_SECRET_KEY=your-coupang-secret-key
COUPANG_PARTNER_ID=your-coupang-partner-id
```

**중요**: 실제 값으로 교체해야 합니다!

### 3. 데이터베이스 설정

이미 Prisma 스키마가 업데이트되었으므로, 다음 명령어만 실행하면 됩니다:

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 적용
npm run db:push
```

## 사용 방법

### 웹 인터페이스

1. **메인 페이지 접속**
   ```
   http://localhost:3000
   ```

2. **상품 목록 페이지로 이동**
   - 헤더의 "보조제 상품" 버튼 클릭
   - 또는 직접 접속: `http://localhost:3000/products`

3. **상품 필터링 및 정렬**
   - 카테고리 선택 (단백질, 오메가3, 크레아틴 등)
   - 정렬 옵션 선택 (최신순, 판매순, 리뷰순)
   - 조회할 월 선택 (YYYY-MM 형식)

4. **상품 상세 보기**
   - 상품 카드 클릭
   - 상세 정보 및 쿠팡 구매 링크 확인

### API 엔드포인트

#### 1. 상품 목록 조회
```
GET /api/coupang-products
```

**Query Parameters:**
- `category` (필수): protein | omega3 | creatine | bcaa | vitamin | preworkout
- `month` (선택): YYYY-MM 형식 (기본값: 현재 월)
- `sortBy` (선택): latest | sales | reviews (기본값: latest)
- `limit` (선택): 페이지당 개수 (기본값: 20)
- `offset` (선택): 오프셋 (기본값: 0)

**예시:**
```bash
# 단백질 카테고리, 판매순 정렬
curl "http://localhost:3000/api/coupang-products?category=protein&sortBy=sales"

# 오메가3 카테고리, 2025년 1월 데이터, 리뷰순
curl "http://localhost:3000/api/coupang-products?category=omega3&month=2025-01&sortBy=reviews"
```

**응답 예시:**
```json
{
  "data": [
    {
      "id": "uuid",
      "productId": "12345678",
      "productName": "프리미엄 단백질 보충제",
      "productUrl": "https://www.coupang.com/...",
      "affiliateUrl": "https://link.coupang.com/...",
      "productImage": "https://image.jpg",
      "productPrice": 29900,
      "originalPrice": 45000,
      "discountRate": 33,
      "isRocketDelivery": true,
      "isFreeShipping": true,
      "rating": 4.8,
      "reviewCount": 1234,
      "salesCount": 5000,
      "brand": "브랜드명",
      "category": "protein",
      "categoryName": "단백질 보충제",
      "month": "2025-01"
    }
  ],
  "totalCount": 100,
  "month": "2025-01",
  "category": "protein",
  "sortBy": "sales",
  "limit": 20,
  "offset": 0
}
```

#### 2. 상품 상세 조회
```
GET /api/coupang-products/[id]
```

**예시:**
```bash
curl "http://localhost:3000/api/coupang-products/uuid"
```

## 데이터 수집 프로세스

### 자동 데이터 수집
첫 요청 시 자동으로 쿠팡 API를 호출하여 데이터를 수집합니다:

1. 사용자가 특정 카테고리 + 월 조합으로 요청
2. DB에 해당 데이터가 있는지 확인
3. 없으면 쿠팡 API 호출:
   - 상품 검색 (최대 100개)
   - 각 상품의 딥링크 생성
   - DB에 저장
4. DB에서 데이터 조회 후 반환

### 수동 데이터 업데이트
필요시 특정 월의 데이터를 갱신할 수 있습니다:

```bash
# DB에서 해당 월 데이터 삭제 후 다시 요청하면 자동으로 수집됨
# 예: 2025-01 월의 단백질 데이터 재수집
```

## 프로젝트 구조

```
pt-buddy/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── coupang-products/
│   │   │       ├── route.ts              # 상품 목록 API
│   │   │       └── [id]/
│   │   │           └── route.ts          # 상품 상세 API
│   │   └── products/
│   │       ├── page.tsx                  # 상품 목록 페이지
│   │       └── [id]/
│   │           └── page.tsx              # 상품 상세 페이지
│   └── lib/
│       └── coupang-api.ts                # 쿠팡 API 클라이언트
└── prisma/
    └── schema.prisma                     # CoupangProduct 모델 포함
```

## 데이터베이스 스키마

### CoupangProduct 모델

```prisma
model CoupangProduct {
  id                  String              @id @default(dbgenerated("gen_random_uuid()"))
  productId           String              // 쿠팡 상품 ID
  productName         String
  productUrl          String
  affiliateUrl        String?             // 파트너스 딥링크
  productImage        String
  productPrice        Int
  originalPrice       Int
  discountRate        Int
  isRocketDelivery    Boolean
  isFreeShipping      Boolean
  rating              Float
  reviewCount         Int
  salesCount          Int
  brand               String?
  category            SupplementCategory
  categoryName        String?
  month               String              // YYYY-MM
  createdAt           DateTime
  updatedAt           DateTime

  @@unique([productId, month])
  @@index([category, month])
  @@index([category, month, salesCount])
  @@index([category, month, reviewCount])
  @@index([category, month, createdAt])
}
```

### 주요 인덱스
- `productId + month`: 중복 방지
- `category + month`: 카테고리별 조회 최적화
- `category + month + salesCount`: 판매순 정렬 최적화
- `category + month + reviewCount`: 리뷰순 정렬 최적화
- `category + month + createdAt`: 최신순 정렬 최적화

## 쿠팡 파트너스 API 제약사항

### 1. API 호출 제한
- 일일 호출 횟수 제한이 있을 수 있음
- 과도한 호출 시 일시적으로 차단될 수 있음

### 2. 데이터 정확성
- 쿠팡 API에서 제공하는 데이터는 실시간이 아닐 수 있음
- 판매량 데이터는 쿠팡이 제공하는 경우에만 표시

### 3. 카테고리 ID
현재 코드의 카테고리 ID는 예시입니다. 실제 쿠팡 카테고리 ID로 교체해야 합니다:

```typescript
// src/lib/coupang-api.ts
export const SUPPLEMENT_CATEGORIES = {
  protein: '194176',      // 실제 카테고리 ID로 교체 필요
  omega3: '194984',
  creatine: '194177',
  bcaa: '194178',
  vitamin: '393760',
  preworkout: '194179',
}
```

## 문제 해결

### API 자격 증명 오류
```
Error: Coupang API credentials are not configured
```
→ `.env` 파일의 쿠팡 API 키를 확인하세요.

### 상품 데이터가 표시되지 않음
1. 쿠팡 API 키가 유효한지 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. 서버 로그에서 API 호출 실패 원인 확인

### 특정 카테고리의 상품이 없음
→ 해당 카테고리 ID가 올바른지 확인하고, 쿠팡에 실제 상품이 있는지 확인

## 주의사항

### 1. 법적 준수
- 쿠팡 파트너스 이용약관을 반드시 준수하세요
- 딥링크는 항상 쿠팡 파트너스를 통해 생성된 것을 사용해야 합니다
- 상품 정보는 정기적으로 업데이트해야 합니다

### 2. 면책 조항 표시
상품 페이지에는 다음 문구를 반드시 포함하세요:
```
이 포스팅은 쿠팡 파트너스 활동의 일환으로,
이에 따른 일정액의 수수료를 제공받습니다.
```

### 3. 데이터 캐싱
- 동일 월의 데이터는 DB에 캐싱되어 재사용됩니다
- 월별로 데이터를 관리하므로 매월 1일에 새 데이터 수집을 권장합니다

## 향후 개선 사항

1. **자동 스케줄링**: 매월 1일 자동으로 새 데이터 수집
2. **가격 추적**: 동일 상품의 월별 가격 변동 그래프
3. **페이지네이션**: 무한 스크롤 또는 페이지 번호 추가
4. **검색 기능**: 상품명으로 직접 검색
5. **북마크**: 사용자가 관심 상품 저장
6. **비교 기능**: 여러 상품 비교표 제공

## 라이선스

MIT License

## 문의

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.
