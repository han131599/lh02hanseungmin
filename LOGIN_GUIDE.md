# 🎯 PT Buddy - 로그인 시스템 가이드

## 🚀 구현 완료된 기능

PT Buddy는 **트레이너**와 **일반회원**을 위한 **분리된 로그인 시스템**을 제공합니다.

### ✅ 주요 특징

1. **역할 기반 로그인 (Role-Based Login)**
   - 트레이너 로그인
   - 일반 회원 로그인
   - 로그인 유형을 선택할 수 있는 UI

2. **별도의 대시보드**
   - 트레이너: `/dashboard` - 회원 관리, 일정 관리, 수강권 관리
   - 일반회원: `/member/dashboard` - PT 일정 확인, 수강권 정보, 보조제 추천

3. **보안 및 접근 제어**
   - JWT 기반 인증
   - 미들웨어를 통한 role 기반 접근 제어
   - 회원은 트레이너 페이지 접근 불가
   - 트레이너는 회원 페이지 접근 불가

---

## 🔐 로그인 방법

### 1️⃣ 트레이너 로그인

1. 로그인 페이지 접속: `http://localhost:3000/auth/login`
2. **로그인 유형**: "트레이너" 선택
3. 이메일과 비밀번호 입력
4. 로그인 성공 시 → `/dashboard` (트레이너 대시보드)

**트레이너 계정 생성:**
- 회원가입 페이지에서 새 트레이너 계정 생성: `/auth/signup`
- 또는 기존 트레이너 계정 사용

### 2️⃣ 일반회원 로그인

1. 로그인 페이지 접속: `http://localhost:3000/auth/login`
2. **로그인 유형**: "일반 회원" 선택
3. 이메일과 비밀번호 입력
4. 로그인 성공 시 → `/member/dashboard` (회원 대시보드)

**테스트 회원 계정 만들기:**
```bash
npm run db:add-test-member
```

이 명령어를 실행하면:
- 테스트 회원 계정 생성 (이메일: `member@test.com`, 비밀번호: `member123`)
- 샘플 수강권 생성
- 샘플 PT 일정 생성

---

## 📋 테스트 시나리오

### 시나리오 1: 트레이너로 로그인

```
1. http://localhost:3000/auth/login 접속
2. "트레이너" 선택
3. 회원가입한 트레이너 계정으로 로그인
4. ✅ 트레이너 대시보드 확인:
   - 활성 회원 수
   - 오늘 일정
   - 이번 주 수익
   - 회원 관리 기능
```

### 시나리오 2: 일반회원으로 로그인

```
1. 먼저 테스트 회원 데이터 추가:
   npm run db:add-test-member

2. http://localhost:3000/auth/login 접속
3. "일반 회원" 선택
4. 이메일: member@test.com
   비밀번호: member123
5. ✅ 회원 대시보드 확인:
   - 오늘 일정
   - 이번 달 운동 횟수
   - 보유 수강권
   - 담당 트레이너 정보
   - 추천 보조제
```

### 시나리오 3: 접근 제어 테스트

```
1. 회원 계정으로 로그인
2. 브라우저에서 직접 /dashboard 접속 시도
3. ✅ 자동으로 /member/dashboard로 리다이렉트됨
```

---

## 🗂️ 데이터베이스 구조

### Trainer (트레이너)
```typescript
{
  id: string
  email: string
  password: string (bcrypt 해싱)
  name: string
  phone?: string
  role: "trainer" (고정값)
  maxMembers: number (기본값: 50)
}
```

### Member (회원)
```typescript
{
  id: string
  trainerId: string (담당 트레이너)
  email?: string
  password?: string (bcrypt 해싱)
  name: string
  phone: string
  role: "member" (고정값)
  birthDate?: Date
  gender?: "male" | "female"
  isActive: boolean
}
```

---

## 🎨 UI/UX 특징

### 로그인 페이지
- 로그인 유형을 명확히 구분하는 토글 버튼
- 트레이너 / 일반 회원 선택 가능
- 반응형 디자인

### 트레이너 대시보드
- 회원 관리 중심
- 일정 관리
- 수강권 관리
- 보조제 추천 관리
- 통계 및 분석

### 회원 대시보드
- 개인 PT 일정 확인
- 수강권 정보
- 운동 기록
- 담당 트레이너 정보
- 추천받은 보조제

---

## 🛠️ 기술 구현

### 1. JWT 토큰 구조
```typescript
{
  userId: string
  email: string
  role: 'trainer' | 'member'
  name: string
}
```

### 2. 미들웨어 보호
- `/dashboard/*` → 트레이너 전용
- `/member/*` → 회원 전용
- 잘못된 접근 시 자동 리다이렉트

### 3. API 라우트
- `POST /api/auth/login` - 로그인 (role 기반)
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/signup` - 트레이너 회원가입

---

## 📝 향후 개선 사항

- [ ] 회원 전용 회원가입 페이지 추가
- [ ] 비밀번호 재설정 기능
- [ ] 회원 전용 일정 페이지 구현
- [ ] 회원 전용 프로필 페이지 구현
- [ ] 보조제 섭취 기록 기능
- [ ] 회원-트레이너 간 메시징 기능

---

## 🐛 문제 해결

### 로그인이 안 돼요
1. 올바른 로그인 유형을 선택했나요?
2. 이메일과 비밀번호가 정확한가요?
3. 회원 계정의 경우, 비밀번호가 설정되어 있나요?

### 회원 계정이 없어요
```bash
# 테스트 회원 추가
npm run db:add-test-member
```

### 대시보드가 비어있어요
- 트레이너: 회원을 추가하고 일정을 등록하세요
- 회원: 트레이너가 일정과 수강권을 등록해야 합니다

---

## 💡 개발자 노트

이 시스템은 다음과 같은 설계 원칙을 따릅니다:

1. **명확한 역할 분리**: 트레이너와 회원의 기능이 완전히 분리됨
2. **보안 우선**: JWT + 미들웨어로 이중 보안
3. **사용자 경험**: 직관적인 로그인 유형 선택
4. **확장 가능성**: 향후 새로운 역할(예: 관리자) 추가 용이

---

## 🎓 학습 포인트

이 프로젝트를 통해 배울 수 있는 것:

✅ Next.js 14 App Router
✅ JWT 인증
✅ Role-based Access Control (RBAC)
✅ Prisma ORM
✅ PostgreSQL
✅ Middleware 패턴
✅ 서버 컴포넌트 vs 클라이언트 컴포넌트

---

**즐거운 개발 되세요! 🎉**
