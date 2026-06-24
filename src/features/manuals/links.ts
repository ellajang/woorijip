import { getWebBaseUrl } from '@/lib/config';

/**
 * 설명서 재생 URL. QR에 인코딩된다.
 * https URL을 쓰는 이유:
 *  - 앱 미설치 부모님 → 브라우저에서 바로 재생 (웹 폴백)
 *  - 앱 설치 시 → 추후 유니버설/앱 링크로 등록하면 이 URL이 앱을 연다
 * 즉 하나의 QR이 "앱 우선 + 웹 폴백"으로 자란다.
 */
export function manualPlaybackUrl(id: string): string {
  const base = getWebBaseUrl();
  return `${base}/v/${id}`;
}
