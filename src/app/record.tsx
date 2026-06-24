import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Palette, Radius, Space } from '@/theme/tokens';

const MAX_DURATION_SEC = 600;

export default function RecordScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);

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

  async function handleStart() {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_DURATION_SEC });
      if (video?.uri) {
        router.push({ pathname: '/save', params: { videoUri: video.uri } });
      }
    } catch {
      setIsRecording(false);
    }
  }

  function handleStop() {
    if (!cameraRef.current || !isRecording) return;
    cameraRef.current.stopRecording();
    setIsRecording(false);
  }

  return (
    <View style={styles.black}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} mode="video" facing="back" />
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.hintBar}>
          <Text style={styles.hint}>
            {isRecording ? '● 녹화 중… (최대 10분)' : '버튼을 누르면 녹화가 시작돼요'}
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={isRecording ? handleStop : handleStart}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? '녹화 종료' : '녹화 시작'}
            style={styles.shutterOuter}>
            <View style={[styles.shutterInner, isRecording && styles.shutterInnerRecording]} />
          </Pressable>
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
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hintBar: {
    alignSelf: 'center',
    marginTop: Space.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  hint: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '600',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: Space.xl,
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
