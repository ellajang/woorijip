import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useDialog } from '@/components/DialogProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { deleteAccount } from '@/features/manuals/api';
import { Palette, Radius, Space, Type } from '@/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { confirm, alert } = useDialog();

  async function handleLogout() {
    const ok = await confirm({
      title: '로그아웃',
      message: '로그아웃 할까요?',
      confirmLabel: '로그아웃',
      destructive: true,
    });
    if (!ok) return;
    try {
      await signOut();
      router.replace('/login');
    } catch (e) {
      alert('로그아웃 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    }
  }

  async function handleDeleteAccount() {
    const ok = await confirm({
      title: '계정 삭제',
      message: '모든 영상이 삭제되고 붙여둔 QR도 다 멈춰요. 되돌릴 수 없어요.',
      confirmLabel: '계정 삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteAccount();
      await signOut();
      router.replace('/login');
    } catch (e) {
      alert('계정 삭제 실패', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>계정</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>로그인 계정</Text>
          <Text style={styles.cardValue}>{session?.user.email ?? '-'}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="로그아웃" variant="secondary" onPress={handleLogout} />
        <Text style={styles.deleteAccount} onPress={handleDeleteAccount}>
          계정 삭제
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    padding: Space.lg,
    gap: Space.sm,
  },
  sectionLabel: {
    fontSize: Type.caption,
    fontWeight: '700',
    color: Palette.textMuted,
    marginBottom: Space.xs,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
    gap: Space.xs,
  },
  cardLabel: {
    fontSize: Type.caption,
    color: Palette.textMuted,
  },
  cardValue: {
    fontSize: Type.headline,
    fontWeight: '600',
    color: Palette.text,
  },
  footer: {
    padding: Space.lg,
    gap: Space.md,
  },
  deleteAccount: {
    fontSize: 14,
    color: Palette.danger,
    textAlign: 'center',
    paddingVertical: Space.sm,
    fontWeight: '600',
  },
});
