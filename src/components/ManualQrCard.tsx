import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Palette, Radius, Space } from '@/theme/tokens';

export function ManualQrCard({ title, url }: { title: string; url: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>이 QR을 제품에 붙여주세요</Text>

      <View style={styles.qrBox}>
        <QRCode value={url} size={220} />
      </View>

      <Text style={styles.hint}>
        부모님이 이 QR을 카메라로 찍으면{'\n'}설명 영상이 바로 재생돼요.
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
    borderWidth: 1,
    borderColor: Palette.border,
    marginVertical: Space.md,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  url: {
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
  },
});
