import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { pickContactAsPerson } from '@/features/contacts/pickContact';
import { usePeople } from '@/state/People';
import { colors } from '@/theme/colors';

/**
 * FriendsScreen — your people (M1, fake data).
 *
 * The point of this screen is to load people *up front* so booping is a single
 * tap, never typing mid-boop (the M1 playtest friction). Add from the phone's
 * Contacts one at a time via the native picker — no full-address-book access.
 *
 * M2 turns this into a real, persisted friends list (add by username, etc.);
 * for now the list is in-memory and resets on reload.
 */
export function FriendsScreen() {
  const { people, addPeople } = usePeople();
  const [busy, setBusy] = useState(false);

  async function addFromContacts() {
    if (busy) return;
    setBusy(true);
    try {
      const person = await pickContactAsPerson();
      if (person) addPeople([person]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Add your people here so booping is one tap — no typing mid-boop.
        </Text>

        {people.map((p) => (
          <View key={p.id} style={styles.row}>
            <Text style={styles.rowName}>{p.name}</Text>
            {p.relation ? <Text style={styles.rowSubtitle}>{p.relation}</Text> : null}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, busy && styles.addButtonDisabled]}
        activeOpacity={0.85}
        disabled={busy}
        onPress={addFromContacts}
      >
        <Text style={styles.addButtonText}>📇  Add from Contacts</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 8 },
  hint: { fontSize: 14, color: colors.muted, marginBottom: 16, lineHeight: 20 },
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
  rowSubtitle: { fontSize: 14, color: colors.muted },
  addButton: {
    margin: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: colors.primaryText, fontSize: 17, fontWeight: '800' },
});
