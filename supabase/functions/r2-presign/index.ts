// Cloudflare R2 업로드/삭제용 presigned URL을 발급한다.
// 비밀키(R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)는 Supabase 비밀값에만 두고,
// 클라이언트에는 잠깐 쓰는 임시 URL만 내려준다 (키 노출 0).
//
// 보안: 호출자(로그인 유저)의 id로 키를 "userId/파일명" 형태로 강제한다.
//       클라이언트가 어떤 키를 보내든 파일명만 취해 본인 폴더 아래로만 서명 →
//       남의 영상은 삭제/덮어쓰기 불가.
//
// 필요한 Supabase 비밀값: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (자동),
//   R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
//
// 배포: Supabase 대시보드 > Edge Functions > "r2-presign"에 이 코드 붙여넣기
//      (또는 CLI: supabase functions deploy r2-presign)
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20';
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

const ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID') ?? '';
const BUCKET = Deno.env.get('R2_BUCKET') ?? '';
const ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
const SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';
const ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const EXPIRES = 3600; // 임시 URL 유효기간(초) — 큰 영상 업로드 대비 1시간

const aws = new AwsClient({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: 'auto',
  service: 's3',
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!ACCOUNT_ID || !BUCKET || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      return json({ error: 'R2 설정이 비어 있어요. Supabase 비밀값을 확인해주세요.' }, 500);
    }

    // 호출자 본인 확인 → userId 획득 (키를 이 유저 폴더로만 제한)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: '로그인이 필요해요.' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: '인증 실패' }, 401);
    const userId = userData.user.id;

    const { keys, method } = await req.json();
    const httpMethod = method === 'DELETE' ? 'DELETE' : 'PUT';
    if (!Array.isArray(keys) || keys.length === 0) {
      return json({ error: 'keys가 없어요.' }, 400);
    }

    const urls: { key: string; url: string }[] = [];
    for (const raw of keys) {
      // 클라이언트가 뭘 보내든 파일명만 취해 본인 폴더 아래로 강제
      const base = String(raw).split('/').pop() ?? '';
      const key = `${userId}/${base}`;
      const u = new URL(`${ENDPOINT}/${BUCKET}/${key}`);
      u.searchParams.set('X-Amz-Expires', String(EXPIRES));
      const signed = await aws.sign(u.toString(), {
        method: httpMethod,
        aws: { signQuery: true },
      });
      urls.push({ key, url: signed.url });
    }

    return json({ urls }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
