import { Platform } from 'react-native';

/**
 * 클라이언트에 노출되는 환경변수 모음 (EXPO_PUBLIC_ 접두).
 * anon key는 RLS로 보호되는 공개 키이므로 노출 OK. 비밀 키는 절대 여기 두지 않는다.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const WEB_BASE_URL_ENV = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? '';

/** Supabase 영상 버킷 이름 */
export const VIDEO_BUCKET = 'videos';

/**
 * QR이 가리킬 웹 재생 페이지의 베이스 URL.
 * - 배포 환경: EXPO_PUBLIC_WEB_BASE_URL 사용
 * - 웹에서 로컬 실행 중이면 현재 origin으로 자동 추론
 */
export function getWebBaseUrl(): string {
  if (WEB_BASE_URL_ENV) return WEB_BASE_URL_ENV.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
