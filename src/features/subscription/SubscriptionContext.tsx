import { createContext, useContext, useMemo, useState } from 'react';

interface SubscriptionValue {
  isPro: boolean;
  /**
   * TODO(RevenueCat): 출시 시 실제 구매로 교체.
   * 지금은 결제 SDK 없이 흐름을 확인하기 위한 로컬 미리보기용이다.
   */
  subscribe: () => Promise<void>;
  /** 복원된 구독이 있으면 true */
  restore: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);

  const value = useMemo<SubscriptionValue>(
    () => ({
      isPro,
      // TODO(RevenueCat): Purchases.purchasePackage(...) 결과로 isPro 설정
      async subscribe() {
        setIsPro(true);
      },
      // TODO(RevenueCat): Purchases.restorePurchases() 결과로 복원 처리.
      // 지금은 실제 구매 이력이 없으므로 복원할 게 없다.
      async restore() {
        return false;
      },
    }),
    [isPro],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
