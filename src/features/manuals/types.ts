/** 설명서 한 건. DB `manuals` 테이블과 1:1 대응 (snake_case → camelCase 매핑) */
export interface Manual {
  id: string;
  title: string;
  /** Storage 버킷 내 영상 경로 (예: "abc123.mp4") */
  videoPath: string;
  createdAt: string;
}

/** DB row 원본 (Supabase는 snake_case 반환) */
export interface ManualRow {
  id: string;
  title: string;
  video_path: string;
  created_at: string;
}

export function mapManualRow(row: ManualRow): Manual {
  return {
    id: row.id,
    title: row.title,
    videoPath: row.video_path,
    createdAt: row.created_at,
  };
}

export interface CreateManualInput {
  title: string;
  /** 녹화된 로컬 영상 파일 URI (file:// 또는 blob:) */
  videoUri: string;
}
