import { randomUUID } from 'expo-crypto';

import { VIDEO_BUCKET } from '@/lib/config';
import { supabase } from '@/lib/supabase';

import { readVideoForUpload } from './videoUpload';
import { CreateManualInput, Manual, ManualRow, mapManualRow } from './types';

/**
 * 설명서를 생성한다.
 * 1) 클라이언트에서 id 발급 → 영상 파일명/DB id로 동시 사용
 * 2) 영상을 Storage에 업로드
 * 3) 메타데이터 row 삽입
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
  const videoPaths: string[] = [];

  onProgress?.(0, videoUris.length);

  // 클립을 순서대로 업로드. 중간 실패 시 지금까지 올린 것 정리.
  for (let i = 0; i < videoUris.length; i++) {
    const path = `${id}-${i}.mp4`;
    const body = await readVideoForUpload(videoUris[i]);
    const { error: uploadError } = await supabase.storage
      .from(VIDEO_BUCKET)
      .upload(path, body, { contentType: 'video/mp4', upsert: false });
    if (uploadError) {
      if (videoPaths.length > 0) await supabase.storage.from(VIDEO_BUCKET).remove(videoPaths);
      throw new Error(`영상 업로드 실패: ${uploadError.message}`);
    }
    videoPaths.push(path);
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
    await supabase.storage.from(VIDEO_BUCKET).remove(videoPaths);
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
  if (videoPaths.length > 0) {
    await supabase.storage.from(VIDEO_BUCKET).remove(videoPaths);
  }

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

/** Storage 경로 → 공개 재생 URL */
export function getVideoPublicUrl(videoPath: string): string {
  const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(videoPath);
  return data.publicUrl;
}
