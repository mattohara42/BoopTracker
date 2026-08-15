import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

/**
 * Shown when Firebase config is missing (no `.env` yet). Keeps first-run setup
 * from looking like a crash.
 */
export function SetupNeededScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔧</Text>
        <Text style={styles.title}>Almost there</Text>
        <Text style={styles.body}>
          BoopTracker needs your Firebase config to connect. Copy{' '}
          <Text style={styles.code}>.env.example</Text> to{' '}
          <Text style={styles.code}>.env</Text>, paste in your project’s values,
          then restart <Text style={styles.code}>npm start</Text>.
        </Text>
        <Text style={styles.hint}>See docs/DATA_MODEL.md for the setup steps.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, marginBottom: 12 },
  body: { fontSize: 16, color: colors.text, textAlign: 'center', lineHeight: 24 },
  code: { fontWeight: '700', color: colors.primary },
  hint: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 16 },
});
