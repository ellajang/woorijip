import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * 로컬 영상(file:// 또는 blob:)을 presigned URL(R2)로 PUT 업로드한다.
 * - native: expo-file-system 의 uploadAsync 로 파일을 직접 스트리밍 (큰 영상도 안정적)
 * - web: blob 을 읽어 fetch PUT
 * Content-Type 을 video/mp4 로 보내 R2가 브라우저 인라인 재생 가능한 형태로 저장하게 한다.
 */
export async function uploadVideoToUrl(uri: string, presignedUrl: string): Promise<void> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    const put = await fetch(presignedUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'video/mp4' },
    });
    if (!put.ok) throw new Error(`영상 업로드 실패 (${put.status})`);
    return;
  }

  const result = await uploadAsync(presignedUrl, uri, {
    httpMethod: 'PUT',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': 'video/mp4' },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`영상 업로드 실패 (${result.status})`);
  }
}
