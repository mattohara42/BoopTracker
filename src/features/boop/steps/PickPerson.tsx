import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { pickContactAsPerson } from '@/features/contacts/pickContact';
import { type Person } from '@/data/fakeFriends';
import { useBoopLog } from '@/state/BoopLog';
import { usePeople } from '@/state/People';
import { colors } from '@/theme/colors';

/**
 * Step 2 of the three-tap loop: pick who you booped.
 * Recent people at the top (SPEC), then your people, then ways to add someone
 * not in the list — picking from Contacts (fast) or typing a name (fallback).
 */
export function PickPerson({ onPick }: { onPick: (person: Person) => void }) {
  const { recentPeople } = useBoopLog();
  const { people, addPeople } = usePeople();
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestName, setGuestName] = useState('');

  // Don't repeat a person in "Friends" if they're already shown under Recent.
  const recentIds = new Set(recentPeople.map((p) => p.id));
  const otherFriends = people.filter((f) => !recentIds.has(f.id));

  function confirmGuest() {
    const name = guestName.trim();
    if (!name) return;
    // Stable id so the same guest name dedupes in recents / unique counts.
    onPick({ id: `guest:${name.toLowerCase()}`, name });
  }

  async function pickFromContacts() {
    const person = await pickContactAsPerson();
    if (!person) return; // cancelled or unavailable
    addPeople([person]); // remember them for next time
    onPick(person); // ...and use them for this boop right now
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {recentPeople.length > 0 && (
        <Section title="Recent">
          {recentPeople.map((p) => (
            <PersonRow key={p.id} name={p.name} onPress={() => onPick({ id: p.id, name: p.name })} />
          ))}
        </Section>
      )}

      <Section title={recentPeople.length > 0 ? 'Friends' : 'Who did you boop?'}>
        {otherFriends.map((p) => (
          <PersonRow
            key={p.id}
            name={p.name}
            subtitle={p.relation}
            onPress={() => onPick(p)}
          />
        ))}
      </Section>

      <Section title="Add someone">
        <PersonRow name="📇  Pick from Contacts" onPress={pickFromContacts} />
        {addingGuest ? (
          <View style={styles.guestBox}>
            <TextInput
              style={styles.guestInput}
              placeholder="Their name"
              placeholderTextColor={colors.muted}
              value={guestName}
              onChangeText={setGuestName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmGuest}
            />
            <TouchableOpacity
              style={[styles.guestConfirm, !guestName.trim() && styles.guestConfirmDisabled]}
              disabled={!guestName.trim()}
              onPress={confirmGuest}
            >
              <Text style={styles.guestConfirmText}>Boop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <PersonRow name="Someone else…" muted onPress={() => setAddingGuest(true)} />
        )}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PersonRow({
  name,
  subtitle,
  muted,
  onPress,
}: {
  name: string;
  subtitle?: string;
  muted?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <Text style={[styles.rowName, muted && styles.rowNameMuted]}>{name}</Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.muted,
    marginBottom: 8,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowName: { fontSize: 18, fontWeight: '600', color: colors.text },
  rowNameMuted: { color: colors.muted },
  rowSubtitle: { fontSize: 14, color: colors.muted },
  guestBox: { flexDirection: 'row', gap: 10 },
  guestInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 18,
    color: colors.text,
  },
  guestConfirm: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestConfirmDisabled: { opacity: 0.4 },
  guestConfirmText: { color: colors.primaryText, fontWeight: '800', fontSize: 16 },
});
