import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Space, Type } from '@/theme/tokens';

const OPERATOR = '우리집 설명서';
const CONTACT_EMAIL = 'woorijip.help@gmail.com';
const EFFECTIVE_DATE = '2026-06-29';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. 수집하는 개인정보',
    body: `· 계정 정보: 이메일 주소, 비밀번호(암호화되어 저장)\n· 이용자가 만든 콘텐츠: 촬영·업로드한 영상과 자막, 설명서 제목\n· 서비스 이용 과정에서 기기 권한(카메라·마이크·사진)이 사용될 수 있습니다.`,
  },
  {
    heading: '2. 이용 목적',
    body: `· 회원 가입 및 로그인, 본인 확인\n· 설명서(영상·QR) 생성·저장·재생 등 서비스 제공\n· 문의 응대 및 서비스 개선`,
  },
  {
    heading: '3. 보관 및 파기',
    body: `· 개인정보는 회원 탈퇴(계정 삭제) 시 지체 없이 파기합니다.\n· 앱 내 "내 정보 > 계정 삭제"를 통해 계정과 모든 영상·데이터를 직접 삭제할 수 있습니다.\n· 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관 후 파기합니다.`,
  },
  {
    heading: '4. 처리위탁 및 제3자 제공',
    body: `· 데이터 저장·인증을 위해 Supabase(클라우드 인프라)를 이용합니다.\n· 위 목적 외에 이용자의 개인정보를 제3자에게 판매·제공하지 않습니다.`,
  },
  {
    heading: '5. 이용자의 권리',
    body: `· 이용자는 언제든지 본인의 정보 열람·수정·삭제를 요청할 수 있습니다.\n· 계정·데이터 삭제는 앱 내에서 직접 가능하며, 문의처로도 요청할 수 있습니다.`,
  },
  {
    heading: '6. 안전성 확보 조치',
    body: `· 모든 통신은 HTTPS로 암호화됩니다.\n· 비밀번호는 복호화 불가능한 형태로 저장되며, 접근 권한을 최소화합니다.`,
  },
  {
    heading: '7. 공개 재생 안내',
    body: `· QR/링크로 공유된 설명서 영상은 링크를 가진 사람이라면 누구나 볼 수 있습니다. 민감한 정보가 담긴 영상은 공유에 유의해주세요.`,
  },
  {
    heading: '8. 만 14세 미만의 가입 제한',
    body: `· 본 서비스는 만 14세 이상을 대상으로 하며, 만 14세 미만은 가입할 수 없습니다.`,
  },
  {
    heading: '9. 개인정보처리방침의 변경',
    body: `· 본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지를 통해 안내합니다.`,
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>개인정보처리방침</Text>
        <Text style={styles.meta}>
          {OPERATOR} · 시행일 {EFFECTIVE_DATE}
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.heading}>10. 문의처</Text>
          <Text style={styles.body}>개인정보 관련 문의: {CONTACT_EMAIL}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    padding: Space.lg,
    gap: Space.md,
  },
  title: {
    fontSize: Type.title,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Palette.text,
  },
  meta: {
    fontSize: Type.caption,
    color: Palette.textMuted,
    marginBottom: Space.sm,
  },
  section: {
    gap: Space.xs,
  },
  heading: {
    fontSize: Type.headline,
    fontWeight: '700',
    color: Palette.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: Palette.textMuted,
  },
});
