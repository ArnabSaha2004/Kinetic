import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

// TabBarIcon component
function TabBarIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
  return <Ionicons size={28} name={name} color={color} style={{ marginBottom: -3 }} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#9333ea', // Primary purple from STYLE.md
        tabBarInactiveTintColor: '#6b7280', // Gray-500 from STYLE.md
        tabBarStyle: {
          backgroundColor: '#1a1a1f', // Card background from STYLE.md
          borderTopColor: '#374151', // Gray-700 border from STYLE.md
          borderTopWidth: 1,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'IMU Data',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'analytics' : 'analytics-outline'}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'wallet' : 'wallet-outline'}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
