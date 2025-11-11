import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import NotificationsUtil from '../src/utils/notifications';
import * as Notifications from 'expo-notifications';

export default function TabLayout() {
  useEffect(() => {
    // Configure foreground handler so notifications show alerts while app is running
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    NotificationsUtil.initNotifications().then((granted) => {
      console.log('Notifications permission granted:', granted);
    });
  }, []);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: '600' },
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
