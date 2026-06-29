/** 설명서 한 건. 여러 클립(장면)을 순서대로 가진다. DB `manuals` 테이블과 대응. */
export interface Manual {
  id: string;
  title: string;
  /** Storage 내 영상 클립 경로들 (순서대로). 예: ["abc-0.mp4", "abc-1.mp4"] */
  videoPaths: string[];
  /** 장면별 자막 (videoPaths와 같은 순서, 빈 문자열이면 자막 없음) */
  captions: string[];
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
  /** 하위호환: 설명서 단위 자막 */
  caption: string | null;
  /** 장면별 자막 배열 (신규) */
  captions: string[] | null;
  user_id: string | null;
  created_at: string;
}

export function mapManualRow(row: ManualRow): Manual {
  const paths =
    row.video_paths && row.video_paths.length > 0
      ? row.video_paths
      : [row.video_path].filter(Boolean);
  const captions =
    row.captions && row.captions.length > 0 ? row.captions : row.caption ? [row.caption] : [];
  return {
    id: row.id,
    title: row.title,
    videoPaths: paths,
    captions,
    userId: row.user_id ?? null,
    createdAt: row.created_at,
  };
}

export interface CreateManualInput {
  title: string;
  /** 녹화/선택된 클립들의 로컬 URI (순서대로) */
  videoUris: string[];
  /** 장면별 자막 (videoUris와 같은 순서) */
  captions?: string[];
  /** 업로드 진행 콜백 (올린 클립 수, 전체 수) */
  onProgress?: (uploaded: number, total: number) => void;
}
