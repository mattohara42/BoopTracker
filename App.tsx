import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/navigation/RootNavigator';
import { BoopLogProvider } from '@/state/BoopLog';
import { PeopleProvider } from '@/state/People';

export default function App() {
  return (
    <PeopleProvider>
      <BoopLogProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </BoopLogProvider>
    </PeopleProvider>
  );
}
