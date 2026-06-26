// 계정 + 해당 사용자의 모든 데이터(설명서 row + 영상 파일) 삭제.
// auth.users 삭제는 service_role 권한이 필요하므로 Edge Function에서 처리한다.
// 배포: Supabase 대시보드 > Edge Functions > 새 함수 "delete-account"에 이 코드 붙여넣기
//      (또는 CLI: supabase functions deploy delete-account)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: '로그인이 필요해요.' }, 401);
    const token = authHeader.replace('Bearer ', '');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 토큰으로 호출자 본인 확인
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: '인증 실패' }, 401);
    const userId = userData.user.id;

    // 1) 이 사용자의 모든 영상 클립 경로 수집
    const { data: manuals } = await admin
      .from('manuals')
      .select('video_path, video_paths')
      .eq('user_id', userId);

    // 2) 스토리지 영상 삭제 (클립 배열 우선, 없으면 단일 경로)
    const paths = (manuals ?? []).flatMap((m: { video_path: string; video_paths: string[] | null }) =>
      m.video_paths && m.video_paths.length > 0 ? m.video_paths : [m.video_path],
    );
    if (paths.length > 0) {
      await admin.storage.from('videos').remove(paths);
    }

    // 3) 설명서 row 삭제 (계정 삭제 시 FK cascade도 되지만 명시적으로 먼저 정리)
    await admin.from('manuals').delete().eq('user_id', userId);

    // 4) 계정 삭제
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ success: true }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : '알 수 없는 오류' }, 500);
  }
});
