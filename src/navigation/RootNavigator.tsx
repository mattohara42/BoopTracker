import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text } from 'react-native';

import { AwardsScreen } from '@/screens/AwardsScreen';
import { FriendsScreen } from '@/screens/FriendsScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { colors } from '@/theme/colors';

/**
 * Bottom-tab navigation for v1: Home (the BOOP button), Friends, Awards,
 * Leaderboard. Tabs fit the "open → do one thing → leave" model. No stack of
 * feeds. The three-tap record flow opens on top of Home, not as a tab.
 */
export type RootTabParamList = {
  Home: undefined;
  Friends: undefined;
  Awards: undefined;
  Leaderboard: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, string> = {
  Home: '👆',
  Friends: '👥',
  Awards: '🏅',
  Leaderboard: '🏆',
};

export function RootNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontWeight: '800', fontSize: 20 },
        headerTitleAlign: 'left',
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Awards" component={AwardsScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Tab.Navigator>
  );
}
