import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { FriendsScreen } from '@/screens/FriendsScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { colors } from '@/theme/colors';

/**
 * Bottom-tab navigation for v1: Home (the BOOP button), Friends, Leaderboard.
 * Tabs fit the "open → do one thing → leave" model. No stack of feeds.
 * The three-tap record flow (M1) will open on top of Home, not as a tab.
 */
export type RootTabParamList = {
  Home: undefined;
  Friends: undefined;
  Leaderboard: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Tab.Navigator>
  );
}
