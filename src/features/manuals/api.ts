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
export async function createManual({ title, videoUri }: CreateManualInput): Promise<Manual> {
  const id = randomUUID();
  const videoPath = `${id}.mp4`;

  const body = await readVideoForUpload(videoUri);
  const { error: uploadError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(videoPath, body, { contentType: 'video/mp4', upsert: false });

  if (uploadError) {
    throw new Error(`영상 업로드 실패: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from('manuals')
    .insert({ id, title, video_path: videoPath })
    .select()
    .single<ManualRow>();

  if (error || !data) {
    // 메타데이터 저장 실패 시 업로드한 영상도 정리
    await supabase.storage.from(VIDEO_BUCKET).remove([videoPath]);
    throw new Error(`설명서 저장 실패: ${error?.message ?? 'unknown'}`);
  }

  return mapManualRow(data);
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

export async function listManuals(): Promise<Manual[]> {
  const { data, error } = await supabase
    .from('manuals')
    .select()
    .order('created_at', { ascending: false })
    .returns<ManualRow[]>();

  if (error) {
    throw new Error(`목록 조회 실패: ${error.message}`);
  }
  return (data ?? []).map(mapManualRow);
}

/** Storage 경로 → 공개 재생 URL */
export function getVideoPublicUrl(videoPath: string): string {
  const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(videoPath);
  return data.publicUrl;
}
