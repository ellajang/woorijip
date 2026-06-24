import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ManualQrCard } from '@/components/ManualQrCard';
import { useManual } from '@/features/manuals/hooks';
import { manualPlaybackUrl } from '@/features/manuals/links';
import { Palette, Space } from '@/theme/tokens';

/** 이미 만든 설명서의 QR을 다시 보는 화면 (스티커 재출력 등). */
export default function QrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: manual, isLoading, isError } = useManual(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <ActivityIndicator color={Palette.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !manual) {
    return (
      <SafeAreaView style={styles.centered} edges={['bottom']}>
        <Text style={styles.errorText}>설명서를 찾을 수 없어요.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ManualQrCard title={manual.title} url={manualPlaybackUrl(manual.id)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    padding: Space.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  errorText: {
    fontSize: 16,
    color: Palette.textMuted,
  },
});
