import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { isBigDeal } from '@/features/achievements/achievementsCore';
import { useAchievements } from '@/state/Achievements';
import { colors, gradients, radius, space } from '@/theme/colors';

/**
 * AchievementCelebration — the badge-unlock moment (M4). A global overlay that
 * pops whenever the achievements provider queues a freshly-earned badge, so it
 * works no matter *how* the badge was earned: recording a boop (finish screen),
 * confirming a boop you received ("Boop Received"), or adding a fifth friend.
 *
 * It shows one badge at a time; "Nice!" advances to the next queued one. Real
 * confetti + sound is the M7.5 juice pass — this is the honest stand-in.
 *
 * "Big deal" badges (Boop Received, Boop Collector) are meant to grant a Free
 * Boop / Shield *choice* (SPEC). The powerup store is M5, so we don't fake the
 * grant here — we recognise it and tease it. Wire the actual pick in M5.
 */
export function AchievementCelebration() {
  const { celebration, all, dismissCelebration } = useAchievements();
  const currentId = celebration[0];
  const achievement = all.find((a) => a.id === currentId);

  useEffect(() => {
    if (currentId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [currentId]);

  if (!achievement) return null;

  const bigDeal = isBigDeal(achievement.id);
  const remaining = celebration.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissCelebration}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.confetti}>🎉</Text>
          <Text style={styles.kicker}>Achievement unlocked!</Text>
          <Text style={styles.badgeEmoji}>{achievement.emoji}</Text>
          <Text style={styles.label}>{achievement.label}</Text>
          <Text style={styles.desc}>{achievement.description}</Text>

          {bigDeal ? (
            <View style={styles.bigDeal}>
              <Text style={styles.bigDealText}>
                🎁 You earned a powerup pick — Free Boop or Shield.{'\n'}Coming soon!
              </Text>
            </View>
          ) : null}

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
          {remaining > 0 ? (
            <Text style={styles.more}>
              +{remaining} more badge{remaining > 1 ? 's' : ''}
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
  confetti: { fontSize: 44 },
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
  bigDeal: {
    marginTop: space.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  bigDealText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: { alignSelf: 'stretch', borderRadius: radius.md, overflow: 'hidden', marginTop: space.lg },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.primaryText, fontSize: 17, fontWeight: '800' },
  more: { fontSize: 13, color: colors.muted, marginTop: space.sm, fontWeight: '600' },
});
