import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { useManuals } from '@/features/manuals/hooks';
import { manualLimit } from '@/features/subscription/limits';
import { useSubscription } from '@/features/subscription/SubscriptionContext';
import { Palette } from '@/theme/tokens';

export default function TabsLayout() {
  const router = useRouter();
  const { session } = useAuth();
  const { isPro } = useSubscription();
  const { data: manuals } = useManuals(session?.user.id);
  const atFreeLimit = (manuals?.length ?? 0) >= manualLimit(isPro);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarStyle: { backgroundColor: Palette.surface, borderTopColor: Palette.border },
        headerStyle: { backgroundColor: Palette.background },
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '내 설명서',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '촬영',
          tabBarIcon: ({ color, size }) => <Ionicons name="videocam" size={size} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push(atFreeLimit ? '/paywall' : '/record');
          },
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: '사용법',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '내 정보',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
