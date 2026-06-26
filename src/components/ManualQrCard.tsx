import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useDialog } from '@/components/DialogProvider';
import { Palette, Radius, Shadow, Space, Type } from '@/theme/tokens';

/** react-native-qrcode-svg가 getRef로 넘겨주는 인스턴스 (PNG base64 추출용) */
interface QrCodeRef {
  toDataURL: (callback: (base64: string) => void) => void;
}

/** 인쇄용 라벨 HTML — 제목 + QR + 안내문을 테두리 카드로 깔끔하게 */
function buildLabelHtml(title: string, base64: string): string {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;background:#fff;">
    <div style="box-sizing:border-box;width:320px;padding:28px 24px;border:3px solid #2B8AEF;border-radius:28px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#1F2328;letter-spacing:-0.5px;margin-bottom:18px;">${safeTitle}</div>
      <img src="data:image/png;base64,${base64}" style="width:240px;height:240px;" />
      <div style="margin-top:18px;font-size:17px;font-weight:700;color:#2B8AEF;">📱 휴대폰으로 QR을 찍어보세요</div>
      <div style="margin-top:4px;font-size:14px;color:#6B7280;">설명 영상이 바로 나와요</div>
    </div>
  </body></html>`;
}

/**
 * 설명서 하나의 QR 카드(제목 + QR + 재생 URL) + 액션.
 * - 다운로드(⬇): QR 이미지를 사진첩에 저장 → 유저가 알아서 인쇄
 * - 출력하기: 시스템 인쇄창으로 바로 출력 (라벨/일반 프린터)
 * 저장 완료 화면과 "QR 다시 보기" 화면에서 공통으로 쓴다.
 */
export function ManualQrCard({ title, url }: { title: string; url: string }) {
  const qrRef = useRef<QrCodeRef | null>(null);
  const [busy, setBusy] = useState<null | 'save' | 'print' | 'share'>(null);
  const { alert } = useDialog();

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
        alert('권한 필요', '사진 저장 권한을 허용해주세요.');
        return;
      }
      const base64 = await getQrBase64();
      const fileUri = `${FileSystem.cacheDirectory}woorijip-qr.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await MediaLibrary.saveToLibraryAsync(fileUri);
      alert('저장 완료', 'QR 이미지를 사진첩에 저장했어요.');
    } catch (e) {
      alert('저장 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    if (busy) return;
    setBusy('print');
    try {
      const base64 = await getQrBase64();
      await Print.printAsync({ html: buildLabelHtml(title, base64) });
    } catch (e) {
      alert('출력 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy('share');
    try {
      await Share.share({
        message: `📺 "${title}" 설명 영상이에요.\n아래 링크를 누르면 바로 볼 수 있어요.\n${url}`,
      });
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우는 무시
      if (e instanceof Error && !/cancel/i.test(e.message)) {
        alert('공유 실패', e.message);
      }
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
            styles.iconBtn,
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
          onPress={handleShare}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="링크 공유"
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.btnPressed,
            busy !== null && styles.btnDisabled,
          ]}>
          {busy === 'share' ? (
            <ActivityIndicator color={Palette.primary} />
          ) : (
            <Ionicons name="share-social-outline" size={24} color={Palette.primary} />
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
    fontSize: Type.title,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Type.body,
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
  iconBtn: {
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
  url: {
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
  },
});
