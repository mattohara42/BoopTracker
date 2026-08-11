import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/theme/colors';

/**
 * HomeScreen — "just the big BOOP button" (SPEC.md → Core Loop).
 *
 * M0 stub: the button is here and shows the header stats, but tapping it only
 * acknowledges the press. The real three-tap flow (pick who → pick type) lands
 * in M1. No feed, ever — that's a permanent constraint (CLAUDE.md).
 */
export function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Placeholder stats — wired to real data in M2. */}
        <Text style={styles.name}>You</Text>
        <View style={styles.statsRow}>
          <Stat label="Boops given" value="0" />
          <Stat label="People booped" value="0" />
        </View>
      </View>

      <View style={styles.center}>
        <TouchableOpacity
          style={styles.boopButton}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Record a boop"
          onPress={() => {
            // M1: open the pick-who → pick-type flow.
          }}
        >
          <Text style={styles.boopButtonText}>BOOP</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Tap to record a boop</Text>
      </View>
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
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
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
