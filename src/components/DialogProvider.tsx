import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Radius, Shadow, Space, Type } from '@/theme/tokens';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface DialogState extends ConfirmOptions {
  kind: 'confirm' | 'alert';
}

interface DialogApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  alert: (title: string, message?: string) => Promise<void>;
}

const DialogContext = createContext<DialogApi | null>(null);

/** 앱 톤에 맞춘 커스텀 확인/알림 다이얼로그. OS 기본 Alert 대신 사용한다. */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const insets = useSafeAreaInsets();

  function close(result: boolean) {
    setState(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }

  const api = useMemo<DialogApi>(
    () => ({
      confirm(opts) {
        return new Promise<boolean>((resolve) => {
          resolverRef.current = resolve;
          setState({ kind: 'confirm', ...opts });
        });
      },
      alert(title, message) {
        return new Promise<void>((resolve) => {
          resolverRef.current = () => resolve();
          setState({ kind: 'alert', title, message });
        });
      },
    }),
    [],
  );

  const isConfirm = state?.kind === 'confirm';

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal visible={state !== null} transparent animationType="slide" onRequestClose={() => close(false)}>
        <Pressable style={styles.backdrop} onPress={() => close(false)}>
          <Pressable style={[styles.card, { paddingBottom: insets.bottom + Space.lg }]} onPress={() => {}}>
            <View style={styles.handle} />
            {state?.title ? <Text style={styles.title}>{state.title}</Text> : null}
            {state?.message ? <Text style={styles.message}>{state.message}</Text> : null}

            <View style={styles.actions}>
              {isConfirm ? (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.pressed]}
                    onPress={() => close(false)}>
                    <Text style={styles.cancelText}>{state?.cancelLabel ?? '취소'}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      state?.destructive ? styles.dangerBtn : styles.confirmBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => close(true)}>
                    <Text style={styles.confirmText}>{state?.confirmLabel ?? '확인'}</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.confirmBtn, pressed && styles.pressed]}
                  onPress={() => close(true)}>
                  <Text style={styles.confirmText}>확인</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,24,28,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    gap: Space.sm,
    ...Shadow.card,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.border,
    marginBottom: Space.sm,
  },
  title: {
    fontSize: Type.headline,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: Palette.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Space.sm,
    marginTop: Space.md,
  },
  btn: {
    flex: 1,
    minHeight: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  cancelBtn: {
    backgroundColor: Palette.primarySoft,
  },
  confirmBtn: {
    backgroundColor: Palette.primary,
  },
  dangerBtn: {
    backgroundColor: Palette.danger,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.primary,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.white,
  },
});
