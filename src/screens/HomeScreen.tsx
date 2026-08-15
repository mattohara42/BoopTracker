import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { BoopFlow } from '@/features/boop/BoopFlow';
import { useBoopLog } from '@/state/BoopLog';
import { colors } from '@/theme/colors';

/**
 * HomeScreen — "just the big BOOP button" (SPEC.md → Core Loop).
 *
 * The button opens the three-tap record flow (pick who → pick type → finish).
 * Header stats come from the local BoopLog. No feed, ever — that's a permanent
 * constraint (CLAUDE.md).
 */
export function HomeScreen() {
  const { totalBoops, uniquePeopleBooped } = useBoopLog();
  const { profile, signOut } = useAuth();
  const [flowOpen, setFlowOpen] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile?.username ?? 'You'}</Text>
          <TouchableOpacity onPress={() => signOut()} hitSlop={8}>
            <Text style={styles.signOut}>Sign out</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <Stat label="Boops given" value={String(totalBoops)} />
          <Stat label="People booped" value={String(uniquePeopleBooped)} />
        </View>
      </View>

      <View style={styles.center}>
        <TouchableOpacity
          style={styles.boopButton}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Record a boop"
          onPress={() => setFlowOpen(true)}
        >
          <Text style={styles.boopButtonText}>BOOP</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Tap to record a boop</Text>
      </View>

      <BoopFlow visible={flowOpen} onClose={() => setFlowOpen(false)} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  signOut: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boopButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  boopButtonText: {
    color: colors.primaryText,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
  },
  hint: {
    marginTop: 20,
    fontSize: 15,
    color: colors.muted,
  },
});
