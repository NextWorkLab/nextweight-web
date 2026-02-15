# NextWeight Hospital QI System

병원용 GLP-1 질관리 리포트 시스템 - Google Sheets 기반 멀티테넌트 환자 모니터링 플랫폼

## 🎯 주요 기능

- ✅ **병원별 멀티테넌시**: clinic_id 기반 완전한 데이터 분리
- ✅ **자동 신호색 산출**: 환자 상태를 RED/YELLOW/GREEN으로 자동 분류
- ✅ **실시간 대시보드**: 병원별 환자 목록 및 상태 한눈에 확인
- ✅ **상세 리포트**: 환자별 2~8주 증상 추이 및 통계
- ✅ **인쇄 최적화**: A4 출력에 최적화된 리포트 화면
- ✅ **Google Sheets 연동**: 별도 DB 없이 간편한 데이터 관리

## 📋 시스템 구조

```
┌─────────────────┐
│ Google Forms    │ ← 환자가 응답 (Daily/Weekly)
│ (등록/Daily/    │
│  Weekly)        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Google Sheets   │ ← 데이터 저장소
│ - Clinics       │
│ - Patients      │
│ - Daily/Weekly  │
│   Responses     │
└────────┬────────┘
         │
         ↓ (Google Sheets API)
┌─────────────────┐
│ Next.js App     │ ← 병원 대시보드/리포트
│ (This Project)  │
└─────────────────┘
```

## 🚀 빠른 시작

### 1. 프로젝트 클론 및 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일 생성:

```env
# Google Sheets
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 인증
AUTH_MODE=token
CLINIC_TOKEN_MAP={"C001":"your-secret-token"}
```

### 3. Google Sheets 준비

필수 시트 생성 (탭):
- `Clinics` - 병원 정보
- `Patients` - 환자 데이터
- `DailyResponses` - 일일 설문
- `WeeklyResponses` - 주간 설문

자세한 설정은 `HOSPITAL_SETUP_GUIDE.md` 참조

### 4. 로컬 실행

```bash
npm run dev
```

브라우저에서 테스트:
```
http://localhost:3000/clinic?clinic_id=C001&token=your-token
```

## 📁 프로젝트 구조

```
nextweight-web-main/
├── app/
│   ├── clinic/                      # 병원용 화면
│   │   ├── page.tsx                # 대시보드
│   │   └── patient/[patient_code]/ # 환자 리포트
│   │       ├── page.tsx            # 웹 리포트
│   │       └── print/page.tsx      # 인쇄 화면
│   └── api/                        # API 라우트
│       └── clinics/[clinic_id]/
│           ├── dashboard/          # 대시보드 API
│           └── patients/           # 리포트 API
├── lib/
│   ├── sheets.ts                   # Google Sheets 연동
│   ├── qi-engine.ts                # 신호색 산출 엔진
│   ├── auth.ts                     # 토큰 인증
│   └── types.ts                    # TypeScript 타입
└── components/                     # 재사용 컴포넌트
```

## 🎨 화면 구성

### 1. 병원 대시보드 (`/clinic`)

**기능:**
- 환자 목록 (신호색, 투약 상태, 최근 응답)
- 신호색별 카운트 (RED/YELLOW/GREEN)
- 필터: 신호색, 환자 상태
- 정렬: RED 우선, 응답 오래된 순

**URL:**
```
/clinic?clinic_id=C001&token=xxx
```

### 2. 환자 리포트 (`/clinic/patient/[code]`)

**기능:**
- 현재 상태 (신호색, 순응률, 증상, 체중 변화)
- 일일 증상 추이 차트 (오심, 컨디션)
- 주간 체중 추이 차트
- 기간 요약 통계 (2/4/8주 선택 가능)

**URL:**
```
/clinic/patient/C001-1234?clinic_id=C001&token=xxx
```

### 3. 인쇄 화면 (`/clinic/patient/[code]/print`)

**기능:**
- A4 출력 최적화 레이아웃
- 브라우저 Print to PDF 지원
- 의료진용 한 장 요약

## 🔴🟡🟢 신호색 규칙

시스템이 최근 7일 Daily 응답을 분석하여 자동 산출:

### 🔴 RED (긴급)
- 구토 1회 이상
- 오심 8점 이상
- 투약 누락 2회 이상

### 🟡 YELLOW (주의)
- 오심 5~7점이 2일 이상
- 투약 누락 1회

### 🟢 GREEN (양호)
- 위 조건 해당 없음

## 🔐 보안 및 인증

### MVP 토큰 방식

```
URL: /clinic?clinic_id=C001&token=long-secret-token
```

**특징:**
- 병원별 고유 토큰 발급
- 서버에서 clinic_id 범위 강제
- 브라우저는 Sheets 접근 불가

### 토큰 생성

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📊 데이터 스키마

### Patients 시트

```
patient_id | clinic_id | patient_code | phone | name_or_initial | ...
P001 | C001 | C001-1234 | 01012345678 | 홍*동 | ...
```

### DailyResponses 시트

```
Timestamp | 환자코드 | 오늘 투약했나요? | 오심 정도 (0-10) | ...
2024-01-01 09:00:00 | C001-1234 | 예 | 3 | ...
```

### WeeklyResponses 시트

```
Timestamp | 환자코드 | 체중(kg) | 체지방률(%) | ...
2024-01-01 10:00:00 | C001-1234 | 75.5 | 28.3 | ...
```

## 🚀 배포 (Vercel 권장)

### 1. Vercel 프로젝트 생성

```bash
git push origin main
```

Vercel이 자동으로 빌드 및 배포

### 2. 환경변수 설정

Vercel Dashboard > Settings > Environment Variables:

| 변수명 | 설명 | 환경 |
|--------|------|------|
| `GOOGLE_SHEETS_ID` | 스프레드시트 ID | Production + Preview |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account | Production + Preview |
| `GOOGLE_PRIVATE_KEY` | Private Key (\n 유지!) | Production + Preview |
| `AUTH_MODE` | `token` | Production + Preview |
| `CLINIC_TOKEN_MAP` | 병원 토큰 JSON | Production |

### 3. 병원별 접속 URL 제공

```
https://your-app.vercel.app/clinic?clinic_id=C001&token=xxx
```

## 🧪 테스트

### 로컬 테스트

```bash
# 1. Sheets에 샘플 데이터 입력
# 2. 환경변수 설정
# 3. 실행
npm run dev

# 4. 브라우저 접속
open http://localhost:3000/clinic?clinic_id=C001&token=test
```

### 신호색 테스트

DailyResponses에 테스트 데이터 추가:
```
구토 여부 = "예" → RED
오심 7점 2일 → YELLOW
정상 → GREEN
```

## 🔧 문제 해결

### "Google Sheets API 오류"
- Service Account가 Sheets에 공유되었는지 확인
- private_key의 줄바꿈 (\n) 보존 확인

### "인증 실패"
- clinic_id와 token이 URL에 포함되었는지 확인
- CLINIC_TOKEN_MAP에 해당 clinic_id 존재 확인

### "데이터 안 보임"
- Sheets 헤더 행 (1행) 확인
- 한글 컬럼명 띄어쓰기 확인
- clinic_id 일치 확인

## 📈 로드맵

### MVP (현재)
- [x] 병원 대시보드
- [x] 환자 리포트
- [x] 신호색 자동 산출
- [x] 인쇄 화면

### 2단계 (계획)
- [ ] PDF 자동 생성
- [ ] 환자별 개인 링크 (UUID)
- [ ] 이메일/문자 발송
- [ ] EMR 연동
- [ ] AI 기반 권장사항

## 📄 Legal Disclaimer

**비의료 서비스:** 본 서비스는 건강관리 보조 도구이며, 의사의 진단, 처방, 치료를 대신하지 않습니다.

**처방 권고 금지:** 제공되는 수치는 임상 논문에 근거한 통계적 가이드일 뿐입니다.

**전문가 상담 필수:** 모든 약물 용량 조절은 반드시 담당 전문의의 처방과 지시에 따라야 합니다.

## 📞 지원

- 📖 설정 가이드: `HOSPITAL_SETUP_GUIDE.md`
- 🐛 이슈 리포트: GitHub Issues
- 📧 문의: nextweight.service@gmail.com

---

**버전:** 1.0.0 MVP  
**업데이트:** 2024-02-14  
**라이선스:** Proprietary
