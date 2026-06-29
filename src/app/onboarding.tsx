import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

export const ONBOARDING_KEY = 'onboarding_seen_v1';

const STEPS = [
  { title: '설명 영상을 찍어요', body: '설명이 필요한 제품의 사용법을 직접 촬영하세요.' },
  { title: 'QR이 만들어져요', body: '설명서마다 QR이 자동으로 생겨요.' },
  { title: '제품에 붙여요', body: 'QR을 TV·에어컨 등에 붙여두세요.' },
  { title: 'QR을 찍어서 봐요', body: '설명이 필요한 경우 부착된 QR을 찍으면 영상이 바로 재생돼요.' },
];

const PAGE_COUNT = 2;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.back();
  }

  function handleNext() {
    if (page < PAGE_COUNT - 1) {
      scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
      setPage(page + 1);
    } else {
      finish();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.handle} />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.flex}>
        {/* 1페이지 — 앱 소개 */}
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>우리집 설명서</Text>
          <Text style={styles.subtitle}>이렇게 사용해요</Text>
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={styles.step}>
                <Text style={styles.stepTitle}>
                  {i + 1}. {s.title}
                </Text>
                <Text style={styles.stepDesc}>{s.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2페이지 — 장면 골라보기 */}
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>장면을 골라서 봐요</Text>
          <Text style={styles.subtitle}>보고 싶은 부분만 바로</Text>

          <View style={styles.demoBars}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.demoBarWrap}>
                <View style={styles.demoBarTrack}>
                  <View
                    style={[styles.demoBarFill, { width: i === 0 ? '100%' : i === 1 ? '55%' : '0%' }]}
                  />
                </View>
                <Text style={[styles.demoBarNum, i === 1 && styles.demoBarNumActive]}>{i + 1}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.demoBody}>
            재생 화면 위의 <Text style={styles.demoBold}>장면 막대</Text>를 누르면{'\n'}그 장면부터 바로 볼
            수 있어요.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.dots}>
        {Array.from({ length: PAGE_COUNT }).map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <AppButton label={page < PAGE_COUNT - 1 ? '다음' : '시작하기'} onPress={handleNext} large />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  flex: {
    flex: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.border,
    marginTop: Space.sm,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    padding: Space.lg,
  },
  title: {
    fontSize: Type.display,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Palette.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Type.body,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: Space.xl,
  },
  steps: {
    gap: Space.lg,
  },
  step: {
    gap: 4,
  },
  stepTitle: {
    fontSize: Type.headline,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: Palette.text,
  },
  stepDesc: {
    fontSize: 15,
    lineHeight: 21,
    color: Palette.textMuted,
  },
  demoBars: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Space.sm,
    marginBottom: Space.xl,
  },
  demoBarWrap: {
    flex: 1,
    gap: 4,
  },
  demoBarTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.border,
    overflow: 'hidden',
  },
  demoBarFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
  },
  demoBarNum: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: Palette.textMuted,
  },
  demoBarNumActive: {
    color: Palette.primary,
    fontWeight: '800',
  },
  demoBody: {
    fontSize: Type.body,
    lineHeight: 26,
    color: Palette.text,
    textAlign: 'center',
  },
  demoBold: {
    fontWeight: '800',
    color: Palette.primary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Space.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.border,
  },
  dotActive: {
    backgroundColor: Palette.primary,
    width: 20,
  },
  footer: {
    padding: Space.lg,
  },
});
