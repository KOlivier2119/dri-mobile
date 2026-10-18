import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button, ChevronRight } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { MOCK, mockDelay, useSession } from '@/store/session';
import { maskPhone } from '@/utils/phone';

export default function OtpScreen() {
  const { session } = useSession();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState<number>(MOCK.otpResendSeconds);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async () => {
    if (verifying) return;
    setVerifying(true);
    await mockDelay(MOCK.verifyDelayMs);
    // Demo pass-through: every complete code verifies — nothing is checked against a provider.
    router.replace(session.role === 'driver' ? '/driver/apply' : '/client/home');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="overline">Verification</ThemedText>
            <ThemedText type="title" style={styles.headline}>
              Enter the code
            </ThemedText>
            <ThemedText type="body" color={Colors.warmDim} style={styles.sub}>
              We would normally text a 6-digit code to{' '}
              <ThemedText type="body" color={Colors.warm}>
                {maskPhone(session.phone)}
              </ThemedText>
              . This is a demo — any 6 digits will verify.
            </ThemedText>
          </View>

          <View style={styles.otpWrap}>
            <OtpInput
              ref={inputRef}
              value={code}
              onChange={setCode}
              onComplete={() => void verify()}
              disabled={verifying}
            />
          </View>

          <Pressable
            onPress={() => {
              if (verifying) return;
              setCode(MOCK.otpCode);
              void verify();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Use demo code ${MOCK.otpCode.split('').join(' ')}`}
            style={({ pressed }) => [styles.demoCard, pressed && { opacity: 0.7 }]}>
            <ThemedText type="label">Demo code (simulated — no SMS is sent)</ThemedText>
            <ThemedText type="subtitle" style={styles.demoCode}>
              {MOCK.otpCode}
            </ThemedText>
            <ThemedText type="small" color={Colors.mint}>
              Tap to fill and verify
            </ThemedText>
          </Pressable>

          <Button
            title="Verify"
            loading={verifying}
            disabled={code.length !== 6 || verifying}
            onPress={() => void verify()}
            accessoryRight={<ChevronRight />}
            style={styles.cta}
          />

          <View style={styles.footerRow}>
            <ThemedText
              type="small"
              color={seconds > 0 ? Colors.warmFaint : Colors.mint}
              onPress={
                seconds > 0
                  ? undefined
                  : () => {
                      setSeconds(MOCK.otpResendSeconds);
                      setCode('');
                      inputRef.current?.focus();
                    }
              }
              accessibilityRole="button"
              accessibilityLabel={seconds > 0 ? `Resend code available in ${seconds} seconds` : 'Resend code'}>
              {seconds > 0 ? `Resend in ${seconds}s` : 'Resend code'}
            </ThemedText>
            <ThemedText
              type="small"
              color={Colors.warmDim}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to phone number entry">
              Change number
            </ThemedText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.ink },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.four,
  },
  header: { gap: Spacing.two },
  headline: { fontSize: 30, lineHeight: 36 },
  sub: { lineHeight: 22 },
  otpWrap: { gap: Spacing.three },
  demoCard: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.inkSurface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.inkBorder,
    borderRadius: 16,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  demoCode: { fontSize: 28, letterSpacing: 10, color: Colors.mint, paddingLeft: 10 },
  cta: { marginTop: Spacing.one },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
});
