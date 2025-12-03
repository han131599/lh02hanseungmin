# 파일 정리 보고서

## 정리 대상 파일 및 이유

### 1. ❌ 삭제해야 할 파일: `src/types/database.ts`

**이유:**
- **중복된 타입 정의**: Prisma가 자동으로 `node_modules/.prisma/client`에 타입을 생성하므로 수동 타입 정의가 불필요합니다
- **유지보수 부담**: 스키마가 변경될 때마다 두 곳(Prisma schema + database.ts)을 수정해야 합니다
- **타입 불일치 위험**: Prisma 스키마와 수동 타입이 맞지 않을 수 있습니다

**대체 방법:**
```typescript
// 기존 (잘못된 방법)
import { Database } from '@/types/database'
type Member = Database['public']['Tables']['members']['Row']

// 새로운 방법 (Prisma 사용)
import { Prisma } from '@prisma/client'
type Member = Prisma.MemberGetPayload<{}>
// 또는
import type { Member } from '@prisma/client'
```

**영향받는 파일:**
- `src/app/dashboard/page.tsx` - 수정 필요
- `src/app/dashboard/members/page.tsx` - 수정 필요
- `src/app/dashboard/calendar/page.tsx` - 수정 필요
- `src/components/members/add-member-dialog.tsx` - 수정 필요
- `src/components/calendar/add-appointment-dialog.tsx` - 수정 필요
- `src/components/memberships/add-membership-dialog.tsx` - 수정 필요

---

## 변경이 필요한 파일들

### 2. 🔄 Supabase 직접 쿼리 → Prisma로 전환

#### 현재 문제점:
- **데이터 접근 방식 혼재**:
  - Supabase Client로 직접 DB 쿼리 (현재 방식)
  - Prisma ORM 사용 (권장 방식)
- **RLS(Row Level Security) 우회**: Supabase Auth는 사용하지만 데이터는 Prisma로 접근
- **타입 안정성 부족**: Supabase 쿼리는 타입 체크가 약함

#### 전환 대상 파일:

**A. `src/app/dashboard/page.tsx`**
```typescript
// ❌ 기존 (Supabase)
const { data: trainer } = await supabase
  .from('trainers')
  .select('*')
  .eq('id', user.id)
  .single()

// ✅ 변경 (Prisma)
const trainer = await prisma.trainer.findUnique({
  where: { id: user.id },
  include: {
    members: true,
    appointments: true
  }
})
```

**B. `src/app/dashboard/members/page.tsx`**
- Client Component → 'use client' 제거 후 Server Component로 전환
- useQuery → 서버에서 직접 Prisma 쿼리
- 실시간 업데이트가 필요한 부분만 Client Component로 분리

**C. `src/app/dashboard/calendar/page.tsx`**
- react-big-calendar 사용 → Client Component 유지 필요
- API Route를 통한 Prisma 데이터 제공 방식으로 변경

---

## 아키텍처 개선 방안

### 현재 아키텍처 (혼재)
```
Next.js App
├── Supabase Auth (인증) ✅
├── Supabase Client (데이터) ❌
└── Prisma ORM (설정만 되어있음) ⚠️
```

### 권장 아키텍처
```
Next.js App
├── Supabase Auth (인증만) ✅
└── Prisma ORM (모든 데이터 접근) ✅
    ├── Server Components (SSR)
    ├── Server Actions
    └── API Routes (클라이언트용)
```

---

## 정리 작업 순서

### Phase 1: 타입 시스템 통일 ✅ 우선순위 높음
1. `src/types/database.ts` 삭제
2. 모든 파일에서 Prisma 타입으로 변경
3. TypeScript 컴파일 에러 수정

### Phase 2: 데이터 접근 레이어 통일 ✅ 필수
1. Server Component는 Prisma 직접 사용
2. Client Component용 API Routes 생성
   - `GET /api/members` - 회원 목록
   - `POST /api/members` - 회원 추가
   - `GET /api/appointments` - 일정 목록
   - `POST /api/appointments` - 일정 추가
   - 등...
3. 기존 Supabase 쿼리를 Prisma로 전환

### Phase 3: 성능 최적화 (선택)
1. Prisma 쿼리 최적화 (N+1 문제 해결)
2. 필요한 필드만 select
3. 인덱스 활용 확인

---

## 보존해야 할 파일들

### ✅ 인증 관련
- `src/lib/supabase/client.ts` - 클라이언트 인증
- `src/lib/supabase/server.ts` - 서버 인증
- `src/middleware.ts` - 인증 미들웨어

### ✅ Prisma 관련
- `prisma/schema.prisma` - **핵심 스키마**
- `src/lib/prisma.ts` - Prisma Client 싱글톤

### ✅ UI/비즈니스 로직
- `src/components/**/*.tsx` - 모든 컴포넌트
- `src/app/**/*.tsx` - 모든 페이지 (수정 필요)
- `src/lib/validations/**` - Zod 스키마

---

## 주요 변경 사항 요약

| 항목 | 기존 | 변경 후 | 이유 |
|------|------|---------|------|
| 타입 정의 | database.ts | @prisma/client | 자동 생성, 타입 안정성 |
| 데이터 조회 | Supabase Client | Prisma | ORM의 이점, 타입 안전 |
| 인증 | Supabase Auth | Supabase Auth | 변경 없음 (인증만 사용) |
| 컴포넌트 | Client Component | Server Component | 성능 향상, SSR |

---

## 초보자를 위한 추가 설명

### 왜 Prisma를 사용하나요?

**1. 타입 안정성**
```typescript
// Supabase - 오타가 있어도 실행 시점에 에러
const data = await supabase.from('members').select('nmae') // 'name'을 'nmae'로 오타

// Prisma - 컴파일 시점에 에러 발견
const data = await prisma.member.findMany({
  select: { nmae: true } // ❌ TypeScript 에러!
})
```

**2. 관계 쿼리가 쉬움**
```typescript
// Supabase - 복잡한 JOIN
const { data } = await supabase
  .from('members')
  .select(`
    *,
    memberships (*),
    appointments (*)
  `)

// Prisma - 직관적
const members = await prisma.member.findMany({
  include: {
    memberships: true,
    appointments: true
  }
})
```

**3. 마이그레이션 자동화**
- 스키마 변경 시 자동으로 SQL 생성
- 버전 관리 가능
- 롤백 쉬움

---

## 다음 단계

1. **즉시 실행**: database.ts 삭제 및 타입 변경
2. **단계적 적용**: 한 페이지씩 Prisma로 전환
3. **테스트**: 각 페이지의 기능 동작 확인
4. **최적화**: 성능 개선 작업

이 작업을 완료하면:
- ✅ 코드가 더 간결해집니다
- ✅ 타입 에러가 줄어듭니다
- ✅ 유지보수가 쉬워집니다
- ✅ 초보자도 이해하기 쉬워집니다
