# SupplementPro - 보충제 정보 플랫폼

쿠팡 파트너스 API를 활용한 보충제(오메가3, 단백질, 크레아틴) 랭킹 및 정보 제공 플랫폼입니다.

## 주요 기능

### 📊 보충제 랭킹
- **카테고리별 분류**: 오메가3, 단백질, 크레아틴
- **다양한 정렬 옵션**:
  - 판매량순
  - 리뷰순
  - 평점순
  - 가격순 (낮은/높은)

### 💰 상세 정보 제공
- 제품 이미지 (메인 + 상세 이미지)
- 가격 정보 (원가, 할인가, 할인율)
- 평점 및 리뷰 수
- 판매량 정보
- 배송 정보 (로켓배송, 무료배송)
- 제품 사양 (용량, 함량 등)
- 사용자 리뷰 (평점, 내용, 구매인증, 사진)

### 🔗 쿠팡 파트너스 연동
- 파트너스 딥링크 자동 생성
- 쿠팡 상품 페이지 직접 연결

### 📅 월별 업데이트
- 매달 1일 랭킹 자동 업데이트
- 월별 데이터 히스토리 관리

## 기술 스택

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: TanStack Query
- **Language**: TypeScript

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. tsx 패키지 설치 (스크립트 실행용)

```bash
npm install -D tsx
```

### 3. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 필요한 값을 입력하세요:

```bash
cp .env.example .env
```

`.env` 파일 내용:

```env
# 데이터베이스 (Supabase 또는 로컬 PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/supplement_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/supplement_db?schema=public"

# 쿠팡 파트너스 API
COUPANG_ACCESS_KEY="your_access_key_here"
COUPANG_SECRET_KEY="your_secret_key_here"
COUPANG_PARTNER_CODE="your_partner_code_here"
```

### 4. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 적용
npm run db:push
```

### 5. 샘플 데이터 생성

```bash
# 보충제 샘플 데이터 시딩
npm run db:seed
```

이 명령어는 다음을 수행합니다:
- 오메가3, 단백질, 크레아틴 샘플 제품 생성
- 각 제품에 대한 샘플 리뷰 생성
- 월별 랭킹 데이터 생성

### 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어 확인하세요.

## 프로젝트 구조

```
pt-buddy/
├── prisma/
│   └── schema.prisma          # 데이터베이스 스키마
├── scripts/
│   └── seed-supplements.ts    # 샘플 데이터 시딩 스크립트
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── supplements/   # 보충제 API 라우트
│   │   ├── supplements/       # 보충제 페이지
│   │   │   ├── page.tsx       # 목록 페이지
│   │   │   └── [id]/
│   │   │       └── page.tsx   # 상세 페이지
│   │   ├── layout.tsx
│   │   └── page.tsx           # 메인 홈페이지
│   ├── components/
│   │   └── ui/                # UI 컴포넌트
│   └── lib/
│       ├── coupang-partners.ts      # 쿠팡 파트너스 API 클라이언트
│       ├── supplement-scraper.ts    # 보충제 데이터 수집 서비스
│       └── prisma.ts                # Prisma 클라이언트
└── package.json
```

## 데이터베이스 스키마

### Supplement (보충제)
- 제품 정보 (이름, 브랜드, 가격, 할인율)
- 평점 및 리뷰 수
- 판매량
- 이미지 URLs
- 쿠팡 파트너스 링크
- 제품 사양 (JSON)

### SupplementReview (리뷰)
- 작성자, 평점, 내용
- 도움이 됐어요 수
- 구매 인증 여부
- 리뷰 이미지

### MonthlyRanking (월별 랭킹)
- 카테고리별 랭킹
- 정렬 기준별 순위 데이터

## API 엔드포인트

### GET /api/supplements
보충제 목록 조회

**Query Parameters:**
- `category`: omega3 | protein | creatine (선택)
- `sortBy`: sales | reviews | rating | price_low | price_high
- `month`: YYYY-MM (기본값: 현재 월)
- `limit`: 페이지당 개수 (기본값: 20)
- `offset`: 오프셋 (기본값: 0)

### GET /api/supplements/[id]
보충제 상세 정보 조회 (리뷰 포함)

### GET /api/supplements/categories
카테고리 목록 조회

## 쿠팡 파트너스 API 연동

현재 구현은 샘플 데이터를 사용합니다. 실제 프로덕션 환경에서는:

1. **쿠팡 파트너스 가입**: [https://partners.coupang.com](https://partners.coupang.com)
2. **API 키 발급**: 파트너스 대시보드에서 발급
3. **환경 변수 설정**: `.env` 파일에 API 키 입력

### 딥링크 생성

```typescript
import { getCoupangPartnersClient } from '@/lib/coupang-partners'

const client = getCoupangPartnersClient()
const deepLink = await client.generateProductDeepLink('productId')
```

## 월별 데이터 업데이트

매달 1일에 새로운 데이터를 수집하고 랭킹을 업데이트합니다:

```bash
# 현재 월의 데이터 수집 및 랭킹 생성
npm run db:seed
```

실제 프로덕션에서는 크론잡(Cron Job) 또는 스케줄러를 사용하여 자동화할 수 있습니다.

## 주요 페이지

### 메인 페이지 (/)
- 플랫폼 소개
- 카테고리별 빠른 링크
- 주요 기능 안내

### 보충제 목록 (/supplements)
- 카테고리 필터
- 정렬 옵션
- 제품 카드 그리드
- 페이지네이션

### 보충제 상세 (/supplements/[id])
- 제품 이미지 갤러리
- 가격 및 할인 정보
- 평점 및 리뷰
- 제품 사양
- 쿠팡 구매 링크
- 사용자 리뷰 목록

## 개발 시 주의사항

### 1. 쿠팡 이용약관 준수
쿠팡의 robots.txt 및 이용약관을 반드시 준수해야 합니다. 현재는 샘플 데이터를 사용하고 있으며, 실제 데이터 수집 시:
- 쿠팡 오픈API 활용
- 공식 데이터 제공 서비스 활용
- 수동 데이터 입력 및 관리

### 2. 이미지 최적화
실제 프로덕션에서는 Next.js Image 컴포넌트를 사용하여 이미지를 최적화하세요.

### 3. SEO 최적화
- 각 페이지에 적절한 메타 태그 추가
- 시맨틱 HTML 사용
- 구조화된 데이터(Schema.org) 추가

## 배포

### Vercel 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel
```

### 환경 변수 설정
Vercel 대시보드에서 환경 변수를 설정하세요:
- `DATABASE_URL`
- `DIRECT_URL`
- `COUPANG_ACCESS_KEY`
- `COUPANG_SECRET_KEY`
- `COUPANG_PARTNER_CODE`

## 라이선스

MIT License

## 면책 조항

이 프로젝트는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다.
