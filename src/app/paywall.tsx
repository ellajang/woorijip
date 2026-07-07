import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useDialog } from '@/components/DialogProvider';
import { useSubscription } from '@/features/subscription/SubscriptionContext';
import {
  FREE_CLIPS,
  FREE_MANUALS,
  PRO_CLIPS,
  PRO_MANUALS,
  PRO_PRICE_LABEL,
} from '@/features/subscription/limits';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

const BENEFITS = [
  `설명서 ${PRO_MANUALS}개까지 만들기 (무료 ${FREE_MANUALS}개)`,
  `한 설명서에 장면 ${PRO_CLIPS}개까지 나누기 (무료 ${FREE_CLIPS}개)`,
  '자막·카테고리 등 모든 기능',
];

export default function PaywallScreen() {
  const router = useRouter();
  const { isPro, subscribe, restore } = useSubscription();
  const { alert } = useDialog();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  async function handleSubscribe() {
    setBusy(true);
    try {
      await subscribe();
      alert('Pro 시작!', `이제 설명서를 ${PRO_MANUALS}개까지 만들 수 있어요.`);
      router.back();
    } catch (e) {
      alert('결제 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setBusy(true);
    try {
      const restored = await restore();
      if (restored) {
        router.back();
      } else {
        alert('복원할 구독이 없어요', '구독한 적이 없다면 먼저 구독해주세요.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>
        <Text style={styles.title}>우리집 설명서 Pro</Text>
        <Text style={styles.subtitle}>더 많이 만들고, 더 잘게 나눠요</Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={22} color={Palette.primary} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.price}>{PRO_PRICE_LABEL}</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) + Space.md }]}>
        {isPro ? (
          <Text style={styles.alreadyText}>이미 Pro를 이용 중이에요 🎉</Text>
        ) : (
          <>
            <AppButton label="Pro 구독하기" onPress={handleSubscribe} loading={busy} large />
            <Text style={styles.restore} onPress={handleRestore}>
              이전 구독 복원하기
            </Text>
          </>
        )}
        <Text style={styles.close} onPress={() => router.back()}>
          닫기
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Space.lg,
    gap: Space.sm,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: Space.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    marginBottom: Space.sm,
  },
  badgeText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: Type.display,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Type.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: Space.lg,
  },
  benefits: {
    gap: Space.md,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: Type.body,
    color: Palette.text,
    fontWeight: '600',
  },
  price: {
    fontSize: Type.title,
    fontWeight: '800',
    color: Palette.text,
    textAlign: 'center',
    marginTop: Space.lg,
  },
  footer: {
    padding: Space.lg,
    gap: Space.md,
  },
  restore: {
    fontSize: 15,
    color: Palette.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  close: {
    fontSize: 15,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingVertical: Space.sm,
  },
  alreadyText: {
    fontSize: Type.body,
    color: Palette.text,
    textAlign: 'center',
    fontWeight: '700',
  },
});
