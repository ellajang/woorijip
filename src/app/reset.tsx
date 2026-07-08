import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useDialog } from '@/components/DialogProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { Palette, Radius, Space } from '@/theme/tokens';

/**
 * 비밀번호 재설정 메일 링크가 도착하는 화면 (주로 웹).
 * 웹에서는 detectSessionInUrl로 복구 세션이 만들어진 상태이므로 바로 새 비밀번호를 설정한다.
 */
export default function ResetScreen() {
  const router = useRouter();
  const { updatePassword, signOut } = useAuth();
  const { alert } = useDialog();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = password.length >= 6 && !busy;

  async function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await updatePassword(password);
      await signOut();
      setDone(true);
    } catch (e) {
      alert('변경하지 못했어요', e instanceof Error ? e.message : '재설정 링크를 다시 열어주세요.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>비밀번호가 변경됐어요</Text>
          <Text style={styles.body}>새 비밀번호로 로그인해주세요.</Text>
          <AppButton label="로그인하러 가기" onPress={() => router.replace('/login')} large />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>새 비밀번호 설정</Text>
        <Text style={styles.body}>사용할 새 비밀번호를 입력해주세요.</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="새 비밀번호 (6자 이상)"
          placeholderTextColor={Palette.textMuted}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />
        <AppButton
          label="비밀번호 변경"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={busy}
          large
        />
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
    flex: 1,
    justifyContent: 'center',
    padding: Space.lg,
    gap: Space.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Palette.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: Space.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.md,
    fontSize: 17,
    color: Palette.text,
    backgroundColor: Palette.surface,
  },
});
