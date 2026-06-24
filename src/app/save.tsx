import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ManualQrCard } from '@/components/ManualQrCard';
import { useCreateManual } from '@/features/manuals/hooks';
import { manualPlaybackUrl } from '@/features/manuals/links';
import { Palette, Radius, Space } from '@/theme/tokens';

const TITLE_EXAMPLES = ['TV 켜는 방법', '에어컨 설정', '카카오톡 사진 저장'];

export default function SaveScreen() {
  const router = useRouter();
  const { videoUri } = useLocalSearchParams<{ videoUri: string }>();
  const [title, setTitle] = useState('');
  const { mutate, isPending, isError, error, data: savedManual } = useCreateManual();

  const player = useVideoPlayer(videoUri ?? '', (p) => {
    p.loop = true;
  });

  if (!videoUri) {
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

        {isError && <Text style={styles.errorText}>{error?.message}</Text>}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <AppButton
          label="다시 촬영"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.footerBtn}
        />
        <AppButton
          label={isPending ? '저장 중…' : 'QR 만들기'}
          onPress={() => mutate({ title: title.trim(), videoUri })}
          disabled={!canSave}
          loading={isPending}
          style={styles.footerBtn}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function QrResult({ title, url, onDone }: { title: string; url: string; onDone: () => void }) {
  return (
    <SafeAreaView style={styles.qrScreen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.qrContent}>
        <ManualQrCard title={title} url={url} />
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="완료" onPress={onDone} large style={styles.footerBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Palette.background },
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
    flexDirection: 'row',
    gap: Space.sm,
    padding: Space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
  },
  footerBtn: {
    flex: 1,
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
});
