/** 앱 전역 디자인 토큰. 부모님 뷰어는 일부러 큰 사이즈를 따로 둔다. */
export const Palette = {
  primary: '#208AEF',
  primaryDark: '#1668B8',
  danger: '#E5484D',
  text: '#11181C',
  textMuted: '#60646C',
  background: '#FFFFFF',
  surface: '#F4F6F8',
  border: '#E1E4E8',
  white: '#FFFFFF',
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
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

/** 부모님(고령) 화면 전용 — 의도적으로 크게 */
export const SeniorSize = {
  title: 30,
  body: 22,
  playButton: 96,
} as const;
