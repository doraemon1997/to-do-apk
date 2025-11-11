import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today's Tasks",
          tabBarLabel: "Today",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="today" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: "This Week's Tasks",
          tabBarLabel: "This Week",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="date-range" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="past"
        options={{
          title: "Past 7 Days",
          tabBarLabel: "Past Week",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="high-priority"
        options={{
          href: null, // This hides the tab but keeps the screen accessible
        }}
      />
    </Tabs>
  );
}
