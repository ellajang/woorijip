import { File } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * 녹화된 로컬 영상을 Supabase Storage 업로드에 넘길 수 있는 형태로 읽는다.
 * - web: 카메라 결과가 blob: URL → fetch 해서 Blob 반환
 * - native: file:// URI → expo-file-system File API로 ArrayBuffer 반환
 *   (RN의 Blob은 바이트가 비어 업로드되는 알려진 이슈가 있어 ArrayBuffer를 쓴다)
 */
export async function readVideoForUpload(uri: string): Promise<ArrayBuffer | Blob> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return res.blob();
  }
  return new File(uri).arrayBuffer();
}
