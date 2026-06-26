/** 설명서 한 건. 여러 클립(장면)을 순서대로 가진다. DB `manuals` 테이블과 대응. */
export interface Manual {
  id: string;
  title: string;
  /** Storage 내 영상 클립 경로들 (순서대로). 예: ["abc-0.mp4", "abc-1.mp4"] */
  videoPaths: string[];
  /** 영상 아래 보여줄 설명 자막(선택) */
  caption: string | null;
  /** 만든 사람(소유자) id. 본인만 수정/삭제 가능 판단에 쓴다. */
  userId: string | null;
  createdAt: string;
}

/** DB row 원본 (Supabase는 snake_case 반환) */
export interface ManualRow {
  id: string;
  title: string;
  /** 하위호환: 첫 클립 경로 */
  video_path: string;
  /** 전체 클립 경로 배열 (신규) */
  video_paths: string[] | null;
  caption: string | null;
  user_id: string | null;
  created_at: string;
}

export function mapManualRow(row: ManualRow): Manual {
  const paths =
    row.video_paths && row.video_paths.length > 0
      ? row.video_paths
      : [row.video_path].filter(Boolean);
  return {
    id: row.id,
    title: row.title,
    videoPaths: paths,
    caption: row.caption ?? null,
    userId: row.user_id ?? null,
    createdAt: row.created_at,
  };
}

export interface CreateManualInput {
  title: string;
  /** 녹화/선택된 클립들의 로컬 URI (순서대로) */
  videoUris: string[];
  /** 영상 아래 보여줄 설명 자막(선택) */
  caption?: string;
}
