import { randomUUID } from 'expo-crypto';

import { R2_PUBLIC_URL } from '@/lib/config';
import { supabase } from '@/lib/supabase';

import { uploadVideoToUrl } from './videoUpload';
import { CreateManualInput, Manual, ManualRow, mapManualRow } from './types';

/** R2 업로드/삭제용 presigned URL을 Edge Function에서 받아 key→url 맵으로 돌려준다. */
async function getPresignedUrls(
  keys: string[],
  method: 'PUT' | 'DELETE',
): Promise<Record<string, string>> {
  const { data, error } = await supabase.functions.invoke('r2-presign', {
    body: { keys, method },
  });
  if (error) {
    throw new Error(`업로드 준비 실패: ${error.message}`);
  }
  const urls = (data as { urls?: { key: string; url: string }[] })?.urls ?? [];
  const map: Record<string, string> = {};
  for (const u of urls) map[u.key] = u.url;
  return map;
}

/** R2에서 영상 파일들을 삭제한다 (presigned DELETE). 실패해도 조용히 넘어간다. */
async function removeR2Objects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    const delUrls = await getPresignedUrls(keys, 'DELETE');
    await Promise.all(
      keys.map(async (key) => {
        const url = delUrls[key];
        if (!url) return;
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
export async function createManual({
  title,
  videoUris,
  captions,
  onProgress,
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

  const id = randomUUID();
  const keys = videoUris.map((_, i) => `${id}-${i}.mp4`);
  const videoPaths: string[] = [];

  onProgress?.(0, videoUris.length);

  // 업로드용 임시 URL 일괄 발급
  const putUrls = await getPresignedUrls(keys, 'PUT');

  // 클립을 순서대로 업로드. 중간 실패 시 지금까지 올린 것 정리.
  for (let i = 0; i < videoUris.length; i++) {
    const key = keys[i];
    const url = putUrls[key];
    if (!url) {
      if (videoPaths.length > 0) await removeR2Objects(videoPaths);
      throw new Error('업로드 URL을 받지 못했어요.');
    }
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
    })
    .select()
    .single<ManualRow>();

  if (error || !data) {
    await removeR2Objects(videoPaths);
    throw new Error(`설명서 저장 실패: ${error?.message ?? 'unknown'}`);
  }

  return mapManualRow(data);
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

  const { error } = await supabase.from('manuals').delete().eq('id', id);
  if (error) {
    throw new Error(`삭제 실패: ${error.message}`);
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
