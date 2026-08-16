import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { BOOP_TYPES, type BoopTypeId } from '@/config/constants';
import type { Person } from '@/data/fakeFriends';
import { useBoopLog, type Boop } from '@/state/BoopLog';
import { colors } from '@/theme/colors';

import { Finish } from './steps/Finish';
import { PickPerson } from './steps/PickPerson';
import { PickType } from './steps/PickType';

type Step = 'person' | 'type' | 'finish';

function typeLabel(id: BoopTypeId): string {
  const t = BOOP_TYPES.find((bt) => bt.id === id);
  return t ? `${t.emoji}  ${t.label}` : 'Boop';
}

/**
 * The three-tap record flow, presented as a full-screen modal over Home:
 * pick person → pick type → finish. The boop is written to the local BoopLog
 * the moment a type is picked; the finish screen is the payoff (+ optional
 * photo). Everything resets when the modal closes.
 */
export function BoopFlow({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { recordBoop, attachPhoto, removeBoop } = useBoopLog();
  const [step, setStep] = useState<Step>('person');
  const [person, setPerson] = useState<Person | null>(null);
  const [recorded, setRecorded] = useState<Boop | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setStep('person');
    setPerson(null);
    setRecorded(null);
    setSaving(false);
  }

  function close() {
    reset();
    onClose();
  }

  function handlePickPerson(p: Person) {
    setPerson(p);
    setStep('type');
  }

  async function handlePickType(typeId: BoopTypeId) {
    if (saving) return; // guard against a double-tap while the write is in flight
    setSaving(true);
    try {
      const boop = await recordBoop({
        personId: person!.id,
        personName: person!.name,
        boopType: typeId,
      });
      setRecorded(boop);
      setStep('finish');
    } catch {
      Alert.alert('Could not save your boop', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleUndo() {
    if (recorded) removeBoop(recorded.id);
    close();
  }

  const title = step === 'person' ? 'Who did you boop?' : step === 'type' ? 'What kind of boop?' : '';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      {/* A React Native <Modal> renders outside the app's SafeAreaProvider, so
          insets read as 0 in here and the header would ride under the notch.
          Nest a provider (seeded with initialWindowMetrics to avoid a
          first-frame jump) so SafeAreaView measures correctly. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {step !== 'finish' && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (step === 'type' ? setStep('person') : close())}
              hitSlop={12}
            >
              <Text style={styles.headerAction}>{step === 'type' ? '‹ Back' : 'Cancel'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            {/* Spacer to keep the title centered. */}
            <View style={styles.headerSpacer} />
          </View>
        )}

        <View style={styles.body}>
          {step === 'person' && <PickPerson onPick={handlePickPerson} />}
          {step === 'type' && <PickType onPick={handlePickType} />}
          {step === 'finish' && recorded && (
            <Finish
              personName={recorded.personName}
              typeLabel={typeLabel(recorded.boopType)}
              onAttachPhoto={(uri) => attachPhoto(recorded.id, uri)}
              onUndo={handleUndo}
              onDone={close}
            />
          )}
        </View>

        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerAction: { fontSize: 16, color: colors.primary, fontWeight: '600', minWidth: 60 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  headerSpacer: { minWidth: 60 },
  body: { flex: 1 },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 246, 233, 0.6)',
  },
});
