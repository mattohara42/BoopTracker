import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { BOOP_TYPES, type BoopTypeId } from '@/config/constants';
import { usePendingBoops, type PendingBoop } from '@/state/PendingBoops';
import { usePowerups } from '@/state/Powerups';
import { colors, radius, shadow, space } from '@/theme/colors';

function typeMeta(id: BoopTypeId) {
  const t = BOOP_TYPES.find((bt) => bt.id === id);
  return { emoji: t?.emoji ?? '👆', label: t?.label ?? 'Boop' };
}

/**
 * "Boops to confirm" — the booped person confirms (or denies) boops claimed
 * against them, and says whether it was really the claimed type. A utility
 * list, not a feed: it's only reachable when you actually have pending boops,
 * and each one disappears as you resolve it.
 */
export function ConfirmBoopsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { pending, confirm, deny, shield } = usePendingBoops();
  const { powerups, spend } = usePowerups();

  // Spend a Shield, then block the boop — only if the spend actually succeeds,
  // so a boop is never shielded "for free" when you're out of shields.
  async function shieldBoop(boopId: string) {
    if (await spend('shield')) shield(boopId);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* A React Native <Modal> renders outside the app's SafeAreaProvider, so
          insets read as 0 in here — the header would ride under the notch and
          hide "Done". Nesting a provider (seeded with initialWindowMetrics to
          avoid a first-frame jump) makes SafeAreaView measure correctly. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.back}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Boops to confirm</Text>
            {/* Spacer to keep the title centered (mirrors BoopFlow's header). */}
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {pending.length === 0 ? (
              <Text style={styles.empty}>All caught up! 🎉</Text>
            ) : (
              pending.map((b) => (
                <ConfirmCard
                  key={b.id}
                  boop={b}
                  shieldsAvailable={powerups.shields}
                  onConfirm={(typeOk) => confirm(b.id, typeOk)}
                  onDeny={() => deny(b.id)}
                  onShield={() => shieldBoop(b.id)}
                />
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function ConfirmCard({
  boop,
  shieldsAvailable,
  onConfirm,
  onDeny,
  onShield,
}: {
  boop: PendingBoop;
  shieldsAvailable: number;
  onConfirm: (typeConfirmed: boolean) => void;
  onDeny: () => void;
  onShield: () => void;
}) {
  const { emoji, label } = typeMeta(boop.boopType);
  return (
    <View style={styles.card}>
      <Text style={styles.claim}>
        <Text style={styles.booper}>{boop.booperName}</Text> says they got you with a
      </Text>
      <Text style={styles.type}>
        {emoji}  {label}
      </Text>

      <TouchableOpacity style={[styles.btn, styles.yes]} onPress={() => onConfirm(true)}>
        <Text style={styles.yesText}>Yes — that happened!</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.partial]} onPress={() => onConfirm(false)}>
        <Text style={styles.partialText}>It happened, but not a {label}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.no]} onPress={onDeny}>
        <Text style={styles.noText}>Nope, didn’t happen</Text>
      </TouchableOpacity>
      {shieldsAvailable > 0 ? (
        <TouchableOpacity style={[styles.btn, styles.shield]} onPress={onShield}>
          <Text style={styles.shieldText}>🛡️ Shield it — won’t count ({shieldsAvailable})</Text>
        </TouchableOpacity>
      ) : null}
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
  booper: { fontWeight: '800' },
  type: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 4, marginBottom: space.md },
  btn: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  yes: { backgroundColor: colors.primary },
  yesText: { color: colors.primaryText, fontWeight: '800', fontSize: 16 },
  partial: { backgroundColor: colors.surfaceAlt },
  partialText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  no: { backgroundColor: colors.surfaceAlt },
  noText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  shield: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.primary },
  shieldText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
});
