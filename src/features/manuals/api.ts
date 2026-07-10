import { getRandomBytes } from 'expo-crypto';

import { R2_PUBLIC_URL } from '@/lib/config';
import { supabase } from '@/lib/supabase';

// 공유 URL용 설명서 ID: "형용사-명사-꼬리2자" (예: warm-tv-k3). 읽기 쉽고 URL에서 안 깨짐.
const ID_ADJECTIVES = [
  'warm', 'cozy', 'happy', 'bright', 'gentle', 'kind', 'calm', 'sunny', 'clear', 'easy',
  'soft', 'cool', 'neat', 'fresh', 'smart', 'quiet', 'lucky', 'merry', 'sweet', 'brave',
  'tidy', 'jolly', 'snug', 'shiny', 'lively',
];
const ID_NOUNS = [
  'home', 'room', 'note', 'guide', 'video', 'radio', 'lamp', 'clock', 'door', 'book',
  'star', 'cloud', 'leaf', 'bird', 'tree', 'moon', 'desk', 'cup', 'plant', 'photo',
  'key', 'box', 'card', 'bell', 'nest',
];
// 꼬리 문자: 헷갈리는 0/o/1/l/i 제외
const ID_SUFFIX = '23456789abcdefghijkmnpqrstuvwxyz';

/** 읽기 쉬운 공유 ID 생성 (예: warm-tv-k3). 25×25×32² ≈ 64만 조합 → 충돌 사실상 없음. */
function shortId(): string {
  const b = getRandomBytes(4);
  const adj = ID_ADJECTIVES[b[0] % ID_ADJECTIVES.length];
  const noun = ID_NOUNS[b[1] % ID_NOUNS.length];
  const suffix = ID_SUFFIX[b[2] % ID_SUFFIX.length] + ID_SUFFIX[b[3] % ID_SUFFIX.length];
  return `${adj}-${noun}-${suffix}`;
}

import { uploadVideoToUrl } from './videoUpload';
import { CreateManualInput, Manual, ManualRow, mapManualRow } from './types';

/**
 * R2 업로드/삭제용 presigned URL을 Edge Function에서 받는다.
 * 서버가 키를 "userId/파일명"으로 강제하므로, 반환된 key(전체 경로)를 그대로 저장/사용한다.
 * 입력 순서와 동일한 순서로 반환된다.
 */
async function getPresignedUrls(
  keys: string[],
  method: 'PUT' | 'DELETE',
): Promise<{ key: string; url: string }[]> {
  const { data, error } = await supabase.functions.invoke('r2-presign', {
    body: { keys, method },
  });
  if (error) {
    throw new Error(`업로드 준비 실패: ${error.message}`);
  }
  return (data as { urls?: { key: string; url: string }[] })?.urls ?? [];
}

/** R2에서 영상 파일들을 삭제한다 (presigned DELETE). 실패해도 조용히 넘어간다. */
async function removeR2Objects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    const presigned = await getPresignedUrls(keys, 'DELETE');
    await Promise.all(
      presigned.map(async ({ url }) => {
        try {
          await fetch(url, { method: 'DELETE' });
        } catch {
          // 개별 삭제 실패는 무시 (고아 파일은 추후 정리)
        }
      }),
    );
  } catch {
    // presign 실패해도 상위 흐름은 계속
  }
}

/**
 * 설명서를 생성한다.
 * 1) 클라이언트에서 id 발급 → 영상 파일명/DB id로 동시 사용
 * 2) 영상을 R2에 직접 업로드 (임시 URL)
 * 3) 메타데이터 row 삽입 (video_paths엔 파일명만 저장)
 * 업로드 성공 후에만 row를 만들어 "영상 없는 설명서"가 남지 않게 한다.
 */
/** 무료 설명서 보관 기간(일). 지나면 cleanup-expired가 자동 삭제. */
const FREE_TTL_DAYS = 30;

export async function createManual({
  title,
  videoUris,
  captions,
  onProgress,
  isPro,
}: CreateManualInput): Promise<Manual> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('로그인이 필요해요.');
  }
  if (videoUris.length === 0) {
    throw new Error('영상이 없어요.');
  }

  const id = shortId();
  const baseNames = videoUris.map((_, i) => `${id}-${i}.mp4`);
  const videoPaths: string[] = [];

  onProgress?.(0, videoUris.length);

  // 업로드용 임시 URL 일괄 발급 (서버가 userId/파일명 전체 키를 반환, 입력 순서 유지)
  const presigned = await getPresignedUrls(baseNames, 'PUT');
  if (presigned.length !== videoUris.length) {
    throw new Error('업로드 URL 발급에 실패했어요.');
  }

  // 클립을 순서대로 업로드. 중간 실패 시 지금까지 올린 것 정리.
  for (let i = 0; i < videoUris.length; i++) {
    const { key, url } = presigned[i];
    try {
      await uploadVideoToUrl(videoUris[i], url);
    } catch (e) {
      if (videoPaths.length > 0) await removeR2Objects(videoPaths);
      throw e instanceof Error ? e : new Error('영상 업로드 실패');
    }
    videoPaths.push(key);
    onProgress?.(i + 1, videoUris.length);
  }

  const { data, error } = await supabase
    .from('manuals')
    .insert({
      id,
      title,
      video_path: videoPaths[0],
      video_paths: videoPaths,
      captions: (captions ?? []).map((c) => c.trim()),
      user_id: user.id,
      expires_at: isPro
        ? null
        : new Date(Date.now() + FREE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single<ManualRow>();

  if (error || !data) {
    await removeR2Objects(videoPaths);
    throw new Error(`설명서 저장 실패: ${error?.message ?? 'unknown'}`);
  }

  return mapManualRow(data);
}

/** Pro 전환 시: 내 모든 설명서의 자동삭제(만료)를 해제한다. RLS로 본인 것만. */
export async function keepMyManualsForever(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('manuals').update({ expires_at: null }).eq('user_id', user.id);
}

/** 내 설명서 제목 수정. RLS로 본인 것만 가능. */
export async function updateManualTitle({
  id,
  title,
}: {
  id: string;
  title: string;
}): Promise<void> {
  const { data, error } = await supabase
    .from('manuals')
    .update({ title })
    .eq('id', id)
    .select();
  if (error) {
    throw new Error(`제목 수정 실패: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error('수정할 수 없어요. (내 설명서가 아니거나 로그인이 만료됐어요)');
  }
}

export async function getManual(id: string): Promise<Manual | null> {
  const { data, error } = await supabase
    .from('manuals')
    .select()
    .eq('id', id)
    .maybeSingle<ManualRow>();

  if (error) {
    throw new Error(`설명서 조회 실패: ${error.message}`);
  }
  return data ? mapManualRow(data) : null;
}

/** 로그인한 사용자 본인의 설명서만 조회 */
export async function listManuals(userId: string): Promise<Manual[]> {
  const { data, error } = await supabase
    .from('manuals')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<ManualRow[]>();

  if (error) {
    throw new Error(`목록 조회 실패: ${error.message}`);
  }
  return (data ?? []).map(mapManualRow);
}

/** 내 설명서 삭제 (영상 파일 + DB row). RLS로 본인 것만 가능. */
export async function deleteManual({
  id,
  videoPaths,
}: {
  id: string;
  videoPaths: string[];
}): Promise<void> {
  // 영상 파일들 먼저 제거 (실패해도 row 삭제는 진행 — 고아 파일은 추후 정리)
  await removeR2Objects(videoPaths);

  const { data, error } = await supabase.from('manuals').delete().eq('id', id).select();
  if (error) {
    throw new Error(`삭제 실패: ${error.message}`);
  }
  // RLS로 막히면 에러 없이 0건 삭제됨 → 명시적으로 알린다.
  if (!data || data.length === 0) {
    throw new Error('삭제할 수 없어요. (내 설명서가 아니거나 로그인이 만료됐어요)');
  }
}

/**
 * 계정 + 내 모든 데이터 삭제.
 * auth.users 삭제는 권한상 클라이언트에서 불가 → Edge Function(service_role)이 처리.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) {
    throw new Error(`계정 삭제 실패: ${error.message}`);
  }
}

/** 저장된 영상 경로 → 공개 재생 URL (R2). 구 데이터가 전체 URL이면 그대로 사용. */
export function getVideoPublicUrl(videoPath: string): string {
  if (/^https?:\/\//.test(videoPath)) return videoPath;
  return `${R2_PUBLIC_URL}/${videoPath}`;
}
