import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { BackButton } from '@/components/ui/screen';
import { PinIcon } from '@/components/onboarding/illustrations';
import { KIGALI_PLACES, type Place } from '@/constants/places';
import { useLayout } from '@/hooks/use-layout';
import { ApiError } from '@/api/client';
import { Places } from '@/api/endpoints';
import type { LngLat } from '@/api/types';
import { useI18n } from '@/i18n';

export type PickedPlace = { name: string; lng: number; lat: number };

/** Field-shaped button that opens the place sheet. */
export function PlaceField({
  label,
  value,
  placeholder,
  onPress,
  error,
  dot,
}: {
  label: string;
  value: PickedPlace | null;
  placeholder: string;
  onPress: () => void;
  error?: string | null;
  /** route-dot colour shown instead of the pin */
  dot?: string;
}) {
  const { t } = useI18n();
  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="label" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value?.name ?? t('places.notSet')}`}
        style={({ pressed }) => [
          styles.field,
          error ? { borderColor: Colors.danger } : null,
          pressed && { backgroundColor: Colors.surfaceAlt },
        ]}>
        {dot ? (
          <View style={[styles.routeDot, { borderColor: dot }]} />
        ) : (
          <PinIcon size={20} color={value ? Colors.primary : Colors.textFaint} />
        )}
        <ThemedText color={value ? Colors.text : Colors.textFaint} numberOfLines={1} style={{ flex: 1 }}>
          {value?.name ?? placeholder}
        </ThemedText>
      </Pressable>
      {error ? (
        <ThemedText type="small" color={Colors.danger} style={styles.label}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

type Result = { key: string; title: string; subtitle: string; resolve: () => Promise<PickedPlace> };

const fromCurated = (p: Place): Result => ({
  key: `kigali:${p.name}`,
  title: p.name,
  subtitle: p.area,
  resolve: async () => ({ name: p.name, lng: p.lng, lat: p.lat }),
});

/** Backend place search is a proposed endpoint; remember once it's known to be absent. */
let placesSupported = true;

/**
 * Full-screen place search. Queries Google through the API's
 * `/places/autocomplete` (the key stays server-side), biased to `near`; until
 * that endpoint exists it searches the built-in Kigali list instead.
 */
export function PlacePicker({
  visible,
  title,
  allowCurrentLocation,
  onPick,
  onClose,
  near,
}: {
  visible: boolean;
  title: string;
  allowCurrentLocation?: boolean;
  onPick: (place: PickedPlace) => void;
  onClose: () => void;
  /** bias search results around this point */
  near?: LngLat;
}) {
  const { t } = useI18n();
  const { gutter } = useLayout();
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [remote, setRemote] = useState<Result[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const seq = useRef(0);

  const curated = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? KIGALI_PLACES.filter((p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q))
      : KIGALI_PLACES;
    return list.map(fromCurated);
  }, [query]);

  // debounced Google search; any failure quietly keeps the built-in list
  useEffect(() => {
    const q = query.trim();
    const mine = ++seq.current;
    if (q.length < 2 || !placesSupported) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await Places.autocomplete(q, near);
        if (mine !== seq.current) return;
        setRemote(
          found.map((r) => ({
            key: `g:${r.placeId}`,
            title: r.label,
            subtitle: r.secondary ?? '',
            resolve: async () => {
              const c = r.coords ?? (await Places.details(r.placeId)).coords;
              if (!c) throw new Error('no coordinates');
              return { name: r.label, lat: c.lat, lng: c.lng };
            },
          })),
        );
      } catch (e) {
        if (e instanceof ApiError && e.missing) placesSupported = false;
        if (mine === seq.current) setRemote(null);
      } finally {
        if (mine === seq.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, near]);

  const results = query.trim().length >= 2 && remote ? remote : curated;

  const pick = (place: PickedPlace) => {
    setQuery('');
    setRemote(null);
    setMessage(null);
    onPick(place);
  };

  const choose = async (row: Result) => {
    setMessage(null);
    setResolving(row.key);
    try {
      pick(await row.resolve());
    } catch {
      setMessage(t('places.loadFailed'));
    } finally {
      setResolving(null);
    }
  };

  const locateMe = async () => {
    setMessage(null);
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setMessage(t('places.locationOff'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const at = { lng: pos.coords.longitude, lat: pos.coords.latitude };
      // the name is what the driver reads, so never send a placeholder
      const place = await Places.reverse(at).catch(() => null);
      if (!place?.label) {
        setMessage(t('places.noAddress'));
        return;
      }
      pick({ name: place.label, ...at });
    } catch {
      setMessage(t('places.locationFailed'));
    } finally {
      setLocating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={[styles.column, styles.head, { paddingHorizontal: gutter }]}>
          <BackButton onPress={onClose} label={t('common.close')} />
          <ThemedText type="subtitle" style={{ flex: 1 }}>
            {title}
          </ThemedText>
        </View>
        <View style={[styles.column, { paddingHorizontal: gutter, gap: Spacing.two }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('places.searchPlaceholder')}
            placeholderTextColor={Colors.textFaint}
            autoFocus={!allowCurrentLocation}
            autoCorrect={false}
            style={styles.search}
            accessibilityLabel={t('places.searchA11y')}
          />
          {message ? (
            <ThemedText type="small" color={Colors.danger}>
              {message}
            </ThemedText>
          ) : null}
          {searching ? <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.two }} /> : null}
        </View>
        <FlatList
          data={results}
          keyExtractor={(r) => r.key}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.column, { paddingHorizontal: gutter, paddingBottom: Spacing.four }]}
          ListHeaderComponent={
            allowCurrentLocation && !query ? (
              <ResultRow
                title={locating ? t('places.finding') : t('places.useLocation')}
                subtitle={t('places.gps')}
                highlight
                onPress={() => void locateMe()}
              />
            ) : null
          }
          ListEmptyComponent={
            <ThemedText type="caption" style={{ paddingVertical: Spacing.four, textAlign: 'center' }}>
              {t('places.empty')}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <ResultRow
              title={resolving === item.key ? t('common.loading') : item.title}
              subtitle={item.subtitle}
              onPress={() => void choose(item)}
            />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

function ResultRow({
  title,
  subtitle,
  onPress,
  highlight,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  highlight?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surfaceAlt }]}>
      <View style={[styles.rowIcon, highlight && { backgroundColor: Colors.primary }]}>
        <PinIcon size={18} color={highlight ? Colors.onPrimary : Colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <ThemedText type="small" numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="label" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  column: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  label: { color: Colors.text, marginLeft: Spacing.one },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 56,
    borderRadius: Radius.field,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three,
  },
  routeDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 4, marginHorizontal: 3 },
  search: {
    minHeight: 52,
    borderRadius: Radius.field,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 17,
    color: Colors.text,
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 12,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.field,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
