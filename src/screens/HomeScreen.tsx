import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthContext';
import { BoopFlow } from '@/features/boop/BoopFlow';
import { ConfirmBoopsModal } from '@/features/confirm/ConfirmBoopsModal';
import { useBoopLog } from '@/state/BoopLog';
import { usePendingBoops } from '@/state/PendingBoops';
import { colors, gradients, radius, shadow, space } from '@/theme/colors';

/**
 * HomeScreen — "just the big BOOP button" (SPEC.md → Core Loop).
 *
 * Wrapped in a top SafeAreaView so the header clears the phone's status bar.
 * The button opens the three-tap record flow. No feed, ever (CLAUDE.md).
 */
export function HomeScreen() {
  const { totalBoops, uniquePeopleBooped } = useBoopLog();
  const { profile, signOut } = useAuth();
  const { pending } = usePendingBoops();
  const [flowOpen, setFlowOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const name = profile?.username ?? 'You';
  const initial = name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.hi}>Hi,</Text>
            <Text style={styles.name}>{name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.signOut} onPress={() => signOut()} hitSlop={8}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Boops given" value={totalBoops} />
        <Stat label="People booped" value={uniquePeopleBooped} />
      </View>

      {pending.length > 0 && (
        <TouchableOpacity
          style={styles.pendingCard}
          activeOpacity={0.85}
          onPress={() => setConfirmOpen(true)}
        >
          <Text style={styles.pendingText}>
            🔔 {pending.length} boop{pending.length > 1 ? 's' : ''} to confirm
          </Text>
          <Text style={styles.pendingChevron}>›</Text>
        </TouchableOpacity>
      )}

      <View style={styles.center}>
        <Pressable
          onPress={() => setFlowOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Record a boop"
          style={({ pressed }) => [styles.boopWrap, pressed && styles.boopPressed]}
        >
          <LinearGradient
            colors={gradients.boop}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.boopButton}
          >
            <Text style={styles.boopButtonText}>BOOP</Text>
          </LinearGradient>
        </Pressable>
        <Text style={styles.hint}>Tap to record a boop</Text>
      </View>

      <BoopFlow visible={flowOpen} onClose={() => setFlowOpen(false)} />
      <ConfirmBoopsModal visible={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryText, fontSize: 20, fontWeight: '800' },
  hi: { fontSize: 13, color: colors.muted, marginBottom: -2 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  signOut: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  signOutText: { fontSize: 13, color: colors.muted, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  statValue: { fontSize: 32, fontWeight: '900', color: colors.accent },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2, fontWeight: '600' },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: space.lg,
    marginTop: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pendingText: { fontSize: 16, fontWeight: '800', color: colors.text },
  pendingChevron: { fontSize: 24, fontWeight: '800', color: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boopWrap: { borderRadius: radius.pill, ...shadow.button },
  boopPressed: { transform: [{ scale: 0.96 }] },
  boopButton: {
    width: 216,
    height: 216,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boopButtonText: {
    color: colors.primaryText,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 3,
  },
  hint: { marginTop: space.lg, fontSize: 15, color: colors.muted, fontWeight: '600' },
});
