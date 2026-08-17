import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAchievements } from '@/state/Achievements';
import { colors, radius, space } from '@/theme/colors';

/**
 * AwardsScreen — the trophy case (M4). Every week-one badge, earned ones lit up
 * and locked ones greyed with the hint of how to get them. Read-only and it
 * doesn't scroll a feed of activity — it's a static wall of goals, which fits
 * the "open → check → leave" model (CLAUDE.md, no social feed).
 */
export function AwardsScreen() {
  const { all, unlocked } = useAchievements();
  const earned = new Set(unlocked);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.progress}>
        {earned.size} of {all.length} badges earned
      </Text>

      <View style={styles.grid}>
        {all.map((a) => {
          const got = earned.has(a.id);
          return (
            <View
              key={a.id}
              style={[styles.card, got ? styles.cardEarned : styles.cardLocked]}
              accessibilityLabel={`${a.label}, ${got ? 'earned' : 'locked'}. ${a.description}`}
            >
              {a.bigDeal ? (
                <Text style={styles.bigDeal}>{got ? '⭐ Powerup' : '⭐ Big deal'}</Text>
              ) : null}
              <Text style={[styles.emoji, !got && styles.emojiLocked]}>
                {got ? a.emoji : '🔒'}
              </Text>
              <Text style={[styles.label, !got && styles.labelLocked]}>{a.label}</Text>
              <Text style={styles.desc}>{a.description}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.footnote}>
        Earn a ⭐ badge and you'll get to pick a Free Boop or a Shield — coming soon.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: space.xl },
  progress: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.muted,
    marginBottom: space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.md,
  },
  card: {
    width: '48%',
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    minHeight: 148,
  },
  cardEarned: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  cardLocked: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  bigDeal: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 2,
  },
  emoji: { fontSize: 40 },
  emojiLocked: { fontSize: 32 },
  label: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 6 },
  labelLocked: { color: colors.muted },
  desc: { fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 17 },
  footnote: {
    fontSize: 13,
    color: colors.muted,
    marginTop: space.lg,
    lineHeight: 19,
    textAlign: 'center',
  },
});
