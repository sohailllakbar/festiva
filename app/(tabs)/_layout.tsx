import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { typography, useThemedStyles, type Palette, useTheme } from '../../src/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'calendar', title: 'Calendar', icon: 'calendar-today' },
  { name: 'discover', title: 'Discover', icon: 'explore' },
  { name: 'events', title: 'Events', icon: 'celebration' },
  { name: 'profile', title: 'Profile', icon: 'person-outline' },
];

export default function TabsLayout() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => <MaterialIcons name={icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 88,
    paddingTop: 8,
  },
  label: { ...typography.labelSm, marginTop: 2 },
});
