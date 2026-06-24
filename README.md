# 우리집 설명서 📺

> 부모님이 자주 묻는 것을 한 번만 설명하고, 평생 다시 보여주세요.

자녀가 부모님을 위해 직접 설명 영상을 찍어 **QR 코드**로 만들어 두면, 부모님은 제품에 붙은 QR만 찍어 **자녀가 설명한 영상**을 바로 다시 볼 수 있는 앱입니다.

핵심 가치는 "설명 내용"보다 "설명하는 사람"입니다. 제조사 설명서보다 자녀의 목소리와 표현이 부모님께 더 쉽게 전달됩니다.

---

## 주요 기능 (MVP)

- 🎥 **설명 영상 촬영** — 카메라로 최대 10분 녹화
- 📝 **제목 입력** — "TV 켜는 방법", "에어컨 설정" 등
- 🔳 **QR 자동 생성** — 설명서마다 고유 QR 발급
- ▶️ **QR 재생** — 부모님이 QR을 찍으면 영상 즉시 재생 (고령 사용자용 큰 글씨/컨트롤)
- 📂 **설명서 목록 / QR 다시 보기** — 만든 설명서 관리 및 QR 재출력

---

## 기술 스택

| 영역 | 사용 |
| --- | --- |
| 프레임워크 | Expo SDK 54 (Expo Go 호환) + Expo Router (파일 기반 라우팅) |
| 언어 | TypeScript (strict) |
| 백엔드 | Supabase (Postgres + Storage) |
| 서버 상태 | TanStack Query |
| 카메라/영상 | expo-camera, expo-video |
| QR | react-native-qrcode-svg |

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env`를 만들고 Supabase 값을 채웁니다.

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
# QR이 가리킬 배포된 웹 주소 (비워두면 로컬 웹에서 자동 추론)
EXPO_PUBLIC_WEB_BASE_URL=
```

> `anon` 키는 클라이언트 노출을 전제로 한 공개 키이며 RLS로 보호됩니다. 비밀 키가 아닙니다. `.env`는 커밋하지 않습니다.

### 3. Supabase 스키마 적용

Supabase 대시보드 → **SQL Editor**에 [`supabase/schema.sql`](supabase/schema.sql) 내용을 붙여넣고 실행합니다. `manuals` 테이블과 공개 `videos` 스토리지 버킷이 생성됩니다.

### 4. 실행

```bash
npx expo start
```

휴대폰의 **Expo Go** 앱으로 QR을 스캔해 접속합니다 (폰과 PC가 같은 Wi-Fi여야 함, 아니면 `npx expo start --tunnel`).

---

## 사용 흐름

```
[자녀] 앱 실행 → 영상 촬영 → 제목 입력 → QR 생성 → 제품에 부착
[부모님] QR 촬영 → 자녀 설명 영상 재생
```

---

## 프로젝트 구조

```
src/
├─ app/                  # 화면 (Expo Router)
│  ├─ index.tsx          # 홈 — 설명서 목록
│  ├─ record.tsx         # 영상 촬영
│  ├─ save.tsx           # 제목 입력 + 저장 + QR 결과
│  ├─ qr/[id].tsx        # QR 다시 보기
│  └─ v/[id].tsx         # 부모님용 영상 재생 (QR 진입)
├─ components/           # 공용 UI (AppButton, ManualQrCard)
├─ features/manuals/     # 도메인 — API/hooks/types/링크/업로드
├─ lib/                  # supabase 클라이언트, config, queryClient
└─ theme/                # 디자인 토큰
supabase/schema.sql      # DB/스토리지 초기 스키마
```

---

## 현재 상태 / 주의

- **검증 단계 MVP** 입니다. 보안 정책(RLS)이 익명 읽기/쓰기를 모두 허용하도록 열려 있습니다 — 절대 운영에 그대로 두지 말고, Auth 도입 시 소유자 기반 정책으로 좁혀야 합니다 (`schema.sql` 주석 참고).
- QR을 다른 기기(부모님 폰)에서 열려면 재생 페이지가 인터넷에 배포돼 있어야 하며, 그 주소를 `EXPO_PUBLIC_WEB_BASE_URL`에 넣어야 합니다.

---

## 로드맵 (예정)

- 자동 자막 / AI 요약
- 가족 계정 + 소유자 기반 보안
- 방수 QR 스티커 키트 · 라벨 프린터 연동
- 생활 설명서 확장 (병원 예약, 인터넷뱅킹 등)
