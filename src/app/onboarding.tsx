import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
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

export default function OnboardingScreen() {
  const router = useRouter();

  async function handleStart() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.content}>
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

      <View style={styles.footer}>
        <AppButton label="시작하기" onPress={handleStart} large />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.border,
    marginTop: Space.sm,
  },
  content: {
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
  footer: {
    padding: Space.lg,
  },
});
