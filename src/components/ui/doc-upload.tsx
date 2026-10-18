import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { MOCK, mockDelay } from '@/store/session';

type Phase = 'idle' | 'uploading' | 'done' | 'failed';

/**
 * Simulated document capture — no file is ever read or sent.
 * Tapping "select" invents a placeholder filename and animates progress.
 */
export function DocUploadField({
  label,
  hint,
  fileName,
  value,
  onChange,
  failOnce = false,
}: {
  label: string;
  hint: string;
  fileName: string;
  value: boolean;
  onChange: (uploaded: boolean) => void;
  /** demo hook: first attempt fails so the retry state is visible */
  failOnce?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const attempts = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const phase: Phase = uploading ? 'uploading' : failed ? 'failed' : value ? 'done' : 'idle';

  const start = async () => {
    if (uploading) return;
    attempts.current += 1;
    setFailed(false);
    setUploading(true);
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => Math.min(1, p + 0.09));
    }, 90);
    await mockDelay(MOCK.uploadDelayMs);
    if (timer.current) clearInterval(timer.current);
    setProgress(1);
    setUploading(false);
    if (failOnce && attempts.current === 1) {
      setFailed(true);
      return;
    }
    onChange(true);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="label" style={styles.label}>{label}</ThemedText>
      <Pressable
        onPress={() => void start()}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${phase === 'done' ? 'Uploaded' : 'Tap to simulate selecting a photo'}`}
        style={({ pressed }) => [
          styles.box,
          phase === 'done' && styles.boxDone,
          phase === 'failed' && styles.boxFailed,
          pressed && { opacity: 0.9 },
        ]}>
        {phase !== 'done' ? (
          <View style={styles.uploadIcon}>
            <View style={styles.docPage}>
              <View style={styles.docFold} />
            </View>
            <View style={styles.docArrow} />
          </View>
        ) : (
          <View style={[styles.uploadIcon, styles.uploadIconDone]}>
            <View style={styles.check} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          {phase === 'idle' && (
            <>
              <ThemedText type="subtitle" style={{ fontSize: 15, lineHeight: 20 }}>
                Tap to select a photo
              </ThemedText>
              <ThemedText type="small" color={Colors.warmFaint}>{hint}</ThemedText>
            </>
          )}
          {phase === 'uploading' && (
            <>
              <ThemedText type="subtitle" style={{ fontSize: 15, lineHeight: 20 }}>
                Uploading…
              </ThemedText>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
            </>
          )}
          {phase === 'done' && (
            <>
              <ThemedText type="subtitle" style={{ fontSize: 15, lineHeight: 20 }} color={Colors.mint}>
                {fileName}
              </ThemedText>
              <ThemedText type="small" color={Colors.warmFaint}>
                Simulated upload — the file never leaves your device. Tap to replace.
              </ThemedText>
            </>
          )}
          {phase === 'failed' && (
            <>
              <ThemedText type="subtitle" style={{ fontSize: 15, lineHeight: 20 }} color={Colors.danger}>
                Upload failed
              </ThemedText>
              <ThemedText type="small" color={Colors.warmFaint}>
                (Simulated) Connection dropped. Tap to retry.
              </ThemedText>
            </>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  label: { marginLeft: Spacing.two },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 84,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    padding: Spacing.three,
  },
  boxDone: { borderStyle: 'solid', borderColor: Colors.emerald },
  boxFailed: { borderStyle: 'solid', borderColor: Colors.danger },
  uploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.inkSurfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconDone: { backgroundColor: Colors.mintSoft },
  docPage: {
    width: 22,
    height: 28,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.mint,
  },
  docFold: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    backgroundColor: Colors.inkSurfaceHi,
    borderBottomLeftRadius: 4,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.mint,
  },
  docArrow: {
    width: 2,
    height: 14,
    backgroundColor: Colors.warmDim,
    marginTop: 2,
  },
  check: {
    width: 18,
    height: 9,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: Colors.mint,
    transform: [{ rotate: '-45deg' }],
    marginTop: -4,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.inkSurfaceHi,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: { height: 5, borderRadius: 3, backgroundColor: Colors.mint },
});
