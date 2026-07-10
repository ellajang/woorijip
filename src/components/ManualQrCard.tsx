import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { useDialog } from '@/components/DialogProvider';
import { Palette, Radius, Shadow, Space, Type } from '@/theme/tokens';

/** react-native-qrcode-svg가 getRef로 넘겨주는 인스턴스 (PNG base64 추출용) */
interface QrCodeRef {
  toDataURL: (callback: (base64: string) => void) => void;
}

/**
 * 인쇄용 라벨 HTML — 제목 + QR + 안내문을 테두리 카드로.
 * 종이 위 실제 크기를 예측 가능하게 cm 단위로 고정 (카드 약 6.5×8cm, QR 약 4cm).
 * 스티커로 붙이기 좋고, QR 4cm면 팔 뻗은 거리에서도 잘 스캔됨.
 */
function buildLabelHtml(title: string, base64: string): string {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    @page { margin: 0.6cm; }
    * { box-sizing: border-box; }
    body { margin:0; font-family:-apple-system,'Apple SD Gothic Neo',sans-serif; }
    .card { width:6.5cm; padding:0.5cm 0.4cm; border:2px solid #2B8AEF; border-radius:0.5cm; text-align:center; }
    .t { font-size:15pt; font-weight:800; color:#1F2328; letter-spacing:-0.3px; margin-bottom:0.3cm; line-height:1.2; }
    .q { width:4cm; height:4cm; }
    .h1 { margin-top:0.3cm; font-size:11pt; font-weight:700; color:#2B8AEF; }
    .h2 { margin-top:0.1cm; font-size:9pt; color:#6B7280; }
  </style></head>
  <body>
    <div class="card">
      <div class="t">${safeTitle}</div>
      <img class="q" src="data:image/png;base64,${base64}" />
      <div class="h1">📱 휴대폰으로 QR을 찍어보세요</div>
      <div class="h2">설명 영상이 바로 나와요</div>
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
  const cardRef = useRef<View | null>(null);
  const [busy, setBusy] = useState<null | 'save' | 'print' | 'share'>(null);
  // 투명 배경 저장: 카드 바깥만 투명, QR 뒤 흰색은 유지(스캔 보장)
  const [transparentBg, setTransparentBg] = useState(false);
  const { alert } = useDialog();

  /** 현재 QR을 PNG base64로 추출 (인쇄 HTML에 넣을 용도) */
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
      if (!cardRef.current) throw new Error('카드가 아직 준비되지 않았어요.');
      // 제목+QR+안내가 든 카드 View를 통째로 이미지로 캡처 → 사진첩에 저장.
      // 카드 배경이 투명하면(transparentBg) png가 알파를 그대로 보존한다.
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      alert(
        '저장 완료',
        transparentBg
          ? '투명 배경 카드를 사진첩에 저장했어요.'
          : '제목과 QR이 담긴 카드를 사진첩에 저장했어요.',
      );
    } catch (e) {
      alert('저장하지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
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
      alert('출력하지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
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
        alert('공유하지 못했어요', e.message);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.subtitle}>이 QR을 제품에 붙여주세요</Text>

      {/* 사진첩에 저장/인쇄되는 카드 그대로의 미리보기 (cardRef로 캡처) */}
      <View
        ref={cardRef}
        collapsable={false}
        style={[styles.card, transparentBg && styles.cardTransparent]}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.qrBox}>
          <QRCode value={url} size={200} getRef={(c: QrCodeRef | null) => (qrRef.current = c)} />
        </View>
        <Text style={styles.cardHint1}>📱 휴대폰으로 QR을 찍어보세요</Text>
        <Text style={styles.cardHint2}>설명 영상이 바로 나와요</Text>
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

      <Pressable
        onPress={() => setTransparentBg((v) => !v)}
        disabled={busy !== null}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: transparentBg }}
        style={styles.toggleRow}>
        <Ionicons
          name={transparentBg ? 'checkbox' : 'square-outline'}
          size={20}
          color={transparentBg ? Palette.primary : Palette.textMuted}
        />
        <Text style={styles.toggleLabel}>투명 배경으로 저장 (QR 뒤는 흰색 유지)</Text>
      </Pressable>

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
  subtitle: {
    fontSize: Type.body,
    color: Palette.textMuted,
  },
  // 저장/인쇄되는 라벨 카드 (스티커 미리보기 겸용)
  card: {
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 2,
    borderColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingVertical: Space.lg,
    paddingHorizontal: Space.md,
    gap: Space.sm,
    alignSelf: 'stretch',
    ...Shadow.card,
  },
  cardTransparent: {
    backgroundColor: 'transparent',
    // 투명 저장 시 그림자는 알파에 얼룩으로 남을 수 있어 제거
    shadowOpacity: 0,
    elevation: 0,
  },
  cardTitle: {
    fontSize: Type.title,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Palette.text,
    textAlign: 'center',
    marginBottom: Space.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    alignSelf: 'center',
    paddingVertical: Space.xs,
  },
  toggleLabel: {
    fontSize: 13,
    color: Palette.textMuted,
  },
  cardHint1: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
    textAlign: 'center',
    marginTop: Space.xs,
  },
  cardHint2: {
    fontSize: 13,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  qrBox: {
    padding: Space.sm,
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
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
