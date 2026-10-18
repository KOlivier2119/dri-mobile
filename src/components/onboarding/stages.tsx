import { StyleSheet, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { BrandMark } from '@/components/brand/mark';
import { MoonIcon, PinIcon, PreviewTag, WheelIcon } from '@/components/onboarding/illustrations';

/** Screen 1 stage — an abstract night-route: your car, their wheel. */
export function RouteMapStage() {
  return (
    <View style={styles.stage}>
      {/* faint cross streets */}
      <View style={[styles.hLine, { top: '18%' }]} />
      <View style={[styles.hLine, { top: '74%' }]} />
      <View style={[styles.vLine, { left: '22%' }]} />
      <View style={[styles.vLine, { left: '78%' }]} />

      {/* the route */}
      <View style={styles.road}>
        <View style={styles.dash} />
        <View style={styles.dash} />
        <View style={styles.dash} />
        <View style={styles.dash} />
      </View>

      <View style={[styles.origin, { left: '10%', bottom: '12%' }]} />
      <View style={[styles.pinFloat, { right: '14%', top: '10%' }]}>
        <PinIcon size={20} color={Colors.warmFaint} />
      </View>

      {/* focal badge */}
      <View style={styles.badge}>
        <BrandMark size={96} />
      </View>

      {/* the two roles, side by side */}
      <View style={styles.roleRow}>
        <View style={styles.roleCard}>
          <WheelIcon size={34} color={Colors.mint} />
          <ThemedText type="small" color={Colors.warmDim}>
            their wheel
          </ThemedText>
        </View>
        <View style={styles.roleCard}>
          <MoonIcon size={32} color={Colors.warm} />
          <ThemedText type="small" color={Colors.warmDim}>
            your night
          </ThemedText>
        </View>
      </View>
      <PreviewTag style={{ position: 'absolute', top: 0, left: 0 }} />
    </View>
  );
}

/** Screen 2 stage — a believable service-selection sheet in a phone frame. */
export function ServiceSheetStage() {
  return (
    <View style={styles.stage}>
      <View style={styles.phone}>
        <View style={styles.notch} />
        <ThemedText style={styles.sheetTitle}>Choose a service</ThemedText>

        <View style={[styles.serviceRow, styles.serviceRowSelected]}>
          <View style={[styles.iconBox, styles.iconBoxSelected]}>
            <MoonIcon size={26} color={Colors.ink} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="subtitle" style={{ fontSize: 16, lineHeight: 22 }}>
              BOB Night
            </ThemedText>
            <ThemedText type="small" color={Colors.warmDim}>
              A designated driver for your evening
            </ThemedText>
          </View>
          <View style={styles.checkDot} />
        </View>

        <View style={styles.serviceRow}>
          <View style={styles.iconBox}>
            <WheelIcon size={26} color={Colors.warm} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="subtitle" style={{ fontSize: 16, lineHeight: 22 }}>
              Private Driver
            </ThemedText>
            <ThemedText type="small" color={Colors.warmDim}>
              Hours or a full day, on your schedule
            </ThemedText>
          </View>
        </View>

        <View style={styles.sheetCta}>
          <ThemedText style={styles.sheetCtaText}>Continue</ThemedText>
        </View>
      </View>
      <PreviewTag style={{ position: 'absolute', bottom: 4, left: 4 }} />
    </View>
  );
}

/** Screen 3 stage — driver identity card above a shared trip line. */
export function ConfidenceStage() {
  return (
    <View style={styles.stage}>
      <View style={styles.idCard}>
        <View style={styles.avatar}>
          <ThemedText style={styles.initials}>JE</ThemedText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ThemedText type="subtitle" style={{ fontSize: 17, lineHeight: 22 }}>
              Jean E.
            </ThemedText>
            <ThemedText type="small" color={Colors.mint}>
              4.9
            </ThemedText>
          </View>
          <ThemedText type="small" color={Colors.warmDim}>
            Toyota RAV4 · Kigali · CN 123 A
          </ThemedText>
        </View>
        <View style={styles.idBadge}>
          <ThemedText style={styles.idBadgeText}>DRI</ThemedText>
        </View>
      </View>

      <View style={styles.tripLine}>
        <View style={styles.tripDotStart} />
        <View style={styles.tripRoad}>
          <View style={styles.tripProgress} />
        </View>
        <View style={styles.tripDotEnd} />
      </View>

      <View style={styles.safetyRow}>
        <View style={styles.safetyChip}>
          <ThemedText type="small" color={Colors.warmDim}>
            Share trip
          </ThemedText>
        </View>
        <View style={styles.safetyChip}>
          <ThemedText type="small" color={Colors.warmDim}>
            Trip details
          </ThemedText>
        </View>
        <View style={styles.safetyChip}>
          <ThemedText type="small" color={Colors.warmDim}>
            Contacts
          </ThemedText>
        </View>
      </View>
      <PreviewTag style={{ position: 'absolute', top: 0, right: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 1.05,
    maxHeight: '100%',
    borderRadius: Radius.card,
    backgroundColor: Colors.inkSurface,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.inkBorder,
    opacity: 0.6,
  },
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.inkBorder,
    opacity: 0.6,
  },
  road: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    bottom: '8%',
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.emeraldDeep,
    transform: [{ rotate: '-14deg' }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dash: { width: 16, height: 2, borderRadius: 1, backgroundColor: Colors.mint, opacity: 0.7 },
  origin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.warm,
  },
  pinFloat: { position: 'absolute' },
  badge: {
    width: 148,
    height: 148,
    borderRadius: 44,
    backgroundColor: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRow: { flexDirection: 'row', gap: Spacing.three },
  roleCard: {
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.inkSurfaceHi,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },

  phone: {
    width: '86%',
    maxWidth: 320,
    backgroundColor: Colors.ink,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    padding: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  notch: {
    width: 64,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.inkBorder,
    alignSelf: 'center',
    marginBottom: Spacing.one,
  },
  sheetTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.warm,
    marginBottom: Spacing.one,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurface,
    padding: Spacing.three,
  },
  serviceRowSelected: {
    borderColor: Colors.mint,
    backgroundColor: Colors.mintSoft,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.inkSurfaceHi,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.mint },
  sheetCta: {
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCtaText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.ink },

  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    width: '92%',
    maxWidth: 360,
    backgroundColor: Colors.ink,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    padding: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.mintSoft,
    borderWidth: 1,
    borderColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.mint },
  idBadge: {
    backgroundColor: Colors.emerald,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idBadgeText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1, color: Colors.warm },
  tripLine: { flexDirection: 'row', alignItems: 'center', width: '80%', gap: 6 },
  tripDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.warm },
  tripDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.mint },
  tripRoad: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.inkSurfaceHi,
    overflow: 'hidden',
  },
  tripProgress: { width: '62%', height: 6, borderRadius: 3, backgroundColor: Colors.emerald },
  safetyRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', justifyContent: 'center' },
  safetyChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.inkBorder,
    backgroundColor: Colors.inkSurfaceHi,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
