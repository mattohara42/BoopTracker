import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { AuthScreen } from '@/auth/AuthScreen';
import { isFirebaseConfigured } from '@/firebase/app';
import { RootNavigator } from '@/navigation/RootNavigator';
import { SetupNeededScreen } from '@/screens/SetupNeededScreen';
import { BoopLogProvider } from '@/state/BoopLog';
import { PendingBoopsProvider } from '@/state/PendingBoops';
import { PeopleProvider } from '@/state/People';
import { colors } from '@/theme/colors';

/**
 * Gate: no config → setup screen; loading auth → spinner; signed out → auth
 * screen; signed in → the app. The data providers only mount once you're in.
 */
function Gate() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <PeopleProvider>
      <BoopLogProvider>
        <PendingBoopsProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PendingBoopsProvider>
      </BoopLogProvider>
    </PeopleProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      {isFirebaseConfigured ? (
        <AuthProvider>
          <Gate />
        </AuthProvider>
      ) : (
        <SetupNeededScreen />
      )}
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
