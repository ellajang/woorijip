import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Palette, Radius, Shadow, Space } from '@/theme/tokens';

/** react-native-qrcode-svg가 getRef로 넘겨주는 인스턴스 (PNG base64 추출용) */
interface QrCodeRef {
  toDataURL: (callback: (base64: string) => void) => void;
}

/**
 * 설명서 하나의 QR 카드(제목 + QR + 재생 URL) + 액션.
 * - 다운로드(⬇): QR 이미지를 사진첩에 저장 → 유저가 알아서 인쇄
 * - 출력하기: 시스템 인쇄창으로 바로 출력 (라벨/일반 프린터)
 * 저장 완료 화면과 "QR 다시 보기" 화면에서 공통으로 쓴다.
 */
export function ManualQrCard({ title, url }: { title: string; url: string }) {
  const qrRef = useRef<QrCodeRef | null>(null);
  const [busy, setBusy] = useState<null | 'save' | 'print'>(null);

  /** 현재 QR을 PNG base64로 추출 */
  function getQrBase64(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!qrRef.current) {
        reject(new Error('QR이 아직 준비되지 않았어요.'));
        return;
      }
      qrRef.current.toDataURL((base64) => resolve(base64));
    });
  }

  async function handleSave() {
    if (busy) return;
    setBusy('save');
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '사진 저장 권한을 허용해주세요.');
        return;
      }
      const base64 = await getQrBase64();
      const fileUri = `${FileSystem.cacheDirectory}woorijip-qr.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await MediaLibrary.saveToLibraryAsync(fileUri);
      Alert.alert('저장 완료', 'QR 이미지를 사진첩에 저장했어요.');
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    if (busy) return;
    setBusy('print');
    try {
      const base64 = await getQrBase64();
      await Print.printAsync({
        html: `<!doctype html><html><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,sans-serif;">
          <h2 style="margin:0 0 16px;">${title}</h2>
          <img src="data:image/png;base64,${base64}" style="width:280px;height:280px;" />
        </body></html>`,
      });
    } catch (e) {
      Alert.alert('출력 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>이 QR을 제품에 붙여주세요</Text>

      <View style={styles.qrBox}>
        <QRCode value={url} size={220} getRef={(c: QrCodeRef | null) => (qrRef.current = c)} />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleSave}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="QR 이미지 저장"
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.btnPressed,
            busy !== null && styles.btnDisabled,
          ]}>
          {busy === 'save' ? (
            <ActivityIndicator color={Palette.primary} />
          ) : (
            <Ionicons name="download-outline" size={26} color={Palette.primary} />
          )}
        </Pressable>
        <Pressable
          onPress={handlePrint}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="출력하기"
          style={({ pressed }) => [
            styles.printBtn,
            pressed && styles.btnPressed,
            busy !== null && styles.btnDisabled,
          ]}>
          {busy === 'print' ? (
            <ActivityIndicator color={Palette.white} />
          ) : (
            <>
              <Ionicons name="print-outline" size={22} color={Palette.white} />
              <Text style={styles.printBtnText}>출력하기</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.hint}>
        ⬇ 사진첩에 저장해 인쇄하거나, 출력하기로 라벨 프린터에 바로 뽑을 수 있어요.
      </Text>
      <Text style={styles.url} selectable>
        {url}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Space.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Palette.textMuted,
  },
  qrBox: {
    padding: Space.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    marginVertical: Space.md,
    ...Shadow.card,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    alignSelf: 'stretch',
  },
  saveBtn: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printBtn: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    ...Shadow.button,
  },
  printBtnText: {
    color: Palette.white,
    fontSize: 18,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  hint: {
    fontSize: 14,
    lineHeight: 21,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  url: {
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
  },
});
