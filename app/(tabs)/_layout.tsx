import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#111', borderTopColor: '#333', height: 88 },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
      }}
    >
      <Tabs.Screen
        name="status"
        options={{
          title: 'ダッシュボード', // 変更
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="library"
        options={{
          title: '本棚', // 変更
          tabBarIcon: ({ color }) => <Ionicons name="library" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: '探索', // 変更
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}