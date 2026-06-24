/** 앱 전역 디자인 토큰. 부모님 뷰어는 일부러 큰 사이즈를 따로 둔다. */
export const Palette = {
  primary: '#2B8AEF',
  primaryDark: '#1668B8',
  /** 파랑 연한 배경 — 보조 버튼·칩·아이콘 받침 */
  primarySoft: '#EAF3FE',
  /** 따뜻한 코랄 포인트 — 강조/뱃지 */
  accent: '#FF8A5B',
  /** 코랄 연한 배경 */
  accentSoft: '#FFF1EA',
  danger: '#E5484D',
  text: '#1F2328',
  textMuted: '#6B7280',
  /** 따뜻한 화이트 배경 */
  background: '#FBFAF8',
  /** 카드 표면 (배경 위에서 살짝 떠 보이게 순백) */
  surface: '#FFFFFF',
  border: '#ECE8E3',
  white: '#FFFFFF',
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const Space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** 카드/버튼에 얹는 부드러운 그림자 (iOS shadow* + Android elevation) */
export const Shadow = {
  card: {
    shadowColor: '#1F2328',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  button: {
    shadowColor: '#2B8AEF',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

/** 부모님(고령) 화면 전용 — 의도적으로 크게 */
export const SeniorSize = {
  title: 30,
  body: 22,
  playButton: 96,
} as const;
