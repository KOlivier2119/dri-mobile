import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ApiError } from '@/api/client';
import { tr, type MessageKey } from '@/i18n';

/**
 * Message for any thrown value. API messages arrive in English, so a screen
 * can name translated messages for the statuses it expects (e.g. 401 on
 * sign-in → "Wrong email or password").
 */
export function errorMessage(error: unknown, byStatus?: Partial<Record<number, MessageKey>>) {
  if (error instanceof ApiError) {
    const key = byStatus?.[error.status];
    return key ? tr(key) : error.message;
  }
  return tr('errors.unknown');
}

/** Inline banner for a failed request. Renders nothing without a message. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.box} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <ThemedText type="small" color={Colors.danger}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Radius.field,
    backgroundColor: Colors.dangerSoft,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
});
