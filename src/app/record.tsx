import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useDialog } from '@/components/DialogProvider';
import { Palette, Radius, Space } from '@/theme/tokens';

const MAX_DURATION_SEC = 600;
/** 무료 사용자가 한 설명서에 나눌 수 있는 클립 수 */
const FREE_CLIPS = 3;
/** Pro 포함 최대 클립 수 */
const MAX_CLIPS = 10;

interface Clip {
  uri: string;
  thumb: string | null;
}

export default function RecordScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { alert } = useDialog();

  // 언마운트 시 카운트다운 타이머 정리
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, []);

  // 녹화 중 경과시간(초)
  useEffect(() => {
    if (!isRecording) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  // TODO: 구독 결제 연동 시 실제 Pro 여부로 교체
  const isPro = false;
  const clipLimit = isPro ? MAX_CLIPS : FREE_CLIPS;
  const atClipLimit = clips.length >= clipLimit;

  const hasPermission = cameraPermission?.granted && micPermission?.granted;

  if (!cameraPermission || !micPermission) {
    return <View style={styles.black} />;
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permission}>
        <Text style={styles.permissionTitle}>카메라와 마이크 권한이 필요해요</Text>
        <Text style={styles.permissionBody}>
          부모님께 보여줄 설명 영상을 찍으려면{'\n'}카메라와 마이크 사용을 허용해주세요.
        </Text>
        <AppButton
          label="권한 허용하기"
          onPress={async () => {
            await requestCamera();
            await requestMic();
          }}
        />
      </SafeAreaView>
    );
  }

  function handleShutter() {
    if (isRecording) {
      handleStop();
      return;
    }
    if (countdown !== null) return;
    if (atClipLimit) {
      alert(
        'Pro로 업그레이드',
        `무료는 한 설명서에 장면을 ${FREE_CLIPS}개까지 나눌 수 있어요.\nPro로 업그레이드하면 장면을 더 세세하게 나눌 수 있어요.`,
      );
      return;
    }
    startCountdown();
  }

  // 3·2·1 카운트다운 후 녹화 시작
  function startCountdown() {
    let n = 3;
    setCountdown(n);
    Haptics.selectionAsync();
    const tick = () => {
      n -= 1;
      if (n > 0) {
        setCountdown(n);
        Haptics.selectionAsync();
        countdownRef.current = setTimeout(tick, 800);
      } else {
        setCountdown(null);
        handleStart();
      }
    };
    countdownRef.current = setTimeout(tick, 800);
  }

  async function handleStart() {
    if (!cameraRef.current || isRecording || atClipLimit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_DURATION_SEC });
      setIsRecording(false);
      if (video?.uri) {
        let thumb: string | null = null;
        try {
          const t = await VideoThumbnails.getThumbnailAsync(video.uri, { time: 300 });
          thumb = t.uri;
        } catch {
          thumb = null;
        }
        setClips((prev) => [...prev, { uri: video.uri, thumb }]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setIsRecording(false);
    }
  }

  function handleStop() {
    if (!cameraRef.current || !isRecording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cameraRef.current.stopRecording();
  }

  function handleRemove(index: number) {
    setClips((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDone() {
    if (clips.length === 0) return;
    router.push({ pathname: '/save', params: { clipsJson: JSON.stringify(clips.map((c) => c.uri)) } });
  }

  const takeNumber = clips.length + 1;
  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  const takeText = isRecording
    ? `● ${takeNumber}번 촬영 중  ${mmss}`
    : atClipLimit
      ? 'Pro로 업그레이드하고 더 나누기'
      : `${takeNumber}번 촬영`;

  return (
    <View style={styles.black}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.cameraBox}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} mode="video" facing="back" />
          <View style={styles.takeBar}>
            <Text style={styles.takeText}>{takeText}</Text>
          </View>
          {countdown !== null && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
        </View>

        {clips.length > 0 && (
          <ScrollView
            horizontal
            style={styles.strip}
            contentContainerStyle={styles.stripContent}
            showsHorizontalScrollIndicator={false}>
            {clips.map((clip, i) => (
              <View key={`${clip.uri}-${i}`} style={styles.clipItem}>
                {clip.thumb ? (
                  <Image source={{ uri: clip.thumb }} style={styles.clipThumb} contentFit="cover" />
                ) : (
                  <View style={[styles.clipThumb, styles.clipThumbEmpty]} />
                )}
                <View style={styles.clipNumberOverlay}>
                  <Text style={styles.clipNumberText}>{i + 1}</Text>
                </View>
                <Pressable
                  onPress={() => handleRemove(i)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1}번 장면 삭제`}
                  style={styles.clipDelete}>
                  <Ionicons name="close-circle" size={20} color={Palette.white} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.controls}>
          <View style={styles.sideBtn} />

          <Pressable
            onPress={handleShutter}
            accessibilityRole="button"
            accessibilityLabel={
              isRecording ? '장면 녹화 종료' : atClipLimit ? 'Pro 안내' : '장면 녹화 시작'
            }
            style={styles.shutterOuter}>
            {atClipLimit && !isRecording ? (
              <View style={styles.shutterLock}>
                <Ionicons name="lock-closed" size={30} color={Palette.white} />
              </View>
            ) : (
              <View style={[styles.shutterInner, isRecording && styles.shutterInnerRecording]} />
            )}
          </Pressable>

          {clips.length > 0 && !isRecording ? (
            <Pressable
              onPress={handleDone}
              accessibilityRole="button"
              accessibilityLabel="촬영 완료"
              style={({ pressed }) => [styles.sideBtn, pressed && styles.sideBtnPressed]}>
              <Ionicons name="checkmark-circle" size={32} color={Palette.primary} />
              <Text style={styles.sideBtnText}>완료</Text>
            </Pressable>
          ) : (
            <View style={styles.sideBtn} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  black: {
    flex: 1,
    backgroundColor: '#000',
  },
  safe: {
    flex: 1,
  },
  cameraBox: {
    flex: 1,
    margin: Space.sm,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  takeBar: {
    position: 'absolute',
    top: Space.md,
    alignSelf: 'center',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  takeText: {
    color: Palette.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  countdownText: {
    color: Palette.white,
    fontSize: 120,
    fontWeight: '900',
  },
  strip: {
    maxHeight: 84,
    flexGrow: 0,
  },
  stripContent: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    gap: Space.sm,
    alignItems: 'center',
  },
  clipItem: {
    width: 50,
    height: 64,
  },
  clipThumb: {
    width: 50,
    height: 64,
    borderRadius: Radius.sm,
    backgroundColor: '#333',
  },
  clipThumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipNumberOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Radius.sm,
  },
  clipNumberText: {
    color: Palette.white,
    fontSize: 24,
    fontWeight: '800',
  },
  clipDelete: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: '#000',
    borderRadius: Radius.pill,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Space.md,
  },
  sideBtn: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sideBtnPressed: {
    opacity: 0.7,
  },
  sideBtnText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.danger,
  },
  shutterInnerRecording: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  shutterLock: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md,
    padding: Space.lg,
    backgroundColor: Palette.background,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textMuted,
    textAlign: 'center',
  },
});
