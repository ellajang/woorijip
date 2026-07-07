// 만료된(무료) 설명서를 자동 삭제한다. pg_cron이 매일 호출한다.
// expires_at < 지금 인 설명서의 R2 영상 + DB row를 지운다. (Pro는 expires_at=null이라 대상 아님)
//
// 보안: service_role 키로만 호출 가능 (pg_cron이 Authorization 헤더로 전달).
//
// 필요한 Supabase 비밀값: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동),
//   R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
//
// 배포: Supabase 대시보드 > Edge Functions > 새 함수 "cleanup-expired"에 붙여넣기
//      (또는 CLI: supabase functions deploy cleanup-expired)
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20';

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID') ?? '';
const R2_BUCKET = Deno.env.get('R2_BUCKET') ?? '';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const r2 = new AwsClient({
  accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
  secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
  region: 'auto',
  service: 's3',
});

async function deleteR2(paths: string[]) {
  await Promise.all(
    paths.map(async (p) => {
      try {
        await r2.fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${String(p)}`, { method: 'DELETE' });
      } catch {
        // 무시 (고아 파일은 다음 회차에 정리)
      }
    }),
  );
}

Deno.serve(async (req) => {
  // service_role 키를 가진 호출(=pg_cron)만 허용
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ error: 'forbidden' }, 401);
  }

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', SERVICE_ROLE_KEY);
    const nowIso = new Date().toISOString();

    // 만료된 설명서 조회
    const { data: expired, error } = await admin
      .from('manuals')
      .select('id, video_path, video_paths')
      .lt('expires_at', nowIso);
    if (error) return json({ error: error.message }, 500);
    if (!expired || expired.length === 0) return json({ deleted: 0 }, 200);

    // R2 영상 삭제
    const paths = expired.flatMap((m: { video_path: string; video_paths: string[] | null }) =>
      m.video_paths && m.video_paths.length > 0 ? m.video_paths : [m.video_path],
    );
    if (paths.length > 0) await deleteR2(paths);

    // DB row 삭제
    const ids = expired.map((m: { id: string }) => m.id);
    await admin.from('manuals').delete().in('id', ids);

    return json({ deleted: ids.length }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
