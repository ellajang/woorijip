import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Provider, Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { passwordResetUrl } from '@/lib/config';
import { supabase } from '@/lib/supabase';

// 브라우저에서 인증 후 앱으로 돌아올 때 세션을 마무리한다.
WebBrowser.maybeCompleteAuthSession();

/** 소셜 로그인 후 앱으로 돌아오는 리다이렉트 주소 (예: woorijip://) */
const oauthRedirect = makeRedirectUri({ scheme: 'woorijip' });

/** 콜백 URL에서 토큰/코드 파라미터를 추출 (query와 hash 둘 다 처리) */
function parseAuthParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const hash = url.includes('#') ? url.split('#')[1] : '';
  for (const part of [query, hash]) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [k, v] = pair.split('=');
      out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    }
  }
  return out;
}

type SocialProvider = Extract<Provider, 'google' | 'kakao'>;

interface AuthValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirm: boolean }>;
  signInWithProvider: (provider: SocialProvider) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Supabase 인증 에러(영문)를 사용자 친화 한국어 메시지로 바꾼다. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials'))
    return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (m.includes('email not confirmed'))
    return '이메일 인증이 필요해요. 메일함을 확인해주세요.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return '이미 가입된 이메일이에요. 로그인해주세요.';
  if (m.includes('password') && (m.includes('6') || m.includes('at least')))
    return '비밀번호는 6자 이상이어야 해요.';
  if (m.includes('unable to validate email') || m.includes('invalid format'))
    return '이메일 형식이 올바르지 않아요.';
  if (m.includes('rate limit') || m.includes('for security purposes'))
    return '요청이 너무 잦아요. 잠시 후 다시 시도해주세요.';
  return '문제가 생겼어요. 잠시 후 다시 시도해주세요.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      isLoading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(friendlyAuthError(error.message));
      },
      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(friendlyAuthError(error.message));
        // 이메일 확인이 켜져 있으면 세션이 바로 생기지 않는다.
        return { needsConfirm: !data.session };
      },
      async signInWithProvider(provider) {
        // 1) 제공자 인증 URL 발급
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: oauthRedirect, skipBrowserRedirect: true },
        });
        if (error) throw new Error(friendlyAuthError(error.message));
        if (!data?.url) throw new Error('로그인을 시작하지 못했어요.');

        // 2) 브라우저로 로그인 → 앱으로 리다이렉트
        const result = await WebBrowser.openAuthSessionAsync(data.url, oauthRedirect);
        if (result.type !== 'success') return; // 사용자가 창을 닫음

        // 3) 콜백에서 세션 완성 (PKCE=code, implicit=token 둘 다 대응)
        const params = parseAuthParams(result.url);
        if (params.error_description) throw new Error(params.error_description);
        if (params.code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exErr) throw new Error(friendlyAuthError(exErr.message));
        } else if (params.access_token && params.refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (setErr) throw new Error(friendlyAuthError(setErr.message));
        } else {
          throw new Error('로그인 정보를 받지 못했어요. 다시 시도해주세요.');
        }
      },
      async signOut() {
        // 로컬 세션만 즉시 정리한다. 'global'은 서버 토큰 폐기 호출이 실패하면
        // 로컬 세션이 안 지워져 로그아웃이 먹통이 될 수 있다.
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw new Error(error.message);
        // onAuthStateChange 이벤트 타이밍에 의존하지 않고 상태를 즉시 반영한다.
        setSession(null);
      },
      async sendPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: passwordResetUrl(),
        });
        if (error) throw new Error(friendlyAuthError(error.message));
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(friendlyAuthError(error.message));
      },
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
