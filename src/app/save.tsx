import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  DimensionValue,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ManualQrCard } from '@/components/ManualQrCard';
import { useCreateManual } from '@/features/manuals/hooks';
import { manualPlaybackUrl } from '@/features/manuals/links';
import { Palette, Radius, Space } from '@/theme/tokens';

const TITLE_EXAMPLES = ['TV 켜는 방법', '에어컨 설정', '카카오톡 사진 저장'];

export default function SaveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clipsJson, captionsJson, videoUri } = useLocalSearchParams<{
    clipsJson?: string;
    captionsJson?: string;
    videoUri?: string;
  }>();
  const [title, setTitle] = useState('');
  const { mutate, isPending, isError, error, data: savedManual } = useCreateManual();

  // 녹화(여러 클립) 또는 갤러리(단일) 양쪽을 받는다.
  const clips = useMemo<string[]>(() => {
    if (clipsJson) {
      try {
        const arr: unknown = JSON.parse(clipsJson);
        return Array.isArray(arr) ? (arr as string[]) : [];
      } catch {
        return [];
      }
    }
    return videoUri ? [videoUri] : [];
  }, [clipsJson, videoUri]);

  // 장면별 자막 (녹화 화면에서 넘어옴). 갤러리는 자막 없음.
  const captions = useMemo<string[]>(() => {
    if (!captionsJson) return [];
    try {
      const arr: unknown = JSON.parse(captionsJson);
      return Array.isArray(arr) ? (arr as string[]) : [];
    } catch {
      return [];
    }
  }, [captionsJson]);

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const player = useVideoPlayer(clips[0] ?? '', (p) => {
    p.loop = true;
  });

  if (clips.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>영상 정보가 없어요. 다시 촬영해주세요.</Text>
        <AppButton label="다시 촬영" onPress={() => router.replace('/record')} />
      </SafeAreaView>
    );
  }

  // 저장 완료 → QR 화면
  if (savedManual) {
    return (
      <QrResult
        title={savedManual.title}
        url={manualPlaybackUrl(savedManual.id)}
        onDone={() => router.dismissAll()}
      />
    );
  }

  const canSave = title.trim().length > 0 && !isPending;
  const progressWidth: DimensionValue = progress
    ? `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%`
    : '0%';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        <VideoView style={styles.preview} player={player} contentFit="cover" nativeControls />

        <Text style={styles.label}>이 설명서의 제목</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="예: TV 켜는 방법"
          placeholderTextColor={Palette.textMuted}
          maxLength={40}
          returnKeyType="done"
        />

        <View style={styles.examples}>
          {TITLE_EXAMPLES.map((ex) => (
            <Text key={ex} style={styles.exampleChip} onPress={() => setTitle(ex)}>
              {ex}
            </Text>
          ))}
        </View>

        {captions.some((c) => c.trim().length > 0) && (
          <Text style={styles.clipCount}>장면별 자막이 함께 저장돼요</Text>
        )}

        {isError && <Text style={styles.errorText}>{error?.message}</Text>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) + Space.md }]}>
        {isPending && progress && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressLabel}>
              {progress.total > 1
                ? `장면 ${progress.done}/${progress.total} 올리는 중…`
                : '올리는 중…'}
            </Text>
          </View>
        )}
        <View style={styles.footerRow}>
          <AppButton
            label="다시 촬영"
            variant="secondary"
            onPress={() => router.back()}
            disabled={isPending}
            style={styles.footerBtn}
          />
          <AppButton
            label={isPending ? '저장 중…' : 'QR 만들기'}
            onPress={() =>
              mutate({
                title: title.trim(),
                videoUris: clips,
                captions,
                onProgress: (done, total) => setProgress({ done, total }),
              })
            }
            disabled={!canSave}
            loading={isPending}
            style={styles.footerBtn}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function QrResult({ title, url, onDone }: { title: string; url: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.qrScreen}
      contentContainerStyle={[
        styles.qrContent,
        { paddingBottom: Math.max(insets.bottom, 24) + Space.lg },
      ]}>
      <ManualQrCard title={title} url={url} />
      <AppButton label="완료" onPress={onDone} large style={styles.doneBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.background },
  scroll: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md,
    padding: Space.lg,
    backgroundColor: Palette.background,
  },
  content: {
    padding: Space.md,
    gap: Space.md,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  clipCount: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.md,
    fontSize: 18,
    color: Palette.text,
    backgroundColor: Palette.surface,
  },
  examples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  exampleChip: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.primary,
    backgroundColor: Palette.primarySoft,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  footer: {
    gap: Space.sm,
    padding: Space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  footerBtn: {
    flex: 1,
  },
  progressWrap: {
    gap: 6,
    paddingBottom: Space.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primarySoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMuted,
    textAlign: 'center',
  },
  errorText: {
    color: Palette.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  qrScreen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  qrContent: {
    padding: Space.lg,
  },
  doneBtn: {
    marginTop: Space.xl,
    alignSelf: 'stretch',
  },
});
