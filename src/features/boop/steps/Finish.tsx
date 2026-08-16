import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, gradients } from '@/theme/colors';

/**
 * Finish screen. The boop is already recorded by the time we get here — this is
 * the payoff moment: a haptic buzz and (placeholder) confetti.
 *
 * The optional photo attach lives HERE, on the finish screen, rather than as a
 * step between "pick type" and "finish". That keeps the three-tap core loop
 * (BOOP → who → type) intact — a hard constraint in CLAUDE.md — while still
 * offering the camera-roll photo the spec calls for.
 *
 * Real confetti (and any sound) is the M7.5 "juice pass"; this is a stand-in.
 */
export function Finish({
  personName,
  typeLabel,
  onAttachPhoto,
  onUndo,
  onDone,
}: {
  personName: string;
  typeLabel: string;
  onAttachPhoto: (uri: string) => void;
  onUndo: () => void;
  onDone: () => void;
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    // Haptic buzz on arrival. No-ops on platforms without haptics (e.g. web).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  async function pickPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        onAttachPhoto(uri);
      }
    } catch {
      // Camera roll unavailable on this platform — stay silent, it's optional.
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        {/* Confetti placeholder — real animation is M7.5. */}
        <Text style={styles.confetti}>🎉</Text>
        <Text style={styles.headline}>Booped {personName}!</Text>
        <Text style={styles.subhead}>{typeLabel}</Text>

        {photoUri ? (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <Text style={styles.photoNote}>Photo attached ✓</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoButton} activeOpacity={0.7} onPress={pickPhoto}>
            <Text style={styles.photoButtonText}>📷 Add a photo (optional)</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.doneButton} activeOpacity={0.9} onPress={onDone}>
          <LinearGradient
            colors={gradients.boop}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneGradient}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onUndo} hitSlop={8} accessibilityRole="button">
          <Text style={styles.undoText}>Undo — that wasn’t a boop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  confetti: { fontSize: 64, marginBottom: 8 },
  headline: { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center' },
  subhead: { fontSize: 18, color: colors.primary, fontWeight: '700', marginTop: 4 },
  photoWrap: { alignItems: 'center', marginTop: 28 },
  photo: { width: 140, height: 140, borderRadius: 16, backgroundColor: colors.border },
  photoNote: { marginTop: 8, fontSize: 14, color: colors.muted },
  photoButton: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoButtonText: { fontSize: 15, color: colors.text },
  actions: { gap: 14, alignItems: 'center' },
  doneButton: {
    alignSelf: 'stretch',
    borderRadius: 16,
    overflow: 'hidden',
  },
  doneGradient: { paddingVertical: 18, alignItems: 'center' },
  doneButtonText: { color: colors.primaryText, fontSize: 18, fontWeight: '800' },
  undoText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
