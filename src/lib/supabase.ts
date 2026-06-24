import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

/**
 * Supabase 클라이언트.
 * MVP 단계에선 로그인이 없으므로 세션 영속화는 끄되,
 * 추후 Auth 도입 시 네이티브는 AsyncStorage, 웹은 기본 localStorage를 쓰도록 구성해 둔다.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
