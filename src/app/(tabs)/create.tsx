import { Redirect } from 'expo-router';

/**
 * "촬영" 탭 자리. 실제로는 탭을 누르면 (tabs)/_layout의 listener가
 * 전체화면 /record(또는 한도 시 /paywall)로 보내므로 이 화면은 보이지 않는다.
 * 직접 진입한 경우엔 홈으로 돌려보낸다.
 */
export default function CreateTab() {
  return <Redirect href="/" />;
}
