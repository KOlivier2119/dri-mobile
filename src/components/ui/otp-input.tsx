import { forwardRef } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/theme';

export type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  maxLength?: number;
  error?: boolean;
  disabled?: boolean;
};

/**
 * Six large code cells driven by one hidden TextInput, so the caret,
 * autocorrect-off behavior and backspace all stay native and stable.
 */
export const OtpInput = forwardRef<TextInput, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, maxLength = 6, error, disabled },
  ref,
) {
  const cells = Array.from({ length: maxLength }, (_, i) => value[i] ?? '');

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && value.length === maxLength) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <View accessibilityLabel={`Verification code, ${value.length} of ${maxLength} digits entered`}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, '').slice(0, maxLength);
          onChange(digits);
          if (digits.length === maxLength) onComplete?.(digits);
        }}
        onKeyPress={handleKeyPress}
        maxLength={maxLength}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus
        selectTextOnFocus
        editable={!disabled}
        caretHidden
        style={styles.hidden}
      />
      <View style={[styles.row, error && styles.rowError]} pointerEvents="none">
        {cells.map((digit, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              digit !== '' && styles.cellFilled,
              i === value.length && !error && styles.cellActive,
              error && styles.cellError,
            ]}>
            <View style={styles.glyphBox}>
              {digit !== '' ? (
                <Text style={styles.digit}>{digit}</Text>
              ) : (
                i === value.length && !disabled && <View style={styles.caret} />
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    color: 'transparent',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  rowError: {},
  cell: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 64,
    borderRadius: Radius.field,
    borderWidth: 1.5,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: Colors.emerald,
    backgroundColor: Colors.inkSurfaceHi,
  },
  cellActive: {
    borderColor: Colors.mint,
  },
  cellError: {
    borderColor: Colors.danger,
  },
  glyphBox: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caret: {
    width: 2,
    height: 26,
    borderRadius: 1,
    backgroundColor: Colors.mint,
  },
  digit: {
    fontFamily: Fonts.regular,
    fontSize: 26,
    fontWeight: '600',
    color: Colors.warm,
  },
});
