import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Space, Type } from '@/theme/tokens';

const STEPS = [
  { title: '설명 영상을 찍어요', body: '설명이 필요한 제품의 사용법을 직접 촬영하세요.' },
  { title: 'QR이 만들어져요', body: '설명서마다 QR이 자동으로 생겨요.' },
  { title: '제품에 붙여요', body: 'QR을 TV·에어컨 등에 붙여두세요.' },
  { title: 'QR을 찍어서 봐요', body: '설명이 필요한 경우 부착된 QR을 찍으면 영상이 바로 재생돼요.' },
];

export default function GuideScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>이렇게 사용해요</Text>
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

        <Text style={[styles.intro, styles.introSpaced]}>장면을 골라서 봐요</Text>
        <View style={styles.demoCard}>
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
            여러 장면으로 찍은 설명서는 재생 화면 위에{' '}
            <Text style={styles.demoBold}>장면 막대</Text>가 떠요. 막대를 누르면 그 장면부터 바로 볼 수
            있어요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    padding: Space.lg,
    gap: Space.md,
  },
  intro: {
    fontSize: Type.title,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Palette.text,
  },
  introSpaced: {
    marginTop: Space.lg,
  },
  steps: {
    gap: Space.md,
  },
  step: {
    gap: 4,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
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
  demoCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
    gap: Space.md,
    alignItems: 'center',
  },
  demoBars: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Space.sm,
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
    fontSize: 15,
    lineHeight: 23,
    color: Palette.text,
    textAlign: 'center',
  },
  demoBold: {
    fontWeight: '800',
    color: Palette.primary,
  },
});
