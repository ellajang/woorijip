import { createContext, useContext, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Radius, Shadow, Space, Type } from '@/theme/tokens';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PromptOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  maxLength?: number;
}

interface DialogState extends ConfirmOptions, PromptOptions {
  kind: 'confirm' | 'alert' | 'prompt';
}

interface DialogApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  alert: (title: string, message?: string) => Promise<void>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogApi | null>(null);

/** 앱 톤에 맞춘 커스텀 확인/알림/입력 다이얼로그(바텀시트). OS 기본 Alert 대신 사용한다. */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [input, setInput] = useState('');
  const resolverRef = useRef<((value: unknown) => void) | null>(null);
  const insets = useSafeAreaInsets();

  function close(result: unknown) {
    setState(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }

  const api = useMemo<DialogApi>(
    () => ({
      confirm(opts) {
        return new Promise<boolean>((resolve) => {
          resolverRef.current = (v) => resolve(v === true);
          setState({ kind: 'confirm', ...opts });
        });
      },
      alert(title, message) {
        return new Promise<void>((resolve) => {
          resolverRef.current = () => resolve();
          setState({ kind: 'alert', title, message });
        });
      },
      prompt(opts) {
        return new Promise<string | null>((resolve) => {
          resolverRef.current = (v) => resolve(typeof v === 'string' ? v : null);
          setInput(opts.defaultValue ?? '');
          setState({ kind: 'prompt', ...opts });
        });
      },
    }),
    [],
  );

  const isConfirm = state?.kind === 'confirm';
  const isPrompt = state?.kind === 'prompt';
  const canSubmitPrompt = !isPrompt || input.trim().length > 0;

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={state !== null}
        transparent
        animationType="slide"
        onRequestClose={() => close(isPrompt ? null : false)}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close(isPrompt ? null : false)} />
          <View style={[styles.card, { paddingBottom: insets.bottom + Space.lg }]}>
            <View style={styles.handle} />
            {state?.title ? <Text style={styles.title}>{state.title}</Text> : null}
            {state?.message ? <Text style={styles.message}>{state.message}</Text> : null}

            {isPrompt && (
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder={state?.placeholder}
                placeholderTextColor={Palette.textMuted}
                maxLength={state?.maxLength ?? 40}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => canSubmitPrompt && close(input.trim())}
              />
            )}

            <View style={styles.actions}>
              {isConfirm || isPrompt ? (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.pressed]}
                    onPress={() => close(isPrompt ? null : false)}>
                    <Text style={styles.cancelText}>{state?.cancelLabel ?? '취소'}</Text>
                  </Pressable>
                  <Pressable
                    disabled={isPrompt && !canSubmitPrompt}
                    style={({ pressed }) => [
                      styles.btn,
                      state?.destructive ? styles.dangerBtn : styles.confirmBtn,
                      pressed && styles.pressed,
                      isPrompt && !canSubmitPrompt && styles.btnDisabled,
                    ]}
                    onPress={() => close(isPrompt ? input.trim() : true)}>
                    <Text style={styles.confirmText}>{state?.confirmLabel ?? '확인'}</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.confirmBtn, pressed && styles.pressed]}
                  onPress={() => close(undefined)}>
                  <Text style={styles.confirmText}>확인</Text>
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
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
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Space.md,
    paddingVertical: Space.md,
    fontSize: 17,
    color: Palette.text,
    backgroundColor: Palette.background,
    marginTop: Space.xs,
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
  btnDisabled: {
    opacity: 0.5,
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
