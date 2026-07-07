// Cloudflare R2 업로드/삭제용 presigned URL을 발급한다.
// 비밀키(R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)는 Supabase 비밀값에만 두고,
// 클라이언트에는 잠깐 쓰는 임시 URL만 내려준다 (키 노출 0).
//
// 필요한 Supabase 비밀값(Edge Functions > Secrets):
//   R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
//
// 배포: Supabase 대시보드 > Edge Functions > 새 함수 "r2-presign"에 이 코드 붙여넣기
//      (또는 CLI: supabase functions deploy r2-presign)
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20';

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

    // 로그인 사용자만 (Edge Function 기본 verify_jwt=true라 여기 도달하면 인증된 상태)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: '로그인이 필요해요.' }, 401);

    const { keys, method } = await req.json();
    const httpMethod = method === 'DELETE' ? 'DELETE' : 'PUT';
    if (!Array.isArray(keys) || keys.length === 0) {
      return json({ error: 'keys가 없어요.' }, 400);
    }

    const urls: { key: string; url: string }[] = [];
    for (const raw of keys) {
      const key = String(raw);
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
