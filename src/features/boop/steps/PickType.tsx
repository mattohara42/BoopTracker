import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  BOOP_TYPES,
  LOCKED_TYPE_TEASER_SLOTS,
  type BoopTypeId,
} from '@/config/constants';
import { colors } from '@/theme/colors';

/**
 * Step 3 of the three-tap loop: pick which kind of boop it was.
 *
 * This step stays deliberate and fun — it is NOT friction to optimize away
 * (CLAUDE.md hard constraint). All four v1 types are tappable here so Frankie
 * can feel picking between them; the greyed-out slots tease that there's more
 * to unlock.
 *
 * NOTE: In M1 every v1 type is selectable because there's no achievement engine
 * yet. When M4 lands, this should respect `BoopType.unlockedByDefault` so that
 * Boopstache / Bellyboop / Underboop start locked and unlock via achievements.
 */
export function PickType({ onPick }: { onPick: (typeId: BoopTypeId) => void }) {
  return (
    <View style={styles.content}>
      <View style={styles.grid}>
        {BOOP_TYPES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => onPick(t.id)}
          >
            <Text style={styles.cardLabel}>{t.label}</Text>
            <Text style={styles.cardBlurb}>{t.blurb}</Text>
          </TouchableOpacity>
        ))}

        {Array.from({ length: LOCKED_TYPE_TEASER_SLOTS }).map((_, i) => (
          <View key={`locked-${i}`} style={[styles.card, styles.cardLocked]}>
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
  cardLabel: { fontSize: 17, fontWeight: '800', color: colors.text },
  cardBlurb: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  cardLocked: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    alignItems: 'center',
    opacity: 0.6,
  },
  lock: { fontSize: 24 },
  cardLockedText: { fontSize: 13, color: colors.muted, marginTop: 6, fontWeight: '600' },
});
