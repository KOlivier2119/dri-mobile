import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { BrandMark } from '@/components/brand/mark';
import { Button, ChevronRight } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { MOCK, mockDelay, useSession } from '@/store/session';
import {
  formatLocal,
  normalizeDigits,
  phoneSchema,
  toDialString,
  type PhoneFormValues,
} from '@/utils/phone';

const COUNTRIES = [
  { code: '250', name: 'Rwanda', sample: '78 123 4567' },
  { code: '243', name: 'DR Congo', sample: '89 000 0000' },
  { code: '256', name: 'Uganda', sample: '70 000 0000' },
  { code: '254', name: 'Kenya', sample: '70 000 0000' },
  { code: '255', name: 'Tanzania', sample: '60 000 0000' },
] as const;

export default function PhoneScreen() {
  const { authenticate } = useSession();
  const [dial, setDial] = useState<string>(COUNTRIES[0].code);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, setValue } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
    mode: 'onTouched',
  });

  const fillDemo = () => {
    setValue('phone', formatLocal(normalizeDigits(MOCK.demoPhone)), { shouldValidate: false });
  };

  const submit = async ({ phone }: { phone: string }) => {
    if (submitting) return;
    setSubmitting(true);
    await mockDelay(MOCK.verifyDelayMs);
    await authenticate(toDialString(dial, phone));
    router.push('/auth/otp');
  };
  const onSubmit = handleSubmit((values) => void submit(values));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <BrandMark size={44} />
            <ThemedText type="title" style={styles.headline}>
              Let’s get you moving.
            </ThemedText>
            <ThemedText type="body" color={Colors.warmDim}>
              Enter your number to continue with DRI.
            </ThemedText>
          </View>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <TextField
                label="Phone number"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="go"
                onSubmitEditing={() => void onSubmit()}
                onBlur={onBlur}
                error={fieldState.error?.message}
                helper="Digits only — we format it for you."
                prefix={
                  <Pressable
                    onPress={() => setPickerOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`Country code, plus ${dial}. Change`}
                    hitSlop={8}
                    style={styles.dial}>
                    <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                      +{dial}
                    </ThemedText>
                    <View style={styles.chevronDown} />
                  </Pressable>
                }
                value={value}
                onChangeText={(text) => {
                  const digits = normalizeDigits(text);
                  const current = normalizeDigits(value);
                  // only reformat when digits actually changed (stable caret)
                  onChange(digits === current ? value : formatLocal(digits));
                }}
              />
            )}
          />

          <Button
            title="Send code"
            loading={submitting}
            disabled={submitting}
            onPress={onSubmit}
            accessoryRight={<ChevronRight />}
            style={styles.cta}
          />

          <ThemedText
            type="small"
            color={Colors.mint}
            style={styles.demoFill}
            role="button"
            accessibilityRole="button"
            accessibilityLabel={`Use demo phone number ${MOCK.demoPhone}`}
            onPress={fillDemo}>
            Demo shortcut — use {MOCK.demoPhone}
          </ThemedText>

          <ThemedText type="small" color={Colors.warmFaint} style={styles.legal}>
            By continuing you agree to the DRI Terms of Service and Privacy Policy. This prototype
            never sends a real SMS.
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ThemedText type="subtitle" style={{ marginBottom: Spacing.three }}>
              Country code
            </ThemedText>
            <FlatList
              data={COUNTRIES as unknown as typeof COUNTRIES[number][]}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setDial(item.code);
                    setPickerOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, plus ${item.code}`}
                  style={styles.countryRow}>
                  <ThemedText type="body">{item.name}</ThemedText>
                  <ThemedText type="body" color={item.code === dial ? Colors.mint : Colors.warmDim}>
                    +{item.code}
                  </ThemedText>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  headline: { fontSize: 30, lineHeight: 36 },
  cta: { marginTop: Spacing.two },
  demoFill: { textAlign: 'center', paddingVertical: Spacing.two },
  legal: { textAlign: 'center', marginTop: Spacing.three, lineHeight: 18 },
  dial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: Spacing.three,
    marginRight: Spacing.three,
    borderRightWidth: 1,
    borderRightColor: Colors.inkBorder,
  },
  chevronDown: {
    width: 8,
    height: 8,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: Colors.warmDim,
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.inkSurface,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    maxHeight: '70%',
  },
  countryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inkBorder,
  },
});
