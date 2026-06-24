import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Palette, Radius, Space } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  large?: boolean;
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  large = false,
  style,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        large && styles.large,
        variantStyles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={Palette.white} />
      ) : (
        <Text style={[styles.label, large && styles.labelLarge]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: Space.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    minHeight: 72,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: Palette.white,
    fontSize: 17,
    fontWeight: '700',
  },
  labelLarge: {
    fontSize: 24,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Palette.primary },
  secondary: { backgroundColor: Palette.textMuted },
  danger: { backgroundColor: Palette.danger },
};
