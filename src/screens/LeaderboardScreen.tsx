import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

/**
 * LeaderboardScreen — placeholder (M0).
 * Real family + friend leaderboards (all-time only for v1) land in M6.
 */
export function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <Text style={styles.subtitle}>
        Coming in M6: family and friend leaderboards — most people booped, most
        total boops, most/least boops received. All-time for v1.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
