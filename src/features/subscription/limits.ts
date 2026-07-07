/** 무료/Pro 한도. 한 곳에서 관리한다. */
export const FREE_MANUALS = 1;
export const PRO_MANUALS = 5;
export const FREE_CLIPS = 3;
export const PRO_CLIPS = 10;

/** Pro 구독 가격(표시용). 실제 가격은 스토어/RevenueCat에서 관리. */
export const PRO_PRICE_LABEL = '월 1,900원';

export function manualLimit(isPro: boolean): number {
  return isPro ? PRO_MANUALS : FREE_MANUALS;
}

export function clipLimit(isPro: boolean): number {
  return isPro ? PRO_CLIPS : FREE_CLIPS;
}
