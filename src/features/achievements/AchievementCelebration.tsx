import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BOOP_TYPES } from '@/config/constants';
import { isBigDeal } from '@/features/achievements/achievementsCore';
import { Confetti } from '@/features/juice/Confetti';
import { useAchievements, type CelebrationItem } from '@/state/Achievements';
import { usePowerups, type PowerupKind } from '@/state/Powerups';
import { colors, gradients, radius, space } from '@/theme/colors';

/** What to show for a queued celebration item — a badge or a boop-type unlock. */
interface Presented {
  kicker: string;
  emoji: string;
  label: string;
  description: string;
  /** Big-deal items grant a Free Boop / Shield choice instead of a dismiss. */
  bigDeal: boolean;
}

function present(item: CelebrationItem, all: ReturnType<typeof useAchievements>['all']): Presented | null {
  if (item.kind === 'badge') {
    const a = all.find((x) => x.id === item.id);
    if (!a) return null;
    return {
      kicker: 'Achievement unlocked!',
      emoji: a.emoji,
      label: a.label,
      description: a.description,
      bigDeal: isBigDeal(a.id),
    };
  }
  // A boop-type family unlocked — always a "big deal" (grants a choice, per SPEC).
  const t = BOOP_TYPES.find((x) => x.id === item.id);
  if (!t) return null;
  return {
    kicker: 'New boop type!',
    emoji: t.emoji,
    label: `${t.label} unlocked!`,
    description: `You can now send a ${t.label}.`,
    bigDeal: true,
  };
}

/**
 * AchievementCelebration — the unlock moment (M4 + M5). A global overlay that
 * pops whenever the achievements provider queues something freshly unlocked, so
 * it works no matter *how* it happened: recording a boop (finish screen),
 * confirming a boop you received ("Boop Received"), or adding a fifth friend.
 *
 * It shows one item at a time; the button advances to the next queued one. The
 * M7.5 juice pass gave it a real falling-confetti burst (`Confetti`) and a
 * spring "pop" on the badge, in place of the old static 🎉.
 *
 * "Big deal" unlocks grant a Free Boop / Shield *choice* (SPEC): the two big-deal
 * badges (Boop Received, Boop Collector) and every boop-type-family unlock. For
 * those we show two pick buttons instead of a dismiss — choosing grants the
 * powerup (M5) and advances. The pick is required (no dismiss-without-choosing)
 * so the reward can't be lost by tapping away. Choices stack: at 10 boops you
 * pick once for Boop Collector, then again for the Bellyboop unlock.
 */
export function AchievementCelebration() {
  const { celebration, all, dismissCelebration } = useAchievements();
  const { grant } = usePowerups();
  const item = celebration[0];
  const view = item ? present(item, all) : null;
  // A stable key for the effects so they fire once per queued item.
  const itemKey = item ? `${item.kind}:${item.id}` : null;

  // Spring "pop" on the badge emoji, re-run for each queued item.
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!itemKey) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [itemKey, pop]);

  const popStyle = {
    transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
  };

  if (!view) return null;

  const { bigDeal } = view;
  const remaining = celebration.length - 1;

  function choosePowerup(kind: PowerupKind) {
    grant(kind);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    dismissCelebration();
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      // Big-deal rewards must be chosen, so a hardware back doesn't forfeit them.
      onRequestClose={bigDeal ? () => {} : dismissCelebration}
    >
      <View style={styles.backdrop}>
        <Confetti />
        <View style={styles.card}>
          <Text style={styles.kicker}>{view.kicker}</Text>
          <Animated.Text style={[styles.badgeEmoji, popStyle]}>{view.emoji}</Animated.Text>
          <Text style={styles.label}>{view.label}</Text>
          <Text style={styles.desc}>{view.description}</Text>

          {bigDeal ? (
            <>
              <Text style={styles.bigDealPrompt}>🎁 Pick your reward:</Text>
              <View style={styles.choiceRow}>
                <TouchableOpacity
                  style={[styles.choice, styles.choiceFree]}
                  activeOpacity={0.85}
                  onPress={() => choosePowerup('freeBoop')}
                >
                  <Text style={styles.choiceEmoji}>⚡</Text>
                  <Text style={styles.choiceLabel}>Free Boop</Text>
                  <Text style={styles.choiceHint}>Overrule a denial</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choice, styles.choiceShield]}
                  activeOpacity={0.85}
                  onPress={() => choosePowerup('shield')}
                >
                  <Text style={styles.choiceEmoji}>🛡️</Text>
                  <Text style={styles.choiceLabel}>Shield</Text>
                  <Text style={styles.choiceHint}>Block a boop</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.button} activeOpacity={0.9} onPress={dismissCelebration}>
              <LinearGradient
                colors={gradients.boop}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>{remaining > 0 ? 'Next!' : 'Nice!'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {remaining > 0 ? (
            <Text style={styles.more}>
              +{remaining} more to go
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(42, 35, 32, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
  },
  kicker: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.xs,
  },
  badgeEmoji: { fontSize: 72, marginTop: space.sm },
  label: { fontSize: 24, fontWeight: '900', color: colors.text, marginTop: space.xs },
  desc: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  bigDealPrompt: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.accent,
    marginTop: space.lg,
  },
  choiceRow: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch', marginTop: space.sm },
  choice: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  choiceFree: { backgroundColor: colors.surfaceAlt, borderColor: colors.accent },
  choiceShield: { backgroundColor: colors.surfaceAlt, borderColor: colors.primary },
  choiceEmoji: { fontSize: 30 },
  choiceLabel: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  choiceHint: { fontSize: 12, color: colors.muted, marginTop: 2, fontWeight: '600' },
  button: { alignSelf: 'stretch', borderRadius: radius.md, overflow: 'hidden', marginTop: space.lg },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.primaryText, fontSize: 17, fontWeight: '800' },
  more: { fontSize: 13, color: colors.muted, marginTop: space.sm, fontWeight: '600' },
});
