# AWS SES 설정 가이드

PT Buddy에서 비밀번호 재설정 이메일을 발송하기 위한 AWS SES 설정 방법입니다.

## 1. AWS 계정 생성 및 IAM 사용자 설정

### 1-1. AWS 계정 생성
1. [AWS 홈페이지](https://aws.amazon.com/ko/)에서 계정 생성
2. 신용카드 등록 (무료 티어 사용 가능)

### 1-2. IAM 사용자 생성
1. [IAM 콘솔](https://console.aws.amazon.com/iam/)로 이동
2. 왼쪽 메뉴에서 **사용자(Users)** 클릭
3. **사용자 추가(Add users)** 클릭
4. 사용자 이름 입력 (예: `pt-buddy-ses`)
5. **액세스 키 - 프로그래밍 방식 액세스** 선택
6. **다음: 권한(Next: Permissions)** 클릭

### 1-3. SES 권한 부여
1. **기존 정책 직접 연결(Attach existing policies directly)** 선택
2. 검색창에 `SES` 입력
3. **AmazonSESFullAccess** 정책 선택 (또는 필요한 권한만 선택)
4. **다음: 태그(Next: Tags)** 클릭 (선택 사항)
5. **다음: 검토(Next: Review)** 클릭
6. **사용자 만들기(Create user)** 클릭

### 1-4. 액세스 키 저장
1. 생성된 **액세스 키 ID(Access Key ID)** 복사
2. **비밀 액세스 키(Secret Access Key)** 복사
3. `.env` 파일에 저장:
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=wJalr...
   ```

⚠️ **중요**: 비밀 액세스 키는 이 화면에서만 확인할 수 있으므로 안전한 곳에 저장하세요.

---

## 2. AWS SES 설정

### 2-1. SES 콘솔 접속
1. [AWS SES 콘솔](https://console.aws.amazon.com/ses/)로 이동
2. 리전 선택 (권장: **아시아 태평양(서울) - ap-northeast-2**)

### 2-2. 발신자 이메일 인증

#### 방법 1: 단일 이메일 인증 (간단, 개발/테스트용)
1. 왼쪽 메뉴에서 **Identity Management > Email Addresses** 선택
2. **Verify a New Email Address** 클릭
3. 발신자로 사용할 이메일 입력 (예: `noreply@yourdomain.com`)
4. **Verify This Email Address** 클릭
5. 해당 이메일로 전송된 인증 메일의 링크 클릭
6. 상태가 **verified**로 변경되면 완료

#### 방법 2: 도메인 인증 (프로덕션 권장)
1. 왼쪽 메뉴에서 **Identity Management > Domains** 선택
2. **Verify a New Domain** 클릭
3. 도메인 입력 (예: `yourdomain.com`)
4. **Generate DKIM Settings** 체크 (권장)
5. DNS 레코드를 도메인 관리 콘솔에 추가
   - TXT 레코드: SPF 인증
   - CNAME 레코드: DKIM 인증
6. DNS 전파 대기 (수 분 ~ 48시간)
7. 상태가 **verified**로 변경되면 완료

### 2-3. Sandbox 모드 해제 (프로덕션 필수)

기본적으로 AWS SES는 **Sandbox 모드**로 시작됩니다.
Sandbox 모드에서는:
- 인증된 이메일 주소로만 발송 가능
- 일일 200개, 초당 1개 제한

#### Sandbox 해제 방법
1. SES 콘솔 좌측 메뉴에서 **Account Dashboard** 클릭
2. **Request Production Access** 클릭
3. 양식 작성:
   - **Mail Type**: Transactional
   - **Website URL**: 서비스 URL
   - **Use case description**:
     ```
     비밀번호 재설정, 회원 가입 인증 등 트랜잭션 이메일 발송
     사용자 요청 시에만 발송되며, 마케팅 메일 발송 안함
     ```
   - **Process for handling bounces**:
     ```
     AWS SES의 bounce notification을 모니터링하며
     반복적인 bounce 발생 시 해당 이메일 주소를 발송 목록에서 제외
     ```
4. **Submit** 클릭
5. AWS 검토 후 승인 (보통 24시간 이내)

---

## 3. 환경변수 설정

`.env` 파일에 다음 환경변수를 추가하세요:

```env
# AWS SES Configuration
AWS_ACCESS_KEY_ID=AKIA...              # IAM 사용자의 액세스 키 ID
AWS_SECRET_ACCESS_KEY=wJalr...         # IAM 사용자의 비밀 액세스 키
AWS_REGION=ap-northeast-2              # SES 리전 (서울)
AWS_SES_FROM_EMAIL=noreply@yourdomain.com  # 인증된 발신자 이메일
```

---

## 4. 테스트

### 4-1. 개발 환경 테스트
개발 환경에서는 콘솔에 인증 코드가 출력됩니다:
```bash
npm run dev
```

로그인 페이지에서 "비밀번호를 잊으셨나요?" 클릭 후:
1. 이메일 입력
2. 터미널에 출력된 인증 코드 확인
3. 인증 코드 입력하여 테스트

### 4-2. 프로덕션 환경 테스트
1. AWS SES 설정 완료 후 `.env` 파일 설정
2. 애플리케이션 재시작
3. 실제 이메일로 인증 코드가 발송되는지 확인

⚠️ **Sandbox 모드**인 경우 수신자 이메일도 SES에서 인증해야 합니다.

---

## 5. 비용

AWS SES 무료 티어:
- **매월 62,000개** 이메일 무료 (EC2에서 발송 시)
- 매월 1,000개 이메일 무료 (외부에서 발송 시)

무료 티어 초과 시:
- 1,000개당 $0.10 (약 130원)

자세한 내용: [AWS SES 요금](https://aws.amazon.com/ko/ses/pricing/)

---

## 6. 문제 해결

### 이메일이 발송되지 않는 경우

1. **환경변수 확인**
   ```bash
   # .env 파일 확인
   cat .env | grep AWS
   ```

2. **IAM 권한 확인**
   - IAM 사용자에 `AmazonSESFullAccess` 권한이 있는지 확인

3. **이메일 인증 상태 확인**
   - SES 콘솔에서 발신자 이메일이 **verified** 상태인지 확인

4. **Sandbox 모드 확인**
   - Sandbox 모드인 경우 수신자 이메일도 인증 필요

5. **리전 확인**
   - `.env`의 `AWS_REGION`과 SES 콘솔의 리전이 일치하는지 확인

6. **로그 확인**
   ```bash
   # 개발 서버 실행 후 로그 확인
   npm run dev
   ```

### 스팸 폴더에 들어가는 경우

1. **SPF 레코드 추가** (도메인 DNS)
   ```
   v=spf1 include:amazonses.com ~all
   ```

2. **DKIM 설정** (SES 도메인 인증 시 자동 설정)

3. **DMARC 레코드 추가** (선택 사항)
   ```
   v=DMARC1; p=none; rua=mailto:admin@yourdomain.com
   ```

---

## 7. 보안 권장사항

1. **환경변수 보안**
   - `.env` 파일을 `.gitignore`에 추가 (이미 추가됨)
   - 프로덕션에서는 AWS Secrets Manager 또는 환경변수로 관리

2. **최소 권한 원칙**
   - IAM 사용자에 필요한 최소한의 권한만 부여
   - 예: `AmazonSESFullAccess` 대신 `ses:SendEmail`, `ses:SendRawEmail`만 허용

3. **액세스 키 주기적 교체**
   - 3~6개월마다 액세스 키 교체 권장

4. **Rate Limiting**
   - 애플리케이션 레벨에서 이메일 발송 빈도 제한 구현

---

## 8. 추가 자료

- [AWS SES 공식 문서](https://docs.aws.amazon.com/ses/)
- [AWS SES 개발자 가이드](https://docs.aws.amazon.com/ses/latest/dg/Welcome.html)
- [AWS SES FAQ](https://aws.amazon.com/ko/ses/faqs/)

---

## 지원

문제가 계속되면 다음을 확인하세요:
1. AWS 콘솔의 SES 대시보드에서 발송 통계 확인
2. CloudWatch Logs에서 에러 로그 확인
3. AWS Support에 문의
