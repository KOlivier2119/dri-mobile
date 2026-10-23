import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { CheckIcon, CloseIcon } from '@/components/onboarding/illustrations';
import { errorMessage } from '@/components/ui/form-error';
import { Drivers } from '@/api/endpoints';
import type { DocType } from '@/api/types';
import { useI18n } from '@/i18n';

type Phase = 'idle' | 'uploading' | 'done' | 'failed';

/**
 * One verification document: take a photo or pick one, then upload it to the
 * application (JPEG/PNG, max 8 MB — enforced by the API).
 */
export function DocUploadField({
  label,
  hint,
  docType,
  applicationId,
  uploaded,
  onUploaded,
}: {
  label: string;
  hint: string;
  docType: DocType;
  applicationId: string;
  uploaded: boolean;
  onUploaded: () => void;
}) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const phase: Phase = uploading ? 'uploading' : failure ? 'failed' : uploaded ? 'done' : 'idle';

  const pick = async (source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setFailure(source === 'camera' ? t('upload.cameraPermission') : t('upload.photosPermission'));
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, exif: false };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;
    await upload(result.assets[0]);
  };

  const upload = async (asset: ImagePicker.ImagePickerAsset) => {
    setFailure(null);
    setUploading(true);
    try {
      const type = asset.mimeType ?? 'image/jpeg';
      const name = asset.fileName ?? `${docType.toLowerCase()}.${type.includes('png') ? 'png' : 'jpg'}`;
      // web hands back a blob: URI that FormData can't stream, so send the Blob itself there
      const file =
        Platform.OS === 'web'
          ? (new File([await (await fetch(asset.uri)).blob()], name, { type }) as unknown as {
              uri: string;
              name: string;
              type: string;
            })
          : { uri: asset.uri, name, type };
      await Drivers.uploadDocument(applicationId, docType, file);
      onUploaded();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const choose = () => {
    if (uploading) return;
    if (Platform.OS === 'web') return void pick('library');
    Alert.alert(label, undefined, [
      { text: t('upload.takePhoto'), onPress: () => void pick('camera') },
      { text: t('upload.chooseLibrary'), onPress: () => void pick('library') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="label" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable
        onPress={choose}
        accessibilityRole="button"
        accessibilityLabel={phase === 'done' ? t('upload.a11yDone', { label }) : t('upload.a11yAdd', { label })}
        style={({ pressed }) => [
          styles.box,
          phase === 'done' && styles.boxDone,
          phase === 'failed' && styles.boxFailed,
          pressed && { backgroundColor: Colors.surfaceAlt },
        ]}>
        <View
          style={[
            styles.uploadIcon,
            phase === 'done' && styles.uploadIconDone,
            phase === 'failed' && styles.uploadIconFailed,
          ]}>
          {phase === 'uploading' ? (
            <ActivityIndicator color={Colors.primary} />
          ) : phase === 'done' ? (
            <CheckIcon size={24} color={Colors.onPrimary} strokeWidth={2.4} />
          ) : phase === 'failed' ? (
            <CloseIcon size={22} color={Colors.danger} strokeWidth={2.2} />
          ) : (
            <UploadIcon />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <ThemedText
            type="subtitle"
            style={{ fontSize: 15, lineHeight: 20 }}
            color={phase === 'failed' ? Colors.danger : undefined}>
            {phase === 'uploading'
              ? t('upload.uploading')
              : phase === 'done'
                ? t('upload.uploaded')
                : phase === 'failed'
                  ? t('upload.failed')
                  : t('upload.addPhoto')}
          </ThemedText>
          <ThemedText type="caption">
            {phase === 'failed'
              ? t('upload.retry', { reason: failure ?? '' })
              : phase === 'done'
                ? t('upload.tapToReplace')
                : hint}
          </ThemedText>
        </View>
      </Pressable>
    </View>
  );
}

/** Image frame with an up arrow — the empty upload state. */
function UploadIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 14.5V18a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18v-3.5M12 15V4M7.5 8.5 12 4l4.5 4.5"
        stroke={Colors.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  label: { color: Colors.text, marginLeft: Spacing.one },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 80,
    borderRadius: Radius.card - 4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
  },
  boxDone: { borderStyle: 'solid', borderColor: Colors.primaryTint },
  boxFailed: { borderStyle: 'solid', borderColor: Colors.danger, backgroundColor: Colors.dangerSoft },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  uploadIconDone: { backgroundColor: Colors.primary },
  uploadIconFailed: { backgroundColor: Colors.surface },
});
