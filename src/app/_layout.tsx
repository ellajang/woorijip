import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DialogProvider } from '@/components/DialogProvider';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { SubscriptionProvider } from '@/features/subscription/SubscriptionContext';
import { queryClient } from '@/lib/queryClient';
import { Palette } from '@/theme/tokens';

/** 로그인 없이 접근 가능한 최상위 세그먼트 (부모님 QR 재생 + 로그인/비번재설정 화면) */
const PUBLIC_SEGMENTS = ['v', 'login', 'reset'];

function useAuthGuard() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_SEGMENTS.includes(segments[0] ?? '');
    if (!session && !isPublic) {
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      router.replace('/');
    }
  }, [session, isLoading, segments, router]);
}

function RootNavigator() {
  useAuthGuard();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Palette.background },
        headerTintColor: Palette.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Palette.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="reset" options={{ title: '비밀번호 재설정' }} />
      <Stack.Screen name="record" options={{ title: '설명 영상 촬영' }} />
      <Stack.Screen name="save" options={{ title: '설명서 저장' }} />
      <Stack.Screen name="qr/[id]" options={{ title: 'QR 코드' }} />
      <Stack.Screen name="paywall" options={{ title: 'Pro', presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="v/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <DialogProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </DialogProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
