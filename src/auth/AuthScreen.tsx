import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

import { useAuth } from './AuthContext';

/** Turn Firebase's error codes into something a kid (or parent) can read. */
function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return "That email doesn't look right.";
    case 'auth/email-already-in-use':
      return 'That email already has an account — try signing in.';
    case 'auth/weak-password':
      return 'Pick a password with at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return "That email and password don't match.";
    default:
      return (err as { message?: string })?.message ?? 'Something went wrong. Try again.';
  }
}

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const canSubmit =
    email.trim() && password && (!isSignup || username.trim()) && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isSignup) await signUp(email, password, username);
      else await signIn(email, password);
      // On success the auth listener swaps this screen out.
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>👆</Text>
          <Text style={styles.title}>BoopTracker</Text>
          <Text style={styles.subtitle}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </Text>

          {isSignup && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={submit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.buttonText}>{isSignup ? 'Sign up' : 'Sign in'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode(isSignup ? 'signin' : 'signup');
              setError(null);
            }}
            hitSlop={8}
          >
            <Text style={styles.switch}>
              {isSignup ? 'Already have an account? Sign in' : "New here? Create an account"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 28, flexGrow: 1, justifyContent: 'center' },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', color: colors.text, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: 24 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 17,
    color: colors.text,
    marginBottom: 12,
  },
  error: { color: '#C0392B', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.primaryText, fontSize: 18, fontWeight: '800' },
  switch: { color: colors.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 20 },
});
