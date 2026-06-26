import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

/**
 * Supabase 클라이언트.
 * 로그인 세션을 유지한다: 네이티브는 AsyncStorage, 웹은 기본 localStorage.
 * 부모님 재생 화면(/v/[id])은 로그인 없이 공개로 접근하므로 anon 키만으로도 동작한다.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // 웹에서만 URL의 복구/인증 토큰을 자동 처리 (비밀번호 재설정 링크 등)
    detectSessionInUrl: Platform.OS === 'web',
  },
});
