import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { GoogleLogo, KakaoLogo } from '@/components/SocialLogos';
import { useDialog } from '@/components/DialogProvider';
import { useAuth } from '@/features/auth/AuthContext';
import { Palette, Radius, Space } from '@/theme/tokens';

type Mode = 'signIn' | 'signUp' | 'reset';
type Sent = { kind: 'confirm' | 'reset'; email: string };

const SUBTITLE: Record<Mode, string> = {
  signIn: '한 번 찍어두면, 언제든 다시 봐요',
  signUp: '가입하고 첫 설명서를 만들어보세요',
  reset: '가입한 이메일로 재설정 링크를 보내드려요',
};

const SUBMIT_LABEL: Record<Mode, string> = {
  signIn: '로그인',
  signUp: '회원가입',
  reset: '재설정 메일 보내기',
};

export default function LoginScreen() {
  const { signIn, signUp, signInWithProvider, sendPasswordReset } = useAuth();
  const { alert } = useDialog();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [showEmail, setShowEmail] = useState(false);

  // 소셜 버튼만 먼저 보여주고, 이메일 폼은 눌렀을 때(또는 가입/재설정 모드) 펼친다.
  const emailView = showEmail || mode !== 'signIn';
  const needsPassword = mode !== 'reset';
  const passwordsMatch = mode !== 'signUp' || password === confirmPassword;
  const canSubmit =
    email.trim().length > 0 &&
    (!needsPassword || password.length >= 6) &&
    passwordsMatch &&
    !busy;

  async function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password);
      } else if (mode === 'signUp') {
        const { needsConfirm } = await signUp(email.trim(), password);
        if (needsConfirm) setSent({ kind: 'confirm', email: email.trim() });
      } else {
        await sendPasswordReset(email.trim());
        setSent({ kind: 'reset', email: email.trim() });
      }
    } catch (e) {
      alert('다시 확인해주세요', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSocial(provider: 'google' | 'kakao') {
    setBusy(true);
    try {
      await signInWithProvider(provider);
    } catch (e) {
      alert('로그인하지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    const isReset = sent.kind === 'reset';
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.mailIcon}>
            <Text style={styles.mailEmoji}>📩</Text>
          </View>
          <Text style={styles.logo}>
            {isReset ? '재설정 메일을 보냈어요' : '확인 메일을 보냈어요'}
          </Text>
          <Text style={styles.sentBody}>
            <Text style={styles.sentEmail}>{sent.email}</Text>
            {'\n'}
            {isReset
              ? '메일 링크에서 새 비밀번호를 설정한 뒤\n로그인해주세요.'
              : '메일함에서 인증 링크를 누른 뒤\n로그인해주세요.'}
          </Text>
          <Text style={styles.sentHint}>메일이 안 보이면 스팸함도 확인해주세요.</Text>
          <AppButton
            label="로그인하러 가기"
            onPress={() => {
              setSent(null);
              setPassword('');
              setMode('signIn');
            }}
            large
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.logo}>우리집 설명서</Text>
          <Text style={styles.subtitle}>{SUBTITLE[mode]}</Text>

          {!emailView ? (
            <>
              <Pressable
                onPress={() => handleSocial('kakao')}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => [styles.kakaoBtn, pressed && styles.socialPressed]}>
                <KakaoLogo size={20} />
                <Text style={styles.kakaoText}>카카오로 시작하기</Text>
              </Pressable>
              <Pressable
                onPress={() => handleSocial('google')}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => [styles.googleBtn, pressed && styles.socialPressed]}>
                <GoogleLogo size={20} />
                <Text style={styles.googleText}>Google로 시작하기</Text>
              </Pressable>
              <Text style={styles.switch} onPress={() => setShowEmail(true)}>
                이메일로 계속하기
              </Text>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="이메일"
                placeholderTextColor={Palette.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              {needsPassword && (
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호 (6자 이상)"
                  placeholderTextColor={Palette.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="password"
                />
              )}
              {mode === 'signUp' && (
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="비밀번호 확인"
                  placeholderTextColor={Palette.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="password"
                />
              )}
              {mode === 'signUp' && confirmPassword.length > 0 && !passwordsMatch && (
                <Text style={styles.mismatch}>비밀번호가 일치하지 않아요</Text>
              )}

              <AppButton
                label={SUBMIT_LABEL[mode]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={busy}
                large
              />

              {mode === 'signIn' && (
                <Text style={styles.forgot} onPress={() => setMode('reset')}>
                  비밀번호를 잊으셨나요?
                </Text>
              )}

              <Text
                style={styles.switch}
                onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
                {mode === 'signUp'
                  ? '이미 계정이 있으신가요? 로그인'
                  : mode === 'reset'
                    ? '← 로그인으로 돌아가기'
                    : '계정이 없으신가요? 회원가입'}
              </Text>

              <Text
                style={styles.forgot}
                onPress={() => {
                  setShowEmail(false);
                  setMode('signIn');
                }}>
                ← 소셜 로그인으로
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Space.lg,
    gap: Space.md,
  },
  logo: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Palette.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: Space.md,
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
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderRadius: Radius.md,
    paddingVertical: Space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
  },
  kakaoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191600',
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingVertical: Space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  socialPressed: {
    opacity: 0.85,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingVertical: Space.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.border,
  },
  dividerText: {
    fontSize: 13,
    color: Palette.textMuted,
  },
  mismatch: {
    fontSize: 13,
    color: Palette.danger,
    marginTop: -Space.xs,
    marginLeft: Space.xs,
  },
  forgot: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
    paddingTop: Space.sm,
  },
  switch: {
    fontSize: 15,
    color: Palette.primary,
    textAlign: 'center',
    paddingVertical: Space.sm,
    fontWeight: '600',
  },
  mailIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Space.sm,
  },
  mailEmoji: {
    fontSize: 44,
  },
  sentBody: {
    fontSize: 16,
    lineHeight: 24,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  sentEmail: {
    fontWeight: '700',
    color: Palette.text,
  },
  sentHint: {
    fontSize: 13,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: Space.md,
  },
});
