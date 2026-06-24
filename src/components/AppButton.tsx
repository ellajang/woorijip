import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Palette, Radius, Shadow, Space } from '@/theme/tokens';

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

const variantBg: Record<Variant, string> = {
  primary: Palette.primary,
  secondary: Palette.primarySoft,
  danger: Palette.danger,
};

const variantText: Record<Variant, string> = {
  primary: Palette.white,
  secondary: Palette.primary,
  danger: Palette.white,
};

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
  const filled = variant !== 'secondary';
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        large && styles.large,
        { backgroundColor: variantBg[variant] },
        filled && !isDisabled && Shadow.button,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variantText[variant]} />
      ) : (
        <Text style={[styles.label, large && styles.labelLarge, { color: variantText[variant] }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
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
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
  },
  labelLarge: {
    fontSize: 24,
  },
});
