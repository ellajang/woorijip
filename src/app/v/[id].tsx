import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getVideoPublicUrl } from '@/features/manuals/api';
import { useManual } from '@/features/manuals/hooks';
import { Palette, Radius, SeniorSize, Space } from '@/theme/tokens';

/**
 * 부모님이 QR로 들어오는 재생 화면.
 * Expo Router 덕분에 웹(앱 미설치 폴백)·네이티브(앱 딥링크) 모두 이 컴포넌트로 렌더된다.
 * 고령 사용자 기준으로 글씨/컨트롤을 의도적으로 크게 둔다.
 */
export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: manual, isLoading, isError } = useManual(id ?? '');

  const videoUrl = manual ? getVideoPublicUrl(manual.videoPath) : '';
  const player = useVideoPlayer('', (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (!videoUrl) return;
    player.replace(videoUrl);
    player.play();
  }, [videoUrl, player]);

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.statusText}>설명 영상을 불러오는 중…</Text>
      </Centered>
    );
  }

  if (isError || !manual) {
    return (
      <Centered>
        <Text style={styles.statusTitle}>영상을 찾을 수 없어요</Text>
        <Text style={styles.statusText}>QR을 다시 찍어보거나{'\n'}자녀에게 알려주세요.</Text>
      </Centered>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackButton />
      <Text style={styles.title}>{manual.title}</Text>
      <View style={styles.videoWrap}>
        <VideoView style={styles.video} player={player} contentFit="contain" nativeControls />
      </View>
      <Text style={styles.help}>화면을 누르면 다시 볼 수 있어요</Text>
    </SafeAreaView>
  );
}

/**
 * 앱 안에서 목록을 통해 들어온 경우에만 뒤로가기를 보여준다.
 * QR로 새로 진입한 부모님 화면(돌아갈 곳 없음)에는 표시하지 않아 풀스크린을 유지한다.
 */
function BackButton() {
  const router = useRouter();
  if (!router.canGoBack()) return null;
  return (
    <Pressable
      onPress={() => router.back()}
      style={styles.backBtn}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="뒤로">
      <Text style={styles.backBtnText}>‹ 뒤로</Text>
    </Pressable>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.container}>
      <BackButton />
      <View style={styles.centered}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md,
    padding: Space.lg,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  backBtnText: {
    color: Palette.white,
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: Palette.white,
    fontSize: SeniorSize.title,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
  },
  videoWrap: {
    flex: 1,
    marginHorizontal: Space.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  help: {
    color: '#B0B4BA',
    fontSize: SeniorSize.body,
    textAlign: 'center',
    paddingVertical: Space.lg,
  },
  statusTitle: {
    color: Palette.white,
    fontSize: SeniorSize.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusText: {
    color: '#B0B4BA',
    fontSize: SeniorSize.body,
    textAlign: 'center',
    lineHeight: 32,
  },
});
