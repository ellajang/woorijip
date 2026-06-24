import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from '@/lib/queryClient';
import { Palette } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Palette.background },
          headerTintColor: Palette.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Palette.background },
        }}>
        <Stack.Screen name="index" options={{ title: '우리집 설명서' }} />
        <Stack.Screen name="record" options={{ title: '설명 영상 촬영' }} />
        <Stack.Screen name="save" options={{ title: '설명서 저장' }} />
        <Stack.Screen name="qr/[id]" options={{ title: 'QR 코드' }} />
        <Stack.Screen name="v/[id]" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
