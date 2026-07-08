import { Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Palette, Space, Type } from '@/theme/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * 앱 최상위 에러 바운더리.
 * 렌더 중 예외가 나도 흰 화면 대신 친화적 화면 + 다시 시도를 보여준다.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // 개발자용 상세 로그 (운영에선 Sentry 등으로 연결 가능)
    console.error('[ErrorBoundary]', error);
  }

  handleRetry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>문제가 생겼어요</Text>
          <Text style={styles.body}>
            일시적인 문제가 생겼어요.{'\n'}다시 시도해주세요.
          </Text>
          <AppButton label="다시 시도" onPress={this.handleRetry} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.md,
    padding: Space.lg,
    backgroundColor: Palette.background,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: Type.title,
    fontWeight: '800',
    color: Palette.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: Space.sm,
  },
});
