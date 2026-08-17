import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { BOOP_TYPES, type BoopTypeId } from '@/config/constants';
import { useBoopLog, type Boop } from '@/state/BoopLog';
import { usePowerups } from '@/state/Powerups';
import { colors, radius, shadow, space } from '@/theme/colors';

function typeMeta(id: BoopTypeId) {
  const t = BOOP_TYPES.find((bt) => bt.id === id);
  return { emoji: t?.emoji ?? '👆', label: t?.label ?? 'Boop' };
}

/**
 * "Overrule a denial" (M5) — boops you recorded that the other person denied.
 * Spend a Free Boop to overrule one you believe was real; it counts again. A
 * Free Boop can only ever land on a boop that was already recorded *and* denied
 * (SPEC) — it can never fabricate a boop, which is why this list is the only
 * place it's spent. Like the confirm list, it's a utility, not a feed: each
 * denial disappears as you overrule it.
 */
export function OverruleBoopsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { deniedBoops, overruleBoop } = useBoopLog();
  const { powerups, spend } = usePowerups();

  // Spend a Free Boop, then overrule — only if the spend succeeds. Surface a
  // write failure rather than letting the tap silently do nothing.
  async function overrule(boopId: string) {
    try {
      if (await spend('freeBoop')) await overruleBoop(boopId);
    } catch {
      Alert.alert("Couldn't overrule that", 'Check your connection and try again.');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.back}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Denied boops</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.sub}>
            ⚡ {powerups.freeBoops} Free Boop{powerups.freeBoops === 1 ? '' : 's'} — spend one to
            overrule a denial you think was real.
          </Text>

          <ScrollView contentContainerStyle={styles.content}>
            {deniedBoops.length === 0 ? (
              <Text style={styles.empty}>No denied boops. 👍</Text>
            ) : (
              deniedBoops.map((b) => (
                <OverruleCard
                  key={b.id}
                  boop={b}
                  canOverrule={powerups.freeBoops > 0}
                  onOverrule={() => overrule(b.id)}
                />
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function OverruleCard({
  boop,
  canOverrule,
  onOverrule,
}: {
  boop: Boop;
  canOverrule: boolean;
  onOverrule: () => void;
}) {
  const { emoji, label } = typeMeta(boop.boopType);
  return (
    <View style={styles.card}>
      <Text style={styles.claim}>
        <Text style={styles.who}>{boop.personName}</Text> denied your
      </Text>
      <Text style={styles.type}>
        {emoji}  {label}
      </Text>
      <TouchableOpacity
        style={[styles.btn, !canOverrule && styles.btnDisabled]}
        disabled={!canOverrule}
        onPress={onOverrule}
      >
        <Text style={styles.btnText}>⚡ Overrule — make it count</Text>
      </TouchableOpacity>
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
    paddingVertical: space.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  back: { fontSize: 16, color: colors.primary, fontWeight: '700', minWidth: 60 },
  headerSpacer: { minWidth: 60 },
  sub: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
    paddingHorizontal: space.lg,
    lineHeight: 20,
  },
  content: { padding: space.lg, gap: space.md },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 16, marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  claim: { fontSize: 15, color: colors.text, lineHeight: 22 },
  who: { fontWeight: '800' },
  type: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 4, marginBottom: space.md },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.primaryText, fontWeight: '800', fontSize: 16 },
});
