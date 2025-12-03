# SupplementPro - 프로젝트 요약

## 프로젝트 개요

**SupplementPro**는 쿠팡 파트너스 API를 활용하여 보충제(오메가3, 단백질, 크레아틴) 정보를 제공하는 웹 플랫폼입니다.

### 핵심 가치

- 매달 업데이트되는 판매량/리뷰 기반 보충제 랭킹
- 상세한 제품 정보 (가격, 평점, 리뷰, 사양)
- 쿠팡 파트너스를 통한 수익화

## 주요 기능

### 1. 보충제 랭킹 시스템

- **카테고리**: 오메가3, 단백질, 크레아틴
- **정렬 옵션**: 판매량순, 리뷰순, 평점순, 가격순
- **월별 업데이트**: 매달 1일 자동 랭킹 업데이트

### 2. 상세 정보 제공

- 제품 이미지 갤러리 (메인 + 상세)
- 가격 정보 (할인율, 원가 포함)
- 평점 및 리뷰 통계
- 판매량 정보
- 배송 옵션 (로켓배송, 무료배송)
- 제품 사양 (용량, 함량 등)

### 3. 리뷰 시스템

- 사용자 리뷰 표시
- 구매 인증 뱃지
- 리뷰 이미지
- 도움이 됐어요 카운트

### 4. 쿠팡 파트너스 연동

- 딥링크 자동 생성
- 파트너스 수수료 트래킹
- 제품 구매 페이지 직접 연결

## 기술 스택

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: TailwindCSS 4, Radix UI, shadcn/ui
- **State**: TanStack Query (React Query)

### Backend

- **API**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma

### External Services

- **Coupang Partners API**: 딥링크 생성
- **Supabase**: 데이터베이스 호스팅

## 데이터베이스 구조

### 주요 테이블

1. **supplements**: 보충제 제품 정보
2. **supplement_reviews**: 제품 리뷰
3. **monthly_rankings**: 월별 랭킹 스냅샷
4. **users**: 사용자 정보 (확장용)

### 데이터 흐름

```
샘플 데이터 생성 → Prisma → PostgreSQL → API Routes → React Components
```

## 프로젝트 구조

```
pt-buddy/
├── prisma/
│   └── schema.prisma                # DB 스키마
├── scripts/
│   └── seed-supplements.ts          # 데이터 시딩
├── src/
│   ├── app/
│   │   ├── api/supplements/         # API
│   │   ├── supplements/             # 페이지
│   │   ├── layout.tsx
│   │   └── page.tsx                 # 홈
│   ├── components/ui/               # UI 컴포넌트
│   └── lib/
│       ├── coupang-partners.ts      # 쿠팡 API
│       ├── supplement-scraper.ts    # 데이터 수집
│       └── prisma.ts
└── package.json
```

## 핵심 파일

### 1. 데이터베이스 스키마

`prisma/schema.prisma` - 보충제 중심 DB 설계

### 2. API 라우트

- `src/app/api/supplements/route.ts` - 목록 조회
- `src/app/api/supplements/[id]/route.ts` - 상세 조회
- `src/app/api/supplements/categories/route.ts` - 카테고리

### 3. 페이지

- `src/app/page.tsx` - 메인 랜딩
- `src/app/supplements/page.tsx` - 목록 페이지
- `src/app/supplements/[id]/page.tsx` - 상세 페이지

### 4. 서비스

- `src/lib/coupang-partners.ts` - 쿠팡 API 클라이언트
- `src/lib/supplement-scraper.ts` - 데이터 생성/저장

## 실행 방법

### 개발 환경

```bash
npm install
npm install -D tsx
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### 프로덕션

```bash
npm run build
npm start
```

## 배포 전략

### Vercel (권장)

1. GitHub 연동
2. 환경 변수 설정
3. 자동 배포

### 환경 변수

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
COUPANG_ACCESS_KEY=xxx
COUPANG_SECRET_KEY=xxx
COUPANG_PARTNER_CODE=xxx
```

## 수익 모델

### 쿠팡 파트너스

- 사용자가 "쿠팡에서 구매하기" 클릭
- 파트너스 딥링크로 리다이렉트
- 구매 발생 시 수수료 수익

### 확장 가능성

- Google AdSense 광고
- 프리미엄 회원제
- 브랜드 제휴 광고

## 향후 개발 계획

### Phase 1 (완료)

- ✅ 보충제 정보 플랫폼 구축
- ✅ 랭킹 시스템
- ✅ 쿠팡 파트너스 연동

### Phase 2 (계획)

- [ ] 실제 쿠팡 데이터 수집
- [ ] SEO 최적화
- [ ] Google Analytics 연동
- [ ] 이미지 최적화

### Phase 3 (미래)

- [ ] 사용자 리뷰 시스템
- [ ] 가격 변동 알림
- [ ] 모바일 앱
- [ ] AI 추천 시스템

## 성능 최적화

### 현재

- TanStack Query 캐싱
- Prisma 쿼리 최적화
- 인덱스 최적화

### 계획

- Next.js Image 최적화
- CDN 활용
- 데이터베이스 커넥션 풀링
- 서버 컴포넌트 활용

## 주의사항

### 법적 준수

- 쿠팡 파트너스 이용약관 준수
- 저작권 및 상표권 존중
- 개인정보 처리 방침

### 데이터 수집

- robots.txt 준수
- Rate limiting
- 공식 API 활용 권장

## 문서

- **README.md**: 프로젝트 소개 및 기능 설명
- **SETUP_GUIDE.md**: 상세 설치 가이드
- **PROJECT_SUMMARY.md**: 프로젝트 요약 (현재 문서)

## 기여

프로젝트는 MIT 라이선스 하에 공개되며, 기여는 환영합니다.

---

**마지막 업데이트**: 2025-11-26
**버전**: 1.0.0
**상태**: Production Ready
