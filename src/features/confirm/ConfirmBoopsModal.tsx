import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BOOP_TYPES, type BoopTypeId } from '@/config/constants';
import { usePendingBoops, type PendingBoop } from '@/state/PendingBoops';
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
  const { pending, confirm, deny } = usePendingBoops();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Boops to confirm</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {pending.length === 0 ? (
            <Text style={styles.empty}>All caught up! 🎉</Text>
          ) : (
            pending.map((b) => (
              <ConfirmCard
                key={b.id}
                boop={b}
                onConfirm={(typeOk) => confirm(b.id, typeOk)}
                onDeny={() => deny(b.id)}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ConfirmCard({
  boop,
  onConfirm,
  onDeny,
}: {
  boop: PendingBoop;
  onConfirm: (typeConfirmed: boolean) => void;
  onDeny: () => void;
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
  done: { fontSize: 16, color: colors.primary, fontWeight: '700' },
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
});
