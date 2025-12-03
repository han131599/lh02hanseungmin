# SupplementPro 설정 가이드

## 빠른 시작 (5분 안에 시작하기)

### 1. 필수 패키지 설치

```bash
# 프로젝트 의존성 설치
npm install

# tsx 개발 도구 설치
npm install -D tsx
```

### 2. 환경 변수 설정

```bash
# .env.example을 .env로 복사
cp .env.example .env
```

`.env` 파일을 열어 데이터베이스 URL을 설정하세요:

```env
# 기본 Supabase 설정 (무료 tier 사용 가능)
DATABASE_URL="your_supabase_connection_string"
DIRECT_URL="your_supabase_direct_url"

# 쿠팡 파트너스 (나중에 설정 가능)
COUPANG_ACCESS_KEY="demo"
COUPANG_SECRET_KEY="demo"
COUPANG_PARTNER_CODE="demo"
```

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 적용
npm run db:push

# 샘플 데이터 생성
npm run db:seed
```

### 4. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 완료!

---

## 상세 설정 가이드

### Supabase 데이터베이스 설정 (무료)

#### 1. Supabase 계정 생성
1. https://supabase.com 방문
2. GitHub 계정으로 로그인
3. "New Project" 클릭

#### 2. 프로젝트 생성
- **Project Name**: supplement-pro (또는 원하는 이름)
- **Database Password**: 강력한 비밀번호 입력 (메모해두세요!)
- **Region**: Northeast Asia (Seoul) 선택
- "Create new project" 클릭

#### 3. 연결 문자열 가져오기
1. 프로젝트 대시보드에서 "Settings" → "Database" 클릭
2. "Connection string" 섹션에서 "URI" 복사
3. `.env` 파일의 `DATABASE_URL`과 `DIRECT_URL`에 붙여넣기

예시:
```env
DATABASE_URL="postgresql://postgres.xxxxx:your-password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.xxxxx:your-password@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

#### 4. 데이터베이스 초기화
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

성공 메시지를 확인하세요:
```
✓ Saved: 프리미엄 알티지 오메가3...
✓ Saved: 마이프로틴 임팩트 웨이...
✓ 데이터베이스 저장 완료
✓ 월별 랭킹 생성 완료
```

---

### 쿠팡 파트너스 API 설정 (선택사항)

현재는 샘플 데이터로 작동하지만, 실제 쿠팡 링크를 사용하려면:

#### 1. 쿠팡 파트너스 가입
1. https://partners.coupang.com 방문
2. 계정 생성 및 파트너 신청
3. 승인 대기 (보통 1-3일 소요)

#### 2. API 키 발급
1. 파트너스 대시보드 로그인
2. "도구" → "API" 메뉴
3. API Access Key, Secret Key 발급
4. 파트너 코드 확인

#### 3. 환경 변수 설정
```env
COUPANG_ACCESS_KEY="발급받은_access_key"
COUPANG_SECRET_KEY="발급받은_secret_key"
COUPANG_PARTNER_CODE="파트너_코드"
```

#### 4. 딥링크 테스트
```bash
# 개발 서버 재시작
npm run dev
```

이제 제품 상세 페이지의 "쿠팡에서 구매하기" 버튼이 실제 파트너스 링크를 생성합니다.

---

## 문제 해결

### Q: "Prisma Client is not configured" 오류
```bash
# 해결방법
npm run db:generate
```

### Q: 데이터베이스 연결 실패
1. `.env` 파일의 DATABASE_URL이 정확한지 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 방화벽 설정 확인

### Q: 샘플 데이터가 보이지 않음
```bash
# 데이터베이스 초기화 후 재시딩
npm run db:push
npm run db:seed
```

### Q: tsx 명령어를 찾을 수 없음
```bash
# tsx 설치
npm install -D tsx

# 또는 직접 실행
npx tsx scripts/seed-supplements.ts
```

### Q: 이미지가 표시되지 않음
현재는 플레이스홀더 이미지를 사용합니다. 실제 이미지는 쿠팡 API에서 가져오거나 수동으로 추가해야 합니다.

---

## 프로덕션 배포

### Vercel 배포 (추천)

#### 1. GitHub 저장소 생성
```bash
git init
git add .
git commit -m "Initial commit: SupplementPro"
git branch -M main
git remote add origin your-github-repo-url
git push -u origin main
```

#### 2. Vercel 프로젝트 생성
1. https://vercel.com 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. "Import" 클릭

#### 3. 환경 변수 설정
Vercel 대시보드에서:
- Settings → Environment Variables
- 다음 변수들을 추가:
  ```
  DATABASE_URL
  DIRECT_URL
  COUPANG_ACCESS_KEY
  COUPANG_SECRET_KEY
  COUPANG_PARTNER_CODE
  ```

#### 4. 배포
- "Deploy" 클릭
- 배포 완료 후 URL 확인

---

## 데이터 관리

### 월별 데이터 업데이트
매달 1일에 새로운 데이터를 수집하려면:

```bash
# 수동 실행
npm run db:seed
```

### Cron Job 설정 (Vercel Cron)
`vercel.json` 파일 생성:
```json
{
  "crons": [
    {
      "path": "/api/cron/update-supplements",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

API 라우트 생성 (`src/app/api/cron/update-supplements/route.ts`):
```typescript
import { NextResponse } from 'next/server'
import {
  generateSampleSupplementData,
  saveSupplementsToDatabase,
  generateMonthlyRankings,
} from '@/lib/supplement-scraper'

export async function GET() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const data = generateSampleSupplementData()

  await saveSupplementsToDatabase(data, currentMonth)
  await generateMonthlyRankings(currentMonth)

  return NextResponse.json({ success: true })
}
```

---

## 개발 팁

### 1. 데이터베이스 뷰어
Prisma Studio를 사용하면 데이터를 시각적으로 확인/수정할 수 있습니다:
```bash
npx prisma studio
```

### 2. 타입 안전성
Prisma Client를 업데이트한 후에는 항상 재생성하세요:
```bash
npm run db:generate
```

### 3. 로컬 개발
로컬 PostgreSQL을 사용하려면:
```bash
# Docker로 PostgreSQL 실행
docker run -d \
  --name supplement-db \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=supplement_db \
  -p 5432:5432 \
  postgres:15

# .env 설정
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/supplement_db"
DIRECT_URL="postgresql://postgres:mysecretpassword@localhost:5432/supplement_db"
```

---

## 다음 단계

1. **실제 데이터 수집**: 쿠팡 오픈API 또는 데이터 제공 서비스 활용
2. **SEO 최적화**: 메타 태그, 구조화된 데이터 추가
3. **이미지 최적화**: Next.js Image 컴포넌트 사용
4. **분석 도구**: Google Analytics, Google Search Console 연동
5. **성능 최적화**: 캐싱, CDN 활용

더 많은 정보는 [README.md](./README.md)를 참고하세요!
