# 관리자 로그인 & 회원탈퇴 기능 가이드

## 개요

PT Buddy 시스템에 **관리자 로그인** 기능과 **회원탈퇴** 기능이 추가되었습니다.

## 주요 기능

### 1. 회원탈퇴 기능

#### 특징
- **소프트 삭제 방식**: 데이터는 실제로 삭제되지 않고 비활성화됩니다
- 트레이너와 일반 회원 모두 탈퇴 가능
- 탈퇴 시 비밀번호 확인 필수
- 확인 문구 입력으로 실수 방지

#### 사용 방법

**트레이너**
1. `/dashboard/settings` 페이지 접속
2. "위험한 작업" 섹션의 "계정 삭제" 버튼 클릭
3. 비밀번호 입력
4. "회원탈퇴" 문구 정확히 입력
5. "탈퇴하기" 버튼 클릭

**일반 회원**
1. `/member/settings` 페이지 접속
2. "위험한 작업" 섹션의 "회원 탈퇴" 버튼 클릭
3. 비밀번호 입력
4. "회원탈퇴" 문구 정확히 입력
5. "탈퇴하기" 버튼 클릭

#### 탈퇴 시 영향

**트레이너 탈퇴**
- 계정 비활성화 (`isActive: false`)
- 삭제 시간 기록 (`deletedAt`)
- 등록된 회원 정보 유지 (트레이너 연결만 해제)
- PT 일정 및 수강권 정보 유지
- 보조제 추천 데이터 유지

**회원 탈퇴**
- 계정 비활성화 (`isActive: false`)
- 삭제 시간 기록 (`deletedAt`)
- 프로필 정보 및 활동 내역 유지
- 수강권 정보 유지
- PT 일정 유지
- 보조제 섭취 기록 유지

### 2. 관리자 로그인

#### 특징
- 시스템 전체를 관리할 수 있는 관리자 계정
- 전체 트레이너/회원 통계 확인
- 최근 가입 사용자 모니터링
- 일반 트레이너/회원과 분리된 독립적인 대시보드

#### 관리자 계정 생성

```bash
npm run admin:create
```

**기본 계정 정보:**
- 이메일: `admin@ptbuddy.com`
- 비밀번호: `admin123456`
- 이름: 시스템 관리자

**환경 변수로 커스터마이징:**
```bash
ADMIN_EMAIL=your-admin@example.com \
ADMIN_PASSWORD=your-secure-password \
ADMIN_NAME="Your Admin Name" \
npm run admin:create
```

#### 관리자 로그인 방법

1. `/auth/login` 페이지 접속
2. 로그인 유형에서 **"관리자"** 선택
3. 관리자 이메일과 비밀번호 입력
4. 로그인 시 `/admin/dashboard`로 자동 리다이렉트

#### 관리자 대시보드 기능

**통계 확인**
- 전체 트레이너 수 (활성/탈퇴)
- 전체 회원 수 (활성/탈퇴)
- 전체 사용자 수

**사용자 모니터링**
- 최근 10명의 가입 사용자 목록
- 사용자 이름, 이메일, 역할, 상태 확인
- 가입일 정보

## 데이터베이스 스키마 변경사항

### Trainer 모델
```prisma
model Trainer {
  // ... 기존 필드
  role          String        @default("trainer") // "trainer" or "admin"
  isActive      Boolean       @default(true)
  deletedAt     DateTime?     @db.Timestamptz
  // ...
}
```

### Member 모델
```prisma
model Member {
  // ... 기존 필드
  isActive      Boolean       @default(true)
  deletedAt     DateTime?     @db.Timestamptz
  // ...
}
```

## API 엔드포인트

### 회원 탈퇴
```
POST /api/auth/delete-account
```

**요청 본문:**
```json
{
  "password": "user-password",
  "confirmation": "회원탈퇴"
}
```

**응답:**
```json
{
  "message": "계정이 성공적으로 삭제되었습니다"
}
```

### 관리자 대시보드 데이터
```
GET /api/admin/dashboard
```

**응답:**
```json
{
  "stats": {
    "totalTrainers": 10,
    "activeTrainers": 8,
    "deletedTrainers": 2,
    "totalMembers": 50,
    "activeMembers": 45,
    "deletedMembers": 5
  },
  "recentUsers": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "role": "member",
      "isActive": true,
      "deletedAt": null,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## 보안 기능

### 접근 제어
- 미들웨어를 통한 Role-based Access Control (RBAC)
- 관리자만 `/admin/*` 경로 접근 가능
- 트레이너는 `/dashboard/*` 경로 접근
- 회원은 `/member/*` 경로 접근
- 권한 없는 접근 시 자동 리다이렉트

### 로그인 검증
- 관리자 로그인 시 `role === 'admin'` 확인
- 일반 트레이너가 관리자 로그인 시도 시 차단
- 관리자가 일반 트레이너 로그인 시도 시 안내 메시지
- 삭제된 계정 로그인 차단

### 탈퇴 안전장치
- 비밀번호 확인 필수
- 확인 문구 ("회원탈퇴") 정확히 입력 필수
- JWT 토큰 검증으로 본인 확인
- 탈퇴 후 쿠키 자동 삭제

## 페이지 구조

```
/auth/login
├── 트레이너 로그인 → /dashboard
├── 회원 로그인 → /member/dashboard
└── 관리자 로그인 → /admin/dashboard

/dashboard (트레이너)
├── /dashboard/settings (계정 설정 & 탈퇴)
└── ... (기존 페이지)

/member (일반 회원)
├── /member/settings (계정 설정 & 탈퇴)
└── ... (기존 페이지)

/admin (관리자)
└── /admin/dashboard (관리자 대시보드)
```

## 추후 개선 예정 사항

### 관리자 기능
- [ ] 전체 트레이너/회원 목록 조회 및 검색
- [ ] 탈퇴 계정 복구 기능
- [ ] 사용자 활동 로그 확인
- [ ] 시스템 설정 관리
- [ ] 통계 데이터 차트 시각화

### 탈퇴 기능
- [ ] 탈퇴 후 재가입 제한 기간 설정
- [ ] 탈퇴 사유 수집
- [ ] 탈퇴 예정 계정 유예 기간
- [ ] 탈퇴 데이터 자동 정리 (예: 1년 후 하드 삭제)

## 주의사항

1. **관리자 비밀번호**: 기본 비밀번호(`admin123456`)는 반드시 변경하세요
2. **데이터 백업**: 탈퇴는 소프트 삭제이지만, 정기적인 데이터 백업을 권장합니다
3. **접근 권한**: 관리자 계정은 신중하게 관리하세요
4. **환경 변수**: 프로덕션 환경에서는 JWT_SECRET을 강력한 값으로 설정하세요

## 문제 해결

### 관리자 로그인이 안 되는 경우
1. 관리자 계정 생성 여부 확인: `npm run admin:create`
2. 로그인 페이지에서 "관리자" 탭 선택 확인
3. 이메일/비밀번호 정확히 입력 확인

### 탈퇴가 안 되는 경우
1. 비밀번호 정확히 입력 확인
2. "회원탈퇴" 문구 정확히 입력 확인 (띄어쓰기 없음)
3. 네트워크 오류 확인

### 페이지 접근이 안 되는 경우
1. 로그인 상태 확인
2. 올바른 역할로 로그인했는지 확인
3. 브라우저 쿠키 확인

## 개발자 정보

### 주요 파일
- `src/app/admin/dashboard/page.tsx` - 관리자 대시보드
- `src/app/admin/layout.tsx` - 관리자 레이아웃
- `src/app/dashboard/settings/page.tsx` - 트레이너 설정
- `src/app/member/settings/page.tsx` - 회원 설정
- `src/app/api/auth/delete-account/route.ts` - 탈퇴 API
- `src/app/api/admin/dashboard/route.ts` - 관리자 대시보드 API
- `src/middleware.ts` - 인증 및 권한 관리
- `scripts/create-admin.ts` - 관리자 계정 생성 스크립트

### JWT Payload
```typescript
interface JWTPayload {
  userId: string
  email: string
  role: 'trainer' | 'member' | 'admin'
  name: string
}
```
