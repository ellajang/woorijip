import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ONBOARDING_KEY } from '@/app/onboarding';

import { AppButton } from '@/components/AppButton';
import { useDialog } from '@/components/DialogProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { useDeleteManual, useManuals } from '@/features/manuals/hooks';
import { Manual } from '@/features/manuals/types';
import { FREE_MANUALS, manualLimit } from '@/features/subscription/limits';
import { useSubscription } from '@/features/subscription/SubscriptionContext';
import { isSupabaseConfigured } from '@/lib/config';
import { Palette, Radius, Shadow, Space, Type } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { confirm, alert } = useDialog();
  const { isPro } = useSubscription();
  const configured = isSupabaseConfigured();
  const { data: manuals, isLoading, isError, error, refetch } = useManuals(session?.user.id);
  const deleteManual = useDeleteManual();

  // 첫 실행이면 온보딩 한 번 보여주기
  const onboardingChecked = useRef(false);
  useEffect(() => {
    if (onboardingChecked.current) return;
    onboardingChecked.current = true;
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      if (!v) router.push('/onboarding');
    });
  }, [router]);

  const count = manuals?.length ?? 0;
  const atFreeLimit = count >= manualLimit(isPro);

  function guardCreate(proceed: () => void) {
    if (atFreeLimit) {
      router.push('/paywall');
      return;
    }
    proceed();
  }

  async function handleDelete(manual: Manual) {
    const ok = await confirm({
      title: '설명서 삭제',
      message: '영상이 지워지고, 붙여둔 QR 스티커도 더 이상 안 열려요.',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    deleteManual.mutate(
      { id: manual.id, videoPaths: manual.videoPaths },
      { onError: (e) => alert('삭제 실패', e.message) },
    );
  }

  async function handlePickVideo() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: true,
        videoMaxDuration: 600,
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map((a) => a.uri);
        router.push({ pathname: '/save', params: { clipsJson: JSON.stringify(uris) } });
      }
    } catch (e) {
      alert('영상 가져오기 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>우리집 설명서</Text>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="설정">
          <Ionicons name="options-outline" size={26} color={Palette.primary} />
        </Pressable>
      </View>
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
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.usage}>
          {isPro ? 'Pro · 무제한' : `무료 ${count}/${FREE_MANUALS}개 사용 중`}
        </Text>
        <AppButton
          label="직접 촬영하기"
          onPress={() => guardCreate(() => router.push('/record'))}
          large
          disabled={!configured}
        />
        <Text style={styles.galleryLink} onPress={() => guardCreate(handlePickVideo)}>
          갤러리에서 영상 가져오기
        </Text>
      </View>
    </SafeAreaView>
  );
}

function ManualRow({
  manual,
  onPress,
  onShowQr,
  onDelete,
}: {
  manual: Manual;
  onPress: () => void;
  onShowQr: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}>
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
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="설명서 삭제"
        hitSlop={8}
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.rowPressed]}>
        <Ionicons name="trash-outline" size={20} color={Palette.danger} />
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyEmoji}>🎬</Text>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    paddingBottom: Space.sm,
  },
  headerTitle: {
    fontSize: Type.title,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Palette.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md,
    padding: Space.lg,
  },
  listContent: {
    padding: Space.lg,
    gap: Space.md,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    padding: Space.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  rowPressed: {
    opacity: 0.6,
  },
  qrBtn: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primarySoft,
  },
  qrBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryLink: {
    fontSize: 15,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingVertical: Space.sm,
    fontWeight: '600',
  },
  usage: {
    fontSize: Type.caption,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: Type.headline,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: Palette.text,
  },
  rowDate: {
    marginTop: 4,
    fontSize: Type.caption,
    color: Palette.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    paddingVertical: Space.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.sm,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: Type.title,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Palette.text,
  },
  emptyBody: {
    fontSize: Type.body,
    lineHeight: 24,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  footer: {
    padding: Space.md,
    gap: Space.sm,
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
