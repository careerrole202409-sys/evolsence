import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useProcessing } from '../../contexts/ProcessingContext'; // ★追加

export default function TabLayout() {
  const { processingCount } = useProcessing(); // ★コンテキストから状態を取得

  return (
    <>
      {/* ★処理中バー（全画面共通） */}
      {processingCount > 0 && (
        <View style={styles.processingBar}>
          <ActivityIndicator size="small" color="#000" style={{ marginRight: 10 }} />
          <Text style={styles.processingText}>AI分析中... 残り {processingCount} 冊</Text>
        </View>
      )}

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
            title: 'ダッシュボード',
            tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: '本棚',
            tabBarIcon: ({ color }) => <Ionicons name="library" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: '探索',
            tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  processingBar: { 
    backgroundColor: '#00ffff', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 50, // ステータスバー避け
    paddingBottom: 10,
    zIndex: 1000, // 最前面に
  },
  processingText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
});