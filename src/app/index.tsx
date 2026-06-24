import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useManuals } from '@/features/manuals/hooks';
import { Manual } from '@/features/manuals/types';
import { isSupabaseConfigured } from '@/lib/config';
import { Palette, Radius, Space } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const { data: manuals, isLoading, isError, error, refetch } = useManuals();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {!configured && <ConfigNotice />}

      {isLoading && configured ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>목록을 불러오지 못했어요.</Text>
          <Text style={styles.errorDetail}>{error?.message}</Text>
          <AppButton label="다시 시도" onPress={() => refetch()} variant="secondary" />
        </View>
      ) : (
        <FlatList
          data={manuals ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item }) => (
            <ManualRow
              manual={item}
              onPress={() => router.push(`/v/${item.id}`)}
              onShowQr={() => router.push(`/qr/${item.id}`)}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <AppButton
          label="+ 새 설명서 만들기"
          onPress={() => router.push('/record')}
          large
          disabled={!configured}
        />
      </View>
    </SafeAreaView>
  );
}

function ManualRow({
  manual,
  onPress,
  onShowQr,
}: {
  manual: Manual;
  onPress: () => void;
  onShowQr: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}>
        <View style={styles.rowIcon}>
          <Text style={styles.rowIconText}>▶</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {manual.title}
          </Text>
          <Text style={styles.rowDate}>{formatDate(manual.createdAt)}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onShowQr}
        accessibilityRole="button"
        accessibilityLabel="QR 코드 보기"
        style={({ pressed }) => [styles.qrBtn, pressed && styles.rowPressed]}>
        <Text style={styles.qrBtnText}>QR</Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>아직 만든 설명서가 없어요</Text>
      <Text style={styles.emptyBody}>
        부모님께 설명할 영상을 찍고{'\n'}QR을 만들어 제품에 붙여보세요.
      </Text>
    </View>
  );
}

function ConfigNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>
        Supabase 환경변수가 설정되지 않았어요. {'\n'}
        .env 파일에 EXPO_PUBLIC_SUPABASE_URL / ANON_KEY를 넣어주세요.
      </Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md,
    padding: Space.lg,
  },
  listContent: {
    padding: Space.md,
    gap: Space.sm,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    padding: Space.md,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  qrBtn: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.sm,
    backgroundColor: '#EAF3FE',
  },
  qrBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    color: Palette.white,
    fontSize: 18,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Palette.text,
  },
  rowDate: {
    marginTop: 2,
    fontSize: 13,
    color: Palette.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    paddingVertical: Space.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  footer: {
    padding: Space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
  },
  errorText: {
    fontSize: 17,
    fontWeight: '600',
    color: Palette.text,
  },
  errorDetail: {
    fontSize: 13,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  notice: {
    backgroundColor: '#FFF4E5',
    padding: Space.md,
  },
  noticeText: {
    color: '#8A5A00',
    fontSize: 13,
    lineHeight: 19,
  },
});
