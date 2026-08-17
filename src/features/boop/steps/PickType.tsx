import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { LOCKED_TYPE_TEASER_SLOTS, type BoopTypeId } from '@/config/constants';
import { boopTypeUnlockStates } from '@/features/boop/boopTypesCore';
import { colors } from '@/theme/colors';

/**
 * Step 3 of the three-tap loop: pick which kind of boop it was.
 *
 * This step stays deliberate and fun — it is NOT friction to optimize away
 * (CLAUDE.md hard constraint). Classic is always pickable; Boopstache /
 * Bellyboop / Underboop start locked and unlock by total boops — "the Ladder"
 * (docs/M4_DESIGN_GATE.md), read from `boopTypeUnlockStates(totalBoops)`. A
 * still-locked type shows greyed with the count that unlocks it, so the player
 * can see exactly what's coming and how close they are. Beyond the four v1
 * types, the extra dashed slots tease that there's a whole roster to earn.
 */
export function PickType({
  totalBoops,
  onPick,
}: {
  totalBoops: number;
  onPick: (typeId: BoopTypeId) => void;
}) {
  const states = boopTypeUnlockStates(totalBoops);

  return (
    <View style={styles.content}>
      <View style={styles.grid}>
        {states.map(({ type: t, unlocked, unlockAtBoops }) =>
          unlocked ? (
            <TouchableOpacity
              key={t.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => onPick(t.id)}
              accessibilityRole="button"
              accessibilityLabel={t.label}
            >
              <Text style={styles.cardEmoji}>{t.emoji}</Text>
              <Text style={styles.cardLabel}>{t.label}</Text>
              <Text style={styles.cardBlurb}>{t.blurb}</Text>
            </TouchableOpacity>
          ) : (
            <View
              key={t.id}
              style={[styles.card, styles.cardLocked]}
              accessibilityLabel={`${t.label}, locked, unlocks at ${unlockAtBoops} boops`}
            >
              <Text style={styles.lock}>🔒</Text>
              <Text style={styles.cardLockedLabel}>{t.label}</Text>
              <Text style={styles.cardLockedText}>
                {unlockAtBoops != null ? `Unlock at ${unlockAtBoops} boops` : 'Locked'}
              </Text>
            </View>
          ),
        )}

        {Array.from({ length: LOCKED_TYPE_TEASER_SLOTS }).map((_, i) => (
          <View key={`teaser-${i}`} style={[styles.card, styles.cardLocked, styles.cardTeaser]}>
            <Text style={styles.lock}>🔒</Text>
            <Text style={styles.cardLockedText}>Locked</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  card: {
    width: '48%',
    minHeight: 104,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 28, marginBottom: 6 },
  cardLabel: { fontSize: 17, fontWeight: '800', color: colors.text },
  cardBlurb: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  cardLocked: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    alignItems: 'center',
    opacity: 0.6,
  },
  // The empty "coming soon" slots (beyond the four v1 types) have no label.
  cardTeaser: { justifyContent: 'center' },
  lock: { fontSize: 24 },
  cardLockedLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  cardLockedText: { fontSize: 13, color: colors.muted, marginTop: 4, fontWeight: '600', textAlign: 'center' },
});
