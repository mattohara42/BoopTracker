import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { PERSON_RELATIONS } from '@/config/constants';
import type { Person } from '@/data/fakeFriends';
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
  const { people, addPeople, removePerson, setRelation, addByUsername } = usePeople();
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendMsg, setFriendMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // The person whose relation is being edited (null = picker closed).
  const [editing, setEditing] = useState<Person | null>(null);

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

  async function addFriend() {
    if (addingFriend || !username.trim()) return;
    setAddingFriend(true);
    setFriendMsg(null);
    const result = await addByUsername(username);
    if (result.ok) {
      setFriendMsg({ ok: true, text: `Added ${result.name} 🎉` });
      setUsername('');
    } else {
      setFriendMsg({ ok: false, text: result.error });
    }
    setAddingFriend(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Add your people here so booping is one tap — no typing mid-boop.
        </Text>

        <View style={styles.addFriend}>
          <TextInput
            style={styles.friendInput}
            placeholder="Add a friend by username"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            onSubmitEditing={addFriend}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.friendAdd, (!username.trim() || addingFriend) && styles.friendAddDisabled]}
            disabled={!username.trim() || addingFriend}
            onPress={addFriend}
          >
            {addingFriend ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.friendAddText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
        {friendMsg ? (
          <Text style={[styles.friendMsg, friendMsg.ok ? styles.friendMsgOk : styles.friendMsgErr]}>
            {friendMsg.text}
          </Text>
        ) : null}

        {people.map((p) => (
          <View key={p.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{p.name}</Text>
              <TouchableOpacity
                onPress={() => setEditing(p)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  p.relation ? `Change ${p.name}'s relation` : `Add a relation for ${p.name}`
                }
              >
                <Text style={[styles.relationPill, !p.relation && styles.relationPillEmpty]}>
                  {p.relation ? p.relation : '＋ Add relation'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => removePerson(p.id)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${p.name}`}
            >
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {people.length === 0 && (
          <Text style={styles.empty}>
            No people yet. Add some from your contacts below.
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, busy && styles.addButtonDisabled]}
        activeOpacity={0.85}
        disabled={busy}
        onPress={addFromContacts}
      >
        <Text style={styles.addButtonText}>📇  Add from Contacts</Text>
      </TouchableOpacity>

      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setEditing(null)}>
          {/* Stop taps inside the card from dismissing the sheet. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Who is {editing?.name}?</Text>
            <View style={styles.chips}>
              {PERSON_RELATIONS.map((r) => {
                const active = editing?.relation === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => {
                      if (editing) setRelation(editing.id, r);
                      setEditing(null);
                    }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setEditing(null)} hitSlop={8}>
              <Text style={styles.sheetCancel}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 8 },
  hint: { fontSize: 14, color: colors.muted, marginBottom: 16, lineHeight: 20 },
  addFriend: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  friendInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  friendAdd: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 22,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAddDisabled: { opacity: 0.5 },
  friendAddText: { color: colors.primaryText, fontWeight: '800', fontSize: 16 },
  friendMsg: { fontSize: 14, marginBottom: 12 },
  friendMsgOk: { color: '#2E7D32' },
  friendMsgErr: { color: '#C0392B' },
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
  rowText: { flex: 1, alignItems: 'flex-start' },
  rowName: { fontSize: 18, fontWeight: '600', color: colors.text },
  relationPill: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  relationPillEmpty: { color: colors.muted, fontWeight: '600' },
  remove: { fontSize: 18, color: colors.muted, paddingHorizontal: 6 },
  empty: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 24 },
  addButton: {
    margin: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: colors.primaryText, fontSize: 17, fontWeight: '800' },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(42, 35, 32, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 18,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.primaryText },
  sheetCancel: { fontSize: 15, fontWeight: '700', color: colors.muted, textAlign: 'center' },
});
