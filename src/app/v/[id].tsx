import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDialog } from '@/components/DialogProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { getVideoPublicUrl } from '@/features/manuals/api';
import { useManual, useUpdateManual } from '@/features/manuals/hooks';
import { Palette, Radius, SeniorSize, Space } from '@/theme/tokens';

/**
 * 부모님이 QR로 들어오는 재생 화면.
 * Expo Router 덕분에 웹(앱 미설치 폴백)·네이티브(앱 딥링크) 모두 이 컴포넌트로 렌더된다.
 * 고령 사용자 기준으로 글씨/컨트롤을 의도적으로 크게 둔다.
 */
export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: manual, isLoading, isError } = useManual(id ?? '');
  const { session } = useAuth();
  const { prompt, alert } = useDialog();
  const updateManual = useUpdateManual();

  const isOwner = Boolean(session?.user?.id && manual?.userId && session.user.id === manual.userId);

  async function handleEditTitle() {
    if (!manual) return;
    const newTitle = await prompt({
      title: '제목 수정',
      defaultValue: manual.title,
      placeholder: '예: TV 켜는 방법',
      confirmLabel: '저장',
    });
    if (!newTitle || newTitle === manual.title) return;
    updateManual.mutate({ id: manual.id, title: newTitle }, { onError: (e) => alert('수정 실패', e.message) });
  }

  const urls = useMemo(() => (manual ? manual.videoPaths.map(getVideoPublicUrl) : []), [manual]);
  const urlsRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const player = useVideoPlayer('', (p) => {
    p.loop = false;
  });

  // 첫 클립부터 재생
  useEffect(() => {
    urlsRef.current = urls;
    indexRef.current = 0;
    if (urls.length > 0) {
      player.replace(urls[0]);
      player.play();
    }
  }, [urls, player]);

  // 한 클립이 끝나면 다음 클립으로 이어 재생
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      const next = indexRef.current + 1;
      if (next < urlsRef.current.length) {
        indexRef.current = next;
        player.replace(urlsRef.current[next]);
        player.play();
      }
    });
    return () => sub.remove();
  }, [player]);

  function handleReplay() {
    if (urlsRef.current.length === 0) return;
    indexRef.current = 0;
    player.replace(urlsRef.current[0]);
    player.play();
  }

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
      <View style={styles.topBar}>
        <BackButton />
        {isOwner && (
          <Pressable
            onPress={handleEditTitle}
            accessibilityRole="button"
            accessibilityLabel="제목 수정"
            hitSlop={10}
            style={({ pressed }) => [styles.editBtn, pressed && styles.editPressed]}>
            <Ionicons name="create-outline" size={20} color={Palette.white} />
            <Text style={styles.editText}>제목 수정</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.title}>{manual.title}</Text>
      <View style={styles.videoWrap}>
        <VideoView style={styles.video} player={player} contentFit="contain" nativeControls />
      </View>
      {manual.caption ? <Text style={styles.caption}>{manual.caption}</Text> : null}
      <Pressable
        onPress={handleReplay}
        accessibilityRole="button"
        accessibilityLabel="다시 보기"
        style={({ pressed }) => [styles.replayBtn, pressed && styles.replayPressed]}>
        <Ionicons name="refresh" size={28} color={Palette.white} />
        <Text style={styles.replayText}>다시 보기</Text>
      </Pressable>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  backBtn: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  editPressed: {
    opacity: 0.6,
  },
  editText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '700',
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
  caption: {
    color: Palette.white,
    fontSize: SeniorSize.body,
    lineHeight: 32,
    textAlign: 'center',
    paddingHorizontal: Space.lg,
    paddingTop: Space.md,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    alignSelf: 'center',
    marginVertical: Space.lg,
    paddingHorizontal: Space.xl,
    paddingVertical: Space.md,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
  },
  replayPressed: {
    opacity: 0.85,
  },
  replayText: {
    color: Palette.white,
    fontSize: SeniorSize.body,
    fontWeight: '800',
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
