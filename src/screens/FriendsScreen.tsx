import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

/**
 * FriendsScreen — placeholder (M0).
 * Real friends list (add by username, "someone else" for non-app people)
 * lands in M2 with real accounts and data.
 */
export function FriendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>
        Coming in M2: add friends by username, plus “someone else” for people
        not in the app.
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
